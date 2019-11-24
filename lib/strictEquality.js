var Promise = require('bluebird');
//var traverseAST = require('../lib/traverseAST.js');

function strictEquality(node) {
	return new Promise(function(resolve, reject) {
		if(node && node.type == 'IfStatement') {
			if(node.test && node.test.type == 'BinaryExpression') {
				if(node.test.operator == '==') {
					node.test.operator = '===';
				} else if(node.test.operator == '!=') {
					node.test.operator = '!==';
				}
			} else if(node.test.type == 'LogicalExpression') {
				var promiseArray = [];
				promiseArray.push(require('../lib/traverseAST.js')(node.test.left)
				.then(function(returnedNode){
					node.test.left = returnedNode;
					return Promise.resolve();
				}))
				promiseArray.push(require('../lib/traverseAST.js')(node.test.right)
				.then(function(returnedNode){
					node.test.right = returnedNode;
					return Promise.resolve();
				}))
				Promise.all(promiseArray)
				.then(function() {
					return resolve(node);
				})
				.catch(function(err) {
					return reject(err);
				});
			}
			return resolve(node);
		} else if(node && node.type == 'LogicalExpression') {
			var promiseArray = [];
			promiseArray.push(require('../lib/traverseAST.js')(node.left)
			.then(function(returnedNode){
				node.left = returnedNode;
				return Promise.resolve();
			}))
			promiseArray.push(require('../lib/traverseAST.js')(node.right)
			.then(function(returnedNode){
				node.right = returnedNode;
				return Promise.resolve();
			}))
			Promise.all(promiseArray)
			.then(function() {
				return resolve(node);
			})
			.catch(function(err) {
				return reject(err);
			});
		} else if(node && node.type == 'BinaryExpression') {
			if(node.operator == '==') {
				node.operator = '===';
			} else if(node.operator == '!=') {
				node.operator = '!==';
			}
			return resolve(node)
		} else {
			return resolve(node);
		}
	});
}

module.exports = strictEquality;