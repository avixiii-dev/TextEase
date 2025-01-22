const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// File handling
ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Documents', extensions: ['txt', 'rtf', 'md'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const filePath = result.filePaths[0];
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Handle RTF files
    if (filePath.toLowerCase().endsWith('.rtf')) {
      // Basic RTF stripping (this is a simple implementation)
      content = content.replace(/[{}\\].*?[{}\\]/g, '')
                      .replace(/\\par/g, '\n')
                      .trim();
    }

    return {
      content,
      filePath
    };
  }
});

ipcMain.handle('save-file', async (event, { content, filePath, fileType, saveAs = false }) => {
  let pathToSave = filePath;

  if (!pathToSave || saveAs) {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Plain Text', extensions: ['txt'] },
        { name: 'Markdown', extensions: ['md'] },
        { name: 'Rich Text Format', extensions: ['rtf'] }
      ],
      defaultPath: pathToSave || `untitled.${fileType}`
    });

    if (result.canceled) return false;
    pathToSave = result.filePath;
  }

  // Handle different file types
  let contentToSave = content;
  const extension = pathToSave.split('.').pop().toLowerCase();

  if (extension === 'rtf') {
    // Basic RTF wrapper
    contentToSave = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}
{\\colortbl ;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\cf1\\f0\\fs24 ${content.replace(/\n/g, '\\par ')}
}`;
  }

  fs.writeFileSync(pathToSave, contentToSave);
  return pathToSave;
});
