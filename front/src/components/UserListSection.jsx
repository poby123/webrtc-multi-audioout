import { memo } from 'react';
import styled from 'styled-components';

export const UserListSection = memo(() => {
  return (
    <Section>
      <Container></Container>
    </Section>
  );
});

const Section = styled.section`
  flex: 1;
  border-radius: 6px;
  background: ${(props) => props.theme.colors.primary500};
  min-height: 100%;
  margin: 0.5rem;
`;

const Container = styled.div`
  border-radius: 6px;
  background: ${(props) => props.theme.colors.primary500};
`;
