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

Imported cards, avatars, lorebooks, and drafts are handled locally unless you choose to export and upload them somewhere yourself.

The GitHub Pages version does not use a backend database and does not store uploaded files on a server.

## Supported formats

Currently supported:

- Character Card V2 `.json`
- PNG character cards with embedded `chara` metadata
- Standalone lorebook `.json`
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

css/
  base.css
  layout.css
  components.css
  editor.css
  avatar.css
  pages.css
  footer.css

js/
  app.js
  staticPage.js
  partials.js
  state.js
  templates.js
  botEditor.js
  lorebookEditor.js
  workspaceCombined.js
  fileImport.js
  fileExport.js
  pngCards.js
  utils.js

partials/
  app-header.html
  index-header.html
  info-header.html
  footer.html