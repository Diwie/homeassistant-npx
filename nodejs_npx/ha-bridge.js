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

const server = http.createServer((req, res) => {
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
