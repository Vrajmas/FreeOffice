import XLSX from 'xlsx-js-style';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import JSZip from 'jszip';
import {AlignmentType,Document,ExternalHyperlink,HeadingLevel,HeightRule,ImageRun,Packer,Paragraph,Table,TableCell,TableLayoutType,TableRow,TextRun,WidthType} from 'docx';

export type Grid=Record<string,string>;
export type CellFormat={bold?:boolean;italic?:boolean;underline?:boolean;align?:'left'|'center'|'right';fill?:string;color?:string;numberFormat?:'general'|'number'|'percent'};
export type SheetData={name:string;cells:Grid;formats:Record<string,CellFormat>};
export type WorkbookData={sheets:SheetData[]};
export const colName=(n:number)=>{let s='';for(n++;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
export const docxFilter=[{name:'Word document',extensions:['docx']}],xlsxFilter=[{name:'Excel workbook',extensions:['xlsx']}];

export async function importDoc(bytes:Uint8Array){
  const arrayBuffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength) as ArrayBuffer;
  const html=DOMPurify.sanitize((await mammoth.convertToHtml({arrayBuffer})).value,{USE_PROFILES:{html:true}});
  const archive=await JSZip.loadAsync(bytes),source=archive.file('word/document.xml');
  if(!source)return html;
  const xml=new DOMParser().parseFromString(await source.async('string'),'application/xml');
  const namespace='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const child=(element:Element|undefined,name:string)=>Array.from(element?.children||[]).find(item=>item.namespaceURI===namespace&&item.localName===name);
  const sizes=Array.from(xml.getElementsByTagNameNS(namespace,'tbl')).map(table=>{
    const widthNode=child(child(table,'tblPr'),'tblW'),rawWidth=Number(widthNode?.getAttribute('w:w'))/50;
    const width=widthNode?.getAttribute('w:type')==='pct'&&Number.isFinite(rawWidth)&&rawWidth>=40&&rawWidth<=100?rawWidth:null;
    const rows=Array.from(table.children).flatMap(section=>section.localName==='tr'?[section]:Array.from(section.children).filter(row=>row.localName==='tr'));
    const firstRow=rows[0],cells=Array.from(firstRow?.children||[]).filter(cell=>cell.localName==='tc');
    let columns=cells.map(cell=>{const value=child(child(cell,'tcPr'),'tcW');return value?.getAttribute('w:type')==='pct'?Number(value.getAttribute('w:w'))/50:null});
    if(!columns.length||columns.some(value=>value===null||!Number.isFinite(value))){const grid=child(table,'tblGrid');columns=Array.from(grid?.children||[]).filter(cell=>cell.localName==='gridCol').map(cell=>Number(cell.getAttribute('w:w')))}
    const total=columns.reduce<number>((sum,value)=>sum+(value||0),0);
    const normalized=columns.length>1&&total>0&&columns.every(value=>value!==null&&Number.isFinite(value))?columns.map(value=>(value||0)/total*100):null;
    const heights=rows.map(row=>{const height=child(child(row,'trPr'),'trHeight'),twips=Number(height?.getAttribute('w:val'));return height&&Number.isFinite(twips)&&twips>=360&&twips<=12000?twips/15:null});
    return {width,columns:normalized,heights};
  });
  if(!sizes.length)return html;
  const dom=new DOMParser().parseFromString(html,'text/html');
  dom.querySelectorAll('table').forEach((table,index)=>{const size=sizes[index];if(!size)return;if(size.width!==null)table.style.width=`${size.width}%`;if(size.columns){table.style.tableLayout='fixed';for(const row of Array.from(table.rows))for(const [column,cell] of Array.from(row.cells).entries())if(size.columns[column])cell.style.width=`${size.columns[column]}%`}for(const [row,height] of size.heights.entries())if(height&&table.rows[row])table.rows[row].style.height=`${height}px`});
  return dom.body.innerHTML;
}

export async function exportDoc(html:string){
  const dom=new DOMParser().parseFromString(html,'text/html');
  const children:(Paragraph|Table)[]=[];
  type Run=TextRun|ExternalHyperlink|ImageRun;
  type RunStyle={bold?:boolean;italics?:boolean;underline?:{};strike?:boolean;font?:string;size?:number;color?:string;shading?:{fill:string}};
  function color(value:string){const hex=/^#([\da-f]{6})$/i.exec(value.trim());if(hex)return hex[1].toUpperCase();const rgb=/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(value.trim());return rgb?rgb.slice(1).map(part=>Number(part).toString(16).padStart(2,'0')).join('').toUpperCase():undefined}
  function runs(node:Node,style:RunStyle={}):Run[]{
    if(node.nodeType===Node.TEXT_NODE)return node.textContent?[new TextRun({text:node.textContent,...style})]:[];
    if(!(node instanceof Element))return [];
    const tag=node.tagName.toLowerCase();
    if(tag==='br')return [new TextRun({break:1})];
    if(tag==='img'){
      const image=node as HTMLImageElement,match=/^data:image\/(png|jpeg|gif);base64,([\s\S]+)$/i.exec(image.src);
      if(!match)return [];
      const raw=atob(match[2]),data=Uint8Array.from(raw,char=>char.charCodeAt(0));
      const width=Math.max(24,Math.min(626,Number.parseFloat(image.style.width)||image.width||300));
      const height=Math.max(24,Math.min(950,Number.parseFloat(image.style.height)||image.height||width));
      return [new ImageRun({data,type:match[1].toLowerCase()==='jpeg'?'jpg':match[1].toLowerCase() as 'png'|'gif',transformation:{width,height}})];
    }
    const element=node as HTMLElement,inline=element.style,legacy=node as HTMLFontElement;
    const fontSize=legacy.size&&tag==='font'?Number(legacy.size):0;
    const next:RunStyle={...style,...(['b','strong'].includes(tag)?{bold:true}:{}),...(['i','em'].includes(tag)?{italics:true}:{}),...(tag==='u'?{underline:{}}:{}),...(['s','strike','del'].includes(tag)||inline.textDecoration.includes('line-through')?{strike:true}:{}),...(inline.fontFamily||legacy.face&&tag==='font'?{font:inline.fontFamily||legacy.face}:{}),...(fontSize?{size:[0,16,20,24,28,36,48,72][Math.min(7,fontSize)]}:{}),...(color(inline.color||(tag==='font'?legacy.color:''))?{color:color(inline.color||(tag==='font'?legacy.color:''))!}:{}),...(color(inline.backgroundColor)?{shading:{fill:color(inline.backgroundColor)!}}:{})};
    const inner=Array.from(node.childNodes).flatMap(child=>runs(child,next));
    if(tag==='a'&&node.getAttribute('href')?.match(/^https?:\/\//i))return [new ExternalHyperlink({link:node.getAttribute('href')!,children:[new TextRun({text:node.textContent||node.getAttribute('href')!,style:'Hyperlink'})]})];
    return inner;
  }
  function paragraph(el:Element,kind?:'bullet'|'number'):Paragraph{
    const tag=el.tagName.toLowerCase();const content=Array.from(el.childNodes).flatMap(node=>runs(node));
    const align=(el as HTMLElement).style.textAlign;
    return new Paragraph({children:content.length?content:[new TextRun('')],heading:tag==='h1'?HeadingLevel.HEADING_1:tag==='h2'?HeadingLevel.HEADING_2:undefined,bullet:kind==='bullet'?{level:0}:undefined,numbering:kind==='number'?{reference:'numbered',level:0}:undefined,alignment:align==='center'?AlignmentType.CENTER:align==='right'?AlignmentType.RIGHT:align==='justify'?AlignmentType.JUSTIFIED:undefined,spacing:{after:140}});
  }
  function visit(el:Element){const tag=el.tagName.toLowerCase();if(tag==='ul'||tag==='ol'){for(const li of Array.from(el.children))children.push(paragraph(li,tag==='ul'?'bullet':'number'));return}if(tag==='table'){const rows=Array.from(el.querySelectorAll('tr')).map(tr=>{const height=parseFloat((tr as HTMLElement).style.height);return new TableRow({height:Number.isFinite(height)?{value:Math.round(height*15),rule:HeightRule.ATLEAST}:undefined,children:Array.from(tr.children).map(cell=>{const width=parseFloat((cell as HTMLElement).style.width);return new TableCell({width:Number.isFinite(width)?{size:width,type:WidthType.PERCENTAGE}:undefined,children:[paragraph(cell)]})})})});const specifiedWidth=parseFloat((el as HTMLElement).style.width);const width=Number.isFinite(specifiedWidth)?Math.min(100,Math.max(40,specifiedWidth)):100;if(rows.length)children.push(new Table({rows,width:{size:width,type:WidthType.PERCENTAGE},layout:(el as HTMLElement).style.tableLayout==='fixed'?TableLayoutType.FIXED:undefined}));return}if(tag==='div'&&el.children.length){Array.from(el.children).forEach(visit);return}children.push(paragraph(el))}
  Array.from(dom.body.children).forEach(visit);
  if(!children.length)children.push(new Paragraph(''));
  const document=new Document({numbering:{config:[{reference:'numbered',levels:[{level:0,format:'decimal',text:'%1.',alignment:AlignmentType.START}]}]},sections:[{children}]});
  return new Uint8Array(await Packer.toArrayBuffer(document));
}

function formatFromStyle(style:unknown):CellFormat{if(!style||typeof style!=='object')return {};const s=style as Record<string,any>;const fmt:CellFormat={};if(s.font){fmt.bold=!!s.font.bold;fmt.italic=!!s.font.italic;fmt.underline=!!s.font.underline;if(s.font.color?.rgb)fmt.color='#'+s.font.color.rgb.slice(-6)}if(s.fill?.fgColor?.rgb)fmt.fill='#'+s.fill.fgColor.rgb.slice(-6);if(s.alignment?.horizontal)fmt.align=s.alignment.horizontal;if(s.numFmt==='0.00%')fmt.numberFormat='percent';else if(s.numFmt==='#,##0.00')fmt.numberFormat='number';return fmt}
function styleFor(format:CellFormat){return {font:{bold:!!format.bold,italic:!!format.italic,underline:!!format.underline,color:{rgb:(format.color||'#273341').replace('#','')}},fill:format.fill?{patternType:'solid',fgColor:{rgb:format.fill.replace('#','')}}:undefined,alignment:{horizontal:format.align||'left'},numFmt:format.numberFormat==='percent'?'0.00%':format.numberFormat==='number'?'#,##0.00':'General'}}
export function importWorkbook(bytes:Uint8Array):WorkbookData{
  const book=XLSX.read(bytes,{type:'array',cellFormula:true,cellStyles:true});
  const sheets:SheetData[]=book.SheetNames.filter(name=>name!=='_PersonalOfficeStyles').map(name=>{const cells:Grid={},formats:Record<string,CellFormat>={};const sheet=book.Sheets[name];for(const[key,raw]of Object.entries(sheet)){if(key.startsWith('!'))continue;const cell=raw as XLSX.CellObject;cells[key]=cell.f?'='+cell.f:String(cell.v??'');if(cell.s)formats[key]=formatFromStyle(cell.s)}return {name,cells,formats}});
  const metadata=book.Sheets._PersonalOfficeStyles?.A1?.v;if(typeof metadata==='string'){try{const stored=JSON.parse(metadata) as Record<string,Record<string,CellFormat>>;for(const sheet of sheets)if(stored[sheet.name])sheet.formats=stored[sheet.name]}catch{}}
  return {sheets:sheets.length?sheets:[{name:'Sheet1',cells:{},formats:{}}]};
}
export function exportWorkbook(data:WorkbookData,getValue?:(sheet:number,key:string)=>string):Uint8Array{
  const book=XLSX.utils.book_new();
  data.sheets.forEach((sheet,index)=>{const ws=XLSX.utils.aoa_to_sheet([[]]);let maxRow=0,maxCol=0;for(const key of new Set([...Object.keys(sheet.cells),...Object.keys(sheet.formats)])){const value=sheet.cells[key]||'';const format=sheet.formats[key];if(!value&&!format)continue;let cell:XLSX.CellObject;if(value.startsWith('=')){const computed=getValue?.(index,key)||'';cell={t:isNaN(Number(computed))?'s':'n',f:value.slice(1),v:isNaN(Number(computed))?computed:Number(computed)}}else if(value.trim()&&!isNaN(Number(value)))cell={t:'n',v:Number(value)};else cell={t:'s',v:value};if(format)cell.s=styleFor(format);ws[key]=cell;const p=XLSX.utils.decode_cell(key);maxRow=Math.max(maxRow,p.r);maxCol=Math.max(maxCol,p.c)}ws['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:maxRow,c:maxCol}});XLSX.utils.book_append_sheet(book,ws,sheet.name||`Sheet${index+1}`)});
  const metadata=XLSX.utils.aoa_to_sheet([[JSON.stringify(Object.fromEntries(data.sheets.map(s=>[s.name,s.formats])))]]);XLSX.utils.book_append_sheet(book,metadata,'_PersonalOfficeStyles');book.Workbook={Sheets:book.SheetNames.map(name=>({name,Hidden:name==='_PersonalOfficeStyles'?2:0}))};
  return new Uint8Array(XLSX.write(book,{bookType:'xlsx',type:'array'}));
}
