var colors = require('../config/colorMap.json');
var foreground = colors.foreground;
var background = colors.background;

function funkyLogger(color, text) {
	if(foreground[color]) {
		return('\x1b['+foreground[color]+'m'+text+'\x1b['+foreground.normal+'m');
	} else {
		return(text);
	}
}

module.exports = funkyLogger;