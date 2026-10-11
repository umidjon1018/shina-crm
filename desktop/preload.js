// Web ilova uchun ko'prik (src/utils/nativeBridge.js) — Android ilovadagi window.SicrmNative bilan bir xil:
// printHtml(html, title), saveFile(base64, filename, mime). Faqat *.sicrm.uz sahifalarida.
const { contextBridge, ipcRenderer } = require('electron')

const host = location.hostname
if (location.protocol === 'https:' && (host === 'sicrm.uz' || host.endsWith('.sicrm.uz'))) {
  contextBridge.exposeInMainWorld('SicrmNative', {
    printHtml: (html, title) => ipcRenderer.send('sicrm:print', String(html || ''), String(title || 'SICRM')),
    saveFile: (base64, filename, mime) => ipcRenderer.send('sicrm:save', String(base64 || ''), String(filename || 'fayl'), String(mime || '')),
  })
}
