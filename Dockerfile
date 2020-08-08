FROM node:lts

LABEL maintainer="sublimer@sublimer.me"

WORKDIR /root
COPY package.json .
RUN npm i
COPY . .
RUN npm run build
EXPOSE 3000
ENV FITBIT_API_TOKEN=""
CMD [ "npm","start" ]