/**
 * Socket.io socket
 */
let socket;
/**
 * The stream object used to send media
 */
let localStream = null;
/**
 * All peer connections
 */
let peers = {};
let socket_sound_config = {};

// redirect if not https
if (location.href.substr(0, 5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4);

//////////// CONFIGURATION //////////////////

/**
 * RTCPeerConnection configuration
 */
const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    // public turn server from https://gist.github.com/sagivo/3a4b2f2c7ac6e1b5267c2f1f59ac6c6b
    // set your own servers here
    {
      url: 'turn:192.158.29.39:3478?transport=udp',
      credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      username: '28224511:1379330808',
    },
  ],
};

/////////////////////////////////////////////////////////

/**
 * initialize the socket connections
 */
function init(stream) {
  socket = io();

  socket.on('initReceive', (socket_id) => {
    console.log('INIT RECEIVE ' + socket_id);
    addPeer(socket_id, false);

    socket.emit('initSend', socket_id);
  });

  socket.on('initSend', (socket_id) => {
    console.log('INIT SEND ' + socket_id);
    addPeer(socket_id, true);
  });

  socket.on('removePeer', (socket_id) => {
    console.log('removing peer ' + socket_id);
    removePeer(socket_id);
  });

  socket.on('disconnect', () => {
    console.log('GOT DISCONNECTED');
    for (let socket_id in peers) {
      removePeer(socket_id);
    }
  });

  socket.on('signal', (data) => {
    peers[data.socket_id].signal(data.signal);
  });

  return stream;
}

/**
 * Remove a peer with given socket_id.
 * Removes the video element and deletes the connection
 * @param {String} socket_id
 */
function removePeer(socket_id) {
  let videoEl = document.getElementById(socket_id);
  if (videoEl) {
    const tracks = videoEl.srcObject.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    videoEl.srcObject = null;
    videoEl.parentNode.removeChild(videoEl);
  }
  if (peers[socket_id]) peers[socket_id].destroy();
  delete peers[socket_id];
}

/**
 * Creates a new peer connection and sets the event listeners
 * @param {String} socket_id
 *                 ID of the peer
 * @param {Boolean} am_initiator
 *                  Set to true if the peer initiates the connection process.
 *                  Set to false if the peer receives the connection.
 */
function addPeer(socket_id, am_initiator) {
  peers[socket_id] = new SimplePeer({
    initiator: am_initiator,
    stream: localStream,
    config: configuration,
  });

  peers[socket_id].on('signal', (data) => {
    socket.emit('signal', {
      signal: data,
      socket_id: socket_id,
    });
  });

  peers[socket_id].on('stream', (stream) => {
    let newVid = document.createElement('video');
    newVid.srcObject = stream;
    newVid.id = socket_id;
    newVid.playsinline = false;
    newVid.autoplay = true;
    newVid.className = 'vid';

    newVid.onclick = () => openPictureMode(newVid);
    newVid.ontouchstart = (e) => openPictureMode(newVid);
    videos.appendChild(newVid);

    
    let container = document.querySelector('.sound_configs');
    let selector = document.createElement('select');
    selector.id = `video_${socket_id}`;
    selector.onchange = handleSoundChange;
    container.appendChild(selector);

    current_deviceInfos.forEach((info) => {
      if (info.kind === 'audiooutput') {
        let option = document.createElement('option');
        option.value = info.deviceId;
        option.text = info.label || `speaker ${parent.length + 1}`;
        selector.appendChild(option);
      }
    });
  });
}

function handleSoundChange(e){
  let selector = document.getElementById(e.target.id);
  let target_id = e.target.id.slice(6);
  let target = document.getElementById(target_id);
  target.setSinkId(selector.value);
}

/**
 * Opens an element in Picture-in-Picture mode
 * @param {HTMLVideoElement} el video element to put in pip mode
 */
function openPictureMode(el) {
  console.log('opening pip');
  el.requestPictureInPicture();
}

/**
 * Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
 */
function switchMedia() {
  if (constraints.video.facingMode.ideal === 'user') {
    constraints.video.facingMode.ideal = 'environment';
  } else {
    constraints.video.facingMode.ideal = 'user';
  }

  const tracks = localStream.getTracks();
  console.log(tracks);
  tracks.forEach(function (track) {
    track.stop();
  });

  localVideo.srcObject = null;
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    for (let socket_id in peers) {
      for (let index in peers[socket_id].streams[0].getTracks()) {
        for (let index2 in stream.getTracks()) {
          if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
            peers[socket_id].replaceTrack(
              peers[socket_id].streams[0].getTracks()[index],
              stream.getTracks()[index2],
              peers[socket_id].streams[0],
            );
            break;
          }
        }
      }
    }

    localStream = stream;
    localVideo.srcObject = stream;

    updateButtons();
  });
}

