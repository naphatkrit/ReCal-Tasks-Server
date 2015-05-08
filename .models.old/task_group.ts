import Sequelize = require('sequelize');
import ReCalLib = require("../lib/lib");

export = function(sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes)
{
    return sequelize.define('TaskGroup', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.TEXT,
        }
    }, {
        classMethods: {
            getterMethods: {
                createdAt: function() {
                    return this.getDataValue("createdAt");
                },
                updatedAt: function() {
                    return this.getDataValue("updatedAt");
                },
            },
            associate: function(models: ReCalLib.Interfaces.DatabaseProxy) {
                models.TaskGroup.hasMany(models.TaskInfo);
            }
        }
    });
}
