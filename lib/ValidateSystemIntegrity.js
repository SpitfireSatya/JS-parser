var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'), {suffix : 'PromiseFn'});
var funkyLogger = require('../lib/funkyLogger');

var baseConfig = './config/';
var configArray = ['colorMap.json', 'taskList.js', 'taskListMap.json', 'globalConfig.json'];
var baseLib = './lib/';
var libArray = ['generateAST.js', 'generateCode.js', 'traverseAST.js','curly.js', 'fileOps.js', 'noConsole.js', 'prettify.js', 'strictEquality.js', 'taskRunner.js']

function validateSystemIntegrity() {
	var promiseArray = []
	return new Promise(function(resolve, reject) {
		return configFilesCheck()
		.then(function(){
			return libFilesCheck()
		})
		/*.then(function() {
			return checkConfigValueType()
		})*/
		.then(function() {
			return validateTaskList()
		}) 
		.then(function() {
			return resolve();
		})
		.catch(function(err) {
			return reject(err);
		})
	});
}

function configFilesCheck() {
	var promiseArray = [];
	return new Promise(function(resolve, reject) {
		configArray.forEach(function(file) {
			promiseArray.push(fs.statPromiseFn(baseConfig+file)
			.then(function(stats) {
				console.log(funkyLogger('green', 'Config File Found: '+file));
				return Promise.resolve();
			})
			.catch(function(err) {
				console.log(funkyLogger('red', 'Config File Missing: '+file));
				console.log('error', err);
				return Promise.reject(err);
			}))
		});

		Promise.all(promiseArray)
		.then(function() {
			return resolve();
		})
		.catch(function(err) {
			return reject(err);
		});
	});
}

function libFilesCheck() {
	var promiseArray = [];
	return new Promise(function(resolve, reject) {
		libArray.forEach(function(file) {
			promiseArray.push(fs.statPromiseFn(baseLib+file)
			.then(function(stats) {
				console.log(funkyLogger('green', 'Library File Found: '+file));
				return Promise.resolve();
			})
			.catch(function(err) {
				console.log(funkyLogger('red', 'Library File Missing: '+file));
				console.log('error', err);
				return Promise.reject(err);
			}))
		});

		Promise.all(promiseArray)
		.then(function() {
			return resolve();
		})
		.catch(function(err) {
			return reject(err);
		});
	});
}

function checkConfigValueType() {
	var fileOpsConfig = require('../config/fileOpsConfig.json');
	fileOpsConfig.taskList = require('../config/taskList.js')
	var checkArray = ['path', 'include', 'exclude', 'taskList'];
	var promiseArray = [];
	return new Promise(function(resolve, reject) {
		checkArray.forEach(function(item) {
			promiseArray.push(new Promise(function(resolve, reject) {
				if(!Array.isArray(fileOpsConfig[item])) {
					console.log(funkyLogger('red', 'Expected an Array. Got a String: '+item));
					return reject('Expected an Array. Got a String');
				} else {
					console.log(funkyLogger('green', 'Config OK: '+item));
					return resolve();
				}
			}))
		})
		Promise.all(promiseArray)
		.then(function() {
			return resolve();
		})
		.catch(function(err) {
			return reject(err);
		});
	});
}

function validateTaskList() {
	var promiseArray = [];
	var taskList = require('../config/taskList.js');
	var taskListMap = require('../config/taskListMap.json')
	return new Promise(function(resolve, reject) {
		taskList.forEach(function(task) {
			promiseArray.push(fs.statPromiseFn(taskListMap[task].substr(1))
			.then(function(stats) {
				console.log(funkyLogger('green', 'JS file Found for Task: '+task));
				return Promise.resolve();
			})
			.catch(function(err){
				console.log(funkyLogger('red', 'JS file Not Found for Task: '+task));
				return Promise.reject(err);
			}))
		});
		Promise.all(promiseArray)
		.then(function() {
			return resolve();
		})
		.catch(function(err) {
			return reject(err);
		});

	});
}

module.exports = validateSystemIntegrity;