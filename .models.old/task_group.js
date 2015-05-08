module.exports = function (sequelize, DataTypes) {
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
                createdAt: function () {
                    return this.getDataValue("createdAt");
                },
                updatedAt: function () {
                    return this.getDataValue("updatedAt");
                },
            },
            associate: function (models) {
                models.TaskGroup.hasMany(models.TaskInfo);
            }
        }
    });
};
