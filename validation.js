var validation = {
	newValidator: function() {
		var validator = {
			validate: function(params, validationDef) {
				var errors;
				var pushError = function(key, msg) {
					if (!errors)
						errors = [];
					errors.push(key + ' ' + msg);
				};
				Object.keys(validationDef).forEach(function(key) {
					// if validation parameter sent to us then validate
					if (key in params)
					{
						var paramValue = params[key];
						var paramValidation = validationDef[key];
						// optional parameters can be blank
						if (paramValidation.optional == true && paramValue == '')
							return;
						// check regex
						if (paramValidation.regex)
						{
							if (!paramValue.match(new RegExp('^' + paramValidation.regex.source + '$', 'i')))
								pushError(key, 'is invalid');
						}
						else
							pushError(key, 'is missing regex in validation');
					}
					// otherwise make sure parameter is optional
					else if (!validationDef[key].optional)
						pushError(key, 'is missing');
				});
				// check for parameters that aren't specified in validation
				Object.keys(params).forEach(function(key) {
					if (!(key in validationDef))
						pushError(key, 'is an invalid parameter');
				})
				return errors;
				}
			};
		return validator;
	},
	regexes: {
		email: /[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/,
		name: /[A-Z]+/,
		lastName: /[A-Z' ]+/,
		anything: /.+/,
		uuid: /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/,
		checkbox: /on|off/
	}
};

module.exports = validation;