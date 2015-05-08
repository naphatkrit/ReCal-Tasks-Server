import Sequelize = require('sequelize');
import ReCalLib = require("../lib/lib");

export = function(sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes)
{
    return sequelize.define('TaskInfo', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.TEXT,
            values: ["complete", "incomplete"],
            defaultValue: "incomplete"
        },
        privacy: {
            type: DataTypes.ENUM,
            values: ["private", "public"],
            defaultValue: "private"
        }
    }, {
        getterMethods: {
            createdAt: function() {
                return this.getDataValue("createdAt");
            },
            updatedAt: function() {
                return this.getDataValue("updatedAt");
            },
        },
        classMethods: {
            associate: function(models: ReCalLib.Interfaces.DatabaseProxy) {
                // this generates a foreign key on models.Task
                models.TaskInfo.hasMany(models.Task);
                models.TaskInfo.belongsTo(models.TaskInfo, {as: "PreviousVersion"});
                models.TaskInfo.belongsTo(models.TaskGroup); // only to generate method.
            }
        },
        freezeTableName: true, // prevent sequelize from naming the table TaskInfos instead of TaskInfo
        validate: {
            isImmutable: function() {
                if (this.createdAt != this.updatedAt) {
                    throw new Error("TaskInfo is immutable.");
                }
            }
        }
    });
}
