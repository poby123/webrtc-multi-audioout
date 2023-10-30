import { constraints } from 'features/rtc/constants';
import { memo, useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { rtcState, setAudioConstraints, setVideoConstraints } from '../features/rtc/store';

export const VideoSection = memo(() => {
  const localVideo = useRef();

  async function switchMedia(audioSource, videoSource) {
    setAudioConstraints({ ...constraints.audio, deviceId: audioSource ? { exact: audioSource } : undefined });
    setVideoConstraints({ ...constraints.video, deviceId: videoSource ? { exact: videoSource } : undefined });
    const tracks = rtcState.localStream.getTracks();

    tracks.forEach(function (track) {
      track.stop();
    });
    localVideo.current = null;
    try {
      const stream = await getStream();
      for (let id in rtcState.peers) {
        for (let index in rtcState.peers[id].streams[0].getTracks()) {
          for (let index2 in stream.getTracks()) {
            if (rtcState.peers[id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
              rtcState.peers[id].replaceTrack(
                rtcState.peers[id].streams[0].getTracks()[index],
                stream.getTracks()[index2],
                rtcState.peers[id].streams[0],
              );
              break;
            }
          }
        }
      }
      // setLocalStream(stream);
      localVideo.current.srcObject = stream;
      // !videoState && toggleVideo();
      // !audioState && toggleMute();
    } catch (error) {
      // setStatusText(`오류로 인해 디바이스를 변경하지 못했습니다: ${error.message}`);
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
          // setStatusText(errorMessage);
          // Jump back to first output device in the list as it's the default.
          // audioOutputSelect.selectedIndex = 0;
        });
    } else {
      // setStatusText('Browser does not support output device selection.');
    }
  }

  function handleSoundChange(audioDestination) {
    try {
      const videos = document.querySelectorAll('video');
      videos.forEach((v) => attachSinkId(v, audioDestination));
    } finally {
      localVideo.current.muted = true;
    }
  }

  function removeLocalStream() {
    if (rtcState.localStream) {
      const tracks = rtcState.localStream.getTracks();

      tracks.forEach(function (track) {
        track.stop();
      });

      localVideo.current.srcObject = null;
    }

    for (let id in rtcState.peers) {
      // removePeer(id);
    }
  }

  const getDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    rtcState.currentDevice = devices;
  }, []);

  const getStream = useCallback(async () => {
    if (getStream.counter === undefined) {
      getStream.counter = 0;
    }

    rtcState.localStream = await navigator.mediaDevices.getUserMedia(rtcState.mediaConstraints);

    localVideo.current.srcObject = rtcState.localStream;
    localVideo.current.play();
    localVideo.current.muted = true;
  }, []);

  useEffect(() => {
    if (!localVideo?.current) {
      return;
    }

    const init = async () => {
      await getDevices();
      await getStream();
    };

    init();
  }, [getDevices, getStream, localVideo]);

  const Config = () => {
    console.log(rtcState.currentDevice);

    if (Object.keys(rtcState.currentDevice).length <= 0) {
      return;
    }

    const currentAudioInputDeviceId = rtcState.mediaConstraints.audio?.deviceId?.exact;
    const currentVideoInputDeviceId = rtcState.mediaConstraints.video?.deviceId?.exact;

    const audioInputs = rtcState.currentDevice
      .filter((c) => c.kind === 'audioinput')
      .map(({ label, deviceId }, index) => {
        return (
          <option key={`${label} ${deviceId}`} value={deviceId}>
            {label || `audio input ${index + 1}`}
          </option>
        );
      });

    const videoInputs = rtcState.currentDevice
      .filter((c) => c.kind === 'videoinput')
      .map(({ label, deviceId }, index) => {
        return (
          <option key={`${label} ${deviceId}`} value={deviceId}>
            {label || `video input ${index + 1}`}
          </option>
        );
      });

    const audioOutputs = rtcState.currentDevice
      .filter((c) => c.kind === 'audiooutput')
      .map(({ label, deviceId }, index) => {
        return (
          <option key={`${label} ${deviceId}`} value={deviceId}>
            {label || `audio output ${index + 1}`}
          </option>
        );
      });

    return (
      <>
        <select value={currentAudioInputDeviceId}>{audioInputs}</select>
        <select value={currentVideoInputDeviceId}>{videoInputs}</select>
        <select>{audioOutputs}</select>
      </>
    );
  };

  return (
    <Section id="sectionA">
      <Container>
        <Config />
        <Video ref={localVideo}></Video>
      </Container>
    </Section>
  );
});

const Section = styled.section`
  flex: 2;
  margin: 0.5rem;
`;

const Container = styled.div`
  border-radius: 6px;
  background: ${(props) => props.theme.colors.primary500};
  display: grid;
  height: 100%;
  overflow-y: scroll;
  padding: 1rem;
  box-sizing: border-box;

  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(auto-fill, minmax(30%, auto));
`;

const Video = styled.video`
  border: 1px solid red;
  width: 100%;
  height: auto;
  object-fit: contain;
  padding: 0;
  margin: 0;
`;
