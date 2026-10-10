const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('desktop',{
  open:(filters)=>ipcRenderer.invoke('open-file',filters),
  save:(args)=>ipcRenderer.invoke('save-file',args),
  savePdf:(name)=>ipcRenderer.invoke('save-pdf',name),
  onExternalOpen:(callback)=>{const handler=(_event,file)=>callback(file);ipcRenderer.on('external-open',handler);void ipcRenderer.invoke('renderer-ready');return()=>ipcRenderer.removeListener('external-open',handler)}
});
