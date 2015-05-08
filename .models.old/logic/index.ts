import _TaskLogic = require('./task');
import helper = require("./helper");

module ModelLogic {
    export var Task = _TaskLogic;

    export var modelInstanceExists = helper.modelInstanceExists;
    export var destroyModelInstance = helper.destroyModelInstance;
    export var destroyModelInstanceWithId = helper.destroyModelInstanceWithId;
}

export = ModelLogic;
