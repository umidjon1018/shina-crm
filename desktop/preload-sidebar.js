// Yon panel (sidebar.html) ↔ asosiy jarayon
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('sicrmShell', {
  onState: (cb) => ipcRenderer.on('shell:state', (e, state) => cb(state)),
  ready: () => ipcRenderer.send('shell:ready'),
  select: (code) => ipcRenderer.send('shell:select', String(code)),
  add: () => ipcRenderer.send('shell:add'),
  remove: (code) => ipcRenderer.send('shell:remove', String(code)),
  reload: () => ipcRenderer.send('shell:reload'),
  toggle: () => ipcRenderer.send('shell:toggle'),
})
