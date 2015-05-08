import Sequelize = require("sequelize");
import models = require("../index");
import ReCalLib = require("../../lib/lib");
import Q = require('q');
import PromiseAdapter = ReCalLib.PromiseAdapter;

export function modelInstanceExists(model: Sequelize.Model<any, any>, modelId: number): Q.Promise<boolean>
{
    let promise = PromiseAdapter.convertSequelize(model.count({ where: { id: modelId } }))
    return promise.then(function(count) { return count > 0; })
}

export function destroyModelInstance(model, modelInstance): Q.Promise<any>
{
    return destroyModelInstanceWithId(model, modelInstance.id)
}

export function destroyModelInstanceWithId(model, id): Q.Promise<any>
{
    return ReCalLib.PromiseAdapter.convertSequelize(
        model.destroy({ where: { id: id } })
        )
}
