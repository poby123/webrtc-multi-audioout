require('dotenv').config();
const { encryptObj, decryptObj } = require('../utility/utility');
const { translateText } = require('../utility/googleTrans');

const Room = require('./room');
const PREFIX_ROOMS = require('../constants/prefixRoom');
const { errorHandler } = require('./errorHanlder');
const PREFIX_ROOMS_PASSWORD = process.env.PREFIX_ROOMS_PASSWORD;

if (!PREFIX_ROOMS_PASSWORD) {
  throw new Error('PREFIX_ROOMS_PASSWORD가 지정되지 않았습니다.');
}

const peers = Room.peers; // peers: {[sessionId]: socket}
const rooms = Room.rooms; // rooms: {[sessionId]: roomId}
const creators = Room.creators; // creator: {[roomId]: {sessionId: [], userId: ''}}
const roomsList = Room.roomsList;
const peerInfos = Room.peerInfo;

const EVENT_KEYS = {
  INIT: 'init',
  CHANGE_LANG: 'changeLang',
  INIT_PREFIX_ROOM: 'initPrefixRoom',
  INVALID_PASSWORD: 'invalidPassword',
  PREFIX_ROOM_APPROVED: 'prefixRoomApproved',

  REJECT_JOIN: 'rejectJoin',
  APPROVED_JOIN: 'approvedJoin',

  REQUEST_JOIN: 'requestJoin',
  CHAT: 'chat',
  INIT_SEND: 'initSend',
  INIT_RECEIVE: 'initReceive',
  SIGNAL: 'signal',
  HOST: 'host',

  RESTORE: 'restore',
  DISCONNECT: 'disconnect',
};

