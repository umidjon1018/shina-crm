// SICRM kompyuter dasturi (Windows / Mac).
// Chapda yon panel — kirilgan kompaniyalar ro'yxati; har kompaniya alohida ko'rinishda (WebContentsView) doim ochiq turadi,
// shuning uchun o'tishda qayta login kerak emas (har domenning sessiyasi o'zida). Yangi kompaniya — kod sahifasi (mobile/www).
// Frontend deploy dasturda ham darhol ko'rinadi; dasturning o'zi faqat bu fayllar o'zgarsa yangilanadi (Windows'da avtomatik).
const { app, BaseWindow, WebContentsView, Menu, ipcMain, dialog, shell, session, net } = require('electron')
const path = require('path')
const fs = require('fs')

const WWW = path.join(__dirname, 'www')
const SETTINGS_FILE = () => path.join(app.getPath('userData'), 'settings.json')
const isMac = process.platform === 'darwin'
const SIDEBAR_FULL = 248
const SIDEBAR_MINI = 14 // yig'ilganda — faqat ochish tutqichi

let settings = { silentPrint: false, printer: '', fullscreen: false, collapsed: false, companies: [], active: null }
const loadSettings = () => { try { settings = { ...settings, ...JSON.parse(fs.readFileSync(SETTINGS_FILE(), 'utf8')) } } catch {} }
const saveSettings = () => { try { fs.writeFileSync(SETTINGS_FILE(), JSON.stringify(settings, null, 1)) } catch {} }

const trusted = (url) => {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && (u.hostname === 'sicrm.uz' || u.hostname.endsWith('.sicrm.uz'))
  } catch { return false }
}
const isLocal = (url) => String(url).startsWith('file://')
// Web ilovadagi "Kompaniyani almashtirish" (mobil ilova manzili) → "Kompaniya qo'shish" sahifasi
const isChangeCompany = (url) => /^(https:\/\/localhost|capacitor:\/\/localhost)\/index\.html\?change=1/.test(String(url))
const codeOf = (url) => { try { return new URL(url).hostname.replace(/\.sicrm\.uz$/, '') } catch { return null } }

let win = null
let sidebar = null
let startView = null
const views = new Map() // kod → WebContentsView
let current = null // ko'rinib turgan view
let printers = []

// ─── Ko'rinishlar ─────────────────────────────────
const contentBounds = () => {
  const [w, h] = win.getContentSize()
  const sw = settings.collapsed ? SIDEBAR_MINI : SIDEBAR_FULL
  return { side: { x: 0, y: 0, width: sw, height: h }, main: { x: sw, y: 0, width: Math.max(0, w - sw), height: h } }
}
const layout = () => {
  if (!win) return
  const b = contentBounds()
  sidebar.setBounds(b.side)
  for (const v of [startView, ...views.values()]) if (v) v.setBounds(b.main)
}
const show = (view) => {
  for (const v of [startView, ...views.values()]) if (v) v.setVisible(v === view)
  current = view
  view.webContents.focus()
}

const sendState = () => {
  if (!sidebar) return
  sidebar.webContents.send('shell:state', {
    collapsed: !!settings.collapsed,
    active: current === startView ? null : settings.active,
    companies: settings.companies.map(c => ({ ...c, host: c.url.replace('https://', ''), admin: c.code === 'admin' })),
  })
}

const guardNavigation = (wc) => {
  const guard = (e, url) => {
    if (isChangeCompany(url)) { e.preventDefault(); openStart(); return }
    if (isLocal(url) || trusted(url)) return
    e.preventDefault()
    if (/^https?:\/\//.test(url)) shell.openExternal(url)
  }
  wc.on('will-navigate', guard)
  wc.on('will-redirect', guard)
  // Yangi oyna: boshqa sayt (to'lov havolasi) — tizim brauzerida; o'z kompaniyasi — shu ko'rinishda
  wc.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url) && !trusted(url)) shell.openExternal(url)
    else if (trusted(url)) openCompany(url)
    return { action: 'deny' }
  })
  wc.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (isMainFrame && code !== -3 && !isLocal(url)) wc.loadFile(path.join(WWW, 'offline.html'))
  })
}

const newView = (preload) => {
  const v = new WebContentsView({ webPreferences: { preload, contextIsolation: true, nodeIntegration: false, sandbox: true } })
  v.setBackgroundColor('#0B0B0F')
  v.webContents.setUserAgent(`${v.webContents.getUserAgent()} SICRM-App SICRM-Desktop`)
  win.contentView.addChildView(v)
  return v
}

// Kompaniya qo'shish sahifasi (kod kiritish). Kompaniya tanlanganda uning manziliga o'tish o'rniga — alohida ko'rinish ochiladi
// auto — dastur birinchi ochilganda: kod sahifasi oxirgi tanlangan kompaniyani eslasa, o'zi o'tadi (eski versiyadan yangilanish)
const openStart = (auto = false) => {
  if (!startView) {
    startView = newView(path.join(__dirname, 'preload.js'))
    startView.webContents.on('will-navigate', (e, url) => {
      if (trusted(url)) { e.preventDefault(); openCompany(url); startView.webContents.loadFile(path.join(WWW, 'index.html'), { search: 'change=1' }) }
    })
    layout()
  }
  startView.webContents.loadFile(path.join(WWW, 'index.html'), auto === true ? {} : { search: 'change=1' })
  show(startView)
  sendState()
}

