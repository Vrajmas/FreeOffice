import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCsv,sortRange,writeCsv} from '../src/sheetFeatures.ts';

test('CSV preserves commas, quotes, and multiline values',()=>{
  const sheet=parseCsv('Name,Notes\r\nAda,"a,b"\r\nBob,"said ""yes""\nagain"\r\n');
  assert.equal(sheet.cells.B2,'a,b');
  assert.equal(sheet.cells.B3,'said "yes"\nagain');
  assert.equal(writeCsv(sheet,key=>sheet.cells[key]||''),'Name,Notes\r\nAda,"a,b"\r\nBob,"said ""yes""\nagain"');
});

test('sorting moves cell formatting with values and protects formulas',()=>{
  const sheet={name:'Sheet1',cells:{A1:'Zoe',B1:'2',A2:'Amy',B2:'10',A3:'Bob',B3:'5'},formats:{A1:{bold:true}}};
  assert.equal(sortRange(sheet,0,2,0,1,1),null);
  assert.deepEqual([sheet.cells.A1,sheet.cells.A2,sheet.cells.A3],['Zoe','Bob','Amy']);
  assert.equal(sheet.formats.A1.bold,true);
  sheet.cells.B2='=1+1';
  assert.match(sortRange(sheet,0,2,0,1,1),/formulas/);
  assert.equal(sheet.cells.B2,'=1+1');
});
