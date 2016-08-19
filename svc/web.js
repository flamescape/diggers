var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var path = require('path');

server.listen(3001);

app.use(express.static(path.resolve(__dirname, '../public')));

module.exports = {
    io: io,
    app: app,
    server: server
};
