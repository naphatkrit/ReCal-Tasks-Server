var _TaskLogic = require('./task');
var helper = require("./helper");
var ModelLogic;
(function (ModelLogic) {
    ModelLogic.Task = _TaskLogic;
    ModelLogic.modelInstanceExists = helper.modelInstanceExists;
    ModelLogic.destroyModelInstance = helper.destroyModelInstance;
    ModelLogic.destroyModelInstanceWithId = helper.destroyModelInstanceWithId;
})(ModelLogic || (ModelLogic = {}));
module.exports = ModelLogic;
