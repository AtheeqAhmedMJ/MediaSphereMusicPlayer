// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectMusicFile: () => ipcRenderer.invoke('select-music-file'),
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  createPlaylist: (name, tracks) => ipcRenderer.invoke('create-playlist', { name, tracks }),
  loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
  saveCurrentPlaylist: (playlistData) => ipcRenderer.invoke('save-current-playlist', playlistData),
  getStoredTracks: () => ipcRenderer.invoke('get-stored-tracks'),
});