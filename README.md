# Home Assistant NPX

A persistent Node.js, npm and npx runtime and toolbox for Home Assistant OS.

Home Assistant NPX provides a flexible environment for running Node.js-based tools, scripts and services as an isolated Home Assistant app without modifying the Home Assistant OS host.

## What you can do

- Run Node.js scripts, npm packages and npx tools on Home Assistant OS
- Install npm packages persistently and reuse them after app restarts and updates
- Run CLI tools, development utilities, diagnostics and automation helpers
- Host long-running Node.js services
- Use tools that depend on Chromium or Puppeteer
- Select package versions and pass custom arguments
- Optionally update configured packages automatically
- Optionally interact with Home Assistant through its API
- Read Home Assistant entity states and call services/actions when the optional bridge is enabled
- Keep Home Assistant integration disabled when only a general Node.js environment is needed

The app is intended as a general-purpose Node.js environment. The examples below show three different ways to use it.

## Installation

[![Open your Home Assistant instance and show the app repository dialog with this repository pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FDiwie%2Fhomeassistant-npx)

Or add this repository manually to the Home Assistant App Store:

https://github.com/Diwie/homeassistant-npx

Then install **Node.js NPX** from the repository.

## Examples

### 1. Run a package persistently

For tools or services that should remain installed instead of being downloaded again after every start:

```yaml
command: ""
package: "cowsay"
version: "latest"
arguments: "Home Assistant NPX works"
auto_update: false
```

Packages are installed under `/config/node` and reused on later starts. npm cache, package metadata, installed modules, Puppeteer browser cache and supported tool data are stored in persistent app storage.

### 2. Run a command or script

For a quick npx tool, shell command or your own Node.js script:

```yaml
command: 'npx --yes cowsay "Home Assistant NPX works"'
package: ""
```

The command mode is useful when persistent package installation is not needed or when several operations should be combined in a shell command.

### 3. Interact with Home Assistant

Home Assistant integration is opt-in:

```yaml
homeassistant_bridge: true
```

When enabled, tools running inside the app can read Home Assistant entity states through the localhost-only bridge:

```bash
curl http://127.0.0.1:32123/state/sensor.example
```

Services/actions can also be called through the bridge. This makes it possible to build Node.js tools that observe or control Home Assistant without exposing the Supervisor authentication token to those tools.

The bridge has been tested with Home Assistant entity-state access. The Home Assistant configuration directory is not mounted by this option.

## Security

Node.js tools, npm packages and configured commands can execute third-party code. Only install and run software you trust.

Home Assistant API integration is optional and disabled by default. Enabling the bridge allows processes inside this app container to read Home Assistant states and call Home Assistant services/actions. Access to Home Assistant configuration files is not enabled by default.

This project is an independent community project and is not affiliated with or endorsed by Home Assistant.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).

Copyright (c) 2026 Steve Jüstel.
