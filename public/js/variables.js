/* Socket.io socket */
let socket;
let localStream = null;
let peers = {};

/* document status */
let current_deviceInfos;
let streams = {};
let waitUsers = {};
let users = {};
let meterRefreshs = {};

/* local sound meter */
const localSoundMeter = new SoundMeter(new AudioContext());

/* document contexts */
const configModal = document.querySelector('.local-config-modal');
const localUserTag = document.getElementById('local-user-name');
const nameBox = document.querySelector('#info-user-name');
const idBox = document.querySelector('#info-user-id');
const profileBox = document.querySelector('#info-user-profile');
const sessionBox = document.querySelector('#info-user-session');
const statusBox = document.querySelector('#info-status');