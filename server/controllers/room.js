/*
  peers[id] = socket
  rooms[id] = roomId
  peerInfo[id] = userInfo;
  creators[roomId] = { sessionId: [id1, id2], userId: userId }
  roomsList[roomId] = true
*/

module.exports = {
  peers: {},
  rooms: {},
  creators: {},
  roomsList: {},
  peerInfo: {},
};
