import styled from 'styled-components';
import { VideoSlashIcon } from './icons/VideoSlashIcon';

const StyledBottomSection = styled.section`
  border: 1px solid red;
`;

export const BottomNavigator = () => {
  return (
    <StyledBottomSection>
      <VideoSlashIcon />
    </StyledBottomSection>
  );
};
