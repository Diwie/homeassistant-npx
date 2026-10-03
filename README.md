# Home Assistant NPX

A lightweight Node.js, npm and npx environment for Home Assistant OS.

It allows Node.js-based tools and services to run as a Home Assistant app without modifying the Home Assistant OS host.

## Features

- Node.js, npm and npx
- Persistent npm cache
- Configurable startup command
- Automatic startup with Home Assistant
- Runs isolated as a Home Assistant app
- No Node.js installation on the HAOS host required

## Installation

Add this repository to the Home Assistant App Store:

https://github.com/Diwie/homeassistant-npx

Then install **Node.js NPX** from the repository.

## Example

Set the app configuration to:

```yaml
command: 'npx --yes cowsay "Home Assistant NPX works"'
```

The configured command is executed whenever the app starts.

## Persistent storage

The app uses its Home Assistant app configuration directory for persistent data and the npm cache.

## Security

Commands configured in this app can download and execute third-party npm packages. Only run packages and commands that you trust.

This project is an independent community project and is not affiliated with or endorsed by Home Assistant.

## License

MIT
