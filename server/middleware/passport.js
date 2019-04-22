const passport = require('passport');


module.exports = function (server) {
    return function (req, res, next) {
        return passport.authenticate('custom', {}, function (err, req, res) {
            // req.user = { "userid": 11 };
            next(err);
        })(req, res, next);
    }
}
