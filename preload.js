// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectMusicFile: () => ipcRenderer.invoke('select-music-file'),
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  createPlaylist: (name, tracks) => ipcRenderer.invoke('create-playlist', { name, tracks }),
  loadPlaylists: () => ipcRenderer.invoke('load-playlists'),
  saveCurrentPlaylist: (playlistData) => ipcRenderer.invoke('save-current-playlist', playlistData),
  getStoredTracks: () => ipcRenderer.invoke('get-stored-tracks'),
  addBookmark: (track) => ipcRenderer.invoke('add-bookmark', track),
  removeBookmark: (trackPath) => ipcRenderer.invoke('remove-bookmark', trackPath),
  getStoredBookmarks: () => ipcRenderer.invoke('get-stored-bookmarks'),
  isTrackBookmarked: (trackPath) => ipcRenderer.invoke('is-track-bookmarked', trackPath),
  clearAllBookmarks: () => ipcRenderer.invoke('clear-all-bookmarks'),
});