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

if (!myName) {
  window.focus();
  let name = undefined;

  do {
    name = prompt('참여할 이름을 정해주세요 : ');
  } while (!name)

  myName = name;
  myProfile = '/images/google.png';
  myId = makeid(30);
}

myInfo = { name: myName, userId: myId, profile: myProfile, sessionId: mySessionId, status: status };
users['myInfo'] = myInfo;
addPeerList('myInfo', myInfo);

/* media resources */
const videoElement = document.querySelector('#localVideo');
const audioInputSelect = document.querySelector('select#audioSource');
const videoSelect = document.querySelector('select#videoSource');
const selectors = [audioInputSelect, videoSelect];

// redirect if not https
if (location.href.substr(0, 5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4);


function init() {
  socket = io();

  /* set my name, title*/
  localUserTag.innerText = myInfo.name;
  document.title = `Translate | ${roomId}`;

  socket.emit('init', myInfo, roomId);

  socket.on('host', (updatedStatus) => {
    myInfo.status = updatedStatus;
  });
  
  socket.on('requestJoin', (userInfo) => {
    window.focus();
    console.log('request Join');
    alert('새로운 유저가 입장을 요청했습니다.');
    const otherId = userInfo.sessionId;
    waitUsers[otherId] = userInfo;
    addWaitList(otherId);
    toggleUserList(false);
  });

  /*****************************/
  socket.on('approvedJoin', (updatedStatus) => {
    myInfo.status = updatedStatus;
  });

  /*****************************/
  socket.on('rejectJoin', () => {
    window.focus();
    alert('방장이 입장을 거부했습니다.');
    exit();
  });

  /*****************************/
  socket.on('initReceive', (otherInfo) => {
    console.log('INIT RECEIVE ' + otherInfo.name);
    addPeer(false, otherInfo);
    socket.emit('initSend', otherInfo.sessionId, myInfo);
  });

  /*****************************/
  socket.on('initSend', (otherInfo) => {
    console.log('INIT SEND ' + otherInfo.name);
    myInfo.joined = true;
    addPeer(true, otherInfo);
  });

  /*****************************/
  socket.on('removePeer', (id) => {
    console.log('removing peer ' + id);
    removePeer(id);
    deleteWaitList(id);
  });

  /*****************************/
  socket.on('disconnect', () => {
    console.log('GOT DISCONNECTED');

    for (const [key] of Object.entries(waitUsers)) {
      deleteWaitList(key);
    }

    socket.emit('restore', myInfo, roomId);
  });

  /*****************************/
  socket.on('signal', (data) => {
    peers[data.sessionId].signal(data.signal);
  });
}

function addPeer(am_initiator, userInfo) {
  const id = userInfo.sessionId;

  peers[id] = new SimplePeer({
    initiator: am_initiator,
    stream: localStream,
    config: configuration,
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
    createParticipantsContainer(id, userInfo, stream)
  });
}

/**
 * Remove a peer with given session id.
 * Removes the video element and deletes the connection
 */
function removePeer(sessionId) {

  if (streams[sessionId]) {
    if (sessionId == currentMaximize) {
      handleMinimize();
    }
    delete streams[sessionId];
  }

  let videoEl = document.getElementById(sessionId);
  let videoSelector = document.getElementById(`selector_${sessionId}`);
  let videoContainer = document.getElementById(`container_${sessionId}`);
  let meter = document.getElementById(`meter_${sessionId}`);

  if (videoEl?.srcObject) {
    const tracks = videoEl.srcObject.getTracks();

    tracks.forEach((track) => {
      track.stop();
    });

    videoEl.srcObject = null;
    videoContainer.removeChild(videoEl);
    videoContainer.removeChild(videoSelector);
    videoContainer.removeChild(meter);
    videoContainer.parentNode.removeChild(videoContainer);
  }
  if (peers[sessionId]) {
    peers[sessionId].destroy();
    delete peers[sessionId];
  }
  
  console.log('meter : ', meterRefreshs[sessionId]);
  meterRefreshs[sessionId] && delete meterRefreshs[sessionId];
  
  deletePeerList(sessionId);
  deleteWaitList(sessionId);
}

/*****************************/
function switchMedia() {
  const audioSource = audioInputSelect.value;
  const videoSource = videoSelect.value;
  constraints.audio = { deviceId: audioSource ? { exact: audioSource } : undefined };
  constraints.video = { deviceId: videoSource ? { exact: videoSource } : undefined };

  
  const tracks = localStream.getTracks();
  const videoState = localStream.getVideoTracks()[0].enabled;
  const audioState = localStream.getAudioTracks()[0].enabled;

  tracks.forEach(function (track) {
    track.stop();
  });

  localVideo.srcObject = null;
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    updateLocalSoundMeter(stream);
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
  });
}

/*****************************/
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


/*****************************/
function handleApprove(e) {
  const id = e.currentTarget.id;
  const targetInfo = waitUsers[id];
  socket.emit('requestJoin', targetInfo, true, roomId);
  deleteWaitList(id);
}

/*****************************/
function handleReject(e) {
  const id = e.currentTarget.id;
  const targetInfo = waitUsers[id];
  socket.emit('requestJoin', targetInfo, false, id, roomId);
  deleteWaitList(id);
}


async function getDevices() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  current_deviceInfos = devices;
  
  // Handles being called several times to update labels. Preserve values.
  const values = selectors.map((select) => select.value);
  selectors.forEach((select) => {
    while (select.firstChild) {
      select.removeChild(select.firstChild);
    }
  });
  for (const {deviceId, label, kind} of devices) {
    const option = document.createElement('option');

    option.value = deviceId;
    if (kind === 'audioinput') {
      option.text = label || `microphone ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    } 
    else if (kind === 'videoinput') {
      option.text = label || `camera ${videoSelect.length + 1}`;
      videoSelect.appendChild(option);
    }
  }

  selectors.forEach((select, i) => {
    if (Array.prototype.slice.call(select.childNodes).some((n) => n.value === values[i])) {
      select.value = values[i];
    }
  });
}


async function getStream() {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  localStream = stream;
  videoElement.srcObject = stream;
  updateLocalSoundMeter(stream);
}

async function start() {
  try{
    await getStream();
    await getDevices();
  }
  catch(e){
    console.log(e);
  }
  finally{
    init();
  }
}

audioInputSelect.onchange = switchMedia;
videoSelect.onchange = switchMedia;
start();