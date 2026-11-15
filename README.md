# Transmissionic Web UI

Transmissionic is a static web interface for `transmission-daemon`, built with Vue 3 and Ionic. It is a maintained fork of [`6c65726f79/Transmissionic`](https://github.com/6c65726f79/Transmissionic) focused on the browser UI.

## Features

- Works with Transmission 3.00 through 4.1.x (JSON-RPC 2.0 `session_get`, `torrent_get`, `session_stats` with automatic fallback to the legacy `session-get` protocol).
- Runs over both HTTPS and plain HTTP on a LAN without requiring `crypto.subtle`.
- Resolves same-origin RPC requests relative to the page URL, so reverse proxies and custom ports work without per-browser setup.
- Supports multiple server profiles, download path presets, tracker filtering, file tree selection, live transfer rate graphs, dark and light themes, and 21 locales.

## Installation

Download `Transmissionic-webui-v1.10.15.zip` from [Releases](https://github.com/lostinfuture/transmissionic/releases), extract the `web/` directory, and point `transmission-daemon` to it with the `TRANSMISSION_WEB_HOME` environment variable:

```sh
unzip Transmissionic-webui-v1.10.15.zip -d /path/to/transmissionic
export TRANSMISSION_WEB_HOME=/path/to/transmissionic/web
```

Alternatively, rename the extracted `web/` folder to `public_html` and place it in one of Transmission's standard search paths:

- Linux / BSD: `$XDG_DATA_HOME/transmission/public_html` (`~/.local/share/transmission/public_html`)
- macOS: `~/Library/Application Support/Transmission/public_html`
- Windows: `%APPDATA%\Transmission\public_html`

If you reach the daemon by hostname or through a reverse proxy, add that hostname to `rpc-host-whitelist` in Transmission's `settings.json`.

## Default Server Configuration

Edit `default.json` in the `web/` directory to prefill connection settings for any browser that has not saved its own server list in `localStorage`. An empty `{}` connects to the same origin that served the web UI at `../rpc` (`/transmission/rpc`).

```json
{
  "host": "192.168.1.15",
  "port": 9091,
  "https": false,
  "path": "/transmission/rpc",
  "auth": {
    "username": "user",
    "password": "password"
  }
}
```

Any field may be omitted. Wait to put `"auth"` in `default.json` unless you trust every user who can fetch `/transmission/web/default.json`, since the file is served without authentication if the web root is exposed outside `transmission-daemon`.

## Keyboard Shortcuts

| Action | Shortcut |
| --- | --- |
| Add torrent file | `Ctrl + O` |
| Add magnet link | `Ctrl + M` |
| Add torrent URL | `Ctrl + U` |
| Search torrents | `Ctrl + F` |
| Select all torrents | `Ctrl + A` |
| Clear selection or close dialog | `Esc` |

## Building from Source

Building requires Node.js 24 and npm:

```sh
npm ci
npm run typecheck
npm run lint
npm run build:webui
```

The static bundle is written to `dist/`.

## License

MIT. Original work Copyright (c) 2021 Transmissionic (`6c65726f79`). Fork changes Copyright (c) 2026 lostinfuture.
