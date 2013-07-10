var crypto = require('crypto');
var sqlUtils = require('./sqlUtils');

var authentication = {
	newAuthenticator: function(dbClient) {
		var authenticator = {
			authenticate: function(email, password, cb) {
				var cmd = "" +
					"SELECT * \n" +
					"FROM users \n" +
					"WHERE email = " + sqlUtils.quote(email) + "\n" +
					"   AND password = " + sqlUtils.quote(password) + "\n" +
					"	AND confirmation_id IS NULL";
				console.log(cmd);
				dbClient.query(cmd, function(err, result) {
					if (err)
						cb(false);
					else
					{
						if (result.rows.length == 0)
							cb(false);
						else
							cb(true);
					}
				});
			},
			passwordHash: function(userId, password, cb) {
				var iteration = parseInt(userId.substring(userId.length - 4), 16);
				crypto.pbkdf2(password, userId, iteration + 10000, 64, function(err, derivedKey) {
					if (err)
						cb(err);
					else
						cb(err, derivedKey.toString('hex'));
				});
			}
		};
		return authenticator;
	}
};

module.exports = authentication;