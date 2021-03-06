# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
RUN mkdir client
COPY client/package*.json ./client
RUN cd client && npm install
COPY . .
RUN cd client && npm run build
RUN cd server && npm install && touch .env
EXPOSE 3333
CMD [ "node", "server/server.js" ]