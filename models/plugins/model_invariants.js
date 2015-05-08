var Invariants = require('../../lib/invariants');
module.exports = function modelInvariantsPluginGenerator(invariantsGenerator) {
    return function (schema, options) {
        schema.pre('save', function (next) {
            invariantsGenerator(this).done(function (invariants) {
                if (Invariants.evaluate(invariants)) {
                    next();
                }
                else {
                    next(new Error('Failed model invariants'));
                }
            }, function (err) {
                next(err);
            });
        });
    };
};
