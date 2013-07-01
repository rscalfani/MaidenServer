var utils = {
	quote: function(s) {
		s = s.replace(/'/g, '\'\'');
		return '\'' + s + '\'';
	}
};

module.exports = utils;