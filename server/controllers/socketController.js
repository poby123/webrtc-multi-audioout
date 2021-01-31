peers = {}; //peers[socket.id] = socket
rooms = {}; //rooms[socket.id] = roomId
creators = {}; // creator[roomId] = { socket_id : [socket.id], userInfo : userInfo}

module.exports = (io) => {
  io.on('connect', (socket) => {
    console.log('a client is connected : ', socket.id);
    peers[socket.id] = socket;

    socket.on('init', (userInfo, roomId) => {
      socket.join(roomId);

      if (!creators[roomId]) {
        console.log('create 방장');
        creators[roomId] = { socket_id: [socket.id], userInfo: userInfo };
        rooms[socket.id] = roomId;
      } else if (creators[roomId] && creators[roomId].userInfo.id == userInfo.id) {
        console.log('add 방장');
        creators[roomId].socket_id.push(socket.id);
        rooms[socket.id] = roomId;

        for (let id in peers) {
          if (id === socket.id) continue;
          if (rooms[id] != rooms[socket.id]) continue;
          console.log('sending init receive to ' + socket.id);
          peers[id].emit('initReceive', socket.id, userInfo);
        }
      } else {
        console.log('request to 방장');
        if (creators[roomId] && creators[roomId].socket_id) {
          const creator_sockets = creators[roomId].socket_id;
          const len = creator_sockets.length;
          console.log('request to 방장 : ', creator_sockets[len - 1]);

          creator_sockets.forEach((element) => {
            console.log(element);
            peers[element].emit('requestJoin', userInfo, socket.id);
          });
        }
      }
    });

    socket.on('requestJoin', (userInfo, result, otherId, roomId) => {
      if (!otherId) {
        return;
      }
      if (result) {
        rooms[otherId] = roomId;

        for (let id in peers) {
          if (id === otherId) continue;
          if (rooms[id] != rooms[otherId]) continue;
          console.log('sending init receive to ' + otherId);
          peers[id].emit('initReceive', otherId, userInfo);
        }
      } else {
        userInfo && console.log(userInfo.name + 'is rejected');
        peers[otherId] && peers[otherId].emit('rejectJoin');
      }
    });

    socket.on('initSend', (init_socket_id, userInfo) => {
      console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id);
      peers[init_socket_id].emit('initSend', socket.id, userInfo);
    });

    socket.on('signal', (data) => {
      // console.log('sending signal from ' + socket.id + ' to ', data)
      if (!peers[data.socket_id]) return;
      peers[data.socket_id].emit('signal', {
        socket_id: socket.id,
        signal: data.signal,
      });
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected ' + socket.id);

      socket.broadcast.to(rooms[socket.id]).emit('removePeer', socket.id);
      delete peers[socket.id];

      const targetRoom = rooms[socket.id];
      if (creators[targetRoom] && creators[targetRoom].socket_id.includes(socket.id)) {
        console.log('방장 연결 끊김.');
        let target;
        creators[targetRoom].socket_id.forEach((element, i) => {
          if (element == socket.id) {
            target = i;
          }
        });
        creators[targetRoom].socket_id.splice(target, 1);
      }

      if (!io.sockets.adapter.rooms.get(rooms[socket.id])) {
        delete creators[rooms[socket.id]];
      }

      if (rooms[socket.id]) {
        delete rooms[socket.id];
      }
    });
  });
};
