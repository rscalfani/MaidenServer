var express = require('express');
var http = require('http');
var pg = require('pg');
var sqlUtils = require('./sqlUtils');
var url = require('url');
var validation = require ('./validation');
var validator = validation.newValidator();

var client = new pg.Client('tcp://rscalfani:5432@localhost/maiden');

client.connect(function(err) {
	if (err)
	{
		console.log('Cannot connect to database:', err);
		process.exit(1);
	}

	var authenticator = require('./authentication').newAuthenticator(client);
	var userManager = require('./userManagement').newUserManager(validation, validator, authenticator, client);

	var server = express();
	server.use(express.bodyParser());

	server.get('/', function(req, res, next) {
		res.redirect('/html/logIn.html')
	});
	server.use('/', express.static(__dirname + '/../Maiden'));

	server.post('/login', userManager.login);
	server.post('/join', userManager.join);
	server.post('/emailCheck', userManager.emailCheck);

	console.log('running');
	http.createServer(server).listen(8080);

	server.get('/confirm', userManager.confirm);

	server.use(function(req, res) {
		res.redirect('/html/error.html');
		console.log('got here');
	});
});