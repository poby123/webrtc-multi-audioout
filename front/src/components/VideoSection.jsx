import RTCContext from 'features/rtc/RTCContext';
import { constraints } from 'features/rtc/constants';
import { memo, useCallback, useContext, useEffect, useRef } from 'react';
import styled from 'styled-components';

export const VideoSection = memo(() => {
  const {
    mediaConstraints,
    localStream,
    setLocalStream,
    peers,
    currentDevice,
    setCurrentDevices,
    localSoundMeter,
    setLocalSoundMeter,
    setAudioConstraints,
    setVideoConstraints,
  } = useContext(RTCContext);
  const localVideo = useRef();

  console.log(setLocalStream);

  async function switchMedia() {
    // const audioSource = audioInputSelect.value;
    // const videoSource = videoSelect.value;
    // setAudioConstraints({ ...constraints.audio, deviceId: audioSource ? { exact: audioSource } : undefined });
    // setVideoConstraints({ ...constraints.video, deviceId: videoSource ? { exact: videoSource } : undefined });
    // const tracks = localStream.getTracks();
    // const videoState = localStream.getVideoTracks()[0]?.enabled;
    // const audioState = localStream.getAudioTracks()[0]?.enabled;
    // tracks.forEach(function (track) {
    //   track.stop();
    // });
    // localVideo.current = null;
    // try {
    //   const stream = await getStream();
    //   for (let id in peers) {
    //     for (let index in peers[id].streams[0].getTracks()) {
    //       for (let index2 in stream.getTracks()) {
    //         if (peers[id].streams[0].getTracks()[index].kind === stream.getTracks()[index2].kind) {
    //           peers[id].replaceTrack(
    //             peers[id].streams[0].getTracks()[index],
    //             stream.getTracks()[index2],
    //             peers[id].streams[0],
    //           );
    //           break;
    //         }
    //       }
    //     }
    //   }
    //   setLocalStream(stream);
    //   videoElement.srcObject = stream;
    //   // !videoState && toggleVideo();
    //   // !audioState && toggleMute();
    // } catch (error) {
    //   // setStatusText(`오류로 인해 디바이스를 변경하지 못했습니다: ${error.message}`);
    // }
  }

  function attachSinkId(element, sinkId) {
    // if (typeof element.sinkId !== 'undefined') {
    //   element
    //     .setSinkId(sinkId)
    //     .then(() => {
    //       console.log(`Success, audio output device attached: ${sinkId}`);
    //     })
    //     .catch((error) => {
    //       let errorMessage = error;
    //       if (error.name === 'SecurityError') {
    //         errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
    //       }
    //       setStatusText(errorMessage);
    //       // Jump back to first output device in the list as it's the default.
    //       audioOutputSelect.selectedIndex = 0;
    //     });
    // } else {
    //   setStatusText('Browser does not support output device selection.');
    // }
  }

  function handleSoundChange() {
    // const audioDestination = audioOutputSelect.value;
    // try {
    //   const videos = document.querySelectorAll('video');
    //   videos.forEach((v) => attachSinkId(v, audioDestination));
    // } finally {
    //   const localVideoElement = document.getElementById('localVideo');
    //   localVideoElement.muted = true;
    // }
  }

  function removeLocalStream() {
    if (localStream) {
      const tracks = localStream.getTracks();

      tracks.forEach(function (track) {
        track.stop();
      });

      // localVideo.current?.srcObject = null;
    }

    for (let id in peers) {
      // removePeer(id);
    }
  }

  async function getDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    setCurrentDevices(devices);
  }

  const getStream = useCallback(async () => {
    if (getStream.counter === undefined) {
      getStream.counter = 0;
    }
    let message = '';
    let audioStatus = true;
    let videoStatus = true;

    // if (audioInputSelect.length <= 0) {
    //   setAudioConstraints(false);
    //   message = `사용 가능한 오디오 입력 디바이스를 인식하지 못했습니다.`;
    //   audioStatus = false;
    // } else {
    //   setAudioConstraints({ ...constraints.audio, deviceId: mediaConstraints.audio?.deviceId });
    // }
    // if (videoSelect.length <= 0) {
    //   setVideoConstraints(false);
    //   message = `${message}\n 사용 가능한 비디오 입력 디바이스를 인식하지 못했습니다.`;
    //   videoStatus = false;
    // } else {
    //   setVideoConstraints({ ...constraints.video, deviceId: mediaConstraints.video?.deviceId });
    // }
    // // message && setStatusText(message);

    // if (!audioStatus && !videoStatus) {
    //   return;
    // }

    console.log('mediaConst : ', mediaConstraints);
    const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
    setLocalStream(stream);
    console.log('stream: ', stream);
    console.log('video: ', localVideo.current);

    localVideo.current.srcObject = stream;
    localVideo.current.play();

    if (audioStatus) {
      getStream.counter++;
      if (getStream.counter <= 1) {
        // setLocalSoundMeter(new SoundMeter(new AudioContext()));
      }
      // updateLocalSoundMeter(stream);
    }
    return stream;
  }, [mediaConstraints, setLocalStream]);

  useEffect(() => {
    if (!localVideo?.current) {
      return;
    }

    const init = async () => {
      getStream();
      getDevices();
    };

    init();
  }, [localVideo, getStream]);

  const Config = () => {
    console.log(currentDevice);

    if (Object.keys(currentDevice).length <= 0) {
      return;
    }

    const currentAudioInputDeviceId = mediaConstraints.audio?.deviceId?.exact;
    const currentVideoInputDeviceId = mediaConstraints.video?.deviceId?.exact;

    const audioInputs = currentDevice
      .filter((c) => c.kind === 'audioinput')
      .map(({ label, deviceId }, index) => {
        return (
          <option key={`${label} ${deviceId}`} value={deviceId}>
            {label || `audio input ${index + 1}`}
          </option>
        );
      });

    const videoInputs = currentDevice
      .filter((c) => c.kind === 'videoinput')
      .map(({ label, deviceId }, index) => {
        return (
          <option key={`${label} ${deviceId}`} value={deviceId}>
            {label || `video input ${index + 1}`}
          </option>
        );
      });

    const audioOutputs = currentDevice
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

    // Handles being called several times to update labels. Preserve values.
    // const values = selectors.map((select) => select.value);
    // selectors.forEach((select) => {
    //   while (select.firstChild) {
    //     select.removeChild(select.firstChild);
    //   }
    // });
    // for (const { deviceId, label, kind } of devices) {
    //   const option = document.createElement('option');
    //   option.value = deviceId;

    //   currentAudioInputDeviceId === deviceId && (option.selected = true);
    //   currentVideoInputDeviceId === deviceId && (option.selected = true);

    //   if (kind === 'audioinput') {
    //     option.text = label || `microphone ${audioInputSelect.length + 1}`;
    //     audioInputSelect.appendChild(option);
    //   } else if (kind === 'videoinput') {
    //     option.text = label || `camera ${videoSelect.length + 1}`;
    //     videoSelect.appendChild(option);
    //   } else if (kind === 'audiooutput') {
    //     option.text = label || `speaker ${audioOutputSelect.length + 1}`;
    //     audioOutputSelect.appendChild(option);
    //   }
    // }

    // selectors.forEach((select, i) => {
    //   if (Array.prototype.slice.call(select.childNodes).some((n) => n.value === values[i])) {
    //     select.value = values[i];
    //   }
    // });
  };

  return (
    <Section>
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
