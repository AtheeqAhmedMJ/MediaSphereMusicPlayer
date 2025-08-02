// main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

let mainWindow;
const userDataPath = app.getPath('userData');
const playlistsPath = path.join(userDataPath, 'playlists');
const tracksDbPath = path.join(userDataPath, 'tracks.json');
const bookmarksDbPath = path.join(userDataPath, 'bookmarks.json');

// Ensure directories exist
function ensureDirectoriesExist() {
  if (!fs.existsSync(playlistsPath)) {
    fs.mkdirSync(playlistsPath, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
  preload: path.join(__dirname, 'preload.js'),
  nodeIntegration: false,
  contextIsolation: true,
  webSecurity: false, // <-- ADD THIS LINE to allow file:// URLs in <audio>
},

    titleBarStyle: 'hiddenInset',
    frame: false,
    backgroundColor: '#121212',
  });

  mainWindow.loadFile('index.html');
}

// Get all audio files recursively in a directory
async function getAudioFiles(directory) {
  ensureDirectoriesExist();
  const files = [];
  const items = await readdir(directory);

  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = await stat(itemPath);

    if (stats.isDirectory()) {
      const subFiles = await getAudioFiles(itemPath);
      files.push(...subFiles);
    } else {
      const ext = path.extname(itemPath).toLowerCase();
      if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext)) {
        files.push({
          path: itemPath,
          name: path.basename(itemPath),
          directory: path.dirname(itemPath),
          added: new Date().toISOString(),
        });
      }
    }
  }
  return files;
}

// Save tracks to storage
function saveTracksToStorage(tracks) {
  try {
    fs.writeFileSync(tracksDbPath, JSON.stringify(tracks, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving tracks to storage:', error);
    return false;
  }
}

// Get stored tracks
function getStoredTracks() {
  try {
    if (fs.existsSync(tracksDbPath)) {
      const data = fs.readFileSync(tracksDbPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading tracks from storage:', error);
    return [];
  }
}

// Save bookmarks to storage
function saveBookmarksToStorage(bookmarks) {
  try {
    fs.writeFileSync(bookmarksDbPath, JSON.stringify(bookmarks, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving bookmarks to storage:', error);
    return false;
  }
}

// Get stored bookmarks
function getStoredBookmarks() {
  try {
    if (fs.existsSync(bookmarksDbPath)) {
      const data = fs.readFileSync(bookmarksDbPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading bookmarks from storage:', error);
    return [];
  }
}

app.whenReady().then(() => {
  ensureDirectoriesExist();
  createWindow();

  // Select a single music file
  ipcMain.handle('select-music-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'] }]
    });

    if (result.canceled || result.filePaths.length === 0) return [];
    
    const tracks = result.filePaths.map(filePath => ({
      path: filePath,
      name: path.basename(filePath),
      directory: path.dirname(filePath),
      added: new Date().toISOString(),
    }));
    
    // Add tracks to storage
    const storedTracks = getStoredTracks();
    const newTracks = [...storedTracks, ...tracks];
    saveTracksToStorage(newTracks);
    
    return tracks;
  });

  // Select a music folder
  ipcMain.handle('select-music-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) return [];
    
    const tracks = await getAudioFiles(result.filePaths[0]);
    
    // Add tracks to storage
    const storedTracks = getStoredTracks();
    const allTrackPaths = new Set(storedTracks.map(t => t.path));
    const uniqueNewTracks = tracks.filter(t => !allTrackPaths.has(t.path));
    const newTracks = [...storedTracks, ...uniqueNewTracks];
    saveTracksToStorage(newTracks);
    
    return tracks;
  });

  // Create a playlist
  ipcMain.handle('create-playlist', async (event, { name, tracks }) => {
    try {
      const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const playlistPath = path.join(playlistsPath, `${sanitizedName}.json`);
      const playlistData = {
        name,
        createdAt: new Date().toISOString(),
        tracks
      };
      
      fs.writeFileSync(playlistPath, JSON.stringify(playlistData, null, 2));
      return { success: true, playlistId: sanitizedName };
    } catch (error) {
      console.error('Error creating playlist:', error);
      return { success: false, error: error.message };
    }
  });

  // Load all playlists
  ipcMain.handle('load-playlists', async () => {
    try {
      const files = await readdir(playlistsPath);
      const playlists = [];
      
      for (const file of files) {
        if (path.extname(file) === '.json') {
          const filePath = path.join(playlistsPath, file);
          const data = fs.readFileSync(filePath, 'utf8');
          playlists.push(JSON.parse(data));
        }
      }
      
      return playlists;
    } catch (error) {
      console.error('Error loading playlists:', error);
      return [];
    }
  });

  // Save current playlist
  ipcMain.handle('save-current-playlist', async (event, playlistData) => {
    try {
      const sanitizedName = playlistData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const playlistPath = path.join(playlistsPath, `${sanitizedName}.json`);
      fs.writeFileSync(playlistPath, JSON.stringify(playlistData, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Error saving playlist:', error);
      return { success: false, error: error.message };
    }
  });

  // Get stored tracks
  ipcMain.handle('get-stored-tracks', () => {
    return getStoredTracks();
  });

  // Add bookmark
  ipcMain.handle('add-bookmark', async (event, track) => {
    try {
      const bookmarks = getStoredBookmarks();
      const existingIndex = bookmarks.findIndex(b => b.path === track.path);
      
      if (existingIndex === -1) {
        const bookmark = {
          ...track,
          bookmarkedAt: new Date().toISOString()
        };
        bookmarks.push(bookmark);
        saveBookmarksToStorage(bookmarks);
        return { success: true, bookmarked: true };
      } else {
        return { success: true, bookmarked: false, message: 'Track already bookmarked' };
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return { success: false, error: error.message };
    }
  });

  // Remove bookmark
  ipcMain.handle('remove-bookmark', async (event, trackPath) => {
    try {
      const bookmarks = getStoredBookmarks();
      const filteredBookmarks = bookmarks.filter(b => b.path !== trackPath);
      saveBookmarksToStorage(filteredBookmarks);
      return { success: true };
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return { success: false, error: error.message };
    }
  });

  // Get stored bookmarks
  ipcMain.handle('get-stored-bookmarks', () => {
    return getStoredBookmarks();
  });

  // Check if track is bookmarked
  ipcMain.handle('is-track-bookmarked', async (event, trackPath) => {
    try {
      const bookmarks = getStoredBookmarks();
      return bookmarks.some(b => b.path === trackPath);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  });

  // Clear all bookmarks
  ipcMain.handle('clear-all-bookmarks', async () => {
    try {
      saveBookmarksToStorage([]);
      return { success: true };
    } catch (error) {
      console.error('Error clearing all bookmarks:', error);
      return { success: false, error: error.message };
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});