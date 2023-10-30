import { constraints } from './constants';

const makeId = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const myInfo = window.__user || {
  username: '홍길동',
  userid: 123456,
  profile: undefined,
  sessionId: makeId(10),
  status: '',
  roomPassword: 'mm1004',
};

export const rtcState = {
  myInfo,
  localStream: null,
  users: {},
  waitUsers: {},
  peers: {},
  streams: {},
  currentDevice: {},
  meterRefresh: {},
  localSoundMeter: null,
  mediaConstraints: { ...constraints },
};

export function setAudioConstraints(audioConst) {
  rtcState.mediaConstraints = {
    ...rtcState.mediaConstraints,
    audio: audioConst,
  };
}

export function setVideoConstraints(videoConst) {
  rtcState.mediaConstraints = {
    ...rtcState.mediaConstraints,
    video: videoConst,
  };
}
