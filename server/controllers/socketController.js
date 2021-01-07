
/*
Uncaught DOMException: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': 
Failed to set remote answer sdp: Called in wrong state: kHaveRemoteOffer

Cannot signal after peer is destroyed

Uncaught DOMException: Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': 
Failed to set remote answer sdp: Called in wrong state: kStable

simplepeer.min.js:6 Uncaught Error: Connection failed.
    at p._onConnectionStateChange (simplepeer.min.js:6)
    at RTCPeerConnection._pc.onconnectionstatechange (simplepeer.min.js:6)
*/

peers = {};
rooms = {};
//peers -> roomId -> socket_id 
module.exports = (io) => {
  io.on('connect', (socket) => {
    console.log('a client is connected : ', socket.id);
    // Initiate the connection process as soon as the client connects
    
    socket.on('new-user', (username, roomId) => {
      peers[socket.id] = socket;
      rooms[socket.id] = roomId;
      socket.join(roomId);
    
      // Asking all other clients in same room to setup the peer connection receiver
      for (let id in peers) {
        if (id === socket.id) continue;
        if(rooms[socket.id] != rooms[id]) continue;
        console.log('sending init receive to ' + socket.id);
        peers[id].emit('initReceive', socket.id, username);
      }
    });

    /**
     * Send message to client to initiate a connection
     * The sender has already setup a peer connection receiver
     */
    socket.on('initSend', (init_socket_id, username) => {
      console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id);
      peers[init_socket_id].emit('initSend', socket.id, username);
    });

    /**
     * relay a peerconnection signal to a specific socket
     */
    socket.on('signal', (data) => {
      // console.log('sending signal from ' + socket.id + ' to ', data)
      if (!peers[data.socket_id]) return;
      peers[data.socket_id].emit('signal', {
        socket_id: socket.id,
        signal: data.signal,
      });
    });

    /**
     * remove the disconnected peer connection from all other connected clients
     */
    socket.on('disconnect', () => {
      console.log('socket disconnected ' + socket.id);

      socket.broadcast.emit('removePeer', socket.id);
      delete peers[socket.id];
      delete peers[socket.id];
    });
  });
};