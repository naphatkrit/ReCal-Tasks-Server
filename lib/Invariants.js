var assert = require("assert");
var Invariants;
(function (Invariants) {
    var debug = Number(process.env.RECAL_DEBUG || "0") !== 0;
    function evaluate(invariant) {
        if (debug) {
            return invariant();
        }
        else {
            return true;
        }
    }
    Invariants.evaluate = evaluate;
    function check(invariant) {
        if (debug) {
            assert(invariant());
        }
    }
    Invariants.check = check;
    function checkArray(invariants) {
        var combined = invariants.reduce(chain, Predefined.alwaysTrue);
        check(combined);
    }
    Invariants.checkArray = checkArray;
    function chain(invariant1, invariant2) {
        return function () { return invariant1() && invariant2(); };
    }
    Invariants.chain = chain;
    var Predefined;
    (function (Predefined) {
        Predefined.alwaysTrue = function () { return true; };
        Predefined.alwaysFalse = function () { return false; };
        function isDefinedAndNotNull(item) {
            return function () { return item !== null && item !== undefined; };
        }
        Predefined.isDefinedAndNotNull = isDefinedAndNotNull;
        function isDefined(item) {
            return function () {
                return item !== undefined;
            };
        }
        Predefined.isDefined = isDefined;
        function isNotEmpty(item) {
            return function () {
                return item.length > 0;
            };
        }
        Predefined.isNotEmpty = isNotEmpty;
    })(Predefined = Invariants.Predefined || (Invariants.Predefined = {}));
})(Invariants || (Invariants = {}));
module.exports = Invariants;
