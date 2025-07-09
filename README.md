# MediaSphere Music Player

MediaSphere is a desktop music player built using [Electron](https://www.electronjs.org/). It features a sleek, modern UI inspired by Apple Music and provides essential tools to manage and play your local audio library.

## Features

- Browse and play local audio files and folders
- Playlist creation and management
- **Bookmark system for favorite tracks**
- Repeat and shuffle playback modes
- Search functionality across the library
- Dual view options: list and grid
- Audio visualizer support
- Modern, responsive, theme-aware UI
- Electron-based window controls (minimize, maximize, close)


## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer)
- npm (comes with Node.js)

### Steps

```bash
git clone https://github.com/AtheeqAhmedMJ/MediaSphereMusicPlayer.git
cd MediaSphereMusicPlayer
npm install
npm start
````

This will launch the Electron window and load the local audio player interface.

---

## Developer Info

### Project Structure

```
|-- playlists  #create a folder named playlist to save playlist locally *Important
├── main.js         # Electron main process
├── preload.js      # Context bridge for secure IPC
├── renderer.js     # Handles UI logic and DOM interactions
├── index.html      # App layout
├── styles.css      # Visual design
├── assets/         # Icons or music placeholders
├── package.json    # Project config and dependencies
```

**Data Storage:**
- `tracks.json` - Library tracks database
- `bookmarks.json` - Bookmarked tracks database
- `playlists/` - User-created playlists

### Technologies Used

* Electron
* HTML/CSS + JavaScript
* Font Awesome
* Howler.js (optional for enhanced audio handling)
* Node.js FS & Path APIs for file/folder interaction

---

## How to Contribute

Want to make MediaSphere even better? Follow the steps below:

### Step-by-Step Contribution Guide

1. **Fork** this repository.
2. **Clone** your fork:

   ```bash
   git clone https://github.com/your-username/MediaSphereMusicPlayer.git
   ```
3. **Create a new branch** for your feature or bugfix:

   ```bash
   git checkout -b feature-name
   ```
4. **Make your changes**, then commit them:

   ```bash
   git add .
   git commit -m "Add your message here"
   ```
5. **Push your branch** to your fork:

   ```bash
   git push origin feature-name
   ```
6. **Create a Pull Request** on GitHub.

### Contribution Guidelines

* Keep your code clean and readable
* Stick to the existing structure and design philosophy
* Prefer small, focused pull requests
* Test your changes thoroughly
* Avoid breaking existing functionality

---


## Author

Mohamed Atheeq Ahmed
GitHub: [AtheeqAhmedMJ](https://github.com/AtheeqAhmedMJ)

---

*Your contributions, feedback, and stars are appreciated!*


