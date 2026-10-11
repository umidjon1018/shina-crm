// SICRM kompyuter dasturi (Windows / Mac): kompaniya kodi → https://<kod>.sicrm.uz ichida ochiladi.
// Frontend deploy dasturda ham darhol ko'rinadi; dasturning o'zi faqat bu fayllar o'zgarsa yangilanadi (Windows'da avtomatik).
const { app, BrowserWindow, Menu, ipcMain, dialog, shell, session } = require('electron')
const path = require('path')
const fs = require('fs')

const WWW = path.join(__dirname, 'www')
const SETTINGS_FILE = () => path.join(app.getPath('userData'), 'settings.json')
const isMac = process.platform === 'darwin'

let settings = { silentPrint: false, printer: '', fullscreen: false }
const loadSettings = () => { try { settings = { ...settings, ...JSON.parse(fs.readFileSync(SETTINGS_FILE(), 'utf8')) } } catch {} }
const saveSettings = () => { try { fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(settings, null, 1)) } catch {} }

const trusted = (url) => {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (u.hostname === 'sicrm.uz' || u.hostname.endsWith('.sicrm.uz'))
  } catch { return false }
}
const isLocal = (url) => String(url).startsWith('file://')
// Web ilovadagi "Kompaniyani almashtirish" (mobil ilova manzili) → dasturning kod ekrani
const isChangeCompany = (url) => /^(https:\/\/localhost|capacitor:\/\/localhost)\/index\.html\?change=1/.test(String(url))

let win = null
let printers = []

const openStart = (change = false) => win.loadFile(path.join(WWW, 'index.html'), change ? { search: 'change=1' } : {})

const createWindow = () => {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    show: false, backgroundColor: '#0B0B0F', autoHideMenuBar: true, title: 'SICRM',
    fullscreen: !!settings.fullscreen,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  win.webContents.setUserAgent(`${win.webContents.getUserAgent()} SICRM-App SICRM-Desktop`)
  win.once('ready-to-show', () => { if (!settings.fullscreen) win.maximize(); win.show() })

  const guard = (e, url) => {
    if (isChangeCompany(url)) { e.preventDefault(); openStart(true); return }
    if (isLocal(url) || trusted(url)) return
    e.preventDefault()
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
  }
  win.webContents.on('will-navigate', guard)
  win.webContents.on('will-redirect', guard)
  // Yangi oyna (to'lov havolasi, hujjat) — tizim brauzerida
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url) && !trusted(url)) shell.openExternal(url)
    else if (trusted(url)) win.loadURL(url)
    return { action: 'deny' }
  })
  win.webContents.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && !isLocal(url)) win.loadFile(path.join(WWW, 'offline.html'))
  })
  win.on('enter-full-screen', () => { settings.fullscreen = true; saveSettings(); buildMenu() })
  win.on('leave-full-screen', () => { settings.fullscreen = false; saveSettings(); buildMenu() })
  openStart()
}

// Kamera (yuz bilan kirish, barkod skaner) — faqat *.sicrm.uz ga
const setupPermissions = () => {
  const ok = (wc, permission, origin) => ['media', 'clipboard-sanitized-write', 'fullscreen'].includes(permission) && trusted(origin || wc?.getURL())
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => cb(ok(wc, permission, details?.requestingUrl)))
  session.defaultSession.setPermissionCheckHandler((wc, permission, origin) => ok(wc, permission, origin))
}

// Chop etish: alohida yashirin oynada HTML → printer (sozlamaga qarab oynasiz yoki chop etish oynasi bilan)
ipcMain.on('sicrm:print', (e, html, title) => {
  if (!trusted(e.senderFrame?.url || e.sender.getURL())) return
  const origin = new URL(e.sender.getURL()).origin + '/'
  // Vaqtinchalik fayl (data: URL ~2 MB chegarasi — narxnomada rasmlar bilan oshib ketadi); nisbiy manzillar sayt bo'yicha
  const file = path.join(app.getPath('temp'), `sicrm-print-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.html`)
  const base = `<base href="${origin}">`
  fs.writeFileSync(file, /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + base) : base + html, 'utf8')
  const pw = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } })
  pw.on('closed', () => fs.rm(file, { force: true }, () => {}))
  pw.webContents.once('did-finish-load', () => {
    pw.webContents.print({
      silent: !!settings.silentPrint, printBackground: true,
      ...(settings.printer ? { deviceName: settings.printer } : {}),
    }, (success, reason) => {
      if (!success && reason && reason !== 'cancelled') dialog.showMessageBox(win, { type: 'warning', message: `Chop etilmadi: ${reason}` })
      setTimeout(() => { if (!pw.isDestroyed()) pw.destroy() }, 500)
    })
  })
  pw.loadFile(file)
  pw.setTitle(title)
})

