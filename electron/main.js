const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    mainWindow.webContents.openDevTools()
  }
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
