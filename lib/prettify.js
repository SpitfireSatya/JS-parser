var _ = require('lodash');
var Promise = require('bluebird');

function prettifyJS(fileData) {
	return new Promise(function(resolve, reject) {
		removeSpaces(fileData)
		.then(function(data) {
			return addNewLineChars(data);
		})
		.then(function(data) {
			return addCorrectSpaces(data);
		})
		.then(function(data) {
			return preventNewLineInDoubleQuotes(data);
		})
		.then(function(data) {
			return preventNewLineInSingleQuotes(data);
		})
		.then(function(data) {
			return finalCorrections(data);
		})
		.then(function(data) {
			return resolve(data);
		})
		.catch(function(err) {
			return reject(err);
		})
	});
	
}

function removeSpaces(fileData) {
	return new Promise(function(resolve, reject) {
		var data = fileData.split("  ").join("");
		data = data.split("\n\r\n").join("\n");
		data = data.split("\t").join("");
		data = data.split("{ ").join("{");
		data = data.split(" }").join("}");
		return resolve(data);
	});
}

function addNewLineChars(fileData) {
	return new Promise(function(resolve, reject) {
		var data = fileData.split("{\n").join("{");
		data = data.split("\n}").join("}");
		data = data.split("{").join("{\n");
		data = data.split("}").join("\n}");
		data = data.split("\n\r\n").join("\n");
		data = data.split("\r\n\r").join("\r");
		data = data.split("\n\n").join("");
		data = data.split("\r\r").join("");
		return resolve(data);
	});
}

function addCorrectSpaces(fileData) {

	var topPart = "";
	var bottomPart = "";

	function addIndentation(str) {
		var index = str.indexOf("{");
		if(index>-1) {
			var substr1 = str.substr(0, index+1);
			var substr2 = str.substr(index+1, str.length-1);
			substr2 = substr2.split("\n").join("\n\t");
			topPart = topPart.concat(substr1);
			return addIndentation(substr2);
		} else {
			topPart = topPart.concat(str);
			return Promise.resolve(topPart);
		}
	}

	function removeIndentation(str) {
		var index = str.indexOf("}");
		if(index>-1) {
			var substr1 = str.substr(0, index+1);
			var substr2 = str.substr(index+1, str.length-1);
			substr1 = substr1.replace("\t}", "}");
			substr2 = substr2.split("\n\t").join("\n");
			bottomPart = bottomPart.concat(substr1);
			return removeIndentation(substr2)
		} else {
			bottomPart = bottomPart.concat(str);
			return Promise.resolve(bottomPart);
		}
	}

	return new Promise(function(resolve, reject) {
		return addIndentation(fileData)
		.then(function(topPart) {
			return removeIndentation(topPart)
		})
		.then(function(bottomPart) {
			return resolve(bottomPart);
		})
	});
}

function preventNewLineInDoubleQuotes(fileData) {
	return new Promise(function(resolve, reject) {
		var dataArray = fileData.split('"');
		var data = [];
		data.push(dataArray[0]);
		for(var i=1; i<dataArray.length; i=i+2) {
			dataArray[i] = dataArray[i].split('\n').join("");
			dataArray[i] = dataArray[i].split('\t').join("");
			data.push(dataArray[i]);
			data.push(dataArray[i+1]);
		}
		data = data.join('"');
		return resolve(data);
	});
}

function preventNewLineInSingleQuotes(fileData) {
	return new Promise(function(resolve, reject) {
		var dataArray = fileData.split("'");
		var data = [];
		data.push(dataArray[0]);
		for(var i=1; i<dataArray.length; i=i+2) {
			dataArray[i] = dataArray[i].split('\n').join("");
			dataArray[i] = dataArray[i].split('\t').join("");
			data.push(dataArray[i]);
			data.push(dataArray[i+1]);
		}
		data = data.join('"');
		return resolve(data);
	});
}

function finalCorrections(fileData) {
	return new Promise(function(resolve, reject) {
		var data = fileData.split("){").join(") {");
		data = data.split("}else").join("} else");
		data = data.split("else{").join("else {");
		data = data.split(" =").join("=");
		data = data.split("= ").join("=");
		return resolve(data);
	});
}

module.exports = prettifyJS;