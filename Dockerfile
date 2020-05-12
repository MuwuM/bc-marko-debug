FROM node:12-alpine
WORKDIR /usr/src/app

RUN apk update && \
apk upgrade --no-cache && \
apk add --no-cache bash git openssh make gcc g++ python curl && \
rm -rf node_modules

COPY package*.json ./
RUN npm ci --production && \
apk del make gcc g++

COPY . .

RUN node ./precompile.js &&\
node --icu-data-dir=node_modules/full-icu ./bc-marko-core/pages.js --preload-only

EXPOSE 80

CMD [ "npm", "start" ]