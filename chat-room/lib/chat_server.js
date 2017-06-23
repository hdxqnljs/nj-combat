const socketio = require('socket.io');
const nickNames = {};
const currentRoom = {};

let io;
let guestNumber = 1;
let namesUsed = [];

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  const name = `Guest${guestNumber}`;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  });
  namesUsed.push(name);
  return guestNumber + 1;
}

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room: room });
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]} has joined ${room}.`
  });
  const usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length <= 1) return;
    let usersInRoomSummary = `Users currently in ${room}: `;
    for (let index in usersInRoom) {
      let userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        usersInRoomSummary += index > 0 ? `, ${nickNames[userSocketId]}` : nickNames[userSocketId];
      }
    }
    usersInRoomSummary += '.';
    socket.emit('message', { text: usersInRoomSummary });
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', name => {
    if (name.indexOf('Guest') == 0 || namesUsed.indexOf(name) != -1) {
      const message = name.indexOf('Guest') == 0 ? 'Names cannot begin with \"Guest\".' : 'That name is already in use.';
      socket.emit('nameResult', {
        success: false,
        message: message
      });
    } else {
      const previousName = nickNames[socket.id];
      const previousNameIndex = namesUsed.indexOf(previousName);
      namesUsed.push(name);
      nickNames[socket.id] = name;
      namesUsed.splice(previousNameIndex, 1);
      socket.emit('nameResult', {
        success: true,
        name: name
      });
      socket.broadcast.to(currentRoom[socket.id]).emit('message', {
        text: `${previousName} is now known as ${name}.` 
      });
    } 
  });
}

function handleMessageBroadcasting(socket) {
  socket.on('message', message => {
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text}`
    });
  });
}

function handleRoomJoining(socket) {
  socket.on('join', room => {
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket) {
  socket.on('disconnect', () => {
    const nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete nickNames[socket.id];
    namesUsed.splice(nameIndex, 1);
  });
}

exports.listen = function(server) {
  io = socketio.listen(server);
  io.set('log level', 1);
  io.sockets.on('connection', socket => {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'lobby');
    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);
  
    socket.on('rooms', () => {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};