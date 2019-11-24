var Promise = require('bluebird');
//var traverseAST = require('../lib/traverseAST.js');

function curly(node) {
  var promiseArray = [];
  return new Promise(function(resolve, reject) {
    if (node && node.consequent && node.consequent.type !== 'BlockStatement') {
      var tempBody = [];
      tempBody.push(node.consequent);
      delete node.consequent;
      node.consequent = {};
      node.consequent.type = 'BlockStatement';
      node.consequent.body = tempBody;
    }
    if (node && node.alternate && node.alternate != null && node.alternate.type != 'IfStatement' && node.alternate.type != 'BlockStatement') {
      var tempBody = [];
      tempBody.push(node.alternate);
      delete node.alternate;
      node.alternate = {};
      node.alternate.type = 'BlockStatement';
      node.alternate.body = tempBody;
      return resolve(node);
    } else if (node && node.alternate && node.alternate.type == 'IfStatement') {
      require('../lib/traverseAST.js')(node.alternate)
        .then(function(returnedNode) {
          node.alternate = returnedNode;
          return resolve(node);
        })
        .catch(function(err) {
          return reject(err);
        })
    } else {
      return resolve(node);
    }
  });
};


module.exports = curly;