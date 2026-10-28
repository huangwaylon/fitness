# Island Fund server: SvelteKit (adapter-node) + SQLite. Multi-stage, non-root, data on /data.
FROM node:24-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build && npm prune --omit=dev

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    DATABASE_PATH=/data/island.db \
    MIGRATIONS_DIR=/app/drizzle \
    BODY_SIZE_LIMIT=20M
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/build ./build
COPY --from=build /app/drizzle ./drizzle
# Admin CLIs run with Node's built-in TypeScript stripping: `node scripts/pair.ts A`
COPY --from=build /app/src/lib ./src/lib
COPY --from=build /app/scripts ./scripts
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME ["/data"]
EXPOSE 3000
# Any HTTP answer (401 without a session) means the server is up.
HEALTHCHECK --interval=60s --timeout=5s CMD node -e "fetch('http://127.0.0.1:3000/api/week').then(r=>process.exit(r.status<500?0:1),()=>process.exit(1))"
CMD ["node", "build"]
