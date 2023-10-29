import { createContext, useState } from 'react';
const RTCContext = createContext();
const user = window.__user || {
  username: '홍길동',
  userid: 123456,
  profile: undefined,
  sessionId: 1378292372,
  status: '',
};
const INIT_STATE = { user };
const RTCContextProvider = ({ children }) => {
  const [myInfo, setMyInfo] = useState(INIT_STATE);
  return <RTCContext.Provider value={{ myInfo, setMyInfo }}>{children}</RTCContext.Provider>;
};
const RTCContextConsumer = RTCContext.Consumer;
export { RTCContext, RTCContextConsumer, RTCContextProvider };
export default RTCContext;