/**
 * Enable screen share
 */
function setScreen() {
  navigator.mediaDevices.getDisplayMedia().then((stream) => {
    for (let socket_id in peers) {
      for (let index in peers[socket_id].streams[0].getTracks()) {
        for (let index2 in stream.getTracks()) {
          if (peers[socket_id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
            peers[socket_id].replaceTrack(
              peers[socket_id].streams[0].getTracks()[index],
              stream.getTracks()[index2],
              peers[socket_id].streams[0],
            );
            break;
          }
        }
      }
    }
    localStream = stream;

    localVideo.srcObject = localStream;
    socket.emit('removeUpdatePeer', '');
  });
  updateButtons();
}

/**
 * Disables and removes the local stream and all the connections to other peers.
 */
function removeLocalStream() {
  if (localStream) {
    const tracks = localStream.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    localVideo.srcObject = null;
  }

  for (let socket_id in peers) {
    removePeer(socket_id);
  }
}

/**
 * Enable/disable microphone
 */
let mute = false;
let show = true;
function toggleMute() {
  for (let index in localStream.getAudioTracks()) {
    localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled;
    muteButton.innerText = localStream.getAudioTracks()[index].enabled ? 'Unmuted' : 'Muted';
  }
}
/**
 * Enable/disable video
 */
function toggleVid() {
  for (let index in localStream.getVideoTracks()) {
    localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled;
    vidButton.innerText = localStream.getVideoTracks()[index].enabled ? 'Video Enabled' : 'Video Disabled';
  }
}

/**
 * updating text of buttons
 */
function updateButtons() {
  for (let index in localStream.getVideoTracks()) {
    vidButton.innerText = localStream.getVideoTracks()[index].enabled ? 'Video Enabled' : 'Video Disabled';
  }
  for (let index in localStream.getAudioTracks()) {
    muteButton.innerText = localStream.getAudioTracks()[index].enabled ? 'Unmuted' : 'Muted';
  }
}
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////

const videoElement = document.querySelector('#localVideo');
const audioInputSelect = document.querySelector('select#audioSource');
const audioOutputSelect = document.querySelector('select#audioOutput');
const videoSelect = document.querySelector('select#videoSource');
const selectors = [audioInputSelect, audioOutputSelect, videoSelect];
let current_deviceInfos;

function gotDevices(deviceInfos) {
  console.log(deviceInfos);
  current_deviceInfos = deviceInfos;
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (let i = 0; i !== deviceInfos.length; ++i) {
    const deviceInfo = deviceInfos[i];
    const option = document.createElement('option');
    option.value = deviceInfo.deviceId;
    if (deviceInfo.kind === 'audioinput') {
      option.text = deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'audiooutput') {
      option.text = deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else {
      console.log('Some other kind of source/device: ', deviceInfo);
    }
  }
  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some((n) => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

function attachSinkId(element, sinkId) {
  if (typeof element.sinkId !== 'undefined') {
    element
      .setSinkId(sinkId)
      .then(() => {
        console.log(`Success, audio output device attached: ${sinkId}`);
      })
      .catch((error) => {
        let errorMessage = error;
        if (error.name === 'SecurityError') {
          errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
        }
        console.error(errorMessage);
        // Jump back to first output device in the list as it's the default.
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    console.warn('Browser does not support output device selection.');
  }
}

function changeAudioDestination() {
  const audioDestination = audioOutputSelect.value;
  attachSinkId(videoElement, audioDestination);
}

function gotStream(stream) {
  localStream = stream; // make stream available to console
  videoElement.srcObject = stream;
  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

/**
 * UserMedia constraints
 */
let constraints = {
  video: {
    width: {
      max: 300,
    },
    height: {
      max: 300,
    },
  },
};

let start_i = 0;
function start() {
  if (localStream) {
    localStream.stream.getTracks().forEach((track) => {
      track.stop();
    });
  }
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  constraints.audio = { deviceId: audioSource ? { exact: audioSource } : undefined };
  constraints.video = { deviceId: videoSource ? { exact: videoSource } : undefined };
  console.log(constraints);
  if (start_i === 0) {
    navigator.mediaDevices.getUserMedia(constraints).then(init).then(gotStream).then(gotDevices).catch(handleError);
    start_i++;
  } else {
    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);
  }
}

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);
start();
audioInputSelect.onchange = start;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = start;
