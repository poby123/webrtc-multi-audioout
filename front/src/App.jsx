import { useEffect } from 'react';
import { RTCPage } from './pages/RTC';
import styled from 'styled-components';
import { getCurrentDimension } from 'utils/getCurrentDimension';

const Wrapper = styled.div`
  background-color: white;
  min-height: calc(var(--vh, 1vh) * 100);
  margin-left: auto;
  margin-right: auto;
`;

function App() {
  const setScreenSize = () => {
    const { width, height } = getCurrentDimension();

    // vh 관련
    const vh = height * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // window width 관련
    const maxWidth = Math.min(768, width);
    document.documentElement.style.setProperty('--app-max-width', `${maxWidth}px`);
  };

  useEffect(() => {
    setScreenSize();
    window.addEventListener('resize', setScreenSize);

    return () => {
      window.removeEventListener('resize', setScreenSize);
    };
  }, []);

  return (
    <Wrapper className="App">
      <RTCPage />
    </Wrapper>
  );
}

export default App;
