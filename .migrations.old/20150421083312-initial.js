'use strict';

module.exports = {
    up: function(queryInterface, Sequelize, done) {
        /*
          Add altering commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.createTable('users', { id: Sequelize.INTEGER });
        */
        var taskGroup = queryInterface.createTable("TaskGroups", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            name: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE
        })
        var user = queryInterface.createTable("Users", {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false
            },
            username: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            createdAt: Sequelize.DATE,
            updatedAt: Sequelize.DATE,
        })
        Sequelize.Promise.all([user, taskGroup])
            .then(function() {
                queryInterface.createTable("TaskInfo", {
                    id: {
                        type: Sequelize.INTEGER,
                        primaryKey: true,
                        autoIncrement: true,
                        allowNull: false
                    },
                    title: {
                        type: Sequelize.TEXT,
                        allowNull: false
                    },
                    privacy: {
                        type: Sequelize.ENUM,
                        values: ["private", "public"],
                        defaultValue: "private",
                        allowNull: false,
                    },
                    createdAt: Sequelize.DATE,
                    updatedAt: Sequelize.DATE,
                    PreviousVersionId: {
                        type: Sequelize.INTEGER,
                        allowNull: true,
                        references: "TaskInfo",
                    },
                    TaskGroupId: {
                        type: Sequelize.INTEGER,
                        allowNull: false,
                        references: "TaskGroups",
                    }
                }).then(function() {
                    queryInterface.createTable("Tasks", {
                        id: {
                            type: Sequelize.INTEGER,
                            primaryKey: true,
                            autoIncrement: true,
                            allowNull: false
                        },
                        status: {
                            type: Sequelize.ENUM,
                            values: ["complete", "incomplete"],
                            allowNull: false,
                            defaultValue: "incomplete"
                        },
                        createdAt: Sequelize.DATE,
                        updatedAt: Sequelize.DATE,
                        TaskInfoId: {
                            type: Sequelize.INTEGER,
                            allowNull: false,
                            references: "TaskInfo",
                        },
                        UserId: {
                            type: Sequelize.INTEGER,
                            allowNull: false,
                            references: "Users",
                        }
                    }, {}).then(function() {done();})
                })
            })
    },

    down: function(queryInterface, Sequelize, done) {
        /*
          Add reverting commands here.
          Return a promise to correctly handle asynchronicity.

          Example:
          return queryInterface.dropTable('users');
        */
        queryInterface.dropTable("Tasks")
            .then(function() {
                queryInterface.dropTable("TaskInfo").then(function() {
                    Sequelize.Promise.all([queryInterface.dropTable("TaskGroups"), queryInterface.dropTable('Users')])
                        .then(function() {done();} )
                })
            })
    }
};
