import { VideoSection } from 'components/VideoSection';
import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { BottomNavigator } from '../components/BottomNavigator';
import Modal from 'components/Modal';
import { socket } from 'socket';
import RTCContext from 'features/rtc/RTCContext';

export const RTCPage = () => {
  const { myInfo } = useContext(RTCContext);
  const [showConfig, setShowConfig] = useState(true);
  const [isConnected, setIsConnected] = useState(socket.connected);
  let [peers, setPeers] = useState({});

  console.log('connected: ', isConnected, ' ', myInfo);

  useEffect(() => {
    function onConnect() {
      console.log('is connected');
    }

    function onDisconnect() {
      console.log('disconnected');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
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
