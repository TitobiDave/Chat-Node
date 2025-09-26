const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', function(req, res) {
    res.render('index.ejs');
});
io.sockets.on('connection', function(socket) {
    socket.on('username', function(username) {
        socket.username = username;
        io.emit('is_online', '🔵 <i>' + socket.username + ' join the chat..</i>');
    });

    socket.on('disconnect', function(username) {
        io.emit('is_online', '🔴 <i>' + socket.username + ' left the chat..</i>');
    })
    socket.on('prevName', function(username) {
        socket.prevName = username;
    });

    socket.on('chat_message', function(data) {
    io.emit('chat_message', {
        username: socket.username,
        message: data.message,
        prevName: data.prevName 
    });

});


});

const server = http.listen(7000, function() {
    console.log('listening on *:7000');
});

