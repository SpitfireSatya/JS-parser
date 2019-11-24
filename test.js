var fs = require('fs');
var Promise = require('bluebird');
Promise.promisifyAll(fs, {suffix: 'PromiseFn'});

var files = [];
var fileData = [];

fs.readdirPromiseFn('./testData')
.then(function(fileList) {
	fileList.forEach(function(fileName){
		files.push(fs.statPromiseFn('./testData'+'/'+fileName)
		.then(function(stat) {
			if(stat && stat.isDirectory()) {
				return Promise.resolve();
			} else {
				return fs.readFilePromiseFn('./testData'+'/'+fileName, 'utf8')
				.then(function(data){
					fileData.push(data);
					return Promise.resolve();
				});
			}

		}));
	});

	Promise.all(files)
	.then(function(value) {
		console.log(fileData.length);
		console.log(value);
	});
});