// Faylni saqlash (Excel, CSV, barkod rasmi)
ipcMain.on('sicrm:save', async (e, base64, filename) => {
  if (!trusted(e.senderFrame?.url || e.sender.getURL())) return
  const name = filename.replace(/[\\/:*?"<>|]/g, '_').slice(0, 120) || 'fayl'
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(app.getPath('downloads'), name) })
  if (r.canceled || !r.filePath) return
  try {
    fs.writeFileSync(r.filePath, Buffer.from(base64, 'base64'))
    shell.showItemInFolder(r.filePath)
  } catch (err) {
    dialog.showMessageBox(win, { type: 'error', message: `Saqlab bo'lmadi: ${err.message}` })
  }
})

const refreshPrinters = async () => {
  try { printers = win ? await win.webContents.getPrintersAsync() : [] } catch { printers = [] }
  buildMenu()
}

const buildMenu = () => {
  const printerItems = [
    { label: 'Standart printer', type: 'radio', checked: !settings.printer, click: () => { settings.printer = ''; saveSettings() } },
    ...printers.map(p => ({ label: p.displayName || p.name, type: 'radio', checked: settings.printer === p.name, click: () => { settings.printer = p.name; saveSettings() } })),
    { type: 'separator' },
    { label: "Printerlar ro'yxatini yangilash", click: refreshPrinters },
  ]
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    {
      label: 'SICRM',
      submenu: [
        { label: 'Kompaniyani almashtirish', click: () => openStart(true) },
        { label: 'Qayta yuklash', accelerator: 'F5', click: () => win?.webContents.reload() },
        { label: "To'liq ekran", accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11', type: 'checkbox', checked: !!settings.fullscreen, click: () => win?.setFullScreen(!win.isFullScreen()) },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Kattalashtirish' }, { role: 'zoomOut', label: 'Kichiklashtirish' }, { role: 'resetZoom', label: "Asl o'lcham" },
        ...(isMac ? [] : [{ type: 'separator' }, { role: 'quit', label: 'Chiqish' }]),
      ],
    },
    { role: 'editMenu', label: 'Tahrirlash' },
    {
      label: 'Chop etish',
      submenu: [
        { label: 'Oynasiz chop etish (chek printeri uchun)', type: 'checkbox', checked: !!settings.silentPrint, click: (i) => { settings.silentPrint = i.checked; saveSettings() } },
        { label: 'Printer', submenu: printerItems },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// Windows: dastur yangilanishi (GitHub "desktop-latest" relizidan). Mac — imzosiz ilovada avtomatik yangilanish ishlamaydi.
const setupUpdates = () => {
  if (isMac || !app.isPackaged) return
  try {
    const { autoUpdater } = require('electron-updater')
    autoUpdater.autoDownload = true
    autoUpdater.on('update-downloaded', async () => {
      const r = await dialog.showMessageBox(win, { type: 'info', buttons: ['Hozir qayta ishga tushirish', 'Keyinroq'], defaultId: 0, message: "SICRM dasturining yangi versiyasi yuklandi. O'rnatish uchun dastur qayta ishga tushadi." })
      if (r.response === 0) autoUpdater.quitAndInstall()
    })
    const check = () => autoUpdater.checkForUpdates().catch(() => {})
    check()
    setInterval(check, 6 * 60 * 60 * 1000)
  } catch {}
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus() } })
  app.whenReady().then(() => {
    loadSettings()
    setupPermissions()
    createWindow()
    buildMenu()
    refreshPrinters()
    setupUpdates()
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
  })
  app.on('window-all-closed', () => { if (!isMac) app.quit() })
}
