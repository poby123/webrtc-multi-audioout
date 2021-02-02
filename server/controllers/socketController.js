peers = {}; //peers[session id] = socket
rooms = {}; //rooms[session id] = roomId
creators = {}; //creators[roomId] = {sessionId: [host session id], userId:''};

module.exports = (io) => {
  io.on('connect', (socket) => {
    console.log('a client is connected : ', socket.id);

    socket.on('init', (userInfo, roomId) => {
      peers[userInfo.sessionId] = socket;
      socket.join(roomId);
      socket.sessionId = userInfo.sessionId;
      console.log('join sessionId : ', socket.sessionId);

      // Hosts
      if (!creators[roomId] || creators[roomId].userId == userInfo.userId) {
        rooms[userInfo.sessionId] = roomId;
        const sessionId = userInfo.sessionId;
        const userId = userInfo.userId;

        if (!creators[roomId]) {
          console.log('create room');
          creators[roomId] = { sessionId: [sessionId], userId: userId };
        } else if (creators[roomId].userId == userId) {
          console.log('add 방장');
          creators[roomId].sessionId.push(sessionId);

          for (let id in peers) {
            if (id === sessionId) continue;
            if (rooms[id] != rooms[sessionId]) continue;
            console.log('sending init receive to ' + socket.id);
            peers[id].emit('initReceive', userInfo);
          }
        }
        socket.emit('host');
      }
      // Participants
      else {
        if (creators[roomId]) {
          const creatorIds = creators[roomId].sessionId;
          creatorIds.forEach((id) => {
            console.log(id);
            peers[id].emit('requestJoin', userInfo);
          });
        }
      }
    });

    socket.on('requestJoin', (userInfo, result, roomId) => {
      const sessionId = userInfo.sessionId;
      if (result) {
        rooms[sessionId] = roomId;

        for (let id in peers) {
          if (id === sessionId) continue;
          if (rooms[id] != rooms[sessionId]) continue;
          console.log('sending init receive to ' + sessionId);
          peers[id].emit('initReceive', userInfo);
        }
      } else {
        userInfo && console.log(userInfo.name + 'is rejected');
        peers[sessionId] && peers[sessionId].emit('rejectJoin');
      }
    });

    socket.on('initSend', (id, userInfo) => {
      console.log('INIT SEND by ' + socket.id + ' for ' + id);
      peers[id] && peers[id].emit('initSend', userInfo);
    });

    socket.on('signal', (data, sessionId) => {
      if (!peers[data.sessionId]) return;
      // console.log('signaling sessionId : ', sessionId);
      peers[data.sessionId].emit('signal', {
        sessionId: sessionId,
        signal: data.signal,
      });
    });

    socket.on('restore', (userInfo, roomId) => {
      if (!userInfo || !userInfo.joined) {
        return;
      }
      console.log('restore...');
      const sessionId = userInfo.sessionId;
      socket.sessionId = sessionId;
      socket.join(roomId);
      peers[sessionId] = socket;
      rooms[sessionId] = roomId;

      if (userInfo.host) {
        console.log('restore Host of room : ', roomId);
        if (!creators[roomId]) {
          creators[roomId] = { sessionId: [sessionId], userId: userInfo.userId };
        } else if (creators[roomId].userId == userInfo.userId) {
          creators[roomId].sessionId.push(sessionId);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected ' + socket.sessionId);
      const sessionId = socket.sessionId;
      const targetRoom = rooms[sessionId];

      socket.broadcast.to(targetRoom).emit('removePeer', sessionId);
      delete peers[sessionId];
      delete socket[sessionId];

      if (creators[targetRoom] && creators[targetRoom].sessionId.includes(sessionId)) {
        console.log('방장 연결 끊김.');
        let target;
        creators[targetRoom].sessionId.forEach((element, i) => {
          if (element == sessionId) {
            target = i;
          }
        });
        creators[targetRoom].sessionId.splice(target, 1);
      }

      if (!io.sockets.adapter.rooms.get(rooms[sessionId])) {
        delete creators[targetRoom];
      }

      if (rooms[sessionId]) {
        delete rooms[sessionId];
      }
    });
  });
};
