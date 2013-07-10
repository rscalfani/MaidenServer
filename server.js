var express = require('express');
var http = require('http');
var pg = require('pg');
var url = require('url');
var validation = require('./validation');
var validator = validation.newValidator();

var dbClient = new pg.Client('tcp://rscalfani:5432@localhost/maiden');

dbClient.connect(function(err) {
	if (err)
	{
		console.log('Cannot connect to database:', err);
		process.exit(1);
	}

	var authenticator = require('./authentication').newAuthenticator(dbClient);
	var userManager = require('./userManagement').newUserManager(validation, validator, authenticator, dbClient);

	var server = express();
	server.use(express.bodyParser());

	server.get('/', function(req, res, next) {
		res.redirect('/html/login.html')
	});
	server.use('/', express.static(__dirname + '/../Maiden'));

	server.post('/login', userManager.login);
	server.post('/join', userManager.join);
	server.post('/emailCheck', userManager.emailCheck);
	server.get('/confirm', userManager.confirm);

	var port = 8080;
	console.log('Server listening on port:', port);
	http.createServer(server).listen(port);

	// default 404 error page
	server.use(function(req, res) {
		res.redirect('/html/error.html');
	});
});