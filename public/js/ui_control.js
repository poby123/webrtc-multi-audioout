const peerListSection = document.querySelector('.section-peer-list');
const waitUserContainer = peerListSection.querySelector('.wait-container');
const peerListContainer = peerListSection.querySelector('.peer-container');

const maximizedVideoSection = document.querySelector('.section-maximized-video');
const videosConainerGroup = document.querySelector('.video-container-group');

let currentMaximizedId = undefined;
let showConfigModal = false;
let showUserList = false;

function handleMaximize(e) {
    const id = e.currentTarget.id.replace('maximizeButton_', '');
    const button = document.getElementById(`maximizeButton_${id}`);

    // toggle maximized section
    if(currentMaximizedId === id){
        handleMinimize(e);
        return;
    }
    
    const minimizeIcon = document.createElement('img')
    minimizeIcon.src = '/fonts/minimize-solid.svg'
    minimizeIcon.className = 'maximize-icons'

    button.replaceChildren(minimizeIcon);

    currentMaximizedId = id;
    const selectedContainer = document.getElementById(`container_${id}`);
    maximizedVideoSection.appendChild(selectedContainer);
    maximizedVideoSection.setAttribute('style', 'display: flex');
    videosConainerGroup.setAttribute('style', 'display: none');
}

function handleMinimize() {
    if(!currentMaximizedId){
        alert('[ERROR]: cannot minimize due current maximized value is not defined.');
        return;
    }

    const id = currentMaximizedId;
    currentMaximizedId = null;
    
    const selectedContainer = document.getElementById(`container_${id}`);
    videosConainerGroup.appendChild(selectedContainer);

    while(maximizedVideoSection.hasChildNodes()){
        maximizedVideoSection.removeChild(maximizedVideoSection.firstChild);
    }

    const button = document.getElementById(`maximizeButton_${id}`);
    const maximzeIcon = document.createElement('img')
    maximzeIcon.src = '/fonts/maximize-solid.svg'
    maximzeIcon.className = 'maximize-icons'

    button.replaceChildren(maximzeIcon);

    videosConainerGroup.setAttribute('style', 'display: flex');
    maximizedVideoSection.setAttribute('style', 'display: none');
}

function toggleConfig(show) {
    showConfigModal = (show === undefined) ? !showConfigModal : show;
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

    const container = document.createElement('div');
    container.className = 'a-user-container';
    container.id = `peerList_${id}`;

    const profileImg = document.createElement('img');
    profileImg.src = value.profile;
    profileImg.className = 'profile-img';

    const nameTag = document.createElement('span');
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
    console.log('stream : ', stream);
    newVid.id = id;
    newVid.playsinline = false;
    newVid.autoplay = true;

    /* create container */
    let videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `container_${id}`;

    /* create maximize icon */
    let maximizeButton = document.createElement('button');
    const maximzeIcon = document.createElement('img')
    maximzeIcon.src = '/fonts/maximize-solid.svg'
    maximzeIcon.className = 'maximize-icons'

    /* create maximize button */
    maximizeButton.id = `maximizeButton_${id}`;
    maximizeButton.className = 'maximize-buttons'
    maximizeButton.appendChild(maximzeIcon);
    maximizeButton.addEventListener('click', handleMaximize);
    
    /* create meter */
    let meter = createSoundMeter(id, stream);
    
    /* append children */
    videosConainerGroup.appendChild(videoContainer);
    videoContainer.appendChild(meter);
    videoContainer.appendChild(newVid);
    videoContainer.appendChild(nameTag);
    videoContainer.appendChild(maximizeButton);
}

function hideAllModal(){
    toggleConfig(false);
    toggleUserList(false);
}

videosConainerGroup.addEventListener('click', hideAllModal);
maximizedVideoSection.addEventListener('click', hideAllModal);