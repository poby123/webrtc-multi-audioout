let myInfo;
let myName = nameBox.value;
let myId = idBox.value;
let myProfile = profileBox.value;
let mySessionId = sessionBox.value;
let status = statusBox.value;

/* parse data from url */
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('id');
const isPrefixRoom = PREFIX_ROOMS[roomId];

/* media resources */
const videoElement = document.querySelector('#localVideo');
let audioInputSelect = document.querySelector('select#audioInputSource');
let audioOutputSelect = document.querySelector('select#audioOutputSource');
let videoSelect = document.querySelector('select#videoSource');
let selectors = [audioInputSelect, audioOutputSelect, videoSelect];

/**
 * Init start
 */
function init() {
  socket = io();

  /* set my name, title*/
  document.title = `Translate | ${roomId}`;

  socket.on('prefixRoomApproved', () => {
    socket.emit('initPrefixRoom', myInfo, roomId);
    setStatusText(`${roomId}에 참여했습니다!`);
  });

  socket.on('host', (updatedStatus) => {
    myInfo.status = updatedStatus;
    toggleEntranceModal(false);
    setStatusText('회의를 시작했습니다.');

    users['myInfo'] = myInfo;
    addPeerList('myInfo', myInfo);
  });

  socket.on('requestJoin', (userInfo) => {
    window.focus();
    setStatusText(`새로운 유저가 입장을 요청했습니다`);
    const otherId = userInfo.sessionId;
    waitUsers[otherId] = userInfo;
    addWaitList(otherId);
    toggleUserList(true);
  });

  /*****************************/
  socket.on('approvedJoin', (updatedStatus) => {
    setStatusText('회의에 참여했습니다.');
    toggleEntranceModal(false);
    myInfo.status = updatedStatus;

    users['myInfo'] = myInfo;
    addPeerList('myInfo', myInfo);
  });

  /*****************************/
  socket.on('rejectJoin', () => {
    setStatusText('방장이 입장을 거부했습니다.');
    setEntranceMessage('방장이 입장을 거부했습니다.');
  });

  /*****************************/
  socket.on('invalidPassword', () => {
    window.focus();
    setStatusText('잘못된 비밀번호입니다.');
    setEntranceMessage('잘못된 비밀번호입니다.');
    const passwordTarget = document.getElementById('entrance-room-password');
    passwordTarget.value = '';
  });

  /*****************************/
  socket.on('initReceive', (otherInfo) => {
    console.log('INIT RECEIVE ' + otherInfo.name);
    setStatusText('새로운 사용자가 입장했습니다.');
    addPeer(false, otherInfo);
    socket.emit('initSend', otherInfo.sessionId, myInfo);
  });

  /*****************************/
  socket.on('initSend', (otherInfo) => {
    console.log('INIT SEND ' + otherInfo.name);
    myInfo.joined = true;
    toggleEntranceModal(false);
    addPeer(true, otherInfo);
  });

  /*****************************/
  socket.on('removePeer', (id) => {
    removePeer(id);
    deleteWaitList(id);
  });

  /*****************************/
  socket.on('allHostDisconnected', () => {
    setStatusText(
      `모든 방장과의 연결이 끊겼습니다. \n방장이 다시 들어올 때까지 기다리거나 새로 방을 만들 수 있습니다.`,
    );
  });

  /*****************************/
  socket.on('disconnect', () => {
    console.log('GOT DISCONNECTED');
    setStatusText(
      '연결이 끊겼습니다. 다른 참가자의 화면이 정상적이지 않다면, \n 새로고침을 하거나 회의를 나갔다가 다시 들어오는 과정이 필요할 수 있습니다.',
    );

    for (const [key] of Object.entries(waitUsers)) {
      deleteWaitList(key);
    }

    socket.emit('restore', myInfo, roomId);
  });

  /*****************************/
  socket.on('signal', (data) => {
    peers[data.sessionId].signal(data.signal);
  });

  /************************** */
  socket.on('chat', (fromUserInfo, message) => {
    console.log(fromUserInfo, ' ', message);
    createChatContainer(fromUserInfo, message, fromUserInfo.sessionId === myInfo.sessionId);
  });

  socket.on('translate', (message, chatId) => {
    transChat[chatId] = message;
    $(`#chat-content-${chatId}`).html(message);
    $(`#translate-button-${chatId}`).html('original');
  });
}
/** Init end */

function addPeer(am_initiator, userInfo) {
  const id = userInfo.sessionId;

  peers[id] = new SimplePeer({
    initiator: am_initiator,
    stream: localStream,
    config: configuration,
    sdpTransform: (sdp) => {
      sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
      return sdp;
    },
  });

  deleteWaitList(id);

  /*****************************/
  peers[id].on('signal', (data) => {
    socket.emit(
      'signal',
      {
        signal: data,
        sessionId: id,
      },
      myInfo.sessionId,
    );
  });

  /*****************************/
  peers[id].on('stream', (stream) => {
    addPeerList(id, userInfo);
    createParticipantsContainer(id, userInfo, stream);
  });
}

/**
 * Remove a peer with given session id.
 * Removes the video element and deletes the connection
 */
function removePeer(sessionId) {
  if (streams[sessionId]) {
    if (sessionId == currentMaximizedId) {
      handleMinimize();
    }
    delete streams[sessionId];
  }

  const videoEl = document.getElementById(sessionId);
  const videoContainer = document.getElementById(`container_${sessionId}`);

  if (videoEl?.srcObject) {
    const tracks = videoEl.srcObject.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    videoEl.srcObject = null;
  }

  if (videoContainer) {
    while (videoContainer.hasChildNodes()) {
      videoContainer.removeChild(videoContainer.firstChild);
    }
    videoContainer.parentNode.removeChild(videoContainer);
  }

  if (peers[sessionId]) {
    peers[sessionId].destroy();
    delete peers[sessionId];
  }

  meterRefreshs[sessionId] && delete meterRefreshs[sessionId];

  deletePeerList(sessionId);
  deleteWaitList(sessionId);
}

async function switchMedia() {
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;

  mediaConstraints.audio = { ...constraints.audio, deviceId: audioSource ? { exact: audioSource } : undefined };
  mediaConstraints.video = { ...constraints.video, deviceId: videoSource ? { exact: videoSource } : undefined };

  const tracks = localStream.getTracks();
  const videoState = localStream.getVideoTracks()[0]?.enabled;
  const audioState = localStream.getAudioTracks()[0]?.enabled;

  tracks.forEach(function (track) {
    track.stop();
  });

  localVideo.srcObject = null;
  try {
    const stream = await getStream();
    for (let id in peers) {
      for (let index in peers[id].streams[0].getTracks()) {
        for (let index2 in stream.getTracks()) {
          if (peers[id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
            peers[id].replaceTrack(
              peers[id].streams[0].getTracks()[index],
              stream.getTracks()[index2],
              peers[id].streams[0],
            );
            break;
          }
        }
      }
    }
    localStream = stream;
    videoElement.srcObject = stream;

    !videoState && toggleVideo();
    !audioState && toggleMute();
  } catch (error) {
    setStatusText(`오류로 인해 디바이스를 변경하지 못했습니다: ${error.message}`);
  }
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
        setStatusText(errorMessage);
        // Jump back to first output device in the list as it's the default.
        audioOutputSelect.selectedIndex = 0;
      });
  } else {
    setStatusText('Browser does not support output device selection.');
  }
}

function handleSoundChange() {
  const audioDestination = audioOutputSelect.value;

  try {
    const videos = document.querySelectorAll('video');
    videos.forEach((v) => attachSinkId(v, audioDestination));
  } finally {
    const localVideoElement = document.getElementById('localVideo');
    localVideoElement.muted = true;
  }
}

function removeLocalStream() {
  if (localStream) {
    const tracks = localStream.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });

    localVideo.srcObject = null;
  }

  for (let id in peers) {
    removePeer(id);
  }
}

function handleApprove(e) {
  const id = e.currentTarget.id;
  const targetInfo = waitUsers[id];
  socket.emit('requestJoin', targetInfo, true, roomId);
  deleteWaitList(id);
}

function handleReject(e) {
  const id = e.currentTarget.id;
  const targetInfo = waitUsers[id];
  socket.emit('requestJoin', targetInfo, false, id, roomId);
  deleteWaitList(id);
}

async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  current_deviceInfos = devices;

  const currentAudioInputDeviceId = mediaConstraints.audio?.deviceId?.exact;
  const currentVideoInputDeviceId = mediaConstraints.video?.deviceId?.exact;

  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (const { deviceId, label, kind } of devices) {
    const option = document.createElement('option');
    option.value = deviceId;

    currentAudioInputDeviceId === deviceId && (option.selected = true);
    currentVideoInputDeviceId === deviceId && (option.selected = true);

    if (kind === 'audioinput') {
      option.text = label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } else if (kind === 'videoinput') {
      option.text = label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    } else if (kind === 'audiooutput') {
      option.text = label || `speaker ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    }
  }

  selectors.forEach((select, i) => {
    if (Array.prototype.slice.call(select.childNodes).some((n) => n.value === values[i])) {
      select.value = values[i];
    }
  });
}

async function getStream() {
  if (getStream.counter === undefined) {
    getStream.counter = 0;
  }
  let message = '';
  let audioStatus = true;
  let videoStatus = true;

  if (audioInputSelect.length <= 0) {
    mediaConstraints.audio = false;
    message = `사용 가능한 오디오 입력 디바이스를 인식하지 못했습니다.`;
    audioStatus = false;
  } else {
    const defaultAudioInput = current_deviceInfos.filter((cp) => cp.kind === 'audioinput')[0]?.deviceId;
    mediaConstraints.audio = { ...constraints.audio, deviceId: mediaConstraints.audio?.deviceId || defaultAudioInput };
  }
  if (videoSelect.length <= 0) {
    mediaConstraints.video = false;
    message = `${message}\n 사용 가능한 비디오 입력 디바이스를 인식하지 못했습니다.`;
    videoStatus = false;
  } else {
    const defaultVideoInput = current_deviceInfos.filter((cp) => cp.kind === 'videoinput')[0]?.deviceId;
    mediaConstraints.video = { ...constraints.video, deviceId: mediaConstraints.video?.deviceId || defaultVideoInput };
  }
  message && setStatusText(message);

  if (!audioStatus && !videoStatus) {
    return;
  }

  console.log('mediaConst : ', mediaConstraints);
  const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
  localStream = stream;
  videoElement.srcObject = stream;

  if (audioStatus) {
    getStream.counter++;
    if (getStream.counter <= 1) {
      localSoundMeter = new SoundMeter(new AudioContext());
    }
    updateLocalSoundMeter(stream);
  }
  return stream;
}

async function start() {
  try {
    await getDevices();
    await getStream();
    // toggleMute();
  } catch (e) {
    setStatusText(`[function start] 다음과 같은 에러가 발생했습니다. ${e.message}`);
    console.error(e);
  }
}

function initUserInfo(username, roomPassword) {
  myName = username;

  myInfo = {
    name: myName,
    userId: myId || makeid(30),
    profile: myProfile || '/images/default_profile.webp',
    sessionId: mySessionId,
    status: status,
    roomPassword: roomPassword,
  };
}

function handleEntrance(e) {
  e.preventDefault();

  const username = document.getElementById('entrance-username').value;
  const roomPassword = document.getElementById('entrance-room-password').value;

  initUserInfo(username, roomPassword);

  if (entranceCount <= 0) {
    init();
  }

  localUserTag.innerText = myInfo.name;
  socket.emit('init', myInfo, roomId);
  setStatusText('회의 참여 요청을 보냈습니다. 호스트가 수락하면 참여하게 됩니다.');
  entranceCount += 1;

  return false;
}

function entranceFlow() {
  toggleEntranceModal(true, !!isPrefixRoom);
}

function mediaInitFlow() {
  audioInputSelect.onchange = switchMedia;
  videoSelect.onchange = switchMedia;
  audioOutputSelect.onchange = handleSoundChange;
  start();
}

window.onload = function () {
  window.focus();
  toggleChat(false);

  mediaInitFlow();
  entranceFlow();
};
