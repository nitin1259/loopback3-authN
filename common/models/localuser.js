'use strict';

module.exports = function(Localuser) {
    //START - Disable endpoints
    var isStatic = true;
    Localuser.disableRemoteMethod('deleteById', isStatic);
    //END - Disable endpoints
    
    Localuser.observe('before save', function(ctx, next){
        let mdl = ctx.data || ctx.instance;
        //encrypt mdl.password
        Localuser.find({where:{"username": mdl.username, "password":mdl.password}}, function(err, model){
            if(err) next(err);
            if(model.length > 0){
                next(new Error('User already exists'));
            }
            else next();            
        })
    })
};
