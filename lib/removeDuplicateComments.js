var Promise = require('bluebird');

function removeDuplicateComments(node) {
	return new Promise(function(resolve, reject) {
		if(node && node.trailingComments) {
			delete node.trailingComments;
		}
		return resolve(node);
	});
}

module.exports = removeDuplicateComments;