# Desktop Client Manual Acceptance Test

Run after dependency updates to verify no functionality regression.

## Prerequisites

- macOS with the built DMG or dev mode (`npm run start`)
- A running Pomerium instance to test connections against (or use `verify.pomerium.com`)
- ~15 minutes

## Launch & Window Management

- [ ] App launches without crash
- [ ] Main window renders (no white screen, no Electron error dialog)
- [ ] Window title shows "Pomerium Desktop"
- [ ] Window resizes correctly (drag corners)
- [ ] Window minimize/maximize/close work
- [ ] System tray icon appears (macOS menu bar)
- [ ] Clicking tray icon shows/hides window
- [ ] Right-clicking tray icon shows context menu

## Manage Connections (Main Screen)

- [ ] Empty state message shown when no connections exist
- [ ] "New Connection" button visible and clickable
- [ ] Top tabs render correctly (no missing icons or broken layout)
- [ ] Search/filter bar renders

## Create Connection

- [ ] Click "New Connection" -> form loads
- [ ] All form fields render: Name, Destination URL, Local Address, Tags
- [ ] Can type in all text fields
- [ ] Advanced settings accordion expands/collapses
- [ ] Advanced settings show: Pomerium URL, Disable TLS Verification, Client Certificates
- [ ] Can save a connection (fills required fields, clicks Save)
- [ ] After save, redirected back to connection list
- [ ] New connection appears in the list

## Edit Connection

- [ ] Click on a connection -> Connection View loads
- [ ] Connection details display correctly
- [ ] Edit button works -> loads edit form pre-filled
- [ ] Can modify fields and save
- [ ] Changes persist after save

## Connection Operations

- [ ] Connect button starts a tunnel (if Pomerium instance available)
- [ ] Connection status indicator updates (connecting -> connected or error)
- [ ] Disconnect button stops the tunnel
- [ ] Connection logs display in the log viewer
- [ ] Log export (JSON) works — file save dialog appears

## Import/Export

- [ ] Export connections -> file save dialog appears, JSON file saved
- [ ] Import connections -> file open dialog appears
- [ ] Imported connections appear in the list

## Delete Operations

- [ ] Delete a single connection -> confirmation dialog appears
- [ ] Confirm delete -> connection removed from list
- [ ] Delete all (if available) -> confirmation dialog appears

## Duplicate Connection

- [ ] Duplicate a connection -> new copy appears with modified name

## Tags & Folders

- [ ] Tags display on connections
- [ ] Tag filter/folder view works
- [ ] Can add/remove tags on connections

## Load from Pomerium (if applicable)

- [ ] "Load from Pomerium" navigates to load form
- [ ] Can enter a Pomerium URL
- [ ] Routes are fetched and displayed
- [ ] Can select and import routes as connections

## Client Certificates

- [ ] Client certificate picker renders in advanced settings
- [ ] Can browse/select certificate files
- [ ] Certificate details display after selection

## App Menu

- [ ] macOS app menu shows (Pomerium Desktop, File, Edit, View, Window, Help)
- [ ] About dialog shows version info
- [ ] Check for Updates works (or shows appropriate message)

## Visual/Layout

- [ ] No broken CSS (missing styles, overlapping elements)
- [ ] Material UI components render correctly (buttons, inputs, cards)
- [ ] Icons display (no missing icon boxes)
- [ ] Dark mode / light mode follows system preference (if supported)
- [ ] Scrolling works in connection list and log viewer

## Stability

- [ ] Navigate between all pages multiple times — no crashes
- [ ] Open/close the app 3 times — no corruption of saved connections
- [ ] Leave app running for 5 minutes — no memory leaks or freezes
