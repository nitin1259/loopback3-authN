// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict';

var loopback = require('loopback');
var boot = require('loopback-boot');
var http = require('http');
var https = require('https');
var fs = require('fs');
var app = module.exports = loopback();
var userseed = require('./boot/user-seed.json');
var authStrategiesSeed = require('./boot/auth-strategies-seed.json');
var jwtAlgorithmsSeed = require('./boot/algorithms-seed.json');
/*
 * body-parser is a piece of express middleware that
 *   reads a form's input and stores it as a javascript
 *   object accessible through `req.body`
 *
 */
var bodyParser = require('body-parser');


// -- Add your pre-processing middleware here --
// boot scripts mount components like REST API
boot(app, __dirname);

// to support JSON-encoded bodies
app.middleware('parse', bodyParser.json());
// to support URL-encoded bodies
app.middleware('parse', bodyParser.urlencoded({
  extended: true,
}));


// app.start = function() {
//   // start the web server
//   return app.listen(function() {
//     app.emit('started');
//     var baseUrl = app.get('url').replace(/\/$/, '');
//     console.log('Web server listening at: %s', baseUrl);
//     if (app.get('loopback-component-explorer')) {
//       var explorerPath = app.get('loopback-component-explorer').mountPath;
//       console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
//     }
//   });
// };


// app.start = function(httpOnly) {
//   if (httpOnly === undefined) {
//     httpOnly = process.env.HTTP;
//   }
//   var server = null;
//   if (!httpOnly) {
//     var options = {
//       key: sslConfig.privateKey,
//       cert: sslConfig.certificate,
//     };
//     server = https.createServer(options, app);
//   } else {
//     server = http.createServer(app);
//   }
//   server.listen(app.get('port'), function() {
//     var baseUrl = (httpOnly ? 'http://' : 'https://') + app.get('host') + ':' + app.get('port');
//     app.emit('started', baseUrl);
//     console.log('LoopBack server listening @ %s%s', baseUrl, '/');
//     if (app.get('loopback-component-explorer')) {
//       var explorerPath = app.get('loopback-component-explorer').mountPath;
//       console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
//     }
//   });
//   return server;
// };


app.start = function(httpOnly) {
  if (httpOnly === undefined) {
    httpOnly = process.env.HTTP;
  }
  var server = null;
  if (!httpOnly) {
    var options = {
      // The Server's SSL Key
    key: fs.readFileSync('ssl/server.key'),
    // The Server's Cert
    cert: fs.readFileSync('ssl/server.crt'),
    // The CA (us in this case)
    ca: fs.readFileSync('ssl/ca.crt'),
    passphrase: 'password',
    // Ask for the client's cert
    requestCert: true,
    // Don't automatically reject
    rejectUnauthorized: false
    };
    server = https.createServer(options, app);
  } else {
    server = http.createServer(app);
  }
  server.listen(app.get('port'), function() {
    var baseUrl = (httpOnly ? 'http://' : 'https://') + app.get('host') + ':' + app.get('port');
    app.emit('started', baseUrl);
    console.log('LoopBack server listening @ %s%s', baseUrl, '/');
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
    }
  });
  return server;
};


var ds = app.datasources.postgreDS;
//START - SuperAdmin user seed.
ds.autoupdate('localuser', function(err) {
  if (err) return;
  var superAdminUser = userseed;
  app.models.Localuser.upsertWithWhere(superAdminUser, superAdminUser, function(err, model){
    if (err) return;
    else console.log('SuperAdmin account seeded', model);
  })  
});
//END - SuperAdmin user seed.
//START - Auth Strategies seed.
ds.autoupdate('authstrategies', function(err) {
  if (err) return;
  var authStrategies = authStrategiesSeed;
  authStrategies.forEach(strategy => {
    app.models.Authstrategies.upsertWithWhere(strategy, strategy, function(err, model){
      if (err) return;
      else console.log('Auth Strategy seeded');
    }) 
  });   
});
//END - Auth Strategies seed.
//START - JWT Algorithms seed.
ds.autoupdate('jwtalgorithm', function(err) {
  if (err) {console.log(err);return;}
  var algorithmsSeed = jwtAlgorithmsSeed;
  algorithmsSeed.forEach(algo => {
    app.models.Jwtalgorithm.upsertWithWhere(algo, algo, function(err, model){
      if (err) return;
      else console.log('JWT Algorithms seeded');
    }) 
  });   
});
//END - JWT Algorithms seed.
// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
