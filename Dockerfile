# Global variable declaration:
# Build to serve under Subdirectory BASE_URL if provided, eg: "ARG BASE_URL=/pdf/", otherwise leave blank: "ARG BASE_URL="
ARG BASE_URL=

ARG BUILDPLATFORM
ARG TARGETPLATFORM

# Build stage
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY vendor ./vendor
ENV HUSKY=0

ARG PNPM_FLAGS=
RUN corepack enable
RUN pnpm install --frozen-lockfile --prefer-offline --reporter=append-only $PNPM_FLAGS
COPY . .

# Build without type checking (vite build only)
# Pass SIMPLE_MODE environment variable if provided
ARG SIMPLE_MODE=false
ENV SIMPLE_MODE=$SIMPLE_MODE
ARG COMPRESSION_MODE=all
ENV COMPRESSION_MODE=$COMPRESSION_MODE

# global arg to local arg
ARG BASE_URL
ENV BASE_URL=$BASE_URL

RUN if [ -z "$BASE_URL" ]; then \
    pnpm run build -- --mode production; \
    else \
    pnpm run build -- --base=${BASE_URL} --mode production; \
    fi

# Production stage
FROM --platform=$TARGETPLATFORM nginxinc/nginx-unprivileged:stable-alpine-slim

LABEL org.opencontainers.image.source="https://github.com/alam00000/bentopdf"
LABEL org.opencontainers.image.url="https://github.com/alam00000/bentopdf"

# global arg to local arg
ARG BASE_URL

# Set this to "true" to disable Nginx listening on IPv6
ENV DISABLE_IPV6=false

COPY --chown=nginx:nginx --from=builder /app/dist /usr/share/nginx/html${BASE_URL%/}
COPY --chown=nginx:nginx nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx --chmod=755 nginx-ipv6.sh /docker-entrypoint.d/99-disable-ipv6.sh
RUN mkdir -p /etc/nginx/tmp && chown -R nginx:nginx /etc/nginx/tmp

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
