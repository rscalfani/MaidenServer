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
						if (paramValidation != null)
						{
							// optional parameters can be blank
							if (paramValidation.optional == true && paramValue == '')
								return;
							// check regex
							if (paramValidation.regex && !paramValue.match(paramValidation.regex))
								pushError(key, 'is invalid');
						}
					}
					// otherwise make sure parameter is optional
					else if (validationDef[key] == null || validationDef[key].optional !== true)
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
		email: /^[A-Z0-9._%-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
		name: /[A-Z]/ig,
		lastName: /[A-Z' ]/ig,
		anything: /.+/ig
	}
};

module.exports = validation;