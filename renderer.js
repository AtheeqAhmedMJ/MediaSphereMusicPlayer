// renderer.js - Enhanced version

// Global state
let tracks = [];
let playlists = [];
let bookmarks = [];
let currentTrackIndex = -1;
let currentPlaylist = null;
let isPlaying = false;
let isShuffled = false;
let repeatMode = 'none'; // 'none', 'one', 'all'
let audioContext = null;
let audioAnalyzer = null;
let visualizerActive = false;

// DOM Elements - Player Controls
const audioEl = new Audio();
const playPauseBtn = document.getElementById('playPause');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const seekBar = document.getElementById('seekBar');
const progressBar = document.getElementById('progressBar');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const volumeSlider = document.getElementById('volumeSlider');

// DOM Elements - Track Info
const currentTrackEl = document.getElementById('currentTrack');
const currentArtistEl = document.getElementById('currentArtist');
const nowPlayingTitleEl = document.getElementById('nowPlayingTitle');
const nowPlayingArtistEl = document.getElementById('nowPlayingArtist');
const albumArtEl = document.getElementById('albumArt');
const miniAlbumArtEl = document.getElementById('miniAlbumArt');

// DOM Elements - Library
const trackListEl = document.getElementById('trackList');
const recentlyAddedEl = document.getElementById('recentlyAddedTracks');
const trackGridEl = document.getElementById('trackGrid');

// DOM Elements - Navigation
const navItems = document.querySelectorAll('#navMenu li');
const viewContainers = document.querySelectorAll('.view');

// DOM Elements - Controls
const addFilesBtn = document.getElementById('addFilesBtn');
const addFolderBtn = document.getElementById('addFolderBtn');
const createPlaylistBtn = document.getElementById('createPlaylistBtn');
const playlistModal = document.getElementById('playlistModal');
const savePlaylistBtn = document.getElementById('savePlaylistBtn');
const cancelPlaylistBtn = document.getElementById('cancelPlaylistBtn');
const closeModalBtn = document.querySelector('.close-modal');
const searchInput = document.getElementById('searchInput');
const listViewBtn = document.getElementById('listViewBtn');
const gridViewBtn = document.getElementById('gridViewBtn');
const playlistsGridEl = document.getElementById('playlistsGrid');
const playlistMenuEl = document.getElementById('playlistMenu');

// DOM Elements - Bookmarks
const bookmarkBtn = document.getElementById('bookmarkBtn');
const clearBookmarksBtn = document.getElementById('clearBookmarksBtn');
const bookmarkCountEl = document.getElementById('bookmarkCount');
const bookmarkListEl = document.getElementById('bookmarkList');
const bookmarkGridEl = document.getElementById('bookmarkGrid');
const bookmarkListViewBtn = document.getElementById('bookmarkListViewBtn');
const bookmarkGridViewBtn = document.getElementById('bookmarkGridViewBtn');
const bookmarkSortByEl = document.getElementById('bookmarkSortBy');

// Visualizer
const visualizerCanvas = document.getElementById('audioVisualizer');
const canvasCtx = visualizerCanvas.getContext('2d');

// Initialize application
document.addEventListener('DOMContentLoaded', async () => {
  initApp();
  initWindowControls();
  initNavigationControls();
  loadStoredTracks();
  loadPlaylists();
  loadBookmarks();
  initVisualizer();
});

// Setup initial state
async function initApp() {
  // Set audio event listeners
  audioEl.addEventListener('timeupdate', updateProgress);
  audioEl.addEventListener('ended', handleTrackEnd);
  audioEl.addEventListener('loadedmetadata', updateTotalTime);

  // Player controls
  playPauseBtn.addEventListener('click', togglePlayPause);
  nextBtn.addEventListener('click', playNextTrack);
  prevBtn.addEventListener('click', playPreviousTrack);
  seekBar.addEventListener('input', seekTrack);
  volumeSlider.addEventListener('input', adjustVolume);
  shuffleBtn.addEventListener('click', toggleShuffle);
  repeatBtn.addEventListener('click', toggleRepeat);

  // Library controls
  addFilesBtn.addEventListener('click', addMusicFiles);
  addFolderBtn.addEventListener('click', addMusicFolder);
  document.getElementById('browseFolderBtn').addEventListener('click', addMusicFolder);
  document.getElementById('browseFilesBtn').addEventListener('click', addMusicFiles);

  
  // Search functionality
  searchInput.addEventListener('input', searchLibrary);
  
  // View controls
  listViewBtn.addEventListener('click', () => switchLibraryView('list'));
  gridViewBtn.addEventListener('click', () => switchLibraryView('grid'));
  
  // Playlist controls
  createPlaylistBtn.addEventListener('click', showPlaylistModal);
  savePlaylistBtn.addEventListener('click', createPlaylist);
  cancelPlaylistBtn.addEventListener('click', hidePlaylistModal);
  closeModalBtn.addEventListener('click', hidePlaylistModal);
  
  // Bookmark controls
  bookmarkBtn.addEventListener('click', toggleBookmark);
  clearBookmarksBtn.addEventListener('click', clearAllBookmarks);
  bookmarkListViewBtn.addEventListener('click', () => switchBookmarkView('list'));
  bookmarkGridViewBtn.addEventListener('click', () => switchBookmarkView('grid'));
  bookmarkSortByEl.addEventListener('change', sortBookmarks);
  
  // Set volume from slider
  audioEl.volume = volumeSlider.value / 100;
}

// Window controls (minimize, maximize, close)
function initWindowControls() {
  const minimizeBtn = document.getElementById('minimizeBtn');
  const maximizeBtn = document.getElementById('maximizeBtn');
  const closeBtn = document.getElementById('closeBtn');
  
  // These events would need to be connected to Electron IPC in preload.js
  // For now they're placeholders
  minimizeBtn.addEventListener('click', () => console.log('Minimize window'));
  maximizeBtn.addEventListener('click', () => console.log('Maximize window'));
  closeBtn.addEventListener('click', () => console.log('Close window'));
}

// Navigation between views
function initNavigationControls() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const viewName = item.getAttribute('data-view');
      
      // Update active navigation item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Show the selected view
      viewContainers.forEach(container => {
        container.classList.remove('active-view');
        if (container.id === `${viewName}View`) {
          container.classList.add('active-view');
        }
      });
      
      // Update view title
      document.querySelector('.view-title').textContent = item.textContent.trim();
    });
  });
}

// Load tracks from storage
async function loadStoredTracks() {
  try {
    tracks = await window.electronAPI.getStoredTracks();
    renderTrackList();
    renderRecentlyAdded();
  } catch (error) {
    console.error('Failed to load tracks:', error);
  }
}

// Load playlists from storage
async function loadPlaylists() {
  try {
    playlists = await window.electronAPI.loadPlaylists();
    renderPlaylists();
  } catch (error) {
    console.error('Failed to load playlists:', error);
  }
}

// Load bookmarks from storage
async function loadBookmarks() {
  try {
    bookmarks = await window.electronAPI.getStoredBookmarks();
    renderBookmarks();
    updateBookmarkCount();
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
  }
}

// Toggle bookmark for current track
async function toggleBookmark() {
  if (currentTrackIndex === -1) return;
  
  const track = tracks[currentTrackIndex];
  const isBookmarked = await window.electronAPI.isTrackBookmarked(track.path);
  
  try {
    if (isBookmarked) {
      // Remove bookmark
      const result = await window.electronAPI.removeBookmark(track.path);
      if (result.success) {
        bookmarks = bookmarks.filter(b => b.path !== track.path);
        updateBookmarkButton(false);
        renderBookmarks();
        updateBookmarkCount();
        showNotification('Bookmark removed', 'success');
      }
    } else {
      // Add bookmark
      const result = await window.electronAPI.addBookmark(track);
      if (result.success && result.bookmarked) {
        bookmarks.push({ ...track, bookmarkedAt: new Date().toISOString() });
        updateBookmarkButton(true);
        renderBookmarks();
        updateBookmarkCount();
        showNotification('Track bookmarked', 'success');
      } else if (result.message) {
        showNotification(result.message, 'info');
      }
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    showNotification('Error updating bookmark', 'error');
  }
}

// Update bookmark button appearance
function updateBookmarkButton(isBookmarked) {
  const icon = bookmarkBtn.querySelector('i');
  if (isBookmarked) {
    icon.className = 'fas fa-bookmark';
    bookmarkBtn.title = 'Remove bookmark';
  } else {
    icon.className = 'far fa-bookmark';
    bookmarkBtn.title = 'Bookmark track';
  }
}

// Update bookmark button state based on current track
async function updateBookmarkButtonState(trackPath) {
  try {
    const isBookmarked = await window.electronAPI.isTrackBookmarked(trackPath);
    updateBookmarkButton(isBookmarked);
  } catch (error) {
    console.error('Error checking bookmark state:', error);
    updateBookmarkButton(false);
  }
}

// Clear all bookmarks
async function clearAllBookmarks() {
  if (bookmarks.length === 0) {
    showNotification('No bookmarks to clear', 'info');
    return;
  }
  
  if (confirm('Are you sure you want to clear all bookmarks?')) {
    try {
      bookmarks = [];
      await window.electronAPI.clearAllBookmarks();
      renderBookmarks();
      updateBookmarkCount();
      updateBookmarkButton(false);
      showNotification('All bookmarks cleared', 'success');
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
      showNotification('Error clearing bookmarks', 'error');
    }
  }
}

// Update bookmark count display
function updateBookmarkCount() {
  bookmarkCountEl.textContent = `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''}`;
}

// Render bookmarks
function renderBookmarks() {
  bookmarkListEl.innerHTML = '';
  bookmarkGridEl.innerHTML = '';
  
  if (bookmarks.length === 0) {
    bookmarkListEl.innerHTML = '<tr><td colspan="5" class="empty-message">No bookmarked tracks. Bookmark some tracks to see them here!</td></tr>';
    return;
  }
  
  bookmarks.forEach((bookmark, idx) => {
    const { artist, title } = parseTrackInfo(bookmark.name);
    const mainIndex = tracks.findIndex(t => t.path === bookmark.path);
    
    // Create table row
    const tr = document.createElement('tr');
    tr.classList.toggle('active', mainIndex === currentTrackIndex);
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${title}</td>
      <td>${artist}</td>
      <td>${formatDate(bookmark.bookmarkedAt)}</td>
      <td>
        <button class="action-icon play-track-btn" title="Play"><i class="fas fa-play"></i></button>
        <button class="action-icon remove-bookmark-btn" title="Remove bookmark"><i class="fas fa-bookmark"></i></button>
      </td>
    `;
    
    // Add event listeners
    tr.querySelector('.play-track-btn').addEventListener('click', () => {
      if (mainIndex !== -1) {
        loadTrack(mainIndex);
        isPlaying = true;
        audioEl.play();
        updatePlayPauseIcon();
      }
    });
    
    tr.querySelector('.remove-bookmark-btn').addEventListener('click', async () => {
      await removeBookmark(bookmark.path);
    });
    
    tr.addEventListener('click', (e) => {
      if (!e.target.closest('button') && mainIndex !== -1) {
        loadTrack(mainIndex);
        isPlaying = true;
        audioEl.play();
        updatePlayPauseIcon();
      }
    });
    
    bookmarkListEl.appendChild(tr);
    
    // Create grid item
    const card = document.createElement('div');
    card.className = 'bookmark-card';
    card.classList.toggle('active', mainIndex === currentTrackIndex);
    card.innerHTML = `
      <div class="bookmark-indicator">
        <i class="fas fa-bookmark"></i>
      </div>
      <button class="remove-bookmark-btn" title="Remove bookmark">
        <i class="fas fa-times"></i>
      </button>
      <div class="track-card-art">
        <i class="fas fa-music"></i>
        <div class="track-card-overlay">
          <button class="play-overlay-btn"><i class="fas fa-play"></i></button>
        </div>
      </div>
      <div class="track-card-info">
        <div class="track-card-title">${title}</div>
        <div class="track-card-artist">${artist}</div>
        <div class="bookmark-date">${formatDate(bookmark.bookmarkedAt)}</div>
      </div>
    `;
    
    card.querySelector('.play-overlay-btn').addEventListener('click', () => {
      if (mainIndex !== -1) {
        loadTrack(mainIndex);
        isPlaying = true;
        audioEl.play();
        updatePlayPauseIcon();
      }
    });
    
    card.querySelector('.remove-bookmark-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      await removeBookmark(bookmark.path);
    });
    
    card.addEventListener('click', () => {
      if (mainIndex !== -1) {
        loadTrack(mainIndex);
        isPlaying = true;
        audioEl.play();
        updatePlayPauseIcon();
      }
    });
    
    bookmarkGridEl.appendChild(card);
  });
}

// Remove bookmark
async function removeBookmark(trackPath) {
  try {
    const result = await window.electronAPI.removeBookmark(trackPath);
    if (result.success) {
      bookmarks = bookmarks.filter(b => b.path !== trackPath);
      renderBookmarks();
      updateBookmarkCount();
      
      // Update bookmark button if this was the current track
      if (currentTrackIndex !== -1 && tracks[currentTrackIndex].path === trackPath) {
        updateBookmarkButton(false);
      }
      
      showNotification('Bookmark removed', 'success');
    }
  } catch (error) {
    console.error('Error removing bookmark:', error);
    showNotification('Error removing bookmark', 'error');
  }
}

// Switch bookmark view (list/grid)
function switchBookmarkView(viewType) {
  const container = document.getElementById('bookmarksTracksContainer');
  
  if (viewType === 'list') {
    container.className = 'list-view';
    bookmarkListViewBtn.classList.add('active');
    bookmarkGridViewBtn.classList.remove('active');
  } else {
    container.className = 'grid-view';
    bookmarkGridViewBtn.classList.add('active');
    bookmarkListViewBtn.classList.remove('active');
  }
}

// Sort bookmarks
function sortBookmarks() {
  const sortBy = bookmarkSortByEl.value;
  
  bookmarks.sort((a, b) => {
    const { artist: artistA, title: titleA } = parseTrackInfo(a.name);
    const { artist: artistB, title: titleB } = parseTrackInfo(b.name);
    
    switch (sortBy) {
      case 'name':
        return titleA.localeCompare(titleB);
      case 'artist':
        return artistA.localeCompare(artistB);
      case 'dateBookmarked':
        return new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt);
      default:
        return 0;
    }
  });
  
  renderBookmarks();
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Show notification
  setTimeout(() => notification.classList.add('show'), 100);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => document.body.removeChild(notification), 300);
  }, 3000);
}

// Add music files
async function addMusicFiles() {
  try {
    const newTracks = await window.electronAPI.selectMusicFile();
    if (newTracks && newTracks.length > 0) {
      tracks = [...tracks, ...newTracks];
      renderTrackList();
      renderRecentlyAdded();
    }
  } catch (error) {
    console.error('Failed to add music files:', error);
  }
}

// Add music folder
async function addMusicFolder() {
  try {
    const newTracks = await window.electronAPI.selectMusicFolder();
    if (newTracks && newTracks.length > 0) {
      tracks = [...tracks, ...newTracks];
      renderTrackList();
      renderRecentlyAdded();
    }
  } catch (error) {
    console.error('Failed to add music folder:', error);
  }
}

// Format time for display (mm:ss)
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Extract artist and title from filename
function parseTrackInfo(filename) {
  // Remove extension
  const name = filename.replace(/\.[^/.]+$/, '');
  
  // Try to parse artist - title format
  const match = name.match(/^(.+)\s-\s(.+)$/);
  if (match) {
    return { artist: match[1].trim(), title: match[2].trim() };
  }
  
  return { artist: 'Unknown Artist', title: name };
}

// Update progress bar during playback
function updateProgress() {
  if (!audioEl.duration) return;
  
  const progress = (audioEl.currentTime / audioEl.duration) * 100;
  seekBar.value = progress;
  progressBar.style.width = `${progress}%`;
  currentTimeEl.textContent = formatTime(audioEl.currentTime);
}

// Update total time when track metadata is loaded
function updateTotalTime() {
  totalTimeEl.textContent = formatTime(audioEl.duration);
}

// Handle track end based on repeat mode
function handleTrackEnd() {
  if (repeatMode === 'one') {
    audioEl.currentTime = 0;
    audioEl.play();
  } else if (repeatMode === 'all' || tracks.length > 1) {
    playNextTrack();
  } else {
    isPlaying = false;
    updatePlayPauseIcon();
  }
}

// Toggle play/pause
function togglePlayPause() {
  if (tracks.length === 0) return;
  
  if (currentTrackIndex === -1) {
    loadTrack(0);
  }
  
  if (isPlaying) {
    audioEl.pause();
    isPlaying = false;
  } else {
    audioEl.play();
    isPlaying = true;
  }
  
  updatePlayPauseIcon();
}

// Update play/pause button icon
function updatePlayPauseIcon() {
  playPauseBtn.innerHTML = isPlaying ? 
    '<i class="fas fa-pause"></i>' : 
    '<i class="fas fa-play"></i>';
}

// Play next track
function playNextTrack() {
  if (tracks.length === 0) return;
  
  if (isShuffled) {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    loadTrack(randomIndex);
  } else {
    const nextIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(nextIndex);
  }
  
  if (isPlaying) {
    audioEl.play();
  }
}

// Play previous track
function playPreviousTrack() {
  if (tracks.length === 0) return;
  
  // If at the start of a track, go to previous track
  // Otherwise restart current track
  if (audioEl.currentTime > 3) {
    audioEl.currentTime = 0;
    return;
  }
  
  if (isShuffled) {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    loadTrack(randomIndex);
  } else {
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    loadTrack(prevIndex);
  }
  
  if (isPlaying) {
    audioEl.play();
  }
}

// Load track by index
function loadTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  
  currentTrackIndex = index;
  const track = tracks[index];
  
  // Set audio source
  audioEl.src = track.path;
  audioEl.load();
  
  // Parse track info from filename
  const { artist, title } = parseTrackInfo(track.name);
  
  // Update UI
  currentTrackEl.textContent = title;
  currentArtistEl.textContent = artist;
  nowPlayingTitleEl.textContent = title;
  nowPlayingArtistEl.textContent = artist;
  
  // Update track list highlighting
  updateActiveTrack();
  
  // Update bookmark button state
  updateBookmarkButtonState(track.path);
}

// Update active track highlighting in lists
function updateActiveTrack() {
  // Update in track list view
  const trackItems = trackListEl.querySelectorAll('tr');
  trackItems.forEach((row, idx) => {
    row.classList.toggle('active', idx === currentTrackIndex);
  });
  
  // Update in grid view
  const gridItems = trackGridEl.querySelectorAll('.track-card');
  gridItems.forEach((card, idx) => {
    card.classList.toggle('active', idx === currentTrackIndex);
  });
}

// Seek track to position
function seekTrack() {
  if (!audioEl.duration) return;
  
  const seekTime = (seekBar.value / 100) * audioEl.duration;
  audioEl.currentTime = seekTime;
}

// Adjust volume
function adjustVolume() {
  audioEl.volume = volumeSlider.value / 100;
  
  // Update volume icon
  const volumeBtn = document.getElementById('volumeBtn');
  if (audioEl.volume === 0) {
    volumeBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  } else if (audioEl.volume < 0.5) {
    volumeBtn.innerHTML = '<i class="fas fa-volume-down"></i>';
  } else {
    volumeBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
  }
}

// Toggle shuffle mode
function toggleShuffle() {
  isShuffled = !isShuffled;
  shuffleBtn.classList.toggle('active', isShuffled);
}

// Toggle repeat mode (none -> one -> all -> none)
function toggleRepeat() {
  const modes = ['none', 'one', 'all'];
  const currentIndex = modes.indexOf(repeatMode);
  repeatMode = modes[(currentIndex + 1) % modes.length];
  
  // Update UI
  repeatBtn.classList.toggle('active', repeatMode !== 'none');
  repeatBtn.innerHTML = repeatMode === 'one' ? 
    '<i class="fas fa-redo-alt"></i><span class="repeat-one">1</span>' : 
    '<i class="fas fa-redo"></i>';
}

// Render track list in table view
function renderTrackList() {
  trackListEl.innerHTML = '';
  trackGridEl.innerHTML = '';
  
  if (tracks.length === 0) {
    trackListEl.innerHTML = '<tr><td colspan="5" class="empty-message">Your library is empty. Add some music to get started!</td></tr>';
    return;
  }
  
  tracks.forEach((track, idx) => {
    const { artist, title } = parseTrackInfo(track.name);
    
    // Create table row
    const tr = document.createElement('tr');
    tr.classList.toggle('active', idx === currentTrackIndex);
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${title}</td>
      <td>${artist}</td>
      <td>--:--</td>
      <td>
        <button class="action-icon play-track-btn" title="Play"><i class="fas fa-play"></i></button>
        <button class="action-icon add-to-playlist-btn" title="Add to playlist"><i class="fas fa-plus"></i></button>
      </td>
    `;
    
    // Add event listener
    tr.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        loadTrack(idx);
        isPlaying = true;
        audioEl.play();
        updatePlayPauseIcon();
      }
    });
    
    trackListEl.appendChild(tr);
    
    // Create grid item
    const card = document.createElement('div');
    card.className = 'track-card';
    card.classList.toggle('active', idx === currentTrackIndex);
    card.innerHTML = `
      <div class="track-card-art">
        <i class="fas fa-music"></i>
        <div class="track-card-overlay">
          <button class="play-overlay-btn"><i class="fas fa-play"></i></button>
        </div>
      </div>
      <div class="track-card-info">
        <div class="track-card-title">${title}</div>
        <div class="track-card-artist">${artist}</div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      loadTrack(idx);
      isPlaying = true;
      audioEl.play();
      updatePlayPauseIcon();
    });
    
    trackGridEl.appendChild(card);
  });
}

// Render recently added tracks
function renderRecentlyAdded() {
  recentlyAddedEl.innerHTML = '';
  
  // Get 6 most recent tracks
  const recentTracks = [...tracks]
    .sort((a, b) => new Date(b.added) - new Date(a.added))
    .slice(0, 6);
  
  if (recentTracks.length === 0) {
    recentlyAddedEl.innerHTML = '<p class="empty-message">Add some music to see your recently added tracks!</p>';
    return;
  }
  
  recentTracks.forEach((track, idx) => {
    const { artist, title } = parseTrackInfo(track.name);
    
    const card = document.createElement('div');
    card.className = 'track-card';
    card.innerHTML = `
      <div class="track-card-art">
        <i class="fas fa-music"></i>
        <div class="track-card-overlay">
          <button class="play-overlay-btn"><i class="fas fa-play"></i></button>
        </div>
      </div>
      <div class="track-card-info">
        <div class="track-card-title">${title}</div>
        <div class="track-card-artist">${artist}</div>
      </div>
    `;
    
    // Find index in main tracks array
    const mainIndex = tracks.findIndex(t => t.path === track.path);
    
    card.addEventListener('click', () => {
      loadTrack(mainIndex);
      isPlaying = true;
      audioEl.play();
      updatePlayPauseIcon();
    });
    
    recentlyAddedEl.appendChild(card);
  });
}

// Switch library view between list and grid
function switchLibraryView(viewType) {
  const container = document.getElementById('libraryTracksContainer');
  
  if (viewType === 'list') {
    container.className = 'list-view';
    listViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
  } else {
    container.className = 'grid-view';
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
  }
}

// Search library
function searchLibrary() {
  const query = searchInput.value.toLowerCase().trim();
  
  if (!query) {
    renderTrackList();
    return;
  }
  
  const filteredTracks = tracks.filter(track => {
    const { artist, title } = parseTrackInfo(track.name);
    return (
      title.toLowerCase().includes(query) || 
      artist.toLowerCase().includes(query) ||
      track.name.toLowerCase().includes(query)
    );
  });
  
  renderFilteredTracks(filteredTracks);
}

// Render filtered tracks
function renderFilteredTracks(filteredTracks) {
  trackListEl.innerHTML = '';
  trackGridEl.innerHTML = '';
  
  if (filteredTracks.length === 0) {
    trackListEl.innerHTML = '<tr><td colspan="5" class="empty-message">No matching tracks found</td></tr>';
    return;
  }
  
  filteredTracks.forEach((track) => {
    const { artist, title } = parseTrackInfo(track.name);
    const idx = tracks.findIndex(t => t.path === track.path);
    
    // Create table row
    const tr = document.createElement('tr');
    tr.classList.toggle('active', idx === currentTrackIndex);
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${title}</td>
      <td>${artist}</td>
      <td>--:--</td>
      <td>
        <button class="action-icon play-track-btn" title="Play"><i class="fas fa-play"></i></button>
        <button class="action-icon add-to-playlist-btn" title="Add to playlist"><i class="fas fa-plus"></i></button>
      </td>
    `;
    
    tr.addEventListener('click', (e) => {
      if (!e.target.closest('button')) {
        loadTrack(idx);
        isPlaying = true;
        audioEl.play();
        updatePlayPauseIcon();
      }
    });
    
    trackListEl.appendChild(tr);
    
    // Create grid item
    const card = document.createElement('div');
    card.className = 'track-card';
    card.classList.toggle('active', idx === currentTrackIndex);
    card.innerHTML = `
      <div class="track-card-art">
        <i class="fas fa-music"></i>
        <div class="track-card-overlay">
          <button class="play-overlay-btn"><i class="fas fa-play"></i></button>
        </div>
      </div>
      <div class="track-card-info">
        <div class="track-card-title">${title}</div>
        <div class="track-card-artist">${artist}</div>
      </div>
    `;
    
    card.addEventListener('click', () => {
      loadTrack(idx);
      isPlaying = true;
      audioEl.play();
      updatePlayPauseIcon();
    });
    
    trackGridEl.appendChild(card);
  });
}

// Show playlist creation modal
function showPlaylistModal() {
  playlistModal.style.display = 'block';
  
  // Populate track selection
  const trackSelectionList = document.getElementById('trackSelectionList');
  trackSelectionList.innerHTML = '';
  
  tracks.forEach((track, idx) => {
    const { title, artist } = parseTrackInfo(track.name);
    
    const trackItem = document.createElement('div');
    trackItem.className = 'track-selection-item';
    trackItem.innerHTML = `
      <input type="checkbox" id="track-${idx}" data-index="${idx}">
      <label for="track-${idx}">
        <span class="track-title">${title}</span>
        <span class="track-artist">${artist}</span>
      </label>
    `;
    
    trackSelectionList.appendChild(trackItem);
  });
}

// Hide playlist creation modal
function hidePlaylistModal() {
  playlistModal.style.display = 'none';
  document.getElementById('playlistName').value = '';
}

// Create new playlist
async function createPlaylist() {
  const name = document.getElementById('playlistName').value.trim();
  if (!name) {
    alert('Please enter a playlist name');
    return;
  }
  
  // Get selected tracks
  const selectedIndices = [];
  document.querySelectorAll('#trackSelectionList input:checked').forEach(checkbox => {
    selectedIndices.push(parseInt(checkbox.getAttribute('data-index')));
  });
  
  if (selectedIndices.length === 0) {
    alert('Please select at least one track');
    return;
  }
  
  const selectedTracks = selectedIndices.map(idx => tracks[idx]);
  
  try {
    const result = await window.electronAPI.createPlaylist(name, selectedTracks);
    if (result.success) {
      // Reload playlists
      loadPlaylists();
      hidePlaylistModal();
    } else {
      alert('Failed to create playlist');
    }
  } catch (error) {
    console.error('Error creating playlist:', error);
    alert('An error occurred while creating the playlist');
  }
}

