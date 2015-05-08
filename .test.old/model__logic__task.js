var assert = require('assert');
var logic = require('../models/logic/index');
var models = require("../models/index");
var ReCalLib = require("../lib/lib");
var Q = require('q');
function createTestUser() {
    return ReCalLib.PromiseAdapter.convertSequelize(models.User.create({
        username: "test_user",
    }));
}
function createTaskGroup() {
    return ReCalLib.PromiseAdapter.convertSequelize(models.TaskGroup.create({
        name: "test_group",
    }));
}
function destroyTestUser(testUserModel) {
    return logic.destroyModelInstance(models.User, testUserModel);
}
describe('Task Model Logic Unit Tests', function () {
    describe('createTask()', function () {
        it('Should not accept objects with task ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.createTask({
                    id: 1234,
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with task info ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.createTask({
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        id: 1,
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with nonexistent task group ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.createTask({
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: -1,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with nonexistent user ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.createTask({
                    userId: -1,
                    status: 'complete',
                    taskInfo: {
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should return a valid TaskObject with ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                var status = 'complete';
                var title = 'dummy';
                var privacy = 'private';
                logic.Task.createTask({
                    userId: testUserModel.id,
                    status: status,
                    taskInfo: {
                        title: title,
                        privacy: privacy,
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(taskObject.id !== null && taskObject.id !== undefined);
                    assert(taskObject.taskInfo.id !== null && taskObject.taskInfo.id !== undefined);
                    assert(taskObject.status === status);
                    assert(taskObject.taskInfo.title === title);
                    assert(taskObject.taskInfo.privacy === privacy);
                    assert(taskObject.userId === testUserModel.id);
                    assert(taskObject.taskInfo.taskGroup.id === taskGroupModel.id);
                    assert(taskObject.taskInfo.taskGroup.name === taskGroupModel.name);
                    return Q.spread([logic.modelInstanceExists(models.Task, taskObject.id), logic.modelInstanceExists(models.TaskInfo, taskObject.taskInfo.id)], function (exists1, exists2) {
                        assert(exists1 && exists2);
                        return logic.destroyModelInstanceWithId(models.Task, taskObject.id).then(function () {
                            return logic.destroyModelInstanceWithId(models.TaskInfo, taskObject.taskInfo.id);
                        });
                    });
                }).fail(function (error) {
                    console.log(error);
                    console.log(error.stack);
                    throw error;
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
    });
    describe('updateTaskInfo()', function () {
        function setUpTestTask() {
            return Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                return Q.all([
                    Q.fcall(function () { return testUserModel; }),
                    Q.fcall(function () { return taskGroupModel; }),
                    logic.Task.createTask({
                        userId: testUserModel.id,
                        status: 'complete',
                        taskInfo: {
                            title: 'dummy',
                            privacy: 'private',
                            taskGroup: {
                                id: taskGroupModel.id,
                                name: taskGroupModel.name
                            }
                        }
                    })
                ]);
            });
        }
        function cleanUp(testUserModel, taskGroupModel, taskObject) {
            return logic.destroyModelInstanceWithId(models.Task, taskObject.id).then(function () {
                return logic.destroyModelInstanceWithId(models.TaskInfo, taskObject.taskInfo.id);
            }).then(function () {
                return Q.all([
                    destroyTestUser(testUserModel),
                    logic.destroyModelInstance(models.TaskGroup, taskGroupModel)
                ]);
            }).then(function () {
                return;
            });
        }
        it('Should not accept objects without task ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.updateTaskInfo({
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        id: 0,
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects without task info ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.updateTaskInfo({
                    id: 0,
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with nonexistent task group ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.updateTaskInfo({
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: -1,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with nonexistent user ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.updateTaskInfo({
                    id: 0,
                    userId: -1,
                    status: 'complete',
                    taskInfo: {
                        id: 0,
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with nonexistent task group ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.updateTaskInfo({
                    id: 0,
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        id: 0,
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: -1,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with nonexistent task ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.updateTaskInfo({
                    id: -1,
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        id: 0,
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not accept objects with nonexistent task info ID', function (done) {
            Q.spread([createTestUser(), createTaskGroup()], function (testUserModel, taskGroupModel) {
                logic.Task.updateTaskInfo({
                    id: 0,
                    userId: testUserModel.id,
                    status: 'complete',
                    taskInfo: {
                        id: -1,
                        title: 'dummy',
                        privacy: 'private',
                        taskGroup: {
                            id: taskGroupModel.id,
                            name: taskGroupModel.name
                        }
                    }
                }).then(function (taskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    Q.all([destroyTestUser(testUserModel), logic.destroyModelInstance(models.TaskGroup, taskGroupModel)]).then(function () { done(); });
                });
            });
        });
        it('Should not allow modification of task status', function (done) {
            setUpTestTask().spread(function (testUserModel, taskGroupModel, taskObject) {
                taskObject.status = 'incomplete';
                logic.Task.updateTaskInfo(taskObject).then(function (newTaskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    cleanUp(testUserModel, taskGroupModel, taskObject).then(function () { done(); });
                });
            });
        });
        it('Should not allow modification of task privacy', function (done) {
            setUpTestTask().spread(function (testUserModel, taskGroupModel, taskObject) {
                taskObject.taskInfo.privacy = 'public';
                logic.Task.updateTaskInfo(taskObject).then(function (newTaskObject) {
                    assert(false);
                }, function (error) {
                    assert(error);
                }).then(function () {
                    cleanUp(testUserModel, taskGroupModel, taskObject).then(function () { done(); });
                });
            });
        });
    });
});
