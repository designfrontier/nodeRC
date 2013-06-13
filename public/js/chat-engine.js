$(function(){
	var chatBox = $('#main-chat')
		, chatView = $('#main-chat-list')
		, socket = io.connect(location.hostname)
		, sendMsg = function(){
			var msg = chatBox.val()
				, command = false
				, issuedCommand = ''
				, msgObj;

			if(msg[0] === '/'){
				command = true;
				issuedCommand = msg.match(/(^[^ ]*)/)[0].toLowerCase();
				console.log(issuedCommand);
			}

			if(command){
				console.log(issuedCommand);

				socket.emit('command:send', {
					command: issuedCommand
					, data: msg.replace(msg.match(/(^[^ ]*)/g)[0], '')
				});
			}else{
				msgObj = {
					content: msg
					, msgId: Math.ceil(Math.random() * 1000)
				};

				//send the message to the server
				socket.emit('message:send', msgObj);
				printMessage(msgObj);

				// msg = msg.replace(/#([^ ]*)/, '<a href="#$1" class="hashtag">#$1</a>');


				// //write it to this browsers window
				// chatView.append('<li>' + msg + '</li>');
			}

			//clear the text box
			chatBox.val('');
		}

		, filters = {}

		, openFilter = function(event){
			var newFilter = $.trim($(event.target).attr('href'));

			if(typeof filters[newFilter] === 'undefined'){
				filters[newFilter] = addNewFilterDOM(newFilter);
			}

			return false;
		}

		, addNewFilterDOM = function(filter){
			var filterDom = $('<div class="filter left" data-attr="' + filter + '">' + filter + '</div>');

			$('#weir').append(filterDom);

			return filterDom;
		}

		, printMessage = function(data){
			var key
				, regex;

			if(typeof data.name === 'undefined'){
				//this is a local message
				data.name = '';
				data.content = data.content.replace(/#([^ ]*)/g, '<a href="#$1" class="hashtag">#$1</a>');

			}

			$('#main-chat-list').append('<li><span class="italic">' + data.name + '</span>' + data.content + '</li>');
			
			for(key in filters){
				if(data.content.match(key)){
					$(filters[key]).append('<li><span class="italic">' + data.name + '</span>' + data.content + '</li>');
				}
			}
		};

	chatBox.on('keyup', function(event){
		if(event.keyCode === 13){
			//enter key. Send stuff
			sendMsg();
		}
	});

	$('#send').on('click', sendMsg);
	$('body').on('click', '.hashtag', openFilter);

	socket.on('message:publish', printMessage);

	socket.on('admin:announce', function(data){
		$('#main-chat-list').append('<li class="announcement italic">' + data.msg + '</li>');
	});

	socket.on('debug:log', function(data){
		console.log(data);
	});
});