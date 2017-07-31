'use strict';

var express = require('express'),
    compression = require('compression'),
    swig = require('swig'),
    helmet = require('helmet');

var app = express();

app.use(compression());
app.use(helmet());

// Set swig as the template engine
app.engine('html', swig.renderFile);

// Set views path and view engine
app.set('view engine', 'html');
app.set('views', __dirname);

app.use('/assets', express.static(__dirname + '/assets'));
app.use('/fonts', express.static(__dirname + '/fonts'));
app.use('/images', express.static(__dirname + '/images'));
app.use('/maps', express.static(__dirname + '/maps'));
app.use('/styles', express.static(__dirname + '/styles'));
app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/bower_components', express.static(__dirname + '/bower_components'));

app.all('/*', function(req, res) {
  var env = process.env.NODE_ENV ? process.env.NODE_ENV : "development";
  // Just send the index.html for other files to support HTML5Mode
  res.render('index', { root: __dirname, env: env });
});

var port = process.env.PORT || 8080;

app.listen(port); //the port you want to use
