var emailConfig = require('./emailConfig');
var emailer = require('./emailer').newEmailer(emailConfig);
var sqlUtils = require('./sqlUtils');
var url = require('url');
var uuid = require('node-uuid');

var userManagement = {
	newUserManager: function(validation, validator, authenticator, dbClient) {
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

				var cmd = "" +
					"SELECT user_id \n" +
					"FROM users \n" +
					"WHERE email = " + sqlUtils.quote(req.body.email);

				dbClient.query(cmd, function(err, result) {
					if (err || result.rows.length == 0)
						res.redirect('/html/error.html?err=notauthenticated');
					else
					{
						var userId = result.rows[0].user_id;
						authenticator.passwordHash(userId, req.body.password, function(err, passwordHash) {
							if (err)
								res.redirect('/html/error.html?err=notauthenticated');
							else
							{
								authenticator.authenticate(req.body.email, passwordHash, function(authenticated) {
									if (authenticated)
										res.redirect('http://skavenger.com.ar/homerswebpage/');
									else
										res.redirect('/html/error.html?err=notauthenticated');
								});
							}
						});
					}
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
				// create random userId
				var userId = uuid.v4();
				authenticator.passwordHash(userId, req.body.password, function(err, passwordHash) {
					if (err)
						res.redirect('/html/error.html?err=' + err);
					else
					{
						// create random confirmation id for email
						var confirmationId = uuid.v4();
						var cmd = "" +
							"INSERT INTO users (first_name, middle_name, last_name, email, password, sign_up_ts, confirmation_id, user_id) \n" +
							"VALUES (" + sqlUtils.quote(req.body.firstName) + ", " + sqlUtils.quote(req.body.middleName) + ", " + sqlUtils.quote(req.body.lastName) + ", " + sqlUtils.quote(req.body.email) + ", " + sqlUtils.quote(passwordHash) + ", CURRENT_TIMESTAMP AT TIME ZONE 'UTC', " + sqlUtils.quote(confirmationId) + "," + sqlUtils.quote(userId) + ")";
						dbClient.query(cmd, function(err, result) {
							if (err)
								res.redirect('/html/error.html?err=' + err);
							else
							{
								if (result.rowCount == 1)
								{
									// send confirmation email
									var urlParts = url.parse(req.headers.origin);
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
									res.redirect('/html/error.html?err=unabletojoin');
							}
						});
					}
				});
			},
			emailCheck: function(req, res) {
				var ajaxResponse = function(res, o) {
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
				dbClient.query(cmd, function(err, result) {
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
					ajaxResponse(res, {
						success: success,
						exists: exists,
						error: error
					});
				});
			},
			confirm: function(req, res) {
				var validationDef = {
					confirmationId: {
						regex: validation.regexes.uuid
					}
				};
				var errors = validator.validate(req.query, validationDef);
				if (errors)
				{
					res.redirect('/html/error.html?err=' + JSON.stringify(errors));
					return;
				}
				var confirmationId = req.query.confirmationId;
				var cmd = "" +
					"SELECT * \n" +
					"FROM users \n" +
					"WHERE confirmation_id = " + sqlUtils.quote(confirmationId);
				dbClient.query(cmd, function(err, result) {
					if (err)
						res.redirect('/html/error.html?err=' + err);
					else
					{
						if (result.rowCount == 1)
						{
							// delete confirmation id from user record so user can login
							cmd = "" +
								"UPDATE users \n" +
								"	SET confirmation_id = null \n" +
								"WHERE confirmation_id = " + sqlUtils.quote(confirmationId);
							dbClient.query(cmd, function (err, result) {
								if (err)
									res.redirect('/html/error.html?err=' + err);
								else
									res.redirect('/html/login.html');
							});
						}
						else
							res.redirect('/html/error.html?err=invalidconfirmationid');
					}
				});
			}
		};
		return manager;
	}
};

module.exports = userManagement;