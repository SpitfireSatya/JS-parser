var Promise = require('bluebird');
var _ = require('lodash');
var fileOps = require('../lib/fileOps');
var taskFilePaths = require('../config/taskListMap.json');
var taskList = require('../config/taskList.js');
var funkyLogger = require('../lib/funkyLogger.js');

function taskRunner(fileList) {
	var promiseArray = [];
	return new Promise(function(resolve, reject) {
		fileList.forEach(function(filePath) {
			promiseArray.push(fileOps.readFileData(filePath)
			.then(function(fileObject) {
				console.log(funkyLogger('green', 'Successfully Read File: '),funkyLogger('cyan', filePath));
				return runTaskList(fileObject);
			})
			.then(function(fileObject) {
				return fileOps.writeFileData(fileObject)
			})
			.then(function(fileName) {
				console.log(funkyLogger('green', 'File Successfully Written to: '),funkyLogger('cyan', fileName));
				return Promise.resolve();
			})
			.catch(function(err) {
				return Promise.reject(err);
			})
			);
		});
		Promise.all(promiseArray)
		.then(function() {
			return resolve();
		});
	});
};


function runTaskList (fileObject) {
	return new Promise(function(resolve, reject) {
		Promise.reduce(taskList, function(acc, task, index) {
			return require(taskFilePaths[task])(fileObject.data)
			.then(function(data){
				fileObject.data = data;
				console.log(funkyLogger('yellow', 'Task ')+funkyLogger('magenta', task)+funkyLogger('green', ' Successfully executed on ')+funkyLogger('cyan', fileObject.filePath));
				Promise.resolve(fileObject);
			});
		}, 0)
		.then(function(acc) {
			return resolve(fileObject);
		})
		.catch(function(err) {
			return reject(err);
		});
	});
};

module.exports = taskRunner;