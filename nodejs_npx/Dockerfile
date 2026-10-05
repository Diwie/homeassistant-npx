FROM ghcr.io/home-assistant/base:latest

RUN apk add --no-cache nodejs npm git chromium

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY run.sh /
COPY ha-bridge.js /
RUN chmod a+x /run.sh

CMD ["/run.sh"]
