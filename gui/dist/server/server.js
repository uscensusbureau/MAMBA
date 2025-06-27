const defaults = {
  port: 5173,
  frameURL: 'http://localhost:9036'
};

// Import builtin NodeJS modules to instantiate the service
const path = require('path');
const fs = require('fs');

// Import the express module
const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
const apiProxy = httpProxy.createProxyServer({ secure: false });

const helmet = require("helmet");
const nocache = require("nocache");
const cors = require('cors');

app.use(helmet({
  crossOriginEmbedderPolicy: false
}));
app.use(nocache());
app.use(cors());

app
  .get('/', (req, res) => res.redirect('/mamba_gui'))
  .use('/mamba_gui', express.static(path.resolve(__dirname + '/../index')))
  .get('/mamba_gui/*', (req, res) => {
    res.sendFile(path.resolve(__dirname + '/../index/index.html'));
  })
  .get('/mamba_gui*', (req, res) => {
    res.status(404).send('<h1>404! Page not found</h1>');
  })
  .all('/api/*', function (req, res) {
    try {
      logRequest(req, defaults.frameURL);
      apiProxy.web(req, res, { target: defaults.frameURL });
      apiProxy.on('error', function (err, req, res) {
        console.log(err);
      });
    } catch (e) {
      console.log(e);
    }
  })
  .listen(defaults.port, () =>
    console.log(`Server started. Now open your browser on  http:\/\/localhost:` + defaults.port + `\/`)
  );

const logRequest = (req, target) => {
  let reqString = 'request[\n\t';
  reqString += 'targetUrl=' + target + '\n\t'
  reqString += 'url=' + req.url + ',\n\t';
  reqString += 'body=' + req.body + '\n';
  reqString += ']';
  console.log(reqString);
}