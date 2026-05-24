const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectFile: (opts) => ipcRenderer.invoke('select-file', opts),
  saveFile: (opts) => ipcRenderer.invoke('save-file', opts),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openFolder: (filePath) => ipcRenderer.invoke('open-folder', filePath),
  onUpdate: (cb) => {
    const handler = (_, data) => cb(data)
    ipcRenderer.on('update-event', handler)
    return () => ipcRenderer.removeListener('update-event', handler)
  }
})