// Kompaniya nomi — uning o'z serveridan (/api/app/tenant)
const fetchName = async (origin) => {
  try {
    const r = await net.fetch(`${origin}/api/app/tenant`, { cache: 'no-store' })
    const d = await r.json()
    return d?.name || null
  } catch { return null }
}

const openCompany = (url) => {
  if (!trusted(url)) return
  const origin = new URL(url).origin
  const code = codeOf(url)
  let entry = settings.companies.find(c => c.code === code)
  if (!entry) {
    entry = { code, url: origin, name: code === 'admin' ? 'SICRM boshqaruv' : code }
    settings.companies.push(entry)
    fetchName(origin).then(name => { if (name && code !== 'admin') { entry.name = name; saveSettings(); sendState() } })
  }
  let v = views.get(code)
  if (!v) {
    v = newView(path.join(__dirname, 'preload.js'))
    guardNavigation(v.webContents)
    views.set(code, v)
    layout()
    v.webContents.loadURL(url.startsWith(origin) ? url : origin)
  } else if (url !== origin && url !== `${origin}/`) {
    v.webContents.loadURL(url)
  }
  settings.active = code
  saveSettings()
  show(v)
  sendState()
}

const selectCompany = (code) => {
  const c = settings.companies.find(x => x.code === code)
  if (c) openCompany(c.url)
}

const removeCompany = (code) => {
  settings.companies = settings.companies.filter(c => c.code !== code)
  const v = views.get(code)
  if (v) { win.contentView.removeChildView(v); v.webContents.close(); views.delete(code) }
  if (settings.active === code) {
    settings.active = settings.companies[0]?.code || null
    if (settings.active) selectCompany(settings.active)
    else openStart()
  }
  saveSettings()
  sendState()
}

const createWindow = () => {
  win = new BaseWindow({
    width: 1400, height: 860, minWidth: 900, minHeight: 600,
    show: false, backgroundColor: '#0B0B0F', autoHideMenuBar: true, title: 'SICRM',
    fullscreen: !!settings.fullscreen,
  })
  sidebar = new WebContentsView({ webPreferences: { preload: path.join(__dirname, 'preload-sidebar.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } })
  sidebar.setBackgroundColor('#08080C')
  win.contentView.addChildView(sidebar)
  sidebar.webContents.loadFile(path.join(__dirname, 'sidebar.html'))
  sidebar.webContents.on('will-navigate', (e) => e.preventDefault())

  const last = settings.companies.find(c => c.code === settings.active) || settings.companies[0]
  if (last) openCompany(last.url)
  else openStart(true)

  win.on('resize', layout)
  win.on('enter-full-screen', () => { settings.fullscreen = true; saveSettings(); buildMenu(); layout() })
  win.on('leave-full-screen', () => { settings.fullscreen = false; saveSettings(); buildMenu(); layout() })
  win.once('show', layout)
  if (!settings.fullscreen) win.maximize()
  win.show()
  layout()
}

ipcMain.on('shell:ready', sendState)
ipcMain.on('shell:select', (e, code) => selectCompany(code))
ipcMain.on('shell:add', () => openStart())
ipcMain.on('shell:remove', (e, code) => removeCompany(code))
ipcMain.on('shell:reload', () => current?.webContents.reload())
ipcMain.on('shell:toggle', () => { settings.collapsed = !settings.collapsed; saveSettings(); layout(); sendState() })

// Kamera (yuz bilan kirish, barkod skaner) — faqat *.sicrm.uz ga
const setupPermissions = () => {
  const ok = (wc, permission, origin) => ['media', 'clipboard-sanitized-write', 'fullscreen'].includes(permission) && trusted(origin || wc?.getURL())
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb, details) => cb(ok(wc, permission, details?.requestingUrl)))
  session.defaultSession.setPermissionCheckHandler((wc, permission, origin) => ok(wc, permission, origin))
}

// Chop etish: alohida yashirin oynada HTML → printer (sozlamaga qarab oynasiz yoki chop etish oynasi bilan)
ipcMain.on('sicrm:print', (e, html, title) => {
  if (!trusted(e.senderFrame?.url || e.sender.getURL())) return
  const { BrowserWindow } = require('electron')
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
  try { printers = sidebar ? await sidebar.webContents.getPrintersAsync() : [] } catch { printers = [] }
  buildMenu()
}

const zoom = (d) => { const wc = current?.webContents; if (wc) wc.setZoomLevel(d === 0 ? 0 : wc.getZoomLevel() + d) }

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
        { label: "Kompaniya qo'shish", click: () => openStart() },
        { label: 'Yon panelni yig\'ish / ochish', accelerator: 'CmdOrCtrl+B', click: () => { settings.collapsed = !settings.collapsed; saveSettings(); layout(); sendState() } },
        { label: 'Qayta yuklash', accelerator: 'F5', click: () => current?.webContents.reload() },
        { label: "To'liq ekran", accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11', type: 'checkbox', checked: !!settings.fullscreen, click: () => win?.setFullScreen(!win.isFullScreen()) },
        { type: 'separator' },
        { label: 'Kattalashtirish', accelerator: 'CmdOrCtrl+=', click: () => zoom(0.5) },
        { label: 'Kichiklashtirish', accelerator: 'CmdOrCtrl+-', click: () => zoom(-0.5) },
        { label: "Asl o'lcham", accelerator: 'CmdOrCtrl+0', click: () => zoom(0) },
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
    app.on('activate', () => { if (!win) createWindow() })
  })
  app.on('window-all-closed', () => { if (!isMac) app.quit() })
}
