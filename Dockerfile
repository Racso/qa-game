FROM node:22-alpine
WORKDIR /app
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build
RUN cp -r dist/qa-game/browser /poof
