FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx tsc --noEmit || true

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 3099
CMD ["node", "./node_modules/tsx/dist/cli.mjs", "src/index.ts"]
