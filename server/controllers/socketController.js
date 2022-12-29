const { encryptObj, decryptObj } = require('../utility/utility');

const Room = require('./room');
const peers = Room.peers;
const rooms = Room.rooms;
const creators = Room.creators;
const roomsList = Room.roomsList;

module.exports = (io) => {
  io.on('connect', (socket) => {
    socket.on('init', (userInfo, roomId) => {
      const { sessionId, userId } = userInfo;
      socket.join(roomId);
      socket.sessionId = sessionId;
      peers[sessionId] = socket;
      console.log('[LOG] : JOIN => ', sessionId);

      // Participants
      if (creators[roomId] && creators[roomId].userId !== userId) {
        console.log('[LOG] : JOIN ROOM => ', roomId);
        const creatorIdArr = creators[roomId]?.sessionId || [];
        creatorIdArr.forEach((id) => peers[id].emit('requestJoin', userInfo));
        return;
      }

      // Hosts
      rooms[sessionId] = roomId;
      if (!creators[roomId]) {
        console.log('[LOG] : CREATE ROOM => ', roomId);
        creators[roomId] = { sessionId: [sessionId], userId: userId };
      }
      else if (creators[roomId].userId === userId) {
        console.log('[LOG] : ADD HOST');
        creators[roomId].sessionId.push(sessionId);

        /* broadcast to this room except self */
        socket.broadcast.to(roomId).emit('initReceive', userInfo);
      }
      const updatedStatus = encryptObj({ host: true, joined: true });
      socket.emit('host', updatedStatus);
    });


    socket.on('requestJoin', (userInfo, result, roomId) => {
      const { sessionId, name } = userInfo;

      if (!result) {
        userInfo && console.log('[LOG] : ', name + 'is rejected');
        peers[sessionId] && peers[sessionId].emit('rejectJoin');
        return;
      }

      rooms[sessionId] = roomId;
      for (const id in peers) {
        if (rooms[id] != rooms[sessionId]) continue;
        if (id === sessionId) continue;
        peers[id].emit('initReceive', userInfo);
      }
      const updatedStatus = encryptObj({ host: false, joined: true });
      peers[sessionId] && peers[sessionId].emit('approvedJoin', updatedStatus);
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

      console.log('[LOG] : RESTORE... ', roomId);
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
        }
        else if (creators[roomId].userId === userInfo.userId) {
          creators[roomId].sessionId.push(sessionId);
        }
      }
    });


    socket.on('disconnect', () => {
      console.log('[LOG] : SOCKET DISCONENCTED =>' + socket.sessionId);
      const sessionId = socket.sessionId;
      const targetRoom = rooms[sessionId];
      const targetCreators = creators[targetRoom]?.sessionId;

      socket.broadcast.to(targetRoom).emit('removePeer', sessionId);
      peers[sessionId] && (delete peers[sessionId]);
      socket[sessionId] && (delete socket[sessionId]);
      
      if (targetCreators?.includes(sessionId)) {
        console.log('[LOG] : HOST IS DISCONNECTED');
        creators[targetRoom].sessionId = targetCreators.filter((id) => id !== sessionId);
      }

      if (!io.sockets.adapter.rooms.get(rooms[sessionId])) {
        creators[targetRoom] && (delete creators[targetRoom]);
        roomsList[targetRoom] && (delete roomsList[targetRoom]);
      }
      rooms[sessionId] && delete rooms[sessionId];
    });
  });
};
