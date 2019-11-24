var fs = require('fs');
var Promise = require('bluebird');
var config = {path: ['./testData']}//require('../config/fileOpsConfig.json');
Promise.promisifyAll(fs, {suffix: 'PromiseFn'});


var fileList = [];

function simpleFileSearch(path) {
	var promiseArray = [];
	return new Promise(function(resolve, reject) {
		fs.readdirPromiseFn(path)
		.then(function(files) {
			if(files) {
				files.forEach(function(fileName) {
					promiseArray.push(fs.statPromiseFn(path+'/'+fileName)
					.then(function(stat) {
						if(stat && stat.isDirectory()) {
							return simpleFileSearch(path+'/'+fileName)
							.then(function() {
								return Promise.resolve()
							})
							.catch(function(err) {
								Promise.reject(err);
							});
						} else {
							if(fileName.lastIndexOf('.js') == fileName.length-3) {
								fileList.push(path+'/'+fileName);
							}
							return Promise.resolve()
						}
					})
					.catch(function(err){
						return Promise.reject(err)
					}));
				});

				Promise.all(promiseArray)
				.then(function() {
					return resolve();
				});

			} else {
				return Promise.resolve();
			}
		})
		.catch(function(err){
			return Promise.reject(err);
		});	
	})
}

function checkInclusionList() {
	return new Promise(function(resolve, reject) {
		return resolve();
	});
}

function checkExclusionList() {
	return new Promise(function(resolve, reject) {
		return resolve();
	});
}


function recursiveFileSearch() {
	var promiseArray = [];
	return new Promise(function(resolve, reject) {
		config.path.forEach(function(filePath){
			promiseArray.push(simpleFileSearch(filePath)
			.then(function(){
				return Promise.resolve();
			})
			.catch(function(err) {
				return Promise.reject();
			}))
		});

		Promise.all(promiseArray)
		.then(function() {
			return checkInclusionList()
		})
		.then(function() {
			return checkExclusionList()
		})
		.then(function() {
			return resolve(fileList);
		})
		.catch(function(err) {
			return reject(err)
		});
	});	
}

function readFileData(filePath) {
	return new Promise(function(resolve, reject) {
		return fs.readFilePromiseFn(filePath, 'utf8')
		.then(function(contents){
			return resolve({ filePath: filePath, data: contents });
		})
		.catch(function(err) {
			return reject(err);
		});
	});
}

function writeFileData(fileObject) {
	return new Promise(function(resolve, reject) {
		return fs.writeFilePromiseFn('traverseTest.js'/*fileObject.filePath*/, fileObject.data, 'utf8')
		.then(function() {
			return resolve(fileObject.filePath);
		})
		.catch(function(err) {
			return reject(err);
		});
	});
}

module.exports = {
	recursiveFileSearch : recursiveFileSearch,
	readFileData : readFileData,
	writeFileData: writeFileData
};
