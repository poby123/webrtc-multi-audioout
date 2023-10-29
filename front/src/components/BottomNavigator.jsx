import { useAppDispatch, useAppSelector } from 'store/Hooks';
import styled, { useTheme } from 'styled-components';
import { ConfigIcon } from './icons/ConfigIcon';
import { BoldCrossIcon } from './icons/CrossIcon';
import { MicIcon } from './icons/MicIcon';
import { UserIcon } from './icons/UserIcon';
import { VideoSlashIcon } from './icons/VideoSlashIcon';
import { VideoIcon } from './icons/VideoIcon';
import { MicSlashIcon } from './icons/MicSlashIcon';
import { rtcActions } from 'store/ducks/rtcSlice';
import { memo } from 'react';
import { getCurrentDimension } from 'utils/getCurrentDimension';

export const BottomNavigator = memo(() => {
  const { colors } = useTheme();
  const state = useAppSelector((state) => state.rtc);
  const { isActiveMic, isActiveVideo } = state;
  const dispatch = useAppDispatch();
  const { width } = getCurrentDimension();
  const size = width > 400 ? 24 : 18;

  const onClickExit = () => {};

  const onToggleVideo = () => {
    dispatch(rtcActions.setVideoState(!isActiveVideo));
  };

  const onToggleMic = () => {
    dispatch(rtcActions.setMicState(!isActiveMic));
  };

  const onToggleConfig = () => {};

  const onToggleUser = () => {};

  return (
    <StyledBottomSection>
      <Container>
        <RoundedButton onClick={onClickExit}>
          <BoldCrossIcon color={colors.grey100} size={size} />
        </RoundedButton>

        <RoundedButton onClick={onToggleVideo}>
          {isActiveVideo ? (
            <VideoIcon color={colors.grey100} size={size} />
          ) : (
            <VideoSlashIcon color={colors.grey100} size={size} />
          )}
        </RoundedButton>

        <RoundedButton onClick={onToggleMic}>
          {isActiveMic ? (
            <MicIcon color={colors.grey100} size={size * 2} />
          ) : (
            <MicSlashIcon color={colors.focus100} size={size * 2} />
          )}
        </RoundedButton>

        <RoundedButton onClick={onToggleConfig}>
          <ConfigIcon color={colors.grey100} size={size} />
        </RoundedButton>

        <RoundedButton onClick={onToggleUser}>
          <UserIcon color={colors.grey100} size={size} />
        </RoundedButton>
      </Container>
    </StyledBottomSection>
  );
});

const RoundedButton = styled.button`
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
`;

const Container = styled.div`
  display: flex;
  width: minmax(300px, 90%);
  margin-left: auto;
  margin-right: auto;

  justify-content: space-around;
  align-items: center;
  margin-bottom: 0.5rem;
`;
