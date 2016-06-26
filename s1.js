var express = require('express');
var app = express();
var server = require('http').createServer(app);  
var io = require('socket.io')(server);
class Room {
  constructor(id,arrX, arrO,turn,count) {
  	this.id = id;
  	this.arrX = arrX;
  	this.arrO = arrO;
    this.turn = turn;
    this.count = count;  }
}
var room1 = new Room('room1',[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],0,0);
var rooms = [room1];
var roomcount = 1;
var usernames = {};

app.use(express.static(__dirname + '/bower_components'));  
app.get('/', function(req, res,next) {  
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket) {  

    console.log('Client connected...');

   	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){

		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = room1;
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join(room1);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to(room1).emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, room1);
    });

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});

	socket.on('changeValue', function(id){
		var currentroom = socket.room;
		if(currentroom.turn == 0)
		{
			io.sockets.in(currentroom).emit('updategame', id, 'x');
			currentroom.count += 1;
	    	currentroom.arrX[id] = Math.pow(2,id);
			checkWin(currentroom.arrX,'X wins');
	    	checkDraw();
			currentroom.turn = 1;
		} else {
			io.sockets.in(currentroom).emit('updategame', id, 'o');
			currentroom.count += 1;
	    	currentroom.arrO[id] = Math.pow(2,id);
			checkWin(currentroom.arrO, 'O wins');
    		checkDraw();
			currentroom.turn = 0;
		}
	});

	function checkWin(arr,str)
	{
		var winCombinations = [7,56,448,73,146,292,273,84];
	    if((arr[0] + arr[1] + arr[2] == 7) || (arr[3] + arr[4] + arr[5] == 56) ||
	    (arr[6] + arr[7] + arr[8] == 448) || (arr[0] + arr[3] + arr[6] == 73) ||
	    (arr[1] + arr[4] + arr[7] == 146) || (arr[2] + arr[5] + arr[8] == 292) ||
	    (arr[0] + arr[4] + arr[8] == 273) || (arr[2] + arr[4] + arr[6] == 84))
	    {
	    	io.sockets.in(socket.room).emit('onWin', str);
	        newGame();
	    }
	}

	function checkDraw()
	{
		var str = "It's a tie!";
		if (socket.room.count == 9)
	    {
	    	io.sockets.in(socket.room).emit('onTie', str);
	        newGame();
	    }
	}

	socket.on('startover', function(){
		newGame();
	});

	function setAll(a, v) {
	    var i, n = a.length;
	    for (i = 0; i < n; ++i) {
	        a[i] = v;
	    }
	}
	function newGame()
	{
	    io.sockets.in(socket.room).emit('restartgame');
	    socket.room.turn = 0;
		setAll(socket.room.arrX,0);
	    setAll(socket.room.arrO,0);
	    socket.room.count = 0;
	}

});


server.listen(3000, function () {
  	console.log('Example app listening on port 3000!');
});
