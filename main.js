const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const backupDir = path.join(app.getPath('userData'), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'assets/Square44x44Logo.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
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

// Create backup of file
function createBackup(content, originalPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.basename(originalPath || 'untitled.txt');
    const backupPath = path.join(backupDir, `${filename}.${timestamp}.bak`);
    
    try {
        fs.writeFileSync(backupPath, content);
        // Keep only last 5 backups
        const files = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(filename))
            .sort()
            .reverse();
            
        if (files.length > 5) {
            files.slice(5).forEach(f => {
                fs.unlinkSync(path.join(backupDir, f));
            });
        }
    } catch (error) {
        console.error('Error creating backup:', error);
    }
}

// Handle file open
ipcMain.handle('open-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Text Files', extensions: ['txt', 'md', 'rtf'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return { content, filePath };
        } catch (error) {
            await dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Error',
                message: 'Failed to open file',
                detail: error.message
            });
            return null;
        }
    }
    return null;
});

// Handle file save
ipcMain.handle('save-file', async (event, { content, filePath, fileType, saveAs = false, quickSave = false }) => {
    let targetPath = filePath;
    
    // Create backup before saving
    if (filePath) {
        createBackup(content, filePath);
    }
    
    // For quick save, only save if we have a path
    if (quickSave && !targetPath) {
        return null;
    }
    
    if (!targetPath || saveAs) {
        // Get default save path
        let defaultPath;
        try {
            defaultPath = path.join(app.getPath('documents'), `untitled.${fileType}`);
        } catch (error) {
            // Fallback to user data path if documents is not available
            defaultPath = path.join(app.getPath('userData'), `untitled.${fileType}`);
        }

        const result = await dialog.showSaveDialog(mainWindow, {
            defaultPath: defaultPath,
            filters: [
                { name: 'Text Files', extensions: ['txt', 'md', 'rtf'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (result.canceled) {
            return null;
        }
        
        targetPath = result.filePath;
    }
    
    try {
        // Format content based on file type
        let contentToSave = content;
        if (targetPath.toLowerCase().endsWith('.rtf')) {
            contentToSave = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0\\fnil\\fcharset0 Arial;}}
{\\colortbl ;\\red0\\green0\\blue0;}
\\viewkind4\\uc1\\pard\\cf1\\f0\\fs24 ${content.replace(/\n/g, '\\par\n')}
}`;
        }
        
        fs.writeFileSync(targetPath, contentToSave);
        return targetPath;
    } catch (error) {
        await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Error',
            message: 'Failed to save file',
            detail: error.message
        });
        return null;
    }
});

// Handle auto-save
ipcMain.handle('auto-save', async (event, { content, filePath }) => {
    if (!filePath) return null;
    
    try {
        createBackup(content, filePath);
        fs.writeFileSync(filePath, content);
        return true;
    } catch (error) {
        console.error('Auto-save failed:', error);
        return false;
    }
});

// Handle recover from backup
ipcMain.handle('recover-from-backup', async (event, originalPath) => {
    try {
        const filename = path.basename(originalPath || 'untitled.txt');
        const backups = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(filename))
            .sort()
            .reverse();
            
        if (backups.length > 0) {
            const latestBackup = backups[0];
            const content = fs.readFileSync(path.join(backupDir, latestBackup), 'utf8');
            return { content, backupPath: path.join(backupDir, latestBackup) };
        }
    } catch (error) {
        console.error('Error recovering from backup:', error);
    }
    return null;
});

// Handle dropped file
ipcMain.handle('handle-file-drop', async (event, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return { content, filePath };
    } catch (error) {
        await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Error',
            message: 'Failed to open dropped file',
            detail: error.message
        });
        return null;
    }
});
