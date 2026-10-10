import type {SheetData} from './office';

export function parseCsv(text:string):SheetData{
  text=text.replace(/^\uFEFF/,'');
  const cells:SheetData['cells']={};
  let row=0,column=0,field='',quoted=false;
  const commit=()=>{if(field)cells[`${columnName(column)}${row+1}`]=field;field='';column++};
  for(let index=0;index<text.length;index++){
    const char=text[index];
    if(char==='"'){
      if(quoted&&text[index+1]==='"'){field+='"';index++}else quoted=!quoted;
    }else if(char===','&&!quoted)commit();
    else if((char==='\n'||char==='\r')&&!quoted){commit();if(char==='\r'&&text[index+1]==='\n')index++;row++;column=0}
    else field+=char;
  }
  if(field||column>0)commit();
  return {name:'Sheet1',cells,formats:{}};
}

function columnName(index:number){let result='';for(let value=index+1;value;value=Math.floor((value-1)/26))result=String.fromCharCode(65+(value-1)%26)+result;return result}
function coordinates(key:string){const match=/^([A-Z]+)(\d+)$/.exec(key);if(!match)return null;let column=0;for(const char of match[1])column=column*26+char.charCodeAt(0)-64;return {row:Number(match[2])-1,column:column-1}}

export function writeCsv(sheet:SheetData,getValue:(key:string)=>string):string{
  const positions=Object.keys(sheet.cells).map(coordinates).filter((value):value is {row:number;column:number}=>value!==null);
  if(!positions.length)return '';
  const maxRow=Math.max(...positions.map(value=>value.row)),maxColumn=Math.max(...positions.map(value=>value.column));
  const escape=(value:string)=>/[",\r\n]/.test(value)?`"${value.replaceAll('"','""')}"`:value;
  return Array.from({length:maxRow+1},(_,row)=>Array.from({length:maxColumn+1},(_,column)=>escape(getValue(`${columnName(column)}${row+1}`))).join(',')).join('\r\n');
}

export function sortRange(sheet:SheetData,top:number,bottom:number,left:number,right:number,sortColumn:number,descending=false):string|null{
  if(bottom<=top)return 'Select at least two rows to sort';
  const rows=Array.from({length:bottom-top+1},(_,offset)=>{
    const source=top+offset;
    return Array.from({length:right-left+1},(_,index)=>{
      const key=`${columnName(left+index)}${source+1}`;
      return {value:sheet.cells[key]||'',format:sheet.formats[key]};
    });
  });
  if(rows.some(row=>row.some(cell=>cell.value.startsWith('='))))return 'Sorting ranges with formulas is not supported yet';
  const index=sortColumn-left,collator=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
  rows.sort((a,b)=>(descending?-1:1)*collator.compare(a[index].value,b[index].value));
  rows.forEach((row,offset)=>row.forEach((cell,index)=>{
    const key=`${columnName(left+index)}${top+offset+1}`;
    if(cell.value)sheet.cells[key]=cell.value;else delete sheet.cells[key];
    if(cell.format)sheet.formats[key]=cell.format;else delete sheet.formats[key];
  }));
  return null;
}
