var _ = require('underscore');
var nodemailer = require('nodemailer');

var emailer = {
	newEmailer: function(config, options) {
		options = options || {};
		options = _.defaults(options, {
			protocol: 'SMTP'
		});
		var private = {
			transport: nodemailer.createTransport(options.protocol, config)
		};
		var emailerInstance = {
			send: function(options, cb) {
				private.transport.sendMail(options, cb);
			}
		};
		return emailerInstance;
	}
};

module.exports = emailer;
