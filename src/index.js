const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const http = require('http');
const Filter = require('bad-words');
const { generateMsg } = require('./utils/msg');
const { addUser, delUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3002;
const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

    io.on('connection', (socket) => {
        socket.on('join', ({ username, room }, cb) => {
            const { error, user } = addUser({ id: socket.id , username, room });
            if(error) {
                return cb(error);
            }

            socket.join(user.room);
        
            socket.emit('msg', generateMsg('Admin', 'Welcome'));
            socket.broadcast.to(user.room).emit('msg', generateMsg('Admin', `${user.username} joined the chat`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });

            cb();
        });

    socket.on('sendMsg', (msg, cb) => {
        const user = getUser(socket.id);
        const filter = new Filter();

        if(filter.isProfane(msg)) {
            return cb('bad language is not allowed');
        }

        io.to(user.room).emit('msg', generateMsg(user.username, msg));
        cb();
    });

    socket.on('shareLocation', (msg, cb) => {
        const user = getUser(socket.id);
        io.to(user.room).emit('locationMsg', generateMsg(user.username, `https://google.com/maps?q=${msg.latitude},${msg.longitude}`));
        cb();
    });


    socket.on('disconnect', () => {
        const user = delUser(socket.id);
        if(user) {
            io.to(user.room).emit('msg', generateMsg('Admin', `${user.username} left the room`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }

    })
});

server.listen(port, () => console.log('runnin on port ' + port));