// Render all playlists
function renderPlaylists() {
  // Render in playlists view
  const playlistsGrid = document.getElementById('playlistsGrid');
  
  // Keep the "Create New Playlist" card
  playlistsGrid.innerHTML = `
    <div class="playlist-card add-playlist">
      <div class="playlist-add-icon">
        <i class="fas fa-plus"></i>
      </div>
      <p>Create New Playlist</p>
    </div>
  `;
  
  // Add event listener to the "Create New Playlist" card
  playlistsGrid.querySelector('.add-playlist').addEventListener('click', showPlaylistModal);
  
  // Render in sidebar
  playlistMenuEl.innerHTML = '';
  
  playlists.forEach(playlist => {
    // Create playlist card
    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.innerHTML = `
      <div class="playlist-art">
        <i class="fas fa-list"></i>
      </div>
      <div class="playlist-info">
        <h3>${playlist.name}</h3>
        <p>${playlist.tracks.length} tracks</p>
      </div>
    `;
    
    card.addEventListener('click', () => showPlaylistDetail(playlist));
    playlistsGrid.appendChild(card);
    
    // Create sidebar menu item
    const menuItem = document.createElement('li');
    menuItem.innerHTML = `<i class="fas fa-list"></i> ${playlist.name}`;
    menuItem.addEventListener('click', () => {
      // Switch to playlists view
      document.querySelector('[data-view="playlists"]').click();
      // Show playlist detail
      showPlaylistDetail(playlist);
    });
    
    playlistMenuEl.appendChild(menuItem);
  });
}

