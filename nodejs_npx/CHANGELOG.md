# Changelog

## 1.5.0 - 2026-10-04

- Added dedicated Home Assistant app documentation
- Documented persistent package mode and configuration options
- Documented bundled Chromium and persistent Desktop Commander identity
- Clarified security boundaries and that Home Assistant configuration is not exposed by default

## 1.4.3 - 2026-10-04

- Bundled Alpine Chromium in the app image
- Disabled Puppeteer's Chrome download
- Fixed Desktop Commander startup getting stuck while downloading Chrome

## 1.4.2 - 2026-10-04

- Added My Home Assistant repository installation button
- Improved persistent storage documentation

## 1.4.1 - 2026-10-04

- Added persistent Puppeteer cache
- Added persistent Desktop Commander device identity storage

## 1.4.0 - 2026-10-03

- Prepared persistent runtime improvements

## 1.3.3 - 2026-10-03

- Made package-related configuration fields optional
- Kept command as the primary configuration field

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
