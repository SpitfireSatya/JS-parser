var Promise = require('bluebird');
var charLimit = 50;
var whiteSpaceLength = 3;
function breakLongLines(fileData) {
	var promiseArray = [], finalArray = [];
	return new Promise(function(resolve, reject) {
		var dataArray = fileData.split("\n");
		dataArray.forEach(function(data) {
			promiseArray.push(addNewLineChars(data, 1, 0)
			.then(function(modifiedData){
				finalArray.push(modifiedData);
				return Promise.resolve();
			})
			.catch(function(err) {
				return reject(err)
			}))
		})

		Promise.all(promiseArray)
		.then(function(){
			finalArray = finalArray.join("\n");
			return resolve(finalArray);
		})
		.catch(function(err) {
			return reject(err);
		})

	});
}

function addNewLineChars(data, i, lastSlice) {
	return new Promise(function(resolve, reject) {
		if(data.length > charLimit*i && data.indexOf('.then(', charLimit*i)>-1 && (data.indexOf('//')==-1 || data.indexOf('//')>data.indexOf('.then(', charLimit*i))) {
			if(data.indexOf('.then(', charLimit*i) > lastSlice) {
				data = data.slice(0, data.indexOf('.then(', charLimit*i)) + '\n' + Array(whiteSpaceLength+1).join('    ') + data.slice(data.indexOf('.then(', charLimit*i));
				lastSlice = data.indexOf('.then(', charLimit*i)+2;
			}
			i++;
			return resolve(addNewLineChars(data, i, lastSlice));
		} else if(data.length > charLimit*i && data.indexOf('&&', charLimit*i)>-1 && (data.indexOf('//')==-1 || data.indexOf('//')>data.indexOf('&&', charLimit*i))) {
			if(data.indexOf('&&', charLimit*i) > lastSlice) {
				data = data.slice(0, data.indexOf('&&', charLimit*i)+2) + '\n' + Array(whiteSpaceLength+1).join('	') + data.slice(data.indexOf('&&', charLimit*i)+2);
				lastSlice = data.indexOf('&&', charLimit*i)+2;
			}
			i++;
			return resolve(addNewLineChars(data, i, lastSlice));
		} else if(data.length > charLimit*i && data.indexOf('||', charLimit*i)>-1 && (data.indexOf('//')==-1 || data.indexOf('//')>data.indexOf('||', charLimit*i))) {
			if(data.indexOf('||', charLimit*i) > lastSlice) {
				data = data.slice(0, data.indexOf('||', charLimit*i)+2) + '\n' + Array(whiteSpaceLength+1).join('	') + data.slice(data.indexOf('||', charLimit*i)+2);
				lastSlice = data.indexOf('||', charLimit*i)+2;
			}
			i++;
			return resolve(addNewLineChars(data, i, lastSlice));
		} else if(data.length > (charLimit*2)*i && data.indexOf(',', (charLimit*2)*i)>-1 && (data.indexOf('//')==-1 || data.indexOf('//')>data.indexOf(',', (charLimit*2)*i))) {
			if(data.indexOf(',', (charLimit*2)*i) > lastSlice) {
				data = data.slice(0, data.indexOf(',', (charLimit*2)*i)+1) + '\n' + Array(whiteSpaceLength+1).join('	') + data.slice(data.indexOf(',', (charLimit*2)*i)+1);
				lastSlice = data.indexOf(',', (charLimit*2)*i)+1;
			}
			i++;
			return resolve(addNewLineChars(data, i, lastSlice));
		}else {
			return resolve(data);
		}
	});
}


module.exports = breakLongLines;