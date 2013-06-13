var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , names = {}

  , number = 1 //TODO: this might be dumb...

  //global functions
  , setName = function(data, socket){
  		names[socket.id] = data;
  }

  , getName = function(socket){
  		return names[socket.id];
  }

  , setDefaultName = function(socket){
  		var name = 'User ' + number;
  		
  		number++;

  		setName(name, socket);
  }

  , setNick = function(data, socket){
  		var oldName = getName(socket);

  		setName(data.data, socket);
		socket.broadcast.emit('admin:announce', {
			msg: oldName + ' is now known to the world as: ' + getName(socket)
		});
  }

  , dance = function(socket){
  		//TODO: randomize som gifs and messages
  		//	to send out for fun

  		//send it to everyone
  		socket.broadcast.emit('message:publish', {
  			content: 'Break it down! <br><img src="/public/images/community.gif"/>'
  			, name: getName(socket)
  		});

  		//send it to the sender!
  		socket.emit('message:publish', {
  			content: 'Break it down! <br><img src="/public/images/community.gif"/>'
  			, name: getName(socket)
  		});
  }

  , debug = function(data, socket){
  		socket.broadcast.emit('debug:log', data);
  };

server.listen(3000);

//APP.use Express setup and stuff
app.use(express.compress());
app.use('/public', express.static(__dirname + '/public'));
app.use('/', function (req, res) {
  res.sendfile(__dirname + '/views/index.htm');
});


io.sockets.on('connection', function (socket) {
	//TODO: on new connection populate what is there
	setDefaultName(socket);

	socket.on('command:send', function(data){
		var command = data.command.trim();

		switch(command) {
			case '/dance':
				dance(socket);
				break;
			case '/nick':
				setNick(data, socket);
				break;
		}
	});

	socket.on('message:send', function(dataIn){
		//TODO: Persist this somewhere...
		var data = dataIn;

		//get the senders name
		data.name = getName(socket);

		//parse out the hash tags and make them links
		data.content = data.content.replace(/#([^ ]*)/g, '<a href="#$1" class="hashtag">#$1</a>');

		socket.broadcast.emit('message:publish', data);
	});
});