module.exports = function (sequelize, DataTypes) {
    return sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            type: DataTypes.STRING
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
                models.User.hasMany(models.Task);
            }
        }
    });
};
