const peerListSection = document.querySelector('.section-peer-list');
const waitUserContainer = peerListSection.querySelector('.wait-container');
const peerListContainer = peerListSection.querySelector('.peer-container');
const statusElement = document.getElementById('status-text');
const chatContentContainer = document.querySelector('.chat-content-container');

const maximizedVideoSection = document.querySelector('.section-maximized-video');
const videoContainerGroup = document.querySelector('.video-container-group');

let currentMaximizedId = undefined;
let showConfigModal = false;
let showUserList = false;

function setStatusText(msg) {
  statusElement.innerText = msg;
}

function handleMaximize(e) {
  const targetElement = e.currentTarget;
  const id = e.currentTarget.id.replace('maximizeButton_', '');

  // toggle maximized section
  if (currentMaximizedId === id) {
    handleMinimize(e);
    return;
  }

  targetElement.src = '/fonts/minimize-solid.svg';

  currentMaximizedId = id;
  const selectedContainer = document.getElementById(`container_${id}`);
  maximizedVideoSection.appendChild(selectedContainer);

  $('.video-container-group').css('display', 'none');
  $('.section-maximized-video').css('display', 'flex');
  hideAllModal();
}

/**
 * It is invoked by handleMaximize function
 * @param {*} e
 * @returns
 */
function handleMinimize(e) {
  if (!currentMaximizedId) {
    console.error('[ERROR]: cannot minimize due current maximized value is not defined.');
    return;
  }

  const id = currentMaximizedId;
  currentMaximizedId = null;

  const selectedContainer = document.getElementById(`container_${id}`);
  if (id === 'local') {
    videoContainerGroup.prepend(selectedContainer);
  } else {
    videoContainerGroup.appendChild(selectedContainer);
  }

  while (maximizedVideoSection.hasChildNodes()) {
    maximizedVideoSection.removeChild(maximizedVideoSection.firstChild);
  }

  if (e) {
    const targetElement = e.currentTarget;
    targetElement.src = '/fonts/maximize-solid.svg';
  }

  $('.video-container-group').css('display', 'grid');
  $('.section-maximized-video').css('display', 'none');
}

function toggleAudioOutput(e) {
  const targetElement = e.currentTarget;
  const id = targetElement.id.replace('speakerButton_', '');

  const targetVideo = document.getElementById(`${id}`);
  const currentMuteStatus = targetVideo.muted;

  // change status
  targetVideo.muted = !currentMuteStatus;
  if (targetVideo.muted) {
    targetElement.src = '/fonts/volume-xmark.svg';
  } else {
    targetElement.src = '/fonts/volume-high.svg';
  }
}

/**
 * @param {*} e
 */
function toggleVideoOutput(e) {
  const targetElement = e.currentTarget;
  const id = targetElement.id.replace('videoOutputToggleButton_', '');
  const targetVideo = document.getElementById(`${id}`);

  const isHidden = targetVideo.classList.contains('hidden-video');

  if (isHidden) {
    // hidden -> show.
    targetElement.src = '/fonts/mint-video.svg';
    targetVideo.classList.remove('hidden-video');
  } else {
    // show -> hidden
    targetElement.src = '/fonts/mint-video-slash.svg';
    targetVideo.classList.add('hidden-video');
  }
}

function toggleConfig(show) {
  const target = $('.local-config-modal');

  const currentOpacity = target.css('opacity');
  const nextOpacity = show !== undefined ? Number(show) : (Number(currentOpacity) + 1) % 2;

  if (nextOpacity === 1) {
    target.css('display', 'block');
    target.animate(
      {
        opacity: nextOpacity,
      },
      200,
    );
    return;
  }

  target.animate(
    {
      opacity: nextOpacity,
    },
    400,
  );
  target.css('display', 'none');
}

function setEntranceMessage(msg) {
  const target = document.getElementById('entrance-status-message');
  target.innerHTML = msg;
}

function toggleEntranceModal(show, showPassword) {
  if (showPassword) {
    $('#entrance-room-password-section').removeClass('hidden');
    $('#entrance-room-password-section').addClass('show');
  }

  const target = $('.entrance-modal');

  const currentOpacity = target.css('opacity');
  const nextOpacity = show !== undefined ? Number(show) : (Number(currentOpacity) + 1) % 2;

  if (nextOpacity === 1) {
    target.css('display', 'flex');
    target.animate(
      {
        opacity: nextOpacity,
      },
      200,
    );
    return;
  }

  target.animate(
    {
      opacity: nextOpacity,
    },
    400,
  );
  target.css('display', 'none');
}

function toggleUserList(show) {
  if (show === undefined) {
    $('.section-peer-list').fadeToggle('fast');
    return;
  }

  if (show) {
    $('.section-peer-list').fadeIn('fast');
  } else {
    $('.section-peer-list').fadeOut('fast');
  }
}

function toggleMute() {
  if (!localStream) {
    return;
  }
  for (const track of localStream.getAudioTracks()) {
    track.enabled = !track.enabled;
    const buttonStatus = track.enabled ? '/fonts/microphone.svg' : '/fonts/microphone-slash.svg';
    const buttonImage = document.getElementById('muteButtonImage');
    buttonImage.src = buttonStatus;
  }
}

function toggleVideo() {
  for (const track of localStream.getVideoTracks()) {
    track.enabled = !track.enabled;
    const buttonStatus = track.enabled ? '/fonts/video.svg' : '/fonts/video-slash.svg';
    const buttonImage = document.getElementById('videoButtonImage');
    buttonImage.src = buttonStatus;
  }
}

function addPeerList(id, userInfo) {
  users[id] = userInfo;
  const value = users[id];

  const container = document.createElement('div');
  container.className = 'a-user-container';
  container.id = `peerList_${id}`;

  const profileGroup = document.createElement('div');
  profileGroup.className = 'a-user-profile-group';

  const profileImg = document.createElement('img');
  profileImg.src = value.profile;
  profileImg.className = 'profile-img';

  const nameTag = document.createElement('span');
  nameTag.innerHTML = value.name;
  nameTag.className = 'profile-name';

  profileGroup.append(profileImg, nameTag);
  container.append(profileGroup);
  peerListContainer.append(container);
}

function deletePeerList(id) {
  if (!users[id]) {
    return;
  }
  const targetContainer = document.querySelector(`#peerList_${id}`);

  while (targetContainer.hasChildNodes()) {
    targetContainer.removeChild(targetContainer.firstChild);
  }

  targetContainer.parentNode.removeChild(targetContainer);

  delete users[id];
}

function addWaitList(id) {
  const value = waitUsers[id];

  const container = document.createElement('div');
  container.className = 'a-user-container';
  container.id = `waitList_${id}`;

  const profileGroup = document.createElement('div');
  profileGroup.className = 'a-user-profile-group';

  const buttonGroup = document.createElement('div');
  buttonGroup.className = 'a-user-button-group';

  const profileImg = document.createElement('img');
  profileImg.src = value.profile;
  profileImg.className = 'profile-img';

  const nameTag = document.createElement('span');
  nameTag.innerHTML = value.name;
  nameTag.className = 'profile-name';

  const approveButton = document.createElement('button');
  approveButton.innerHTML = '수락';
  approveButton.className = 'approve-button';
  approveButton.id = id;
  approveButton.addEventListener('click', handleApprove);

  const rejectButton = document.createElement('button');
  rejectButton.innerHTML = '거절';
  rejectButton.className = 'reject-button';
  rejectButton.id = id;
  rejectButton.addEventListener('click', handleReject);

  profileGroup.append(profileImg, nameTag);
  buttonGroup.append(approveButton, rejectButton);

  container.append(profileGroup, buttonGroup);
  waitUserContainer.appendChild(container);
}

function deleteWaitList(id) {
  if (!waitUsers[id]) {
    return;
  }

  const targetContainer = document.querySelector(`#waitList_${id}`);
  while (targetContainer.hasChildNodes()) {
    targetContainer.removeChild(targetContainer.firstChild);
  }

  targetContainer.parentNode.removeChild(targetContainer);

  delete waitUsers[id];
}

function createParticipantsContainer(id, userInfo, stream) {
  /* create name tag */
  let nameTag = document.createElement('span');
  nameTag.className = 'user-name';
  nameTag.innerText = userInfo.name;

  /* create video */
  let newVid = document.createElement('video');
  newVid.srcObject = stream;
  streams[id] = stream;
  newVid.id = id;
  newVid.playsinline = false;
  newVid.autoplay = true;

  const audioOutput = sessionStorage.getItem(AUDIO_OUTPUT_KEY);
  if (audioOutput) {
    newVid.setSinkId(audioOutput);
  }

  /* create container */
  let videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';
  videoContainer.id = `container_${id}`;

  /* create buttons container */
  let buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'buttons-container';

  // create speaker icon
  const speakerIcon = document.createElement('img');
  speakerIcon.src = '/fonts/volume-high.svg';
  speakerIcon.className = 'video-icons';
  speakerIcon.id = `speakerButton_${id}`;
  speakerIcon.addEventListener('click', toggleAudioOutput);
  buttonsContainer.appendChild(speakerIcon);

  // create video icon
  const videoOutputToggleIcon = document.createElement('img');
  videoOutputToggleIcon.src = '/fonts/mint-video.svg';
  videoOutputToggleIcon.className = 'video-icons';
  videoOutputToggleIcon.id = `videoOutputToggleButton_${id}`;
  videoOutputToggleIcon.addEventListener('click', toggleVideoOutput);
  buttonsContainer.appendChild(videoOutputToggleIcon);

  // create maximize icon
  const maximzeIcon = document.createElement('img');
  maximzeIcon.src = '/fonts/maximize-solid.svg';
  maximzeIcon.className = 'video-icons';
  maximzeIcon.id = `maximizeButton_${id}`;
  maximzeIcon.addEventListener('click', handleMaximize);
  buttonsContainer.appendChild(maximzeIcon);

  // create meter
  let meter = createSoundMeter(id, stream);

  // append children
  videoContainerGroup.appendChild(videoContainer);
  videoContainer.appendChild(meter);
  videoContainer.appendChild(newVid);
  videoContainer.appendChild(nameTag);
  videoContainer.appendChild(buttonsContainer);
}

function hideAllModal() {
  toggleConfig(false);
  toggleUserList(false);
}

// videoContainerGroup.addEventListener('click', hideAllModal);
// maximizedVideoSection.addEventListener('click', hideAllModal);

const horizonal = document.querySelector('.horizonal-flex');
horizonal.addEventListener('click', (e) => {
  toggleConfig(false);
});

function changeTransLanguage(language) {
  console.log('lang: ', language);
  const chatLanguage = sessionStorage.getItem('lang') || 'kr';
  $(`#country-${chatLanguage}`).removeClass('selected-country');
  $(`#country2-${chatLanguage}`).removeClass('selected-country');

  sessionStorage.setItem('lang', language);
  console.log($(`#country-${language}`));
  $(`#country-${language}`).addClass('selected-country');
  $(`#country2-${language}`).addClass('selected-country');

  console.log('socket : ', socket);
  socket?.emit('changeLang', myInfo, language);
}
