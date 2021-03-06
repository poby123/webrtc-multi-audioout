/* Socket.io socket */
let socket;
let localStream = null;
let peers = {};

/* document status */
let current_deviceInfos;
let currentMaximize;
let showConfigModal = false;
let showUserList = false;
let streams = {};
let waitUsers = {};
let users = {};
let meterRefreshs = {};

/* parse data from url */
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const roomId = urlParams.get('id');

/* ocument contexts */
const peerListSection = document.querySelector('.section-peer-list');
const waitUserContainer = peerListSection.querySelector('.wait-container');
const peerListContainer = peerListSection.querySelector('.peer-container');

const mainVideoSection = document.querySelector('.section-main-video');
const mainVideoContainer = mainVideoSection.querySelector('.container');

const configModal = document.querySelector('.local-config-modal');
const localUserTag = document.getElementById('local-user-name');

const nameBox = document.querySelector('#info-user-name');
const idBox = document.querySelector('#info-user-id');
const profileBox = document.querySelector('#info-user-profile');
const sessionBox = document.querySelector('#info-user-session');
const statusBox = document.querySelector('#info-status');

/* parse userinfo */
function makeid(length) {
  var result = '';
  var characters = '0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

let myInfo;
let myName = nameBox.value;
let myId = idBox.value;
let myProfile = profileBox.value;
let mySessionId = sessionBox.value;
let status = statusBox.value;

if (!myName) {
  window.focus();
  let name = prompt('참여할 이름을 정해주세요 : ');
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

/**
 * RTCPeerConnection configuration
 */
const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
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
      max: 1920,
    },
    height: {
      max: 1080,
    },
  },
};

// initialize the socket connections
function init(stream) {
  socket = io();

  /* set my name, title*/
  localUserTag.innerText = myInfo.name;
  document.title = `Translate | ${roomId}`;

  socket.emit('init', myInfo, roomId);

  /*****************************/
  socket.on('host', (updatedStatus) => {
    myInfo.status = updatedStatus;
  });

  /*****************************/
  socket.on('requestJoin', (userInfo) => {
    window.focus();
    console.log('request Join');
    alert('새로운 유저가 입장을 요청했습니다.');
    const otherId = userInfo.sessionId;
    waitUsers[otherId] = userInfo;
    addWaitList(otherId);
    showUserList = false;
    toggleUserList();
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

  return stream;
}

/**
 * Remove a peer with given session id.
 * Removes the video element and deletes the connection
 */
function removePeer(sessionId) {
  //handle if target video is current maximized video.
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

  if (videoEl) {
    if (videoEl.srcObject) {
      const tracks = videoEl.srcObject.getTracks();

      tracks.forEach(function (track) {
        track.stop();
      });

      videoEl.srcObject = null;
      videoContainer.removeChild(videoEl);
      videoContainer.removeChild(videoSelector);
      videoContainer.removeChild(meter);
      videoContainer.parentNode.removeChild(videoContainer);
    }
  }
  if (peers[sessionId]) {
    peers[sessionId].destroy();
    delete peers[sessionId];
  }
  if (meterRefreshs[sessionId]) {
    delete meterRefreshs[sessionId];
  }
  deletePeerList(sessionId);
  deleteWaitList(sessionId);
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

    /* create name tag */
    let nameTag = document.createElement('span');
    nameTag.className = 'user-name';
    nameTag.innerText = userInfo.name;

    /* create video */
    let newVid = document.createElement('video');
    newVid.srcObject = stream;
    streams[id] = stream;
    console.log('stream : ', stream);
    newVid.id = id;
    newVid.playsinline = false;
    newVid.autoplay = true;

    /* create container */
    let videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `container_${id}`;

    /* create selector */
    let videoSelector = document.createElement('select');
    videoSelector.id = `selector_${id}`;

    /* create maximize button */
    let maximizeButton = document.createElement('button');
    maximizeButton.innerHTML = 'Maximize';
    maximizeButton.id = `maximizeButton_${id}`;
    maximizeButton.addEventListener('click', handleMaximize);

    /* create meter */
    let meter = document.createElement('meter');
    meter.id = `meter_${id}`;
    meter.max = 1;
    meter.high = 0.25;
    meter.value = 0;
    try {
      const soundMeter = new SoundMeter(new AudioContext());
      soundMeter.connectToSource(stream, (e) => {
        if (e) {
          alert(e);
          return;
        }
        meterRefreshs[id] = setInterval(() => {
          meter.value = soundMeter.instant.toFixed(2);
        }, 200);
      });
    } catch (e) {
      console.log('Web Audio API not supported');
    }

    /* append children */
    let videoSection = document.querySelector('.section-videos');
    videoSection.appendChild(videoContainer);
    videoContainer.appendChild(nameTag);
    videoContainer.appendChild(meter);
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

/* handle maximize event */
function handleMaximize(e) {
  let id = e.currentTarget.id.replace('maximizeButton_', '');
  currentMaximize = id;
  let video = document.getElementById(id).cloneNode(true);
  let targetStream = streams[id];
  video.srcObject = targetStream;

  let selector = document.querySelector(`#selector_${id}`).cloneNode(true);
  let minimizeButton = document.createElement('button');
  minimizeButton.innerHTML = 'Minimize';
  minimizeButton.addEventListener('click', handleMinimize);

  mainVideoContainer.innerHTML = '';
  mainVideoContainer.appendChild(video);
  mainVideoContainer.appendChild(selector);
  mainVideoContainer.appendChild(minimizeButton);
  mainVideoContainer.setAttribute('style', 'display: flex');

  // For Safari
  document.body.scrollTop = 0;

  // For Chrome, Firefox, IE and Opera
  document.documentElement.scrollTop = 0;
}

/*****************************/
function handleMinimize() {
  currentMaximize = null;
  mainVideoContainer.innerHTML = '';
  mainVideoContainer.setAttribute('style', 'display: none');
}

/*****************************/
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

/*****************************/
function switchMedia() {
  const tracks = localStream.getTracks();

  tracks.forEach(function (track) {
    track.stop();
  });

  localVideo.srcObject = null;
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
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

    updateButtons();
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

/*****************************/
function toggleVid() {
  for (let index in localStream.getVideoTracks()) {
    console.log(localStream.getVideoTracks());
    localStream.getVideoTracks()[index].enabled = !localStream.getVideoTracks()[index].enabled;
    let buttonStatus = localStream.getVideoTracks()[index].enabled ? '/fonts/video.svg' : '/fonts/video-slash.svg';
    let buttonImage = document.getElementById('videoButtonImage');
    buttonImage.src = buttonStatus;
  }
}

/*****************************/
function toggleUserList() {
  showUserList = !showUserList;
  if (showUserList) {
    peerListSection.setAttribute('style', 'display:flex');
  } else {
    peerListSection.setAttribute('style', 'display:none');
  }
}

/*****************************/
function addPeerList(id, userInfo) {
  users[id] = userInfo;
  const value = users[id];

  let container = document.createElement('div');
  container.className = 'a-user-container';
  container.id = `peerList_${id}`;

  let profileImg = document.createElement('img');
  profileImg.src = value.profile;
  profileImg.className = 'profile-img';

  let nameTag = document.createElement('span');
  nameTag.innerHTML = value.name;
  nameTag.className = 'profile-name';

  container.appendChild(profileImg);
  container.appendChild(nameTag);
  peerListContainer.appendChild(container);
}

/*****************************/
function deletePeerList(id) {
  if (!users[id]) {
    return;
  }
  const targetContainer = document.querySelector(`#peerList_${id}`);
  const targetChildren = (targetContainer && targetContainer.children) || null;

  if (targetChildren) {
    for (let i = 0; i < targetChildren.length; i++) {
      targetContainer.removeChild(targetChildren[i]);
    }
    targetContainer.parentNode.removeChild(targetContainer);
  }

  delete users[id];
}

/*****************************/
function addWaitList(id) {
  const value = waitUsers[id];

  let container = document.createElement('div');
  container.className = 'a-user-container';
  container.id = `waitList_${id}`;

  let profileImg = document.createElement('img');
  profileImg.src = value.profile;
  profileImg.className = 'profile-img';

  let nameTag = document.createElement('span');
  nameTag.innerHTML = value.name;
  nameTag.className = 'profile-name';

  let approveButton = document.createElement('button');
  approveButton.innerHTML = '수락';
  approveButton.className = 'approve-button';
  approveButton.id = id;
  approveButton.addEventListener('click', handleApprove);

  let rejectButton = document.createElement('button');
  rejectButton.innerHTML = '거절';
  rejectButton.className = 'reject-button';
  rejectButton.id = id;
  rejectButton.addEventListener('click', handleReject);

  container.appendChild(approveButton);
  container.appendChild(rejectButton);
  container.appendChild(profileImg);
  container.appendChild(nameTag);
  waitUserContainer.appendChild(container);
}

/*****************************/
function deleteWaitList(id) {
  if (!waitUsers[id]) {
    return;
  }
  const targetContainer = document.querySelector(`#waitList_${id}`);
  const targetChildren = (targetContainer && targetContainer.children) || null;

  if (targetChildren) {
    for (let i = 0; i < targetChildren.length; i++) {
      targetContainer.removeChild(targetChildren[i]);
    }
    targetContainer.parentNode.removeChild(targetContainer);
  }
  delete waitUsers[id];
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

/*****************************/
function exit() {
  window.focus();
  const result = confirm('회의를 나가시겠습니까?');
  if (result) {
    location.replace('/');
  }
}

/*****************************/
function toggleConfig() {
  showConfigModal = !showConfigModal;
  if (showConfigModal) {
    configModal.setAttribute('style', 'display:flex');
  } else {
    configModal.setAttribute('style', 'display:none');
  }
}

/*****************************/
function updateButtons() {
  for (let index in localStream.getVideoTracks()) {
    let buttonStatus = localStream.getVideoTracks()[index].enabled ? '/fonts/video.svg' : '/fonts/video-slash.svg';
    let buttonImage = document.getElementById('videoButtonImage');
    buttonImage.src = buttonStatus;
  }
  for (let index in localStream.getAudioTracks()) {
    let buttonStatus = localStream.getAudioTracks()[index].enabled
      ? '/fonts/microphone.svg'
      : '/fonts/microphone-slash.svg';
    let buttonImage = document.getElementById('muteButtonImage');
    buttonImage.src = buttonStatus;
  }
}

/*****************************/
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

/*****************************/
function gotStream(stream) {
  window.stream = stream;
  
  // make stream available to console
  localStream = stream;
  videoElement.srcObject = stream;

  // Refresh button list in case labels have become available
  return navigator.mediaDevices.enumerateDevices();
}

/*****************************/
function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

/*****************************/
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
