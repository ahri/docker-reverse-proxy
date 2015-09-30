FROM ahri/nodejs:0.12.2-r0

ADD package.json /package.json
RUN npm install

ADD reverse-proxy.js /reverse-proxy.js

EXPOSE 8080

USER nobody
ENTRYPOINT ["npm", "start"]
