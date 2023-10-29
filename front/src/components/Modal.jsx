import { memo } from 'react';
import ReactModal from 'react-modal';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { CrossIcon } from './icons/CrossIcon';

const Modal = ({ isOpen, children, onClose }) => {
  return (
    <ReactModal
      isOpen={isOpen}
      style={{
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
        },
        overlay: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
        },
      }}
      appElement={document.getElementById('root')}
    >
      <Wrapper>
        <ModalHeader>
          <button onClick={onClose}>
            <CrossIcon size="18px" />
          </button>
        </ModalHeader>
        {children}
      </Wrapper>
    </ReactModal>
  );
};

export default memo(Modal);

Modal.propType = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
};

const Wrapper = styled.div`
  width: 400px;
  height: 300px;
`;

const ModalHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
`;
