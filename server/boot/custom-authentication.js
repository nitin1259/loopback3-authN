const passport = require('passport');
const CustomStrategy = require('passport-custom').Strategy;
const BasicStrategy = require('passport-http').BasicStrategy;
const LocalStrategy = require('passport-local').Strategy;
const JWTStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const ClientCertStrategy = require('passport-client-cert').Strategy;

module.exports = function (server) {
    passport.use(new CustomStrategy(
        function (req, done) {
            let certs = {};
            //curl -k --cert ssl/client.crt:password --key ssl/client.key --cacert ssl/ca.crt https://localhost:3000/api/localusers
            //Un comment below lines of code once the app is configured to run on HTTPS
            certs = req.connection.getPeerCertificate();
            console.log(certs);
            if(certs.subject){
                console.log("trying to run Client cert strategy");
                passport.authenticate('client-cert', {session:false}, function (err, res) {
                    if(err) done(err);
                    else done();
                })(req, done);
            }
            else if (req.headers.authorization && req.headers.authorization.indexOf('Basic ') > -1) {
                server.models.Authstrategies.find({where:{"strategy":"Basic"}}, function(err, model){
                    if(model[0].enabled === false){
                        done({ "status": 501, "message": "Basic Strategy not Implemented" }, false);
                    }
                    else{
                        passport.authenticate('basic', {session:false}, function (err, res) {
                            if(err) done(err);
                            else done();
                        })(req, done);
                    }
                })
                
            }
            else if (req.headers.authorization && req.headers.authorization.indexOf('bearer ') > -1) {
                console.log('trying to run local jwt auth');
                server.models.Jwtalgorithm.find({where:{"enabled":true}}, function(err, algorithmModel){
                    if(err) done(err, null);
                    if(algorithmModel.length > 0){
                        algorithmModel = algorithmModel[0];
                        jwt.verify(req.headers.authorization.split(' ')[1], "SECRET", {algorithms:[algorithmModel.name]}, function(err,decoded){
                            if(err) done({"status":400, "message": "Invalid token"});
                            else{
                                passport.authenticate('jwt', {session: false}, function (err, res) {
                                    if(err) done(err);
                                    else done();
                                })(req, done);
                            }
                        });
                    }
                    
                });
                
                
            }
            else {
                console.log("Trying to throw error");
                done({ "status": 403, "message": "No Authentication Provided" }, false);
            }
        }
    ));

    passport.use(new BasicStrategy(
        function (username, password, done) {
            server.models.Localuser.find({where:{"username":username, "password": password}}, function(err, user){
                if(user.length > 0){
                    done(null, user);
                }
                else{
                    done({"status": 404, "message": "User not found"}, false);
                }
            })
        }
    ));

    passport.use(new LocalStrategy(
        function (username, password, done) {
            server.models.Authstrategies.find({where:{"strategy":"Token"}}, function(err, model){
                if(model[0].enabled === false){
                    done({ "status": 501, "message": "Token Strategy not Implemented" }, false);
                }
                else{
                    server.models.Localuser.find({where:{"username":username, "password": password}}, function(err, user){
                        if(user.length > 0){
                            server.models.Jwtalgorithm.find({where:{"enabled":true}}, function(err, algorithmModel){
                                if(err) done(err, null);
                                let token;
                                if(algorithmModel.length > 0){
                                    algorithmModel = algorithmModel[0];
                                    token = jwt.sign(user[0].toJSON(), "SECRET", { algorithm: algorithmModel.name});
                                }
                                else{
                                    token = jwt.sign(user[0].toJSON(), "SECRET");
                                }
                                done(null, user, {access_token:token});
                            });
                        }
                        else{
                            done({"status": 404, "message": "User not found"}, false);
                        }
                    })
                }
            })
            
        }
    ))
    var opts = {}
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = 'SECRET';
    server.models.Jwtalgorithm.find({where:{"enabled":true}}, function(err, algorithmModel){
        let token;
        if(algorithmModel.length > 0){
            algorithmModel = algorithmModel[0];
            //Adding algorithm to the options
            opts.algorithms = [algorithmModel.name];
            passport.use(new JWTStrategy(opts, function (jwt_payload, done) {
                server.models.Localuser.find({where:jwt_payload}, function(err, user){
                    if(err) done(err);
                    else done(null,user);
                })
            }));
        }
    });
    
    
    passport.use(new ClientCertStrategy({ passReqToCallback: true },function(req, clientCert, done) {
        console.log("clientCert:",clientCert);
        var cn = clientCert.subject.cn,
            user = null;
      
        // The CN will typically be checked against a database
        if(cn === 'test-cn') {
          user = { name: 'Test User' }
        }
      
        done(null, user);
      }));

}

