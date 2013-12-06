/*
    nodejs backend for webserver
*/

var S = require('./static/js/settings');
var http = require('http');

var express = require('express');
var hbs = require('hbs');
var url = require('url');

var app = express();

app.set('view engine','html');
app.engine('html', hbs.__express);

app.configure(function(){
  app.use('/static', express.static(__dirname + '/static'));
  app.use(express.static(__dirname + '/static'));
});


app.get('/', function(request, response){
    response.render('../index');
});


console.log('Server running at '+S.host+':'+S.port);

app.listen(S.port);