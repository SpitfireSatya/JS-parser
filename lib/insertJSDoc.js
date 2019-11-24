var Promise = require('bluebird');

function insertJSDoc(node) {
	return new Promise(function(resolve, reject) {
		if(node && node.type == 'Program') {
			if(Array.isArray(node.body)) {
				var insert = true;
				if(node.body[0].leadingComments) {
					node.body[0].leadingComments.forEach(function(comment) {
						if(comment.value.indexOf('@fileOverview') > -1) {
							insert = false
							return false;
						}
					});
				} 

				if(insert) {
					var docComment = {};
					docComment.type = 'Block'
					docComment.value = '\n * @fileOverview <file description> \n * @module <file name> \n ';
					docComment.range = [];

					node.body[0].leadingComments = node.body[0].leadingComments ? node.body[0].leadingComments : [];
					node.body[0].leadingComments.push(docComment);
				}
				return resolve(node);
			}
			return resolve(node);
		} else if(node && node.type == 'FunctionDeclaration' && node.id != null) {
			var insert = true;
			if(node.leadingComments) {
				node.leadingComments.forEach(function(comment) {
					if(comment.value.indexOf('@function') > -1) {
						insert = false;
						return false;
					}
				});
			}

			if(insert) {
				var docComment = {};
				docComment.type = 'Block'
				docComment.value = [];
				docComment.range = [];
				docComment.value.push('\n * <Function description> ');
				docComment.value.push('\n * @function '+node.id.name+' ');
				node.params.forEach(function(param) {
					docComment.value.push('\n * @param {object} '+param.name+' <Description> ');
				});
				docComment.value.push('\n ')
				docComment.value = docComment.value.join('');
				node.leadingComments = node.leadingComments ? node.leadingComments : [];
				node.leadingComments.push(docComment);
			}
			return resolve(node);
		} else {
			return resolve(node);
		}
	});
}

module.exports = insertJSDoc;