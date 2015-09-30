FROM ahri/nodejs:0.0.1

ADD package.json /package.json
RUN npm install

ADD reverse-proxy.js /reverse-proxy.js

EXPOSE 80

ENTRYPOINT ["npm", "start"]
