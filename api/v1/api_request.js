var assert = require('assert');
function validateApiRequest(object) {
    try {
        assert(object !== null && object !== undefined);
        assert(typeof object.serializedObject === 'string');
        return true;
    }
    catch (e) {
        return false;
    }
}
exports.validateApiRequest = validateApiRequest;
function castApiRequest(object) {
    if (validateApiRequest(object)) {
        return object;
    }
    else {
        return null;
    }
}
exports.castApiRequest = castApiRequest;
function tryGetObject(request) {
    try {
        return JSON.parse(request.serializedObject);
    }
    catch (e) {
        return null;
    }
}
exports.tryGetObject = tryGetObject;
