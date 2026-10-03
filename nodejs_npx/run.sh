#!/usr/bin/with-contenv bashio

mkdir -p /config/npm
cd /config
export npm_config_cache=/config/npm

echo "=== Node.js NPX Service ==="
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo "npx:  $(npx --version)"
echo "Working directory: /config"

COMMAND="$(bashio::config 'command')"

if [ -z "$COMMAND" ]; then
    echo "No startup command configured."
    echo "NPX environment remains active."
    exec sleep infinity
fi

echo "Starting: $COMMAND"
exec /bin/bash -lc "$COMMAND"
