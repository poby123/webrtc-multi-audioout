const utility = require('../utility/utility');
const encryptObj = utility.encryptObj;
const decryptObj = utility.decryptObj;

let Room = require('./room');
peers = Room.peers;
rooms = Room.rooms;
creators = Room.creators;
roomsList = Room.roomsList;

module.exports = (io) => {
  io.on('connect', (socket) => {
    socket.on('init', (userInfo, roomId) => {
      peers[userInfo.sessionId] = socket;
      socket.join(roomId);
      socket.sessionId = userInfo.sessionId;
      console.log('[LOG] : JOIN => ', socket.sessionId);

      // Hosts
      if (!creators[roomId] || creators[roomId].userId == userInfo.userId) {
        rooms[userInfo.sessionId] = roomId;
        const sessionId = userInfo.sessionId;
        const userId = userInfo.userId;

        if (!creators[roomId]) {
          console.log('[LOG] : CREATE ROOM => ', roomId);
          creators[roomId] = { sessionId: [sessionId], userId: userId };
        } else if (creators[roomId].userId == userId) {
          console.log('[LOG] : ADD HOST');
          creators[roomId].sessionId.push(sessionId);

          for (let id in peers) {
            if (id === sessionId) continue;
            if (rooms[id] != rooms[sessionId]) continue;
            peers[id].emit('initReceive', userInfo);
          }
        }

        const updatedStatus = encryptObj({ host: true, joined: true });
        socket.emit('host', updatedStatus);
      }
      // Participants
      else {
        if (creators[roomId]) {
          const creatorIds = creators[roomId].sessionId;
          creatorIds.forEach((id) => {
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
          peers[id].emit('initReceive', userInfo);
        }

        const updatedStatus = encryptObj({ host: false, joined: true });
        peers[sessionId] && peers[sessionId].emit('approvedJoin', updatedStatus);
      } else {
        userInfo && console.log('[LOG] : ', userInfo.name + 'is rejected');
        peers[sessionId] && peers[sessionId].emit('rejectJoin');
      }
    });

    socket.on('initSend', (id, userInfo) => {
      peers[id] && peers[id].emit('initSend', userInfo);
    });

    socket.on('signal', (data, sessionId) => {
      if (!peers[data.sessionId]) return;
      peers[data.sessionId].emit('signal', {
        sessionId: sessionId,
        signal: data.signal,
      });
    });

    socket.on('restore', (userInfo, roomId) => {
      const userStatus = decryptObj(userInfo.status);

      if (!userInfo || !userStatus.joined) {
        return;
      }

      console.log('[LOG] : RESTORE...');
      const sessionId = userInfo.sessionId;
      socket.sessionId = sessionId;
      socket.join(roomId);
      peers[sessionId] = socket;
      rooms[sessionId] = roomId;
      roomsList[roomId] = true;

      if (userStatus.host) {
        console.log('[LOG] : RESTORE HOST OF : ', roomId);
        if (!creators[roomId]) {
          creators[roomId] = { sessionId: [sessionId], userId: userInfo.userId };
        } else if (creators[roomId].userId == userInfo.userId) {
          creators[roomId].sessionId.push(sessionId);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('[LOG] : SOCKET DISCONENCTED =>' + socket.sessionId);
      const sessionId = socket.sessionId;
      const targetRoom = rooms[sessionId];

      socket.broadcast.to(targetRoom).emit('removePeer', sessionId);
      delete peers[sessionId];
      delete socket[sessionId];

      if (creators[targetRoom] && creators[targetRoom].sessionId.includes(sessionId)) {
        console.log('[LOG] : HOST IS DISCONNECTED');
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
        delete roomsList[targetRoom];
      }

      if (rooms[sessionId]) {
        delete rooms[sessionId];
      }
    });
  });
};
