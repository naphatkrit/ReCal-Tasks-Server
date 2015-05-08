var Q = require("q");
var PromiseAdapter;
(function (PromiseAdapter) {
    function convertMongooseQuery(query) {
        var deferred = Q.defer();
        query.exec(function (err, doc) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(doc);
            }
        });
        return deferred.promise;
    }
    PromiseAdapter.convertMongooseQuery = convertMongooseQuery;
    function convertMongoosePromise(promise) {
        var deferred = Q.defer();
        promise.then(function (success) {
            deferred.resolve(success);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }
    PromiseAdapter.convertMongoosePromise = convertMongoosePromise;
    function convertMongooseDocumentSave(document) {
        var deferred = Q.defer();
        document.save(function (err) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(document);
            }
        });
        return deferred.promise;
    }
    PromiseAdapter.convertMongooseDocumentSave = convertMongooseDocumentSave;
    function convertMongooseDocumentPopulate(document, populate) {
        var deferred = Q.defer();
        document.populate(populate, function (err, document) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(document);
            }
        });
        return deferred.promise;
    }
    PromiseAdapter.convertMongooseDocumentPopulate = convertMongooseDocumentPopulate;
})(PromiseAdapter || (PromiseAdapter = {}));
module.exports = PromiseAdapter;
