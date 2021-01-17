/* Socket.io socket */
let socket;
let localStream = null;
let peers = {};

/* parse data from url */
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('id');
const myName = document.querySelector('#info-user-name').value;
const myId = document.querySelector('#info-user-id').value;
const myProfile = document.querySelector('#info-user-profile').value;
const myInfo = { name: myName, id: myId, profile: myProfile };

/* media resources */
const videoElement = document.querySelector('#localVideo');
const audioInputSelect = document.querySelector('select#audioSource');
const videoSelect = document.querySelector('select#videoSource');
const selectors = [audioInputSelect, videoSelect];

let current_deviceInfos;
let currentMaximize;
let showConfigModal = false;

// redirect if not https
if (location.href.substr(0, 5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4);

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
/**
 * UserMedia constraints
 */
const constraints = {
  video: {
    width: {
      max: 1280,
    },
    height: {
      max: 720,
    },
  },
};

/**
 * initialize the socket connections
 */
function init(stream) {
  socket = io();

  // myName = prompt('이름을 입력해주세요 : ');
  // console.log('new-user : ', myName);
  let localUserTag = document.getElementById('local-user-name');
  localUserTag.innerText = myInfo.name;
  document.title = `Translate | ${roomId}`;

  socket.emit('init', myInfo, roomId);

  socket.on('requestJoin', (userInfo, otherId) => {
    window.focus();
    const result = window.confirm(`${userInfo.name}님의 입장을 수락하시겠습니까?`);
    socket.emit('requestJoin', userInfo, result, otherId, roomId);
  });

  socket.on('rejectJoin', () => {
    alert('방장이 입장을 거부했습니다.');
    window.replace('/');
  });

  socket.on('initReceive', (socket_id, otherInfo) => {
    console.log('INIT RECEIVE ' + socket_id + ' ' + otherInfo.name);
    addPeer(socket_id, false, otherInfo);

    socket.emit('initSend', socket_id, myInfo);
  });

  socket.on('initSend', (socket_id, otherInfo) => {
    console.log('INIT SEND ' + socket_id);
    addPeer(socket_id, true, otherInfo);
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
  if (streams[socket_id]) {
    if (socket_id == currentMaximize) {
      handleMinimize();
    }
    delete streams[socket_id];
  }

  let videoEl = document.getElementById(socket_id);
  let videoSelector = document.getElementById(`selector_${socket_id}`);
  let videoContainer = document.getElementById(`container_${socket_id}`);
  if (videoEl) {
    const tracks = videoEl.srcObject.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    videoEl.srcObject = null;
    videoEl.parentNode.removeChild(videoEl);
    videoContainer.removeChild(videoSelector);
    videoContainer.parentNode.removeChild(videoContainer);
  }
  if (peers[socket_id]) peers[socket_id].destroy();
  delete peers[socket_id];
}

let streams = {};

/**
 * Creates a new peer connection and sets the event listeners
 * @param {String} socket_id
 * @param {Boolean} am_initiator
 */
function addPeer(socket_id, am_initiator, userinfo) {
  console.log(userinfo);

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
    /* create name tag */
    let nameTag = document.createElement('span');
    nameTag.className = 'user-name';
    nameTag.innerText = userinfo.name;

    /* create video */
    let newVid = document.createElement('video');
    newVid.srcObject = stream;
    streams[socket_id] = stream;
    console.log('stream : ', stream);
    newVid.id = socket_id;
    newVid.playsinline = false;
    newVid.autoplay = true;

    /* create container */
    let videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `container_${socket_id}`;

    /* create selector */
    let videoSelector = document.createElement('select');
    videoSelector.id = `selector_${socket_id}`;

    /* create maximize button */
    let maximizeButton = document.createElement('button');
    maximizeButton.innerHTML = 'Maximize';
    maximizeButton.id = `maximizeButton_${socket_id}`;
    maximizeButton.addEventListener('click', handleMaximize);

    /* append children */
    let videoSection = document.querySelector('.section-videos');
    videoSection.appendChild(videoContainer);
    videoContainer.appendChild(nameTag);
    videoContainer.appendChild(newVid);
    videoContainer.appendChild(videoSelector);
    videoContainer.appendChild(maximizeButton);

    current_deviceInfos.forEach((info) => {
      if (info.kind === 'audiooutput') {
        let option = document.createElement('option');
        option.value = info.deviceId;
        option.text = info.label || `speaker ${parent.length + 1}`;
        videoSelector.appendChild(option);
      }
    });
    /* add mute option to selector */
    const mute_option = document.createElement('option');
    mute_option.value = 'mute';
    mute_option.text = '소리 끄기';
    videoSelector.appendChild(mute_option);
    videoSelector.addEventListener('change', handleSoundChange);

    //set default, others video sound set muted.
    newVid.muted = true;
    videoSelector.value = 'mute';
  });
}

function handleMaximize(e) {
  let socket_id = e.currentTarget.id.replace('maximizeButton_', '');
  currentMaximize = socket_id;
  let video = document.getElementById(socket_id).cloneNode(true);
  let targetStream = streams[socket_id];
  video.srcObject = targetStream;

  let selector = document.querySelector(`#selector_${socket_id}`).cloneNode(true);
  let minimizeButton = document.createElement('button');
  minimizeButton.innerHTML = 'Minimize';
  minimizeButton.addEventListener('click', handleMinimize);

  let mainVideoContainer = document.querySelector('.main-video-container');
  mainVideoContainer.innerHTML = '';
  mainVideoContainer.appendChild(video);
  mainVideoContainer.appendChild(selector);
  mainVideoContainer.appendChild(minimizeButton);
  mainVideoContainer.setAttribute('style', 'display: flex');

  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function handleMinimize() {
  currentMaximize = null;
  let mainVideoContainer = document.querySelector('.main-video-container');
  mainVideoContainer.innerHTML = '';
  mainVideoContainer.setAttribute('style', 'display: none');
}

function handleSoundChange(e) {
  console.log('handle sound change');
  let selector = document.getElementById(e.target.id);
  let target_id = e.target.id.replace('selector_', '');
  console.log(target_id);
  let target = document.getElementById(target_id);

  if (selector.value === 'mute') {
    target.muted = true;
  } else {
    target.muted = false;
    target.setSinkId(selector.value);
  }
}

/**
 * Switches the camera between user and environment. It will just enable the camera 2 cameras not supported.
 */
function switchMedia() {
  const tracks = localStream.getTracks();

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
    videoElement.srcObject = stream;

    updateButtons();
  });
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
function toggleMute() {
  for (let index in localStream.getAudioTracks()) {
    localStream.getAudioTracks()[index].enabled = !localStream.getAudioTracks()[index].enabled;
    let buttonStatus = localStream.getAudioTracks()[index].enabled
      ? '/fonts/microphone.svg'
      : '/fonts/microphone-slash.svg';
    let buttonImage = document.getElementById('muteButtonImage');
    buttonImage.src = buttonStatus;
  }
}
/**
 * Enable/disable video
 */
function toggleVid() {
  for (let index in localStream.getVideoTracks()) {
    console.log(localStream.getVideoTracks());
    localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled;
    let buttonStatus = localStream.getVideoTracks()[index].enabled ? '/fonts/video.svg' : '/fonts/video-slash.svg';
    let buttonImage = document.getElementById('videoButtonImage');
    buttonImage.src = buttonStatus;
  }
}

/**
 * Handle exit button event
 */
function exit() {
  const result = confirm('회의를 나가시겠습니까?');
  if (result) {
    location.replace('/');
  }
}

/**
 * Handle toggle config modal window
 */
function toggleConfig() {
  let configModal = document.querySelector('.local-config-modal');

  showConfigModal = !showConfigModal;
  if (showConfigModal) {
    configModal.setAttribute('style', 'display:flex');
  } else {
    configModal.setAttribute('style', 'display:none');
  }
}

/**
 * updating text of buttons
 */
function updateButtons() {
  for (let index in localStream.getVideoTracks()) {
    // vidButton.innerText = localStream.getVideoTracks()[index].enabled ? 'Video Enabled' : 'Video Disabled';
    let buttonStatus = localStream.getVideoTracks()[index].enabled ? '/fonts/video.svg' : '/fonts/video-slash.svg';
    let buttonImage = document.getElementById('videoButtonImage');
    buttonImage.src = buttonStatus;
  }
  for (let index in localStream.getAudioTracks()) {
    // muteButton.innerText = localStream.getAudioTracks()[index].enabled ? 'Unmuted' : 'Muted';
    let buttonStatus = localStream.getAudioTracks()[index].enabled
      ? '/fonts/microphone.svg'
      : '/fonts/microphone-slash.svg';
    let buttonImage = document.getElementById('muteButtonImage');
    buttonImage.src = buttonStatus;
  }
}

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
    } else if (deviceInfo.kind === 'videoinput') {
      option.text = deviceInfo.label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }

  selectors.forEach((select, selectorIndex) => {
    if (Array.prototype.slice.call(select.childNodes).some((n) => n.value === values[selectorIndex])) {
      select.value = values[selectorIndex];
    }
  });
}

function gotStream(stream) {
  window.stream = stream;
  localStream = stream; // make stream available to console
  videoElement.srcObject = stream;
  return navigator.mediaDevices.enumerateDevices(); // Refresh button list in case labels have become available
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

let start_i = 0;
function start() {
  if (window.stream) {
    window.stream.getTracks().forEach((track) => {
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
    switchMedia();
  }
}

start();
audioInputSelect.onchange = start;
videoSelect.onchange = start;
