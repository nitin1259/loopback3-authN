'use strict';
const disableAllMethods = require('../../server/helper').disableAllMethods;
module.exports = function(Authstrategies) {
    disableAllMethods(Authstrategies, ["find"]);
};
