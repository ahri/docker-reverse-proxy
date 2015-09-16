FROM ahri/nodejs:0.0.1

ADD package.json /package.json
ADD reverse-proxy.js /reverse-proxy.js

RUN npm install

EXPOSE 80

ENTRYPOINT npm start