module.exports = (io) => {
  io.on('connect', (socket) => {
    socket.on(EVENT_KEYS.INIT, (userInfo, roomId) => {
      try {
        const { sessionId, userId, roomPassword } = userInfo;
        socket.join(roomId);
        socket.sessionId = sessionId;
        peers[sessionId] = socket;
        peerInfos[sessionId] = userInfo;
        console.log(new Date().toJSON(), ' [LOG] : JOIN => ', sessionId);
        const isPrefixRoom = PREFIX_ROOMS[roomId];

        // check password of prefix room
        if (isPrefixRoom) {
          if (roomPassword !== PREFIX_ROOMS_PASSWORD) {
            socket.emit(EVENT_KEYS.INVALID_PASSWORD);
            return;
          }
          socket.emit(EVENT_KEYS.PREFIX_ROOM_APPROVED);
          return;
        }

        // Participants
        if (creators[roomId] && creators[roomId].userId !== userId) {
          console.log(new Date().toJSON(), ' [LOG] : JOIN ROOM => ', roomId);
          const creatorIdArr = creators[roomId]?.sessionId || [];
          creatorIdArr.forEach((id) => peers[id].emit(EVENT_KEYS.REQUEST_JOIN, userInfo));
          return;
        }

        // Hosts
        rooms[sessionId] = roomId;
        if (!creators[roomId]) {
          console.log(new Date().toJSON(), ' [LOG] : CREATE ROOM => ', roomId);
          creators[roomId] = { sessionId: [sessionId], userId: userId };
        } else {
          console.log(new Date().toJSON(), ' [LOG] : ADD HOST');
          creators[roomId].sessionId.push(sessionId);

          // broadcast to this room except self
          for (const id in peers) {
            if (rooms[id] != rooms[sessionId]) continue;
            if (id === sessionId) continue;
            peers[id].emit(EVENT_KEYS.INIT_RECEIVE, userInfo);
          }
        }
        const updatedStatus = encryptObj({ host: true, joined: true });
        socket.emit(EVENT_KEYS.HOST, updatedStatus);
      } catch (error) {
        errorHandler(error, `init`, userInfo, roomId);
      }
    });

    socket.on(EVENT_KEYS.CHANGE_LANG, (userInfo, lang) => {
      try {
        const { sessionId } = userInfo;
        peerInfos[sessionId] = { ...peerInfos[sessionId], lang };
        console.log('changed info: ', peerInfos[sessionId]);
      } catch (error) {
        errorHandler(error, EVENT_KEYS.CHANGE_LANG, userInfo, lang);
      }
    });

    socket.on(EVENT_KEYS.INIT_PREFIX_ROOM, (userInfo, roomId) => {
      try {
        const { sessionId, userId, roomPassword } = userInfo;

        if (roomPassword !== PREFIX_ROOMS_PASSWORD) {
          console.log('invalid password');
          socket.emit('invalidPassword');
          return;
        }

        rooms[sessionId] = roomId;
        if (!creators[roomId]) {
          console.log(new Date().toJSON(), ' [LOG] : CREATE ROOM => ', roomId);
          creators[roomId] = { sessionId: [sessionId], userId: userId };
        } else {
          console.log(new Date().toJSON(), ' [LOG] : ADD HOST');
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
      } catch (error) {
        errorHandler(error, 'init prefix room', userInfo, roomId);
      }
    });

    socket.on(EVENT_KEYS.REQUEST_JOIN, (userInfo, result, roomId) => {
      try {
        if (!userInfo) {
          return;
        }
        const { sessionId, name } = userInfo;

        if (!result) {
          userInfo && console.log(new Date().toJSON(), ' [LOG] : ', name + 'is rejected');
          peers[sessionId] && peers[sessionId].emit(EVENT_KEYS.REJECT_JOIN);
          return;
        }

        rooms[sessionId] = roomId;
        for (const id in peers) {
          if (rooms[id] != rooms[sessionId]) continue;
          if (id === sessionId) continue;
          peers[id].emit(EVENT_KEYS.INIT_RECEIVE, userInfo);
        }
        const updatedStatus = encryptObj({ host: false, joined: true });
        peers[sessionId] && peers[sessionId].emit(EVENT_KEYS.APPROVED_JOIN, updatedStatus);
      } catch (error) {
        errorHandler(error, 'request join', userInfo, result, roomId);
      }
    });

    socket.on(EVENT_KEYS.CHAT, async (fromUserInfo, message) => {
      try {
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
          peers[id].emit(EVENT_KEYS.CHAT, fromUserInfo, { translated: text, original: message });
        }
      } catch (error) {
        errorHandler(error, EVENT_KEYS.CHAT, fromUserInfo, message);
      }
    });

    socket.on(EVENT_KEYS.INIT_SEND, (id, userInfo) => {
      try {
        peers[id] && peers[id].emit(EVENT_KEYS.INIT_SEND, userInfo);
      } catch (error) {
        errorHandler(error, EVENT_KEYS.INIT_SEND, id, userInfo);
      }
    });

    socket.on(EVENT_KEYS.SIGNAL, (data, sessionId) => {
      try {
        if (!peers[data.sessionId]) return;
        peers[data.sessionId].emit(EVENT_KEYS.SIGNAL, {
          sessionId: sessionId,
          signal: data.signal,
        });
      } catch (error) {
        errorHandler(error, EVENT_KEYS.SIGNAL, sessionId);
      }
    });

    socket.on(EVENT_KEYS.RESTORE, (userInfo, roomId) => {
      try {
        const userStatus = decryptObj(userInfo.status);

        if (!userInfo || !userStatus.joined) {
          return;
        }

        console.log(new Date().toJSON(), ' [LOG] : RESTORE... ', roomId);
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
          console.log(new Date().toJSON(), ' [LOG] : RESTORE HOST OF : ', roomId);
          if (!creators[roomId]) {
            creators[roomId] = { sessionId: [sessionId], userId: userInfo.userId };
          } else if (creators[roomId].userId === userInfo.userId) {
            creators[roomId].sessionId.push(sessionId);
          }
        }
      } catch (error) {
        errorHandler(error, EVENT_KEYS.RESTORE, userInfo, roomId);
      }
    });

    socket.on(EVENT_KEYS.DISCONNECT, (reason, details) => {
      try {
        console.warn(new Date().toJSON(), ' disconnected');
        console.warn(new Date().toJSON(), ' reason: ', reason);
        console.warn(new Date().toJSON(), ' details: ', details);
        console.log(new Date().toJSON(), ' [LOG] : SOCKET DISCONENCTED =>' + socket.sessionId);
        const sessionId = socket.sessionId;
        const targetRoom = rooms[sessionId];
        const targetCreators = creators[targetRoom]?.sessionId;

        socket.broadcast.to(targetRoom).emit('removePeer', sessionId);
        peers[sessionId] && delete peers[sessionId];
        socket[sessionId] && delete socket[sessionId];

        if (targetCreators?.includes(sessionId)) {
          console.log(new Date().toJSON(), ' [LOG] : HOST IS DISCONNECTED');
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
      } catch (error) {
        errorHandler(error, 'disconnect');
      }
    });
  });
};
