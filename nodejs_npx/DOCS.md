# Node.js NPX

Node.js NPX provides a persistent Node.js, npm and npx environment on Home Assistant OS.

## Configuration

### Command

Run an arbitrary startup command:

```yaml
command: 'npx --yes cowsay "Home Assistant NPX works"'
```

When `package` is empty, the configured command is executed when the app starts.

### Persistent package mode

For larger Node.js tools, configure a package instead of downloading it with npx after every restart:

```yaml
command: ""
package: "@wonderwhy-er/desktop-commander"
version: "latest"
arguments: ""
auto_update: false
```

Packages are stored persistently under `/config/node`. npm cache, Puppeteer browser cache and supported tool identity data are also stored in persistent app storage.

Chromium is included in the app image so Puppeteer-based packages do not need to download Chrome at startup.

## Options

- `command`: startup command used when no package is configured.
- `package`: optional npm package to install persistently.
- `version`: npm package version; defaults to `latest`.
- `arguments`: optional command-line arguments passed to the installed program.
- `auto_update`: reinstall/check the configured package version on every app start.

## Security

npm packages and configured commands can execute third-party code inside the app container. Only use packages and commands you trust.

The app does not expose the Home Assistant configuration directory by default.