// Show playlist detail view
function showPlaylistDetail(playlist) {
  // Show playlist detail view
  document.getElementById('playlistsGrid').style.display = 'none';
  document.getElementById('playlistDetailView').classList.remove('hidden');
  
  // Update playlist info
  document.getElementById('playlistDetailName').textContent = playlist.name;
  document.getElementById('playlistDetailInfo').textContent = `${playlist.tracks.length} tracks`;
  
  // Render playlist tracks
  const tracksContainer = document.getElementById('playlistDetailTracks');
  tracksContainer.innerHTML = '';
  
  if (playlist.tracks.length === 0) {
    tracksContainer.innerHTML = '<tr><td colspan="5" class="empty-message">This playlist is empty</td></tr>';
    return;
  }
  
  playlist.tracks.forEach((track, idx) => {
    const { artist, title } = parseTrackInfo(track.name);
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${title}</td>
      <td>${artist}</td>
      <td>--:--</td>
      <td>
        <button class="action-icon play-track-btn" title="Play"><i class="fas fa-play"></i></button>
        <button class="action-icon remove-track-btn" title="Remove from playlist"><i class="fas fa-times"></i></button>
      </td>
    `;
    
    tr.querySelector('.play-track-btn').addEventListener('click', () => {
      // Set current playlist
      currentPlaylist = playlist;
      // Find track in main library
      const mainIndex = tracks.findIndex(t => t.path === track.path);
      if (mainIndex !== -1) {
        loadTrack(mainIndex);
        isPlaying = true;
        audioEl.play();
        updatePlayPauseIcon();
      }
    });
    
    tracksContainer.appendChild(tr);
  });
  
  // Set up back button
  document.getElementById('backToPlaylists').addEventListener('click', () => {
    document.getElementById('playlistsGrid').style.display = 'grid';
    document.getElementById('playlistDetailView').classList.add('hidden');
  });
  
  // Set up play all button
  document.getElementById('playPlaylistBtn').addEventListener('click', () => {
    if (playlist.tracks.length === 0) return;
    
    // Set current playlist
    currentPlaylist = playlist;
    
    // Find first track in main library
    const mainIndex = tracks.findIndex(t => t.path === playlist.tracks[0].path);
    if (mainIndex !== -1) {
      loadTrack(mainIndex);
      isPlaying = true;
      audioEl.play();
      updatePlayPauseIcon();
    }
  });
}

// Initialize audio visualizer
function initVisualizer() {
  visualizerCanvas.width = visualizerCanvas.offsetWidth;
  visualizerCanvas.height = visualizerCanvas.offsetHeight;
  
  // Setup audio context when user interacts
  document.addEventListener('click', () => {
    if (audioContext) return;
    
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioEl);
      audioAnalyzer = audioContext.createAnalyser();
      audioAnalyzer.fftSize = 256;
      
      source.connect(audioAnalyzer);
      audioAnalyzer.connect(audioContext.destination);
      
      visualizerActive = true;
      renderVisualizer();
    } catch (error) {
      console.error('Failed to initialize audio visualizer:', error);
    }
  }, { once: true });
}

// Render audio visualizer
function renderVisualizer() {
  if (!visualizerActive) return;
  
  requestAnimationFrame(renderVisualizer);
  
  const bufferLength = audioAnalyzer.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  audioAnalyzer.getByteFrequencyData(dataArray);
  
  canvasCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
  
  const barWidth = (visualizerCanvas.width / bufferLength) * 2.5;
  let barHeight;
  let x = 0;
  
  for (let i = 0; i < bufferLength; i++) {
    barHeight = dataArray[i] / 255 * visualizerCanvas.height;
    
    // Create gradient effect
    const gradient = canvasCtx.createLinearGradient(0, 0, 0, visualizerCanvas.height);
    gradient.addColorStop(0, '#FF6F61');
    gradient.addColorStop(1, '#6B5B95');
    
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
    
    x += barWidth + 1;
  }
}