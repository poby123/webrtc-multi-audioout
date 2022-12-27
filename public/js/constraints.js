/**
 * RTCPeerConnection configuration
 */
const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302',
        },
        {
            url: 'turn:192.158.29.39:3478?transport=udp',
            credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
            username: '28224511:1379330808',
        },
    ],
};
/**
 * UserMedia constraints
 */
const constraints = {
    video: {
        width: 1280,
        height: 720
    },
    audio: {
        autoGainControl: false,
        channelCount: 2,
        echoCancellation: false,
        latency: 0,
        noiseSuppression: false,
        sampleRate: 48000,
        sampleSize: 16,
        volume: 1.0
    }
};