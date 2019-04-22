// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-example-passport
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict';
const passport = require('passport');
module.exports = function(server) {
  // Install a `/` route that returns server status
  var router = server.loopback.Router();
  router.get('/status', server.loopback.status());
  router.post('/login', function(req, res, next) {
    passport.authenticate('local', {session:false}, function(err, user, token_record) {
      if (err) { return next(err) }
      res.json({access_token:token_record.access_token});
   })(req, res, next);

  });
  server.use(router);
};
