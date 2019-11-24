var Promise = require('bluebird');

function noConsole(fileData) {
	return new Promise(function(resolve, reject) {
		var data = fileData.split('//console.log').join('console.log');
		data = data.split('// console.log').join('//console.log');
		data = data.split('console.log').join('$log.log');
		return resolve(data);
	});
}

module.exports = noConsole;