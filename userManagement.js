var emailConfig = require('./emailConfig');
var emailer = require('./emailer').newEmailer(emailConfig);
var sqlUtils = require('./sqlUtils');
var url = require('url');
var uuid = require('node-uuid');

var userManagement = {
	newUserManager: function(validation, validator, authenticator, client) {
		var manager = {
			login: function(req, res) {
				var validationDef = {
					email: {
						regex: validation.regexes.email
					},
					password: null
				};
				var errors = validator.validate(req.body, validationDef);
				if (errors)
				{
					res.redirect('/html/error.html?err=' + JSON.stringify(errors));
					return;
				}
				console.log(req.body);

				authenticator.authenticate(req.body.email, req.body.password, function(authenticated) {
					if (authenticated)
						res.redirect('http://skavenger.com.ar/homerswebpage/');
					else
						res.redirect('/html/error.html?err=notauthenticated');
				});
			},
			join: function(req, res) {
				var validationDef = {
					email: {
						regex: validation.regexes.email
					},
					firstName: {
						regex: validation.regexes.name
					},
					middleName: {
						regex: validation.regexes.name,
						optional: true
					},
					lastName: {
						regex: validation.regexes.lastName
					},
					password: {
						regex: validation.regexes.anything
					}
				};
				var errors = validator.validate(req.body, validationDef);
				if (errors)
				{
					res.redirect('/html/error.html?err=' + JSON.stringify(errors));
					return;
				}
				else
				{
					var confirmationId = uuid.v4();
					var cmd = "" +
						"INSERT INTO users (first_name, middle_name, last_name, email, password, sign_up_ts, confirmation_id) \n" +
						"VALUES (" + sqlUtils.quote(req.body.firstName) + ", " + sqlUtils.quote(req.body.middleName) + ", " + sqlUtils.quote(req.body.lastName) + ", " + sqlUtils.quote(req.body.email) + ", " + sqlUtils.quote(req.body.password) + ", CURRENT_TIMESTAMP AT TIME ZONE 'UTC', " + sqlUtils.quote(confirmationId) + ")";
					console.log(cmd);
					client.query(cmd, function(err, result) {
						if (err)
							res.redirect('/html/error.html?err=' + err);
						else
						{
							console.log(result);
							if (result.rowCount == 1)
							{
								var urlParts = url.parse(req.headers.origin);
								console.log(urlParts);
								urlParts.pathname = '/confirm';
								urlParts.search = 'confirmationId=' + confirmationId;
								var confirmationLink = url.format(urlParts);
								emailer.send({
									from: '<rscalfani@gmail.com>',
									to: '<' + req.body.email + '>',
									subject: 'Welcome to Maiden, ' + req.body.firstName,
									html: '<p>Welcome to Maiden</p></br>Please click this link to confirm your email: <a href="' + confirmationLink + '">'+ confirmationLink + '</a>'
								}, function(err, response){
									if(err)
										console.log(err);
									else
										console.log("Message sent: " + response.message);
								});
								res.redirect('/html/login.html');
							}
							else
								res.redirect('/html/error.html?err=doesnotexist');
						}
					});
				}
				console.log(req.body);
			},
			emailCheck: function(req, res) {
				var ajaxResponse = function(res, o) {
					console.log(o);
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.write(JSON.stringify(o));
					res.end();
				};
				var validationDef = {
					email: {
						regex: validation.regexes.email
					}
				};
				var errors = validator.validate(req.body, validationDef);
				if (errors)
				{
					ajaxResponse(res, {
						success: false,
						error: errors.join('\n')
					});
					return;
				}
				var cmd = "" +
					"SELECT * \n" +
					"FROM users \n" +
					"WHERE email = " + sqlUtils.quote(req.body.email);
				console.log(cmd);
				client.query(cmd, function(err, result) {
					var success;
					var exists;
					var error;
					if (err)
					{
						success = false;
						error = err;
					}
					else
					{
						success = true;
						exists = result.rows.length == 1
					}
					console.log(result);
					ajaxResponse(res, {
						success: success,
						exists: exists,
						error: error
					});
				});
			},
			confirm: function(req, res) {
				var confirmationID = req.query.confirmationId;
				var cmd = "" +
					"SELECT * \n" +
					"FROM users \n" +
					"WHERE confirmation_id = " + sqlUtils.quote(confirmationID);
				console.log(cmd);
				client.query(cmd, function(err, result) {
					if (err)
						res.redirect('/html/error.html?err=' + err);
					else
					{
						if (result.rowCount == 1)
						{
							cmd = "" +
								"UPDATE users \n" +
								"SET confirmation_id = null \n" +
								"WHERE confirmation_id = " + sqlUtils.quote(confirmationID);
							client.query(cmd, function (err, result) {
								if (err)
									res.redirect('/html/error.html?err=' + err);
								else
									res.redirect('/html/login.html');
							});
						}
						else
							res.redirect('/html/error.html?err=doesnotexist');
					}
				});
			}
		};
				return manager;
	}
};

module.exports = userManagement;