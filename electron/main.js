const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')

let mainWindow = null

const MIME = {
  '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
  '.woff2': 'font/woff2', '.map': 'application/json',
}

function startProdServer() {
  const dist = path.join(__dirname, '../dist')
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      let filePath = path.join(dist, urlPath === '/' ? 'index.html' : urlPath)
      if (!fs.existsSync(filePath)) {
        filePath = path.join(dist, 'index.html')
      }
      const ext = path.extname(filePath)
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
      fs.createReadStream(filePath).pipe(res)
    })
    server.listen(0, () => resolve(`http://localhost:${server.address().port}`))
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
    show: false,
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    startProdServer().then((url) => {
      mainWindow.loadURL(url)
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('select-file', async (_, opts) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: [opts.isDir ? 'openDirectory' : 'openFile'],
    filters: opts.extensions ? [{ name: 'Files', extensions: opts.extensions }] : undefined
  })
  return result.filePaths[0] || null
})

ipcMain.handle('save-file', async (_, opts) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: opts.defaultName,
    filters: opts.extensions ? [{ name: 'Files', extensions: opts.extensions }] : undefined
  })
  return result.filePath || null
})

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url)
})

ipcMain.handle('open-folder', async (_, filePath) => {
  await shell.showItemInFolder(filePath)
})
