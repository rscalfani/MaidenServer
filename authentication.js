var sqlUtils = require('./sqlUtils');

var authentication = {
	newAuthenticator: function(client) {
		var authenticator = {
			authenticate: function(email, password, cb) {
				var cmd = "" +
					"SELECT * \n" +
					"FROM users \n" +
					"WHERE email = " + sqlUtils.quote(email) + "\n" +
					"   AND password = " + sqlUtils.quote(password) + "\n" +
					"	AND confirmation_id IS NULL";
				console.log(cmd);
				client.query(cmd, function(err, result) {
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
			}
		};
		return authenticator;
	}
};

module.exports = authentication;