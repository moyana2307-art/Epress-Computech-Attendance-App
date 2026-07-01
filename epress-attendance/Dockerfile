FROM node:20-slim AS base
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .
RUN npx vite build

EXPOSE 5000

CMD ["node", "server/index.js"]
