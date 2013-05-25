var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(3000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/views/index.htm');
});

io.sockets.on('connection', function (socket) {

  socket.on('message:send', function(data){
  	socket.broadcast.emit('message:publish', data);
  })
});