import Q = require("q");
import mongoose = require('mongoose');

module PromiseAdapter
{
    // export function convertSequelize<T>(promise: Sequelize.PromiseT<T>): Q.Promise<T>
    // {
    //     let deferred = Q.defer<T>();
    //     promise.then(
    //         (success) =>
    //         {
    //             deferred.resolve(success);
    //         },
    //         (error) =>
    //         {
    //             deferred.reject(error);
    //         });
    //     return deferred.promise;
    // }
    export function convertMongooseQuery<T>(query: mongoose.Query<T>): Q.Promise<T>
    {
        let deferred = Q.defer<T>();
        query.exec((err, doc) =>
        {
            if (err)
            {
                deferred.reject(err);
            } else
            {
                deferred.resolve(doc);
            }
        })
        return deferred.promise;
    }

    export function convertMongoosePromise<T>(promise: mongoose.Promise<T>): Q.Promise<T>
    {
        let deferred = Q.defer<T>();
        promise.then(
            (success) =>
            {
                deferred.resolve(success);
            }, (error) =>
            {
                deferred.reject(error);
            })
        return deferred.promise;
    }

    export function convertMongooseDocumentSave<T extends mongoose.Document>(document: T): Q.Promise<T>
    {
        let deferred = Q.defer<T>();
        document.save((err) =>
        {
            if (err)
            {
                deferred.reject(err);
            }
            else
            {
                deferred.resolve(document);
            }
        })
        return deferred.promise;
    }

    export function convertMongooseDocumentPopulate<T extends mongoose.Document>(document: T, populate: string): Q.Promise<T> {
        let deferred = Q.defer<T>();
        document.populate<T>(populate, (err, document)=>{
            if (err)
            {
                deferred.reject(err);
            }
            else
            {
                deferred.resolve(document);
            }
        })
        return deferred.promise;
    }
}

export = PromiseAdapter;
