var Promise = require('bluebird');
var funkyLogger = require('../lib/funkyLogger.js');
var escodegen = require('escodegen');

var codegenConfig = {
    format: {
        indent: {
            style: '    ',
            base: 0,
            adjustMultilineComment: true
        },
        newline: '\n',
        space: ' ',
        json: false,
        renumber: false,
        hexadecimal: false,
        quotes: 'single',
        escapeless: true,
        compact: false,
        parentheses: true,
        semicolons: true,
        safeConcatenation: true
    },
    moz: {
        starlessGenerator: false,
        parenthesizedComprehensionBlock: true,
        comprehensionExpressionStartsWithAssignment: true
    },
    parse: null,
    comment: true,
    sourceMap: undefined,
    sourceMapRoot: null,
    sourceMapWithCode: false,
    file: undefined,
    sourceContent: undefined,
    directive: false,
    verbatim: undefined
}

function generateCode(fileData) {
	return new Promise(function(resolve, reject) {
		//var data = escodegen.attachComments(fileData, fileData.comments, fileData.tokens);
		data = escodegen.generate(fileData, codegenConfig);
		return resolve(data);
	});
}

module.exports = generateCode;
