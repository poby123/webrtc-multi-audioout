import { VideoSection } from 'components/VideoSection';
import { rtcState } from 'features/rtc/store';
import { useEffect, useState } from 'react';
import { socket } from 'socket';
import styled from 'styled-components';
import { BottomNavigator } from '../components/BottomNavigator';
import SimplePeer from 'simple-peer';
import { configuration } from 'features/rtc/constants';

export const RTCPage = () => {
  const [showConfig, setShowConfig] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);

  console.log('connected: ', isConnected, ' ', rtcState.myInfo);

  useEffect(() => {
    function onConnect() {
      console.log('is connected');
    }

    function onPrefixRoomApproved() {
      console.log('on prefix room approved');
      socket.emit('initPrefixRoom', rtcState.myInfo, rtcState.roomId);
      // setStatusText(`${roomId}에 참여했습니다!`);
    }

    function onHost(updatedStatus) {
      console.log('onhost: ', updatedStatus);
      rtcState.myInfo.status = updatedStatus;
      // toggleEntranceModal(false);
      // setStatusText('회의를 시작했습니다.');

      rtcState.users['myInfo'] = rtcState.myInfo;
      // addPeerList('myInfo', myInfo);
    }

    function onRequestJoin(userInfo) {
      console.log('on request join: ', userInfo);
      window.focus();
      // setStatusText(`새로운 유저가 입장을 요청했습니다`);
      const otherId = userInfo.sessionId;
      rtcState.waitUsers[otherId] = userInfo;
      // addWaitList(otherId);
      // toggleUserList(true);
    }

    function approvedJoin(updatedStatus) {
      console.log('approved join : ', updatedStatus);
      // setStatusText('회의에 참여했습니다.');
      // toggleEntranceModal(false);
      rtcState.myInfo.status = updatedStatus;

      rtcState.users['myInfo'] = rtcState.myInfo;
      // addPeerList('myInfo', myInfo);
    }

    function onReject() {
      console.log('on reject');
      // setStatusText('방장이 입장을 거부했습니다.');
      // setEntranceMessage('방장이 입장을 거부했습니다.');
    }

    function onInvalidPassword() {
      console.log('on invalid password');
      // window.focus();
      // setStatusText('잘못된 비밀번호입니다.');
      // setEntranceMessage('잘못된 비밀번호입니다.');
      // const passwordTarget = document.getElementById('entrance-room-password');
      // passwordTarget.value = '';
    }

    function onInitReceive(otherInfo) {
      console.log('INIT RECEIVE ' + otherInfo.name);
      // setStatusText('새로운 사용자가 입장했습니다.');
      addPeer(false, otherInfo);
      socket.emit('initSend', otherInfo.sessionId, rtcState.myInfo);
    }

    function onInitSend(otherInfo) {
      console.log('INIT SEND ' + otherInfo.name);
      rtcState.myInfo.joined = true;
      // toggleEntranceModal(false);
      addPeer(true, otherInfo);
    }

    function onRemovePeer(id) {
      // removePeer(id);
      // deleteWaitList(id);
    }

    function onAllHostDisconnected() {
      // setStatusText(
      //   `모든 방장과의 연결이 끊겼습니다. \n방장이 다시 들어올 때까지 기다리거나 새로 방을 만들 수 있습니다.`,
      // );
    }

    function onDisconnected() {
      console.log('GOT DISCONNECTED');
      // setStatusText(
      //   '연결이 끊겼습니다. 다른 참가자의 화면이 정상적이지 않다면, \n 새로고침을 하거나 회의를 나갔다가 다시 들어오는 과정이 필요할 수 있습니다.',
      // );

      // for (const [key] of Object.entries(rtcState.waitUsers)) {
      //   deleteWaitList(key);
      // }

      // socket.emit('restore', rtcState.myInfo, rtcState.roomId);
    }

    function addPeer(am_initiator, userInfo) {
      console.log('add peer:', userInfo);
      const id = userInfo.sessionId;

      rtcState.peers[id] = new SimplePeer({
        initiator: am_initiator,
        stream: rtcState.localStream,
        config: configuration,
        sdpTransform: (sdp) => {
          sdp.replace('useinbandfec=1', 'useinbandfec=1; stereo=1; maxaveragebitrate=510000');
          return sdp;
        },
      });

      // deleteWaitList(id);
      rtcState.peers[id].on('signal', (data) => {
        socket.emit(
          'signal',
          {
            signal: data,
            sessionId: id,
          },
          rtcState.myInfo.sessionId,
        );
      });

      /*****************************/
      rtcState.peers[id].on('stream', (stream) => {
        console.log('got stream: ', stream);
        // addPeerList(id, userInfo);
        // createParticipantsContainer(id, userInfo, stream);
      });
    }

    function onSignal(data) {
      console.log('signaling: ', data);
      rtcState.peers[data.sessionId].signal(data.signal);
    }

    const roomId = 'RUS';
    socket.emit('init', rtcState.myInfo, roomId);

    socket.on('connect', onConnect);
    socket.on('prefixRoomApproved', onPrefixRoomApproved);
    socket.on('host', onHost);
    socket.on('requestJoin', onRequestJoin);
    socket.on('approvedJoin', approvedJoin);
    socket.on('rejectJoin', onReject);
    socket.on('invalidPassword', onInvalidPassword);
    socket.on('initReceive', onInitReceive);
    socket.on('initSend', onInitSend);
    socket.on('removePeer', onRemovePeer);
    socket.on('allHostDisconnected', onAllHostDisconnected);
    socket.on('disconnect', onDisconnected);
    socket.on('signal', onSignal);

    return () => {
      socket.off('connect', onConnect);
      socket.off('prefixRoomApproved', onPrefixRoomApproved);
      socket.off('host', onHost);
      socket.off('requestJoin', onRequestJoin);
      socket.off('approvedJoin', approvedJoin);
      socket.off('rejectJoin', onReject);
      socket.off('invalidPassword', onInvalidPassword);
      socket.off('initReceive', onInitReceive);
      socket.off('initSend', onInitSend);
      socket.off('removePeer', onRemovePeer);
      socket.off('allHostDisconnected', onAllHostDisconnected);
      socket.off('disconnect', onDisconnected);
      socket.off('signal', onSignal);
    };
  }, []);

  return (
    <StyledArticle>
      <Container>
        <VideoSection />
      </Container>
      <BottomNavigator />
    </StyledArticle>
  );
};

const StyledArticle = styled.article`
  min-height: calc(var(--vh, 1vh) * 100);
  background: ${(props) => props.theme.colors.primary900};
`;

const Container = styled.div`
  display: flex;
  gap: 1rem;
  max-height: calc(var(--vh, 1vh) * 90);
  min-height: calc(var(--vh, 1vh) * 90);
  width: 100%;
  border: 1px solid green;
`;
