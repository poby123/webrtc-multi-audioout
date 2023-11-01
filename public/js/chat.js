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
  createChatContainer(myInfo, message, true);

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
  // <div class="other-chat-content">
  //   <div class="user-profile">
  //     <img
  //       class="profile-image"
  //       src="https://lh3.googleusercontent.com/a-/AOh14Gge6m6SoNxLUilPuLzv9uqZ8KFisYAGXh14GcFWjg=s96-c"
  //     />
  //     <span class="profile-name">이름</span>
  //   </div>
  //   <div class="chat-content">
  //     안녕 오늘은 어떤 하루였니? 안녕 오늘은 어떤 하루였니? 안녕 오늘은 어떤 하루였니? 안녕 오늘은 어떤 하루였니?
  //   </div>
  // </div>;

  const chatWrapper = document.createElement('div');
  chatWrapper.className = `${isMy ? 'my' : 'other'}-chat-content`;

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

  // content
  const chatContent = document.createElement('div');
  chatContent.className = 'chat-content';
  chatContent.innerHTML = message.replace(/\r|\n/g, '<br/>');

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
