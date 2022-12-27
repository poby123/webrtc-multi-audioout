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