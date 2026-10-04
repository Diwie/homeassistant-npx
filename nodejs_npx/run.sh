#!/usr/bin/with-contenv bashio
set -e

mkdir -p /config/npm /config/node /config/puppeteer /config/desktop-commander-device
cd /config/node

export npm_config_cache=/config/npm
export PUPPETEER_CACHE_DIR=/config/puppeteer

# Preserve an existing Desktop Commander identity and keep it across updates.
if [ -d /root/.desktop-commander-device ] && [ ! -L /root/.desktop-commander-device ]; then
    if [ -f /root/.desktop-commander-device/device.json ] && [ ! -f /config/desktop-commander-device/device.json ]; then
        cp /root/.desktop-commander-device/device.json /config/desktop-commander-device/device.json
    fi
    rm -rf /root/.desktop-commander-device
fi
if [ ! -e /root/.desktop-commander-device ]; then
    ln -s /config/desktop-commander-device /root/.desktop-commander-device
fi

echo "=== Node.js NPX Service ==="
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
echo "npx:  $(npx --version)"
echo "Persistent npm cache:       /config/npm"
echo "Persistent packages:        /config/node"
echo "Persistent Puppeteer cache: /config/puppeteer"
echo "Persistent device identity: /config/desktop-commander-device"

PACKAGE="$(bashio::config 'package')"
VERSION="$(bashio::config 'version')"
ARGUMENTS="$(bashio::config 'arguments')"
AUTO_UPDATE="$(bashio::config 'auto_update')"
COMMAND="$(bashio::config 'command')"

if [ -n "$PACKAGE" ]; then
    [ -n "$VERSION" ] || VERSION="latest"

    if [ ! -f package.json ]; then
        npm init -y >/dev/null 2>&1
    fi

    if [ ! -d "node_modules/$PACKAGE" ]; then
        echo "Installing $PACKAGE@$VERSION persistently..."
        npm install --save-exact "$PACKAGE@$VERSION"
    elif [ "$AUTO_UPDATE" = "true" ]; then
        echo "Updating $PACKAGE@$VERSION..."
        npm install --save-exact "$PACKAGE@$VERSION"
    else
        echo "Using persistent installation of $PACKAGE."
    fi

    echo "Starting $PACKAGE $ARGUMENTS"
    exec ./node_modules/.bin/$(basename "$PACKAGE") $ARGUMENTS
fi

if [ -n "$COMMAND" ]; then
    echo "Command mode: $COMMAND"
    exec /bin/bash -lc "$COMMAND"
fi

echo "No package or startup command configured."
echo "NPX environment remains active."
exec sleep infinity
