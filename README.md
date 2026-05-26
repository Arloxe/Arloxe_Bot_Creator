# Arloxe Card Forge

**Arloxe Card Forge** is a local-first browser tool for creating and editing AI character cards and lorebooks.

It is designed for creators who make Character Card V2 bots for platforms and tools such as **SillyTavern**, **Chub.AI**, **Botbooru**, and compatible character-card systems.

## Features

- Create new **Character Card V2** bots
- Import and edit existing `.json` character cards
- Import and export PNG character cards with embedded metadata
- Add and preview character avatars
- Create standalone lorebooks
- Create bots with embedded lorebooks
- Edit character cards and embedded lorebooks together
- Collapsible sections for easier project overview
- Collapsible alternate greetings
- Dark/light mode
- Accent color options
- Local browser draft saving
- No backend or account required

## Local-first

Arloxe Card Forge runs directly in your browser.

Imported cards, avatars, lorebooks, presets, and drafts are handled locally unless you choose to export and upload them somewhere yourself.

The GitHub Pages version does not use a backend database and does not store uploaded files on a server.

## Supported formats

Currently supported:

- Character Card V2 `.json` (With support for Character's Note)
- PNG character cards with embedded `chara` metadata
- Standalone lorebook `.json`
- Standalone preset `.json`
- Character cards with embedded `character_book` data

Compatibility may vary between platforms, since different tools can use extra fields or custom extensions.

## Project structure

```txt
index.html
editor.html
about.html
privacy.html
terms.html
404.html

assets/
  favicon.png
  main_icon.png
  banner_image.png
  - icons (for on-site icons)

css/
  avatar.css
  base.css
  components.css
  editor.css
  footer.css
  layout.css
  pages.css
  style.css

js/
  app.js
  avatarCropper.js
  botEditor.js
  confirmDialog.js
  fileExport.js
  fileImport.js
  lorebookEditor.js
  partials.js
  pngCards.js
  presetEditor.js
  state.js
  staticPage.js
  templates.js
  utils.js
  workspaceCombined.js

partials/
  app-header.html
  footer.html
  image_preview_fragment.html
  index-header.html
  info-header.html
