const peerListSection = document.querySelector('.section-peer-list');
const waitUserContainer = peerListSection.querySelector('.wait-container');
const peerListContainer = peerListSection.querySelector('.peer-container');

const mainVideoSection = document.querySelector('.section-main-video');
const mainVideoContainer = mainVideoSection.querySelector('.container');

let currentMaximize = undefined;
let showConfigModal = false;
let showUserList = false;

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

function handleMinimize() {
    currentMaximize = null;
    mainVideoContainer.innerHTML = '';
    mainVideoContainer.setAttribute('style', 'display: none');
}

function toggleConfig() {
    showConfigModal = !showConfigModal;
    if (showConfigModal) {
        configModal.setAttribute('style', 'display:flex');
    } else {
        configModal.setAttribute('style', 'display:none');
    }
}

function toggleUserList(show) {
    showUserList = (show === undefined) ? !showUserList : show;

    if (showUserList) {
        peerListSection.setAttribute('style', 'display:flex');
    } else {
        peerListSection.setAttribute('style', 'display:none');
    }
}

function toggleMute() {
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

function createParticipantsContainer(id, userInfo, stream) {
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
    let meter = createSoundMeter(id, stream);

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
}