var helper = require("./helper");
var models = require("../index");
var ReCalLib = require("../../lib/lib");
var Q = require('q');
var PromiseAdapter = ReCalLib.PromiseAdapter;
var TaskLogic;
(function (TaskLogic) {
    function verifyTaskObject(taskObject) {
        return helper.modelInstanceExists(models.TaskGroup, taskObject.taskInfo.taskGroup.id)
            .then(function (exists) {
            if (!exists) {
                throw new Error("Task Group with ID " + taskObject.taskInfo.taskGroup.id + " does not exist.");
            }
            return helper.modelInstanceExists(models.User, taskObject.userId);
        }).then(function (exists) {
            if (!exists) {
                throw new Error("User with ID " + taskObject.userId + " does not exist.");
            }
        });
    }
    function exportTaskGroup(taskGroupModel) {
        return Q.fcall(function () {
            return {
                id: taskGroupModel.id,
                name: taskGroupModel.name
            };
        });
    }
    TaskLogic.exportTaskGroup = exportTaskGroup;
    function exportTaskInfo(taskInfoModel) {
        return taskInfoModel.getTaskGroup()
            .then(exportTaskGroup)
            .then(function (taskGroupObject) {
            return {
                id: taskInfoModel.id,
                title: taskInfoModel.title,
                privacy: taskInfoModel.privacy,
                taskGroup: taskGroupObject
            };
        });
    }
    TaskLogic.exportTaskInfo = exportTaskInfo;
    function exportTask(taskModel) {
        var taskInfoPromise = PromiseAdapter.convertSequelize(taskModel.getTaskInfo());
        var userPromise = PromiseAdapter.convertSequelize(taskModel.getUser());
        return Q.spread([taskInfoPromise, userPromise], function (taskInfoModel, userModel) {
            return exportTaskInfo(taskInfoModel).then(function (taskInfoObject) {
                return {
                    id: taskModel.id,
                    userId: userModel.id,
                    status: taskModel.status,
                    taskInfo: taskInfoObject
                };
            });
        });
    }
    TaskLogic.exportTask = exportTask;
    function createTask(taskObject) {
        return verifyTaskObject(taskObject)
            .then(function () {
            if (taskObject.id !== null && taskObject.id !== undefined) {
                throw new Error("Task ID cannot exist when trying to create a task.");
            }
            if (taskObject.taskInfo.id !== null && taskObject.taskInfo.id !== undefined) {
                throw new Error("Task Info ID cannot exist when trying to create a task.");
            }
        }).then(function () {
            return PromiseAdapter.convertSequelize(models.TaskGroup.find(taskObject.taskInfo.taskGroup.id));
        }).then(function (taskGroupModel) {
            return PromiseAdapter.convertSequelize(models.TaskInfo.create({
                title: taskObject.taskInfo.title,
                privacy: taskObject.taskInfo.privacy,
                TaskGroupId: taskGroupModel.id
            }));
        }).then(function (taskInfoModel) {
            return PromiseAdapter.convertSequelize(models.Task.create({
                status: taskObject.status,
                TaskInfoId: taskInfoModel.id,
                UserId: taskObject.userId
            }));
        }).then(exportTask);
    }
    TaskLogic.createTask = createTask;
    function updateTaskInfo(taskObject) {
        return verifyTaskObject(taskObject)
            .then(function () {
            if (taskObject.id === null || taskObject.id === undefined) {
                throw new Error("Task ID must exist when trying to update a task.");
            }
            if (taskObject.taskInfo.id === null || taskObject.taskInfo.id === undefined) {
                throw new Error("Task Info ID must exist when trying to update a task.");
            }
        }).then(function () {
            return Q.all([
                helper.modelInstanceExists(models.Task, taskObject.id),
                helper.modelInstanceExists(models.TaskInfo, taskObject.taskInfo.id)
            ]);
        }).spread(function (taskExists, taskInfoExists) {
            if (!taskExists) {
                throw new Error("Task ID must correspond to a database row");
            }
            if (!taskInfoExists) {
                throw new Error("Task Info ID must correspond to a database row");
            }
        }).then(function () {
            return Q.all([
                models.User.find(taskObject.userId),
                models.Task.find(taskObject.id),
                models.TaskInfo.find(taskObject.taskInfo.id),
                models.TaskGroup.find(taskObject.taskInfo.taskGroup.id)
            ].map(PromiseAdapter.convertSequelize));
        }).spread(function (userModel, taskModel, taskInfoModel, taskGroupModel) {
            if (taskModel.status !== taskObject.status) {
                throw new Error("Cannot change task status using the updateTaskInfo method");
            }
            if (taskInfoModel.privacy !== taskObject.taskInfo.privacy) {
                throw new Error("Cannot change task privacy using the updateTaskInfo method");
            }
            if (taskModel.TaskInfoId !== taskObject.taskInfo.id) {
                throw new Error("The given Task-TaskInfo relationship does not exist");
            }
            if (taskInfoModel.TaskGroupId !== taskObject.taskInfo.taskGroup.id) {
                throw new Error("The given TaskInfo-TaskGroup relationship does not exist");
            }
            return [userModel, taskModel, taskInfoModel, taskGroupModel];
        }).spread(function (userModel, taskModel, taskInfoModel, taskGroupModel) {
            return models.TaskInfo.create({
                title: taskObject.taskInfo.title,
                privacy: taskObject.taskInfo.privacy,
                PreviousVersionId: taskObject.taskInfo.id,
                TaskGroupId: taskObject.taskInfo.taskGroup.id
            }).then(function (createdTaskInfo) {
                return taskModel.setTaskInfo(createdTaskInfo);
            }).then(function () {
                return taskModel.save();
            }).then(function () {
                return taskModel;
            });
        }).then(function (taskModel) {
            return exportTask(taskModel);
        });
    }
    TaskLogic.updateTaskInfo = updateTaskInfo;
})(TaskLogic || (TaskLogic = {}));
module.exports = TaskLogic;
