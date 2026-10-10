const {app,BrowserWindow,dialog,ipcMain}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const kind=process.env.OFFICE_KIND||require('../package.json').officeKind||'doc';
const ext=kind==='doc'?'.docx':'.xlsx';
const appTitle=kind==='doc'?'Personal Documents':'Personal Spreadsheets';
let win,rendererReady=false;
const pendingPaths=[];
function accepts(filePath){return typeof filePath==='string'&&filePath.toLowerCase().endsWith(ext)}
async function sendFile(filePath){if(!accepts(filePath))return;try{const data=await fs.readFile(filePath);win?.webContents.send('external-open',{name:path.basename(filePath),path:filePath,bytes:new Uint8Array(data)});win?.show();win?.focus()}catch(error){win?.webContents.send('external-open-error',String(error))}}
function queueFile(filePath){if(!accepts(filePath))return;if(rendererReady&&win&&!win.isDestroyed())void sendFile(filePath);else pendingPaths.push(filePath)}
app.on('open-file',(event,filePath)=>{event.preventDefault();queueFile(filePath)});
const singleInstance=app.requestSingleInstanceLock();
if(!singleInstance)app.quit();
else app.on('second-instance',(_event,argv)=>{const filePath=argv.find(accepts);if(filePath)queueFile(filePath);win?.show();win?.focus()});
function create(){win=new BrowserWindow({width:1380,height:900,minWidth:850,minHeight:600,title:appTitle,backgroundColor:'#f4f5f7',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});if(!app.isPackaged)win.loadURL('http://localhost:5173');else win.loadFile(path.join(__dirname,'../dist/index.html'));win.on('closed',()=>{win=null;rendererReady=false})}
app.whenReady().then(()=>{create();for(const arg of process.argv.slice(1))if(accepts(arg))queueFile(arg)});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)create()});
ipcMain.handle('renderer-ready',async()=>{rendererReady=true;const paths=pendingPaths.splice(0);for(const filePath of paths)await sendFile(filePath)});
ipcMain.handle('open-file',async(_e,filters)=>{const x=await dialog.showOpenDialog(win,{properties:['openFile']});if(x.canceled)return null;const filePath=x.filePaths[0];if(!accepts(filePath))return null;const data=await fs.readFile(filePath);return {name:path.basename(filePath),path:filePath,bytes:new Uint8Array(data)}});
ipcMain.handle('save-file',async(_e,{name,bytes,filters,path:existingPath})=>{let filePath=existingPath;if(!filePath){const x=await dialog.showSaveDialog(win,{defaultPath:name,filters});if(x.canceled)return null;filePath=x.filePath}if(!accepts(filePath))throw new Error('Expected a '+ext+' file');await fs.writeFile(filePath,Buffer.from(bytes));return filePath});
ipcMain.handle('save-pdf',async(_e,name)=>{if(kind!=='doc'||!win||win.isDestroyed())throw new Error('PDF export is unavailable');const x=await dialog.showSaveDialog(win,{defaultPath:name,filters:[{name:'PDF document',extensions:['pdf']}]});if(x.canceled||!x.filePath)return null;if(!x.filePath.toLowerCase().endsWith('.pdf'))throw new Error('Expected a .pdf file');const bytes=await win.webContents.printToPDF({pageSize:'A4',printBackground:true,preferCSSPageSize:true,margins:{marginType:'none'}});await fs.writeFile(x.filePath,bytes);return x.filePath});
