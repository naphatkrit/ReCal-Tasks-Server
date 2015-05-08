var ReCalLib = require("../../lib/lib");
var PromiseAdapter = ReCalLib.PromiseAdapter;
function modelInstanceExists(model, modelId) {
    var promise = PromiseAdapter.convertSequelize(model.count({ where: { id: modelId } }));
    return promise.then(function (count) { return count > 0; });
}
exports.modelInstanceExists = modelInstanceExists;
function destroyModelInstance(model, modelInstance) {
    return destroyModelInstanceWithId(model, modelInstance.id);
}
exports.destroyModelInstance = destroyModelInstance;
function destroyModelInstanceWithId(model, id) {
    return ReCalLib.PromiseAdapter.convertSequelize(model.destroy({ where: { id: id } }));
}
exports.destroyModelInstanceWithId = destroyModelInstanceWithId;
