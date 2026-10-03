# Changelog

## 1.3.0 - 2026-10-03

- Added persistent npm package installations under `/config/node`
- Added `package`, `version`, `arguments` and `auto_update` options
- Existing packages are reused after app restarts
- Optional package updates can be enabled explicitly
- Kept the previous `command` option for backwards compatibility

## 1.2.0 - 2026-10-03

Initial public release.

- Node.js runtime
- npm and npx support
- Persistent npm cache
- Configurable startup command
- Automatic startup support
- Home Assistant OS integration
