import { createContext, useMemo, useState } from 'react';
import { constraints } from './constants';

const RTCContext = createContext();
const myInfo = window.__user || {
  username: '홍길동',
  userid: 123456,
  profile: undefined,
  sessionId: 1378292372,
  status: '',
};

const INIT_STATE = {
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

const RTCContextProvider = ({ children }) => {
  const [rtcState, setRtcState] = useState(INIT_STATE);
  const actions = useMemo(
    () => ({
      setLocalStream(stream) {
        setRtcState((prev) => ({ ...prev, localStream: stream }));
      },

      setCurrentDevices(device) {
        setRtcState((prev) => ({ ...prev, currentDevice: device }));
      },

      setLocalSoundMeter(soundMeter) {
        setRtcState((prev) => ({ ...prev, localSoundMeter: soundMeter }));
      },

      setAudioConstraints(audioConst) {
        setRtcState((prev) => ({
          ...prev,
          mediaConstraints: {
            audio: audioConst,
            video: prev.mediaConstraints.video,
          },
        }));
      },

      setVideoConstraints(videoConst) {
        setRtcState((prev) => ({
          ...prev,
          mediaConstraints: {
            audio: prev.mediaConstraints.audio,
            video: videoConst,
          },
        }));
      },

      change(key, value) {
        setRtcState((prev) => ({ ...prev, [key]: value }));
      },

      reset() {
        setRtcState(INIT_STATE);
      },
    }),
    [],
  );
  const value = { ...rtcState, ...actions };

  return <RTCContext.Provider value={value}>{children}</RTCContext.Provider>;
};
const RTCContextConsumer = RTCContext.Consumer;
export { RTCContext, RTCContextConsumer, RTCContextProvider };
export default RTCContext;
