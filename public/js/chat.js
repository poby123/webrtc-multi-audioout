/** chat */
const chatInput = document.querySelector('.chat-input');
const chatSendButton = document.querySelector('.chat-send-button');

chatSendButton.addEventListener('click', () => {
  const message = chatInput.value;
  if (!socket) {
    return;
  }

  socket && socket.emit('chat', myInfo, message);
  createChatContainer(myInfo, message, true);
});
