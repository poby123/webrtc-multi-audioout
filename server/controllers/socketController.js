require('dotenv').config();
const { encryptObj, decryptObj } = require('../utility/utility');
const { translateText } = require('../utility/googleTrans');

const Room = require('./room');
const PREFIX_ROOMS = require('../constants/prefixRoom');
const PREFIX_ROOMS_PASSWORD = process.env.PREFIX_ROOMS_PASSWORD;

if (!PREFIX_ROOMS_PASSWORD) {
  throw new Error('PREFIX_ROOMS_PASSWORD가 지정되지 않았습니다.');
}

const peers = Room.peers; // peers: {[sessionId]: socket}
const rooms = Room.rooms; // rooms: {[sessionId]: roomId}
const creators = Room.creators; // creator: {[roomId]: {sessionId: [], userId: ''}}
const roomsList = Room.roomsList;
const peerInfos = Room.peerInfo;

module.exports = (io) => {
  io.on('connect', (socket) => {
    /**
     * Init
     */
    socket.on('init', (userInfo, roomId) => {
      const { sessionId, userId, roomPassword } = userInfo;
      socket.join(roomId);
      socket.sessionId = sessionId;
      peers[sessionId] = socket;
      peerInfos[sessionId] = userInfo;
      console.log('[LOG] : JOIN => ', sessionId);
      const isPrefixRoom = PREFIX_ROOMS[roomId];

      // check password of prefix room
      if (isPrefixRoom) {
        if (roomPassword !== PREFIX_ROOMS_PASSWORD) {
          socket.emit('invalidPassword');
          return;
        }
        socket.emit('prefixRoomApproved');
        return;
      }

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
      } else {
        console.log('[LOG] : ADD HOST');
        creators[roomId].sessionId.push(sessionId);

        // broadcast to this room except self
        for (const id in peers) {
          if (rooms[id] != rooms[sessionId]) continue;
          if (id === sessionId) continue;
          peers[id].emit('initReceive', userInfo);
        }
      }
      const updatedStatus = encryptObj({ host: true, joined: true });
      socket.emit('host', updatedStatus);
    });

    /**
     * Init prefix room
     */
    socket.on('initPrefixRoom', (userInfo, roomId) => {
      const { sessionId, userId, roomPassword } = userInfo;

      if (roomPassword !== PREFIX_ROOMS_PASSWORD) {
        console.log('invalid password');
        socket.emit('invalidPassword');
        return;
      }

      rooms[sessionId] = roomId;
      if (!creators[roomId]) {
        console.log('[LOG] : CREATE ROOM => ', roomId);
        creators[roomId] = { sessionId: [sessionId], userId: userId };
      } else {
        console.log('[LOG] : ADD HOST');
        creators[roomId].sessionId.push(sessionId);

        //broadcast to this room except self
        for (const id in peers) {
          if (rooms[id] != rooms[sessionId]) continue;
          if (id === sessionId) continue;
          peers[id].emit('initReceive', userInfo);
        }
      }
      const updatedStatus = encryptObj({ host: true, joined: true });
      socket.emit('host', updatedStatus);
    });

    /**
     * Request join
     */
    socket.on('requestJoin', (userInfo, result, roomId) => {
      if (!userInfo) {
        return;
      }
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

    /**
     * Chat
     */
    socket.on('chat', async (fromUserInfo, message) => {
      if (!fromUserInfo) {
        return;
      }

      const { sessionId, lang } = fromUserInfo;

      if (!sessionId || !peers[sessionId]) {
        return;
      }

      for (const id in peers) {
        if (rooms[id] != rooms[sessionId]) continue;
        if (id === sessionId) continue;

        const { lang: targetLang } = peerInfos[id];
        let text = '';
        try {
          console.log('translate: ', message, ' to ', targetLang);
          text = await translateText(message, targetLang);
        } catch (e) {
          console.error(e);
        }
        peers[id].emit('chat', fromUserInfo, { translated: text, original: message });
      }
    });

    /**
     * Init send
     */
    socket.on('initSend', (id, userInfo) => {
      peers[id] && peers[id].emit('initSend', userInfo);
    });

    /**
     * Signal
     */
    socket.on('signal', (data, sessionId) => {
      if (!peers[data.sessionId]) return;
      peers[data.sessionId].emit('signal', {
        sessionId: sessionId,
        signal: data.signal,
      });
    });

    /**
     * Restore
     */
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
      peerInfos[sessionId] = userInfo;
      roomsList[roomId] = true;

      // in case prefix room
      const isPrefixRoom = PREFIX_ROOMS[roomId];
      if (isPrefixRoom) {
        if (!creators[roomId]) {
          creators[roomId] = { sessionId: [sessionId], userId: userInfo.userId };
        } else {
          creators[roomId].sessionId.push(sessionId);
        }
        return;
      }

      // not prefix room
      if (userStatus.host) {
        console.log('[LOG] : RESTORE HOST OF : ', roomId);
        if (!creators[roomId]) {
          creators[roomId] = { sessionId: [sessionId], userId: userInfo.userId };
        } else if (creators[roomId].userId === userInfo.userId) {
          creators[roomId].sessionId.push(sessionId);
        }
      }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
      console.log('[LOG] : SOCKET DISCONENCTED =>' + socket.sessionId);
      const sessionId = socket.sessionId;
      const targetRoom = rooms[sessionId];
      const targetCreators = creators[targetRoom]?.sessionId;

      socket.broadcast.to(targetRoom).emit('removePeer', sessionId);
      peers[sessionId] && delete peers[sessionId];
      socket[sessionId] && delete socket[sessionId];

      if (targetCreators?.includes(sessionId)) {
        console.log('[LOG] : HOST IS DISCONNECTED');
        creators[targetRoom].sessionId = targetCreators.filter((id) => id !== sessionId);
        if (creators[targetRoom].sessionId.length <= 0) {
          socket.broadcast.to(targetRoom).emit('allHostDisconnected');
        }
      }

      if (!io.sockets.adapter.rooms.get(rooms[sessionId])) {
        creators[targetRoom] && delete creators[targetRoom];
        roomsList[targetRoom] && delete roomsList[targetRoom];
        peerInfos[sessionId] && delete peerInfos[sessionId];
      }
      rooms[sessionId] && delete rooms[sessionId];
    });
  });
};
