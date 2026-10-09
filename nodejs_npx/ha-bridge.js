const http = require("http");

const token = process.env.SUPERVISOR_TOKEN;
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
    const raw = await requestCore("/core/api/error_log");
    const lines = raw.split(/\\r?\\n/);
    const matches = lines.filter(line => /(?:ics|ical|calendar|outlook|office365|microsoft|remote_calendar)/i.test(line));
    const sanitized = matches.slice(-80).map(line => line
      .replace(/https?:\\/\\/[^\\s"'<>]+/gi, "[URL REDACTED]")
      .replace(/(?:Bearer\\s+)[^\\s"'<>]+/gi, "Bearer [REDACTED]")
      .replace(/(?:token|secret|password|key|authorization)(\\s*[:=]\\s*)[^\\s,;]+/gi, "$1[REDACTED]")
      .slice(0, 400));
    send(res, 200, {matches: sanitized, count: matches.length,
      note: "Filtered Home Assistant error log; sensitive data redacted. Review before sharing."});
  } catch (error) {
    send(res, 502, {error: "ics_log_diagnostics_failed", detail: String(error.message).slice(0, 120)});
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/diagnostics/ics-errors") return void icsErrorDiagnostics(res);
  if (req.method === "GET" && req.url === "/diagnostics/calendars") return void calendarDiagnostics(res);
  if (req.method === "GET" && req.url.startsWith("/state/")) {
    const entityId = decodeURIComponent(req.url.slice(7));
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(entityId)) return send(res, 400, {error: "invalid_entity_id"});
    return proxy(res, "/core/api/states/" + encodeURIComponent(entityId), "GET");
  }

  if (req.method === "POST" && req.url.startsWith("/service/")) {
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
