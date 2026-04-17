FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN node ace build
WORKDIR /app/build
RUN npm ci --omit=dev
ENV NODE_ENV=production
ENV HOST=0.0.0.0
EXPOSE 3333
CMD ["node", "bin/server.js"]
