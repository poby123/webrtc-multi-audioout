### Todo
0. SoundMeter의 입력이 너무 작다...
1. 사용자가 선택한 미디어 입력 기억하기
    - 유효하지 않은 입력인 경우에 대한 확인과 처리.
2. Redis를 연동한 Socket.io, Session, Room Object 클러스터링 

### Solved
1. Audio Quality
- https://stackoverflow.com/questions/46063374/is-it-really-possible-for-webrtc-to-stream-high-quality-audio-without-noise
- https://www.npmjs.com/package/simple-peer/v/9.1.0#api

<br/>

simple peer api를 통해서 SDP transform을 변경하였다.


### How to use
#### 1. key 값 설정
사용하기 위해서는 먼저 아래와 같은 파일을 추가해서 각 내용에 맞는 키를 환경변수로 설정하거나 직접 넣어주시면 됩니다.
`server/config/constants.js`
```js
module.exports = {
    AES_KEY: process.env.AES_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SESSION_KEY: process.env.SESSION_KEY,
}
```

#### 2. 실행
```sh
npm install -g pm2@latest
npm run test
``` 