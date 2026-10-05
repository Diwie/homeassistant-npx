const http = require("http");

const token = process.env.SUPERVISOR_TOKEN;
if (!token) {
  console.error("HA bridge: SUPERVISOR_TOKEN unavailable");
  process.exit(1);
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" || !req.url.startsWith("/state/")) {
    res.writeHead(404, {"content-type":"application/json"});
    return res.end(JSON.stringify({error:"not_found"}));
  }

  const entityId = decodeURIComponent(req.url.slice("/state/".length));
  if (!/^[a-z0-9_]+\.[a-z0-9_]+$/i.test(entityId)) {
    res.writeHead(400, {"content-type":"application/json"});
    return res.end(JSON.stringify({error:"invalid_entity_id"}));
  }

  const upstream = http.request({
    hostname: "supervisor",
    port: 80,
    path: "/core/api/states/" + encodeURIComponent(entityId),
    method: "GET",
    headers: {Authorization: "Bearer " + token}
  }, upstreamRes => {
    res.writeHead(upstreamRes.statusCode || 502, {"content-type": upstreamRes.headers["content-type"] || "application/json"});
    upstreamRes.pipe(res);
  });

  upstream.on("error", err => {
    res.writeHead(502, {"content-type":"application/json"});
    res.end(JSON.stringify({error:"upstream_error"}));
  });
  upstream.end();
});

server.listen(32123, "127.0.0.1", () => console.log("HA bridge: listening on 127.0.0.1:32123 (read-only states)"));
