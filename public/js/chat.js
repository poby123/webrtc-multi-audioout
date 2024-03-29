/** chat */
const chatInput = document.querySelector('.chat-input');
const chatSendButton = document.querySelector('.chat-send-button');
const chatNumberSpan = document.querySelector('#chat-number');
const chatTextArea = document.querySelector('#chat-text-area');

chatSendButton.addEventListener('click', sendMessage);

$('#chat-text-area').keyup(function (event) {
  if (event.keyCode == 13 && !event.shiftKey) {
    sendMessage();
  }
});

function sendMessage() {
  const message = chatInput.value;
  if (!message || message === '\n') {
    return;
  }

  if (!socket) {
    return false;
  }

  socket && socket.emit('chat', myInfo, message);
  createChatContainer(myInfo, { original: message }, true);

  clearInput();
  return true;
}

function clearInput() {
  chatTextArea.value = '';
}

function setChatNumber(chatNumber) {
  if (isChatShown()) {
    chatNumber = 0;
  }
  chatNumberSpan.innerHTML = chatNumber;
  if (chatNumber > 0) {
    $('#chatButton').css('color', '#ff4b91');
  } else {
    $('#chatButton').css('color', 'white');
  }
}

function getChatNumber() {
  return Number(chatNumberSpan.innerHTML);
}

function isChatShown() {
  // console.log('chat status: ', $('.section-chat').css('display'));
  return $('.section-chat').css('display') === 'block';
}

function toggleChat(show) {
  if (show === undefined) {
    if (!isChatShown()) {
      setChatNumber(0);
    }
    $('.section-chat').fadeToggle('fast');
    return;
  }

  if (show) {
    $('.section-chat').fadeIn('fast');
    setChatNumber(0);
  } else {
    $('.section-chat').fadeOut('fast');
  }
}

function createChatContainer(userInfo, message, isMy) {
  const chatWrapper = document.createElement('div');
  chatWrapper.className = `${isMy ? 'my' : 'other'}-chat-content`;

  const chatId = makeid(10);

  // user
  const userProfile = document.createElement('div');
  userProfile.className = 'user-profile';

  const profileImage = document.createElement('img');
  profileImage.className = 'profile-image';
  profileImage.src = userInfo.profile;

  const userName = document.createElement('span');
  userName.className = 'profile-name';
  userName.innerHTML = userInfo.name;

  userProfile.append(profileImage, userName);

  // chat content
  const chatContent = document.createElement('div');
  chatContent.className = 'chat-content';
  chatContent.id = `chat-content-${chatId}`;

  const translatedContent = message?.translated?.replace(/\r|\n/g, '<br/>') || '';
  const originalContent = message?.original?.replace(/\r|\n/g, '<br/>') || '';

  chatContent.innerHTML = `${translatedContent} ${originalContent}`;

  // combine
  chatWrapper.append(userProfile, chatContent);
  chatContentContainer.append(chatWrapper);
  chatContentContainer.scrollTop = chatContentContainer.scrollHeight;

  if (isChatShown()) {
    setChatNumber(0);
    return;
  }
  if (!isMy) {
    setChatNumber(getChatNumber() + 1);
  }
}

// changeTransLanguage(sessionStorage.getItem('lang') || 'kr');
