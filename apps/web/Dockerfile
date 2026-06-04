FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm install

COPY . .
RUN npm run build -w packages/shared && npm run build -w apps/web

EXPOSE 80
CMD ["npm", "run", "start", "-w", "apps/web"]
