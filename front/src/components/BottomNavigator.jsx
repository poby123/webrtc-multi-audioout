import { memo } from 'react';
import { useAppDispatch, useAppSelector } from 'store/Hooks';
import { rtcActions } from 'store/ducks/rtcSlice';
import styled, { useTheme } from 'styled-components';
import { getCurrentDimension } from 'utils/getCurrentDimension';
import { rtcState } from '../features/rtc/store';
import { ConfigIcon } from './icons/ConfigIcon';
import { BoldCrossIcon } from './icons/CrossIcon';
import { MicIcon } from './icons/MicIcon';
import { MicSlashIcon } from './icons/MicSlashIcon';
import { UserIcon } from './icons/UserIcon';
import { VideoIcon } from './icons/VideoIcon';
import { VideoSlashIcon } from './icons/VideoSlashIcon';

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
    for (const track of rtcState.localStream.getVideoTracks()) {
      track.enabled = !track.enabled;
    }
  };

  const onToggleMic = () => {
    dispatch(rtcActions.setMicState(!isActiveMic));
    for (const track of rtcState.localStream.getAudioTracks()) {
      track.enabled = !track.enabled;
    }
  };

  const onToggleConfig = () => {};

  const onToggleUser = () => {};

  return (
    <StyledBottomSection>
      <Meter max={1} high={0.25} />
      <Container>
        <RoundedButton onClick={onClickExit}>
          <BoldCrossIcon color={colors.grey100} size={size} />
        </RoundedButton>

        <RoundedButton onClick={onToggleVideo}>
          {isActiveVideo ? (
            <VideoSlashIcon color={colors.grey100} size={size} />
          ) : (
            <VideoIcon color={colors.grey100} size={size} />
          )}
        </RoundedButton>

        <RoundedButton onClick={onToggleMic}>
          {isActiveMic ? (
            <MicSlashIcon color={colors.focus100} size={size * 2} />
          ) : (
            <MicIcon color={colors.grey100} size={size * 2} />
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

const Meter = styled.meter`
  width: 100%;
`;
