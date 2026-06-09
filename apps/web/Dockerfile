FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .
ENV NEXT_PUBLIC_CLIENT_API_BASE=/api/v1
ENV NEXT_PUBLIC_API_PROXY_TARGET=http://polytech-media-api:4000
ENV INTERNAL_API_BASE=http://polytech-media-api:4000/api/v1
RUN npm run build -w packages/shared && npm run build -w apps/web

EXPOSE 80
CMD ["npm", "run", "start", "-w", "apps/web"]
