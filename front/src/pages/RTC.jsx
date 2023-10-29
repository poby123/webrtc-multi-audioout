import styled from 'styled-components';
import { BottomNavigator } from '../components/BottomNavigator';
import { useEffect } from 'react';

const StyledArticle = styled.article`
  min-height: calc(var(--vh, 1vh) * 100);
  background: ${(props) => props.theme.colors.primary900};
`;

export const RTCPage = () => {
  useEffect(() => {}, []);

  return (
    <StyledArticle>
      <BottomNavigator />
    </StyledArticle>
  );
};
