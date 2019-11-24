var Promise = require('bluebird');
var funkyLogger = require('../lib/funkyLogger.js');
var esprima = require('esprima');

var esprimaConfig = {
	loc: true,
	range: true,
	tokens: true,
	comment: true,
	tolerant: true,
	attachComment: true
}

function generateAST(fileData) {
	return new Promise(function(resolve, reject) {
		var data = esprima.parse(fileData, esprimaConfig);
		return resolve(data);
	});
}

module.exports = generateAST;
