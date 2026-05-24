# Frontend Deploy

A frontend ships as a Docker image: a static bundle produced by Vite and served by nginx. The image slots into the same `infra/` layout used by Go services — no external host (Vercel, Netlify) is involved.

## Dockerfile

`deploy/Dockerfile` is multi-stage. The builder produces a static bundle; the runtime is a stripped nginx image that copies in only the bundle.

```dockerfile
# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN pnpm run build

FROM nginx:alpine AS runtime
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

The image is single-purpose: serve static files and (optionally) proxy `/api` to a backend service.

## nginx.conf

`deploy/nginx.conf` does two things: serve the SPA with a history fallback, and proxy `/api/*` to whichever Go service the frontend talks to.

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA history fallback — every unknown path returns index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Long cache for fingerprinted assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API calls to the backend (service name resolved by docker-compose or k8s)
    location /api/ {
        proxy_pass http://${BACKEND_HOST}:${BACKEND_PORT}/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

`${BACKEND_HOST}` and `${BACKEND_PORT}` are substituted at container start via `envsubst` (use the `nginx:alpine` template feature: drop the file into `/etc/nginx/templates/default.conf.template` instead of `conf.d/`).

## Build-time vs runtime config

Two categories of configuration, handled differently:

**Build-time (`VITE_*`).** Values fixed for the lifetime of the bundle: feature flags compiled out, public API key prefixes, build version stamps. Set as `--build-arg` to `docker build`; baked into JavaScript at build time. Bundle must be rebuilt to change them.

**Runtime (`/config.js`).** Values that vary per environment (testing vs production) without rebuilding: API base URL, sentry DSN, environment name. Use the small "`config.js` served by nginx" pattern:

1. `public/config.js` contains `window.__APP_CONFIG__ = { apiBaseUrl: "__API_BASE_URL__" };`
2. Container entrypoint runs `envsubst` to replace `__API_BASE_URL__` with the env var value at startup.
3. `index.html` loads `/config.js` before the app bundle so `window.__APP_CONFIG__` is available.
4. `src/lib/config.ts` exports a typed `appConfig` reading from `window.__APP_CONFIG__`.

This avoids the anti-pattern of rebuilding the bundle for each environment.

## Integration with `infra/testing`

Add a service entry to `infra/testing/docker-compose.yaml`:

```yaml
services:
  <frontend-name>:
    build:
      context: ../../frontend/<frontend-name>
      dockerfile: deploy/Dockerfile
    ports:
      - "5173:80"
    environment:
      BACKEND_HOST: <go-service-name>
      BACKEND_PORT: "8080"
    depends_on:
      - <go-service-name>
```

`docker-compose` resolves `<go-service-name>` to the container IP, so nginx's `proxy_pass` works out of the box.

## Integration with `infra/production`

Two manifests under `infra/production/k8s/`, both following the existing flat-directory naming `<service>-<kind>.yaml`:

- `<frontend-name>-deployment.yaml` — Deployment pointing at the built image, with `BACKEND_HOST` / `BACKEND_PORT` env vars set to the backend Service's DNS name.
- `<frontend-name>-service.yaml` — ClusterIP Service exposing port 80.

The ingress (host → frontend Service) is added to the project-level ingress in `infra/production/nginx/<project>.conf` (the production nginx reverse proxy) — not to a per-service Ingress resource. This mirrors how Go services are already routed in the project.

## CI build

A separate `docker build` per environment, with the appropriate `--build-arg VITE_API_BASE_URL=...` if any `VITE_*` variables differ between environments. Tag images as `ghcr.io/<owner>/<frontend-name>:<git-sha>` and update the k8s Deployment to reference the new tag.
