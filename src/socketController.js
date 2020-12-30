peers = {};

module.exports = (io) => {
  io.on('connect', (socket) => {
    console.log('a client is connected : ', socket.id);
    // Initiate the connection process as soon as the client connects
    peers[socket.id] = socket;

    socket.on('new-user', (username) => {
    //   console.log('server new-user : ', username);
    
      // Asking all other clients to setup the peer connection receiver
      for (let id in peers) {
        if (id === socket.id) continue;
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
    });
  });
};
