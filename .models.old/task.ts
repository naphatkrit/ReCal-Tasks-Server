import Sequelize = require('sequelize');
import ReCalLib = require("../lib/lib");

export = function(sequelize: Sequelize.Sequelize, DataTypes: Sequelize.DataTypes)
{
    return sequelize.define('Task', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        status: {
            type: DataTypes.ENUM,
            values: ["complete", "incomplete"],
            defaultValue: "incomplete"
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
                models.Task.belongsTo(models.TaskInfo); // this is just to generate the helper method. the id is already created as part of TaskInfo's associate()
                models.Task.belongsTo(models.User); // again, just to generate methods
            }
        }
    });
}
