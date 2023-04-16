FROM node:latest

WORKDIR /app

COPY common ./common
COPY configs ./configs
COPY controllers ./controllers
COPY models ./models
COPY routers ./routers
COPY utils ./utils
COPY package.json ./package.json
COPY app.js ./app.js
COPY index.js ./index.js
COPY dev.env ./dev.env
RUN npm i

CMD ["npm", "start"]