// Stand-in for a host-owned preload. Never used by the installed application.
const {contextBridge,ipcRenderer}=require('electron');
const snapshot=()=>({cover:Boolean(document.getElementById('sandrone-startup')),readyState:document.readyState,rendererMs:performance.now(),timeOrigin:performance.timeOrigin});
ipcRenderer.send('research:event',{event:'host-preload',...snapshot()});
contextBridge.exposeInMainWorld('researchFixture',{report:(event,paintStartMs)=>ipcRenderer.send('research:event',{event,...snapshot(),...(Number.isFinite(paintStartMs)?{paintStartMs}:{})})});
