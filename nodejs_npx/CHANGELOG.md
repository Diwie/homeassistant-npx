## 1.6.6
- Set `hassio_role: manager` to permit additional Supervisor diagnostic endpoints where supported.
- This grants broader Supervisor management permissions, not read-only access; use only on trusted installations.
- Existing bridge endpoints and calendar settings remain unchanged.

## 1.6.5
- Enable `hassio_api: true` in addition to `homeassistant_api: true` to allow the optional diagnostic bridge to check Supervisor API endpoints.
- No changes to calendar configuration or existing command behavior.
- Access to individual endpoints remains subject to Supervisor permissions and must be verified after installation.

## 1.6.4
- Add read-only `/diagnostics/capabilities` endpoint to check the availability of a fixed set of Home Assistant Core, Supervisor, and host diagnostic interfaces.
- Return HTTP status codes only; no log contents or credentials.
- Keep existing bridge endpoints unchanged.

## 1.6.2
- Add optional read-only ICS/calendar error-log diagnostics at `GET /diagnostics/ics-errors`.
- Filter calendar-related log entries and redact URLs and common credentials before returning them.
- Existing command and bridge functions are unchanged.

## 1.6.1
- Add a read-only calendar entity diagnostics endpoint to the optional Home Assistant bridge (`GET /diagnostics/calendars`).
- Return only calendar states and timestamps, without event descriptions, calendar URLs or credentials.
- Existing bridge routes remain unchanged.

# Changelog

## 1.6.0 - 2026-10-05

- Made Home Assistant integration explicitly opt-in
- Added `homeassistant_bridge` option, disabled by default
- Kept Home Assistant configuration files unmounted
- Removed unnecessary Supervisor API permission


## 1.5.5 - 2026-10-05

- Added controlled Home Assistant service calls through the localhost bridge
- Added JSON validation and a request-size limit for service calls
- Kept the Supervisor token isolated from local client processes

## 1.5.4 - 2026-10-05

- Added a localhost-only Home Assistant API bridge
- Added read-only entity state access without exposing the Supervisor token
- Verified direct state access through the localhost bridge

## 1.5.3 - 2026-10-05

- Added Home Assistant API diagnostics during s6 startup
- Verified authenticated Home Assistant API access in the app startup context

## 1.5.2 - 2026-10-05

- Enabled Supervisor API access for authentication diagnostics

## 1.5.1 - 2026-10-05

- Enabled Home Assistant API access

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
