FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY index.html ./
COPY ishf-portal.html ./
COPY Brain.md ./

EXPOSE 80

VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
