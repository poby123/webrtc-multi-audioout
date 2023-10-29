import styled, { useTheme } from 'styled-components';
import { ConfigIcon } from './icons/ConfigIcon';
import { BoldCrossIcon } from './icons/CrossIcon';
import { MicIcon } from './icons/MicIcon';
import { UserIcon } from './icons/UserIcon';
import { VideoSlashIcon } from './icons/VideoSlashIcon';

export const BottomNavigator = () => {
  const { colors } = useTheme();
  const size = '24px';

  return (
    <StyledBottomSection>
      <Container>
        <RoundedButton>
          <BoldCrossIcon color={colors.grey100} size={size} />
        </RoundedButton>

        <RoundedButton>
          <VideoSlashIcon color={colors.grey100} size={size} />
        </RoundedButton>

        <RoundedButton>
          <MicIcon color={colors.grey100} size={'48px'} />
        </RoundedButton>

        <RoundedButton>
          <ConfigIcon color={colors.grey100} size={size} />
        </RoundedButton>

        <RoundedButton>
          <UserIcon color={colors.grey100} size={size} />
        </RoundedButton>
      </Container>
    </StyledBottomSection>
  );
};

const RoundedButton = styled.button`
  // border: 1px solid red;
  background: ${(props) => props.theme.colors.secondary500};
  padding: 0.8rem;
  border-radius: 50%;

  display: flex;
  align-items: center;
`;

const StyledBottomSection = styled.section`
  position: fixed;
  bottom: 0;
  width: 100%;
  // border: 1px solid red;
`;

const Container = styled.div`
  display: flex;
  width: 90%;
  margin-left: auto;
  margin-right: auto;

  justify-content: space-around;
  align-items: center;
  margin-bottom: 0.5rem;
`;
