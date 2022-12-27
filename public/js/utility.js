function makeid(length) {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function createSoundMeter(id, stream) {
    let meter = document.createElement('meter');
    meter.id = `meter_${id}`;
    meter.max = 1;
    meter.high = 0.25;
    meter.value = 0;

    try {
        const soundMeter = new SoundMeter(new AudioContext());
        soundMeter.connectToSource(stream, (e) => {
            if (e) {
                alert(e);
                return meter;
            }
            meterRefreshs[id] = setInterval(() => {
                meter.value = soundMeter.instant.toFixed(2);
            }, 200);
        });
    } catch (e) {
        console.log('Web Audio API not supported');
    }

    return meter;
}

function updateLocalSoundMeter(stream) {
    let meter = document.getElementById('local-sound-meter');
    meter.max = 1;
    meter.high = 0.25;
    meter.value = 0;

    try {
        localSoundMeter.connectToSource(stream, (e) => {
            if (e) {
                alert(e);
            }
            meterRefreshs['local'] = setInterval(() => {
                meter.value = localSoundMeter.instant.toFixed(2);
            }, 200);
        });
    } catch (e) {
        console.log('Web Audio API not supported');
    }
}

function handleSoundChange(e) {
    console.log('handle sound change');
    let selector = document.getElementById(e.target.id);
    let target_id = e.target.id.replace('selector_', '');
    console.log(target_id);
    let target = document.getElementById(target_id);

    if (selector.value === 'mute') {
        target.muted = true;
    } else {
        target.muted = false;
        target.setSinkId(selector.value);
    }
}

function exit() {
    window.focus();
    const result = confirm('회의를 나가시겠습니까?');
    if (result) {
        location.replace('/');
    }
}