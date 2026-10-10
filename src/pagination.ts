const pageClass='paper';

function makePage(){const page=document.createElement('div');page.className=pageClass;return page}
function pageContents(root:HTMLElement){return Array.from(root.childNodes).flatMap(node=>node instanceof HTMLElement&&node.classList.contains(pageClass)?Array.from(node.childNodes):[node])}

function mergeContinuations(nodes:Node[]){
  const merged:Node[]=[];
  for(const node of nodes){
    const previous=merged[merged.length-1];
    if(node instanceof HTMLElement&&node.dataset.pageContinuation&&previous instanceof HTMLElement&&previous.tagName===node.tagName){previous.append(...Array.from(node.childNodes));node.remove();continue}
    merged.push(node);
  }
  return merged;
}

export function documentHtml(root:HTMLElement){
  const copy=root.cloneNode(true) as HTMLElement;
  const nodes=mergeContinuations(pageContents(copy));
  const container=document.createElement('div');container.append(...nodes);
  container.querySelectorAll('[data-page-continuation]').forEach(node=>node.removeAttribute('data-page-continuation'));
  return container.innerHTML;
}

export function setDocumentHtml(root:HTMLElement,html:string){root.replaceChildren();const page=makePage();page.innerHTML=html;root.append(page);paginate(root)}

function overflows(page:HTMLElement){return page.scrollHeight>page.clientHeight+2}

function splitTextBlock(block:HTMLElement,page:HTMLElement):HTMLElement|null{
  if(!/^(P|DIV|H1|H2|H3|LI)$/.test(block.tagName))return null;
  const walker=document.createTreeWalker(block,NodeFilter.SHOW_TEXT);
  const nodes:Text[]=[];while(walker.nextNode())nodes.push(walker.currentNode as Text);
  const length=nodes.reduce((sum,node)=>sum+node.length,0);
  if(length<2)return null;
  const scale=page.getBoundingClientRect().height/page.offsetHeight;
  const limit=page.getBoundingClientRect().bottom-(parseFloat(getComputedStyle(page).paddingBottom)+parseFloat(getComputedStyle(block).marginBottom)+4)*scale;
  function point(index:number){let remaining=index;for(const node of nodes){if(remaining<=node.length)return {node,offset:remaining};remaining-=node.length}return {node:nodes[nodes.length-1],offset:nodes[nodes.length-1].length}}
  function fits(index:number){const {node,offset}=point(index);const range=document.createRange();range.setStart(node,Math.max(0,offset-1));range.setEnd(node,offset);return range.getBoundingClientRect().bottom<=limit+1}
  let low=1,high=length;
  while(low<high){const middle=Math.ceil((low+high)/2);if(fits(middle))low=middle;else high=middle-1}
  if(!fits(low)||low>=length)return null;
  const text=nodes.map(node=>node.textContent||'').join('');
  const wordBreak=text.lastIndexOf(' ',low);
  const split=wordBreak>0&&wordBreak>=low-60?wordBreak+1:low;
  const {node,offset}=point(split);
  const range=document.createRange();range.selectNodeContents(block);range.setStart(node,offset);
  const tail=block.cloneNode(false) as HTMLElement;tail.dataset.pageContinuation='true';tail.append(range.extractContents());
  return tail;
}

function splitTable(table:HTMLTableElement,page:HTMLElement):HTMLTableElement|null{
  if(table.rows.length<2||table.tBodies.length!==1)return null;
  const tail=table.cloneNode(false) as HTMLTableElement;tail.dataset.pageContinuation='true';
  const body=tail.createTBody();
  while(overflows(page)&&table.rows.length>1)body.prepend(table.rows[table.rows.length-1]);
  if(!body.rows.length)return null;
  if(overflows(page)){table.tBodies[0].append(...Array.from(body.rows));return null}
  return tail;
}

export function paginate(root:HTMLElement){
  let pages=Array.from(root.children).filter(child=>child.classList.contains(pageClass)) as HTMLElement[];
  if(!pages.length){const content=Array.from(root.childNodes);root.replaceChildren();const page=makePage();page.append(...content);root.append(page);return paginate(root)}
  if(pages.length===1&&root.childNodes.length===1&&!overflows(pages[0]))return 1;
  const selected=window.getSelection();let marker:HTMLElement|null=null;
  if(selected?.rangeCount&&selected.isCollapsed&&root.contains(selected.anchorNode)){
    marker=document.createElement('span');marker.dataset.pageCaret='';marker.style.cssText='display:inline-block;width:0;height:0;overflow:hidden';
    selected.getRangeAt(0).insertNode(marker);
  }
  const content=mergeContinuations(pageContents(root)).map(node=>{
    if(node.nodeType===Node.TEXT_NODE&&node.textContent?.trim()){const paragraph=document.createElement('p');paragraph.append(node);return paragraph}
    return node;
  });
  root.replaceChildren();let page=makePage();root.append(page);
  const queue=[...content];let guard=0;
  while(queue.length&&guard++<10000){
    const node=queue.shift()!;page.append(node);
    if(!overflows(page))continue;
    const tail=node instanceof HTMLTableElement?splitTable(node,page):node instanceof HTMLElement?splitTextBlock(node,page):null;
    if(tail){page=makePage();root.append(page);queue.unshift(tail);continue}
    if(page.childNodes.length>1){node.parentNode?.removeChild(node);page=makePage();root.append(page);queue.unshift(node)}
  }
  if(marker?.isConnected){const range=document.createRange();range.setStartBefore(marker);range.collapse(true);selected?.removeAllRanges();selected?.addRange(range);marker.remove()}
  pages=Array.from(root.children) as HTMLElement[];
  return pages.length;
}
