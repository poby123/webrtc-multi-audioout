#!/bin/bash

# redis install
sudo apt install lsb-release
sudo apt-get update
sudo apt-get install redis

# npm package install
sudo git clone https://github.com/poby123/webrtc-multi-audioout.git
cd webrtc-multi-audioout
sudo npm install -g pm2
sudo npm install

# You should make .env file to define environment variables!
# npm run startWithRedis