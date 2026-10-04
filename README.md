# Home Assistant NPX

A persistent Node.js, npm and npx environment for Home Assistant OS.

It allows Node.js-based tools and services to run as a Home Assistant app without modifying the Home Assistant OS host.

## Features

- Node.js, npm and npx
- Simple configurable startup command
- Optional persistent npm package installations
- Configurable package, version and arguments
- Optional automatic package updates
- Automatic startup with Home Assistant
- Runs isolated as a Home Assistant app

## Installation

[![Open your Home Assistant instance and show the app repository dialog with this repository pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FDiwie%2Fhomeassistant-npx)

Or add this repository manually to the Home Assistant App Store:

https://github.com/Diwie/homeassistant-npx

Then install **Node.js NPX** from the repository.

## Command mode

The first and simplest option is `command`:

```yaml
command: 'npx --yes cowsay "Home Assistant NPX works"'
```

If `package` is left empty, this command is executed when the app starts.

## Optional persistent package mode

For large packages that should not be downloaded again after every restart, the optional package fields can be used.

Example for Desktop Commander:

```yaml
command: ""
package: "@wonderwhy-er/desktop-commander"
version: "latest"
arguments: ""
auto_update: false
```

On the first start the package is installed under `/config/node`. Later app restarts reuse that installation. The npm cache, Puppeteer browser cache and Desktop Commander device identity are also kept in persistent app storage. `arguments` contains optional command-line arguments passed to the installed program; it is not a remote-access address by itself. Set `auto_update: true` only when you want npm to check/install the configured version again on every app start.

## Persistent storage

The app uses its Home Assistant app configuration directory for the npm cache, package metadata, installed Node.js modules, Puppeteer browser cache and supported tool identity data.

## Security

Configured npm packages and commands can download and execute third-party code. Only run packages and commands that you trust.

This project is an independent community project and is not affiliated with or endorsed by Home Assistant.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).

Copyright (c) 2026 Steve Jüstel.
