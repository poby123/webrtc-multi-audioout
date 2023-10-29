import { useEffect } from 'react';
import styled from 'styled-components';
import { BottomNavigator } from '../components/BottomNavigator';
import { VideoSection } from 'components/VideoSection';
import { UserListSection } from 'components/UserListSection';

export const RTCPage = () => {
  useEffect(() => {}, []);

  return (
    <StyledArticle>
      <Container>
        <VideoSection />
        <UserListSection />
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
