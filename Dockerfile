FROM node:18

WORKDIR /usr/src/app
COPY package*.json ./

RUN yarn

COPY . .
EXPOSE 4318

CMD [ "node", "index.mjs" ]
