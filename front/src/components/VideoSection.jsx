import { memo } from 'react';
import styled from 'styled-components';

export const VideoSection = memo(() => {
  return (
    <Section>
      <Container>
        <Video></Video>
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
