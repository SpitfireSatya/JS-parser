var Promise = require('bluebird');
var strictEquality = require('../lib/strictEquality.js');
var curly = require('../lib/curly.js');
var removeDuplicateComments = require('../lib/removeDuplicateComments.js');
var insertJSDoc = require('../lib/insertJSDoc.js');

function traverseAST(node) {
	return new Promise(function(resolve, reject) {
		return strictEquality(node)
		.then(function(node) {
			return curly(node);
		})
		.then(function(node) {
			return removeDuplicateComments(node)
		})
		.then(function(node) {
			return insertJSDoc(node)
		})
		.then(function(node) {
			return recursiveRun(node)
		})
		.then(function(node) {
			return resolve(node);
		})
		.catch(function(err) {
			return reject(err);
		});
	});
}

function recursiveRun(node) {
	var promiseArray = [];
	return new Promise(function(resolve, reject) {
		if(node && node.body && Array.isArray(node.body)) {
			node.body.forEach(function(subNode) {
				promiseArray.push(traverseAST(subNode)
				.then(function(returnedSubNode) {
					subNode = returnedSubNode;
					return Promise.resolve(subNode);
				})
				.catch(function(err) {
					return Promise.reject(err);
				}));
			});

			Promise.all(promiseArray)
			.then(function() {
				return resolve(node);
			})
			.catch(function(err) {
				return reject(err);
			});
		} else if(node && node.expression && node.expression.body) {
			return traverseAST(node.expression)
			.then(function(returnedSubNode) {
				node.expression = returnedSubNode;
				return resolve(node);
			})
			.catch(function(err) {
				return reject(err);
			});
		} else if(node && node.expression && node.expression.callee) {
			return traverseAST(node.expression.callee)
			.then(function(returnedSubNode) {
				node.expression.callee = returnedSubNode;
				if(node.expression.arguments) {
					node.expression.arguments.forEach(function(arg) {
						promiseArray.push(traverseAST(arg)
						.then(function(returnedArg) {
							arg = returnedArg;
							return Promise.resolve(arg);
						}))
					})
					Promise.all(promiseArray)
					.then(function() {
						return resolve(node);
					})
				} else {
					return resolve(node);
				}
			})
			.catch(function(err) {
				return reject(err);
			});
		} else if(node && node.body) {
			return traverseAST(node.body)
			.then(function(returnedNode) {
				node.body = returnedNode;
				return resolve(node);
			})
			.catch(function(err) {
				return reject(err);
			});
		} else if(node && node.type == 'IfStatement') {
			promiseArray.push(traverseAST(node.consequent)
			.then(function(returnedNode){
				node.consequent = returnedNode;
				return Promise.resolve();
			}))
			promiseArray.push(traverseAST(node.alternate)
			.then(function(returnedNode){
				node.alternate = returnedNode;
				return Promise.resolve();
			}))
			Promise.all(promiseArray)
			.then(function() {
				return resolve(node);
			})
			.catch(function(err) {
				return reject(err);
			});
		} else if(node && node.type=='VariableDeclaration') {
			node.declarations.forEach(function(declaration) {
				if(declaration.init && declaration.type == 'VariableDeclarator' && declaration.init.type == 'ObjectExpression') {
					promiseArray.push(traverseAST(declaration.init)
					.then(function(returnedDeclaration) {
						declaration.init = returnedDeclaration;
						return Promise.resolve(declaration);
					})
					.catch(function(err) {
						return Promise.reject(err);
					}));
				}
			});

			Promise.all(promiseArray)
			.then(function() {
				return resolve(node);
			})
			.catch(function(err) {
				return reject(err);
			});
		} else if(node && node.type=='ObjectExpression') {
			node.properties.forEach(function(property) {
				promiseArray.push(traverseAST(property)
				.then(function(returnedProperty) {
					property = returnedProperty;
					return Promise.resolve(property);
				})
				.catch(function(err) {
					return Promise.reject(err);
				}));
			});

			Promise.all(promiseArray)
			.then(function() {
				return resolve(node);
			})
			.catch(function(err) {
				return reject(err);
			});
		} else {
			return resolve(node);
		}
	});
}

module.exports = traverseAST;