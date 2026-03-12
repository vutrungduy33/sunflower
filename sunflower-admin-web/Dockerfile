FROM node:20.20.1-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_APP_TITLE="Sunflower Admin Web"
ARG VITE_API_BASE_URL="/api"
ARG VITE_API_PROXY_TARGET="http://backend:8080"

ENV VITE_APP_TITLE=${VITE_APP_TITLE}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_PROXY_TARGET=${VITE_API_PROXY_TARGET}

RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
