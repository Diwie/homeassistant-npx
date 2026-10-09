const http = require("http");

const token = process.env.SUPERVISOR_TOKEN;
const writeEnabled = process.env.HA_BRIDGE_WRITE_ACCESS === "true";
if (!token) {
  console.error("HA bridge: SUPERVISOR_TOKEN unavailable");
  process.exit(1);
}

function send(res, status, data) {
  res.writeHead(status, {"content-type": "application/json"});
  res.end(JSON.stringify(data));
}

function proxy(res, path, method, body) {
  const upstream = http.request({
    hostname: "supervisor",
    port: 80,
    path,
    method,
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    }
  }, upstreamRes => {
    res.writeHead(upstreamRes.statusCode || 502, {
      "content-type": upstreamRes.headers["content-type"] || "application/json"
    });
    upstreamRes.pipe(res);
  });
  upstream.on("error", () => send(res, 502, {error: "upstream_error"}));
  if (body) upstream.write(body);
  upstream.end();
}


function requestCore(path) {
  return new Promise((resolve, reject) => {
    http.get({
      hostname: "supervisor", port: 80, path,
      headers: {Authorization: "Bearer " + token}
    }, response => {
      let data = "";
      response.on("data", chunk => {
        data += chunk;
        if (data.length > 1024 * 1024) response.destroy();
      });
      response.on("end", () => {
        if (response.statusCode !== 200) return reject(new Error("HTTP " + response.statusCode));
        resolve(data);
      });
    }).on("error", reject);
  });
}

async function calendarDiagnostics(res) {
  try {
    const raw = await requestCore("/core/api/states");
    const states = JSON.parse(raw);
    const calendars = states.filter(x => x.entity_id?.startsWith("calendar.")).map(x => ({
      entity_id: x.entity_id,
      state: x.state,
      friendly_name: x.attributes?.friendly_name ?? null,
      last_changed: x.last_changed,
      last_updated: x.last_updated,
      has_next_event: Boolean(x.attributes?.start_time)
    }));
    send(res, 200, {calendars, count: calendars.length,
      note: "States do not establish whether ICS downloads succeeded. No URLs, tokens or event descriptions are returned."});
  } catch (error) {
    send(res, 502, {error: "calendar_diagnostics_failed", detail: String(error.message).slice(0, 120)});
  }
}


async function icsErrorDiagnostics(res) {
  try {
    const raw = await requestCore("/core/logs");
    const lines = raw.split(/\r?\n/);
    const keywords = ["ics", "ical", "calendar", "outlook", "office365", "microsoft", "remote_calendar"];
    const matching = lines.filter(line => keywords.some(word => line.toLowerCase().includes(word)));
    const httpStatuses = {};
    const categories = {};
    for (const line of matching) {
      for (const code of (line.match(/\\b(?:400|401|403|404|408|429|500|502|503|504)\\b/g) || [])) {
        httpStatuses[code] = (httpStatuses[code] || 0) + 1;
      }
      for (const keyword of keywords) {
        if (line.toLowerCase().includes(keyword)) categories[keyword] = (categories[keyword] || 0) + 1;
      }
    }
    send(res, 200, {
      matched_lines: matching.length,
      keyword_counts: categories,
      status_code_mentions: httpStatuses,
      error_signatures: matching.slice(-20).map(line => {
        const patterns = [
          ["timeout", /timed?\\s*out|timeout|deadline exceeded/i],
          ["connection_error", /connection refused|connection reset|connecterror|clientconnectorerror/i],
          ["dns_error", /name or service not known|dns|gaierror|nameresolutionerror/i],
          ["tls_error", /ssl|certificate|tls/i],
          ["authentication_error", /unauthorized|authentication|forbidden|permission denied/i],
          ["http_error", /(?:HTTP|status|response)\\s*[:=]?\\s*[45][0-9]{2}/i],
          ["parse_error", /parse|invalid ical|malformed|invalid calendar|valueerror/i],
          ["update_error", /update failed|error fetching|cannot fetch|failed to load/i]
        ];
        const matched = patterns.filter(([, pattern]) => pattern.test(line)).map(([name]) => name);
        return {types: matched.length ? matched : ["other_calendar_message"]};
      }),
      note: "Only predefined error categories and counts. No raw log lines, calendar URLs, tokens or event details are returned."
    });
  } catch (error) {
    send(res, 502, {error: "ics_log_diagnostics_failed", detail: String(error.message).slice(0, 120)});
  }
}


// Fixed allowlist of diagnostic API paths; no arbitrary URL or request body.
const diagnosticEndpoints = {
  core_api: "/core/api/",
  core_config: "/core/api/config",
  core_error_log: "/core/api/error_log",
  supervisor_info: "/supervisor/info",
  supervisor_logs: "/supervisor/logs",
  core_logs: "/core/logs",
  host_info: "/host/info"
};

function checkDiagnosticEndpoint(path) {
  return new Promise(resolve => {
    const request = http.get({
      hostname: "supervisor",
      port: 80,
      path,
      headers: {Authorization: "Bearer " + token},
      timeout: 5000
    }, response => {
      const status = response.statusCode || null;
      response.destroy();
      resolve(status);
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(null));
  });
}

async function diagnosticCapabilities(res) {
  const endpoints = {};
  for (const [name, path] of Object.entries(diagnosticEndpoints)) {
    endpoints[name] = {http_status: await checkDiagnosticEndpoint(path)};
  }
  send(res, 200, {
    endpoints,
    note: "Only HTTP status codes are returned. No log data or credentials."
  });
}


async function calendarEventCounts(res) {
  try {
    const states = JSON.parse(await requestCore("/core/api/states"));
    const calendars = states.filter(x => /^calendar\\.[a-z0-9_]+$/i.test(x.entity_id));
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 86400000);
    const results = [];
    for (const calendar of calendars) {
      const path = "/core/api/calendars/" + encodeURIComponent(calendar.entity_id)
        + "?start=" + encodeURIComponent(start.toISOString())
        + "&end=" + encodeURIComponent(end.toISOString());
      try {
        const events = JSON.parse(await requestCore(path));
        results.push({entity_id: calendar.entity_id,
          event_count: Array.isArray(events) ? events.length : null,
          status: Array.isArray(events) ? "ok" : "unexpected_response"});
      } catch (error) {
        const code = /^HTTP [0-9]{3}$/.test(error.message) ? error.message : "request_failed";
        results.push({entity_id: calendar.entity_id, event_count: null, status: code});
      }
    }
    send(res, 200, {window_days: 30, calendars: results,
      note: "Only event counts and request statuses are returned. No titles, locations or event descriptions."});
  } catch (error) {
    send(res, 502, {error: "calendar_event_counts_failed"});
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/diagnostics/calendar-event-counts") return void calendarEventCounts(res);
  if (req.method === "GET" && req.url === "/diagnostics/capabilities") return void diagnosticCapabilities(res);
  if (req.method === "GET" && req.url === "/diagnostics/ics-errors") return void icsErrorDiagnostics(res);
  if (req.method === "GET" && req.url === "/diagnostics/calendars") return void calendarDiagnostics(res);
  if (req.method === "GET" && req.url.startsWith("/state/")) {
    const entityId = decodeURIComponent(req.url.slice(7));
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(entityId)) return send(res, 400, {error: "invalid_entity_id"});
    return proxy(res, "/core/api/states/" + encodeURIComponent(entityId), "GET");
  }

  if (req.method === "POST" && req.url.startsWith("/service/")) {
    if (!writeEnabled) return send(res, 403, {error: "write_access_disabled"});
    const parts = req.url.slice(9).split("/");
    if (parts.length !== 2 || !parts.every(p => /^[a-z0-9_]+$/i.test(p))) return send(res, 400, {error: "invalid_service"});

    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 65536) req.destroy();
    });
    req.on("end", () => {
      try {
        body = JSON.stringify(body ? JSON.parse(body) : {});
      } catch {
        return send(res, 400, {error: "invalid_json"});
      }
      proxy(res, "/core/api/services/" + parts[0] + "/" + parts[1], "POST", body);
    });
    return;
  }

  send(res, 404, {error: "not_found"});
});

server.listen(32123, "127.0.0.1", () =>
  console.log("HA bridge: listening on 127.0.0.1:32123 (states + services)")
);
