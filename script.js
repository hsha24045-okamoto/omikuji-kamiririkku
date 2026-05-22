// --- LYRICS DATA ---
// 高校生に刺さる、バチバチに韻を踏んだポジティブなリリック（おみくじ結果）
const lyricsDatabase = [
    "今日のキミは完全に無敵のモード<br>迷わず進めろ自分だけのロード！",
    "テストの点数なんて気にするなマイメン<br>お前のポテンシャルは常に最前！",
    "既読スルーに悩む時間は超ムダ<br>自分磨いてステージ上で踊りな！",
    "周りの雑音はすべてシャットアウト<br>キミの熱いパッションでぶちかます大番狂わせ！",
    "今は低空飛行でも問題ないぜ<br>ここから一気にトップへフライハイ！",
    "控えめに言って今日の運勢は最高級<br>放つリリックはすべて快速球！",
    "悩みがあるなら全部ビートに乗せな<br>明日の主役は間違いなくお前だ！"
];

// --- WEB AUDIO API FOR PROCEDURAL BEAT GENERATION ---
// 本物のヒップホップビートに近いLo-Fi系のドラムループをシンセで動的生成します（外部ファイル不要）
let audioCtx = null;
let beatInterval = null;

function startProceduralBeat() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    let tempo = 90; // HipHop BPM
    let quarterNoteTime = 60 / tempo;
    let nextNoteTime = audioCtx.currentTime;
    let step = 0;

    function playKick(time) {
        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.frequency.setValueAtTime(120, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);

        osc.start(time);
        osc.stop(time + 0.3);
    }

    function playSnare(time) {
        // Noise buffer for snare snapping
        let bufferSize = audioCtx.sampleRate * 0.15;
        let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        let noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        let filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;

        let gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.7, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start(time);
        noise.stop(time + 0.15);
    }

    function playHiHat(time) {
        let bufferSize = audioCtx.sampleRate * 0.04;
        let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        let noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        let filter = audioCtx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;

        let gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        noise.start(time);
        noise.stop(time + 0.04);
    }

    // Sequencer Loop
    beatInterval = setInterval(() => {
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            // Kick on 1 and 3
            if (step === 0 || step === 4 || step === 10) {
                playKick(nextNoteTime);
            }
            // Snare on 2 and 4
            if (step === 4 || step === 12) {
                playSnare(nextNoteTime);
            }
            // Continuous Hi-hats
            if (step % 2 === 0) {
                playHiHat(nextNoteTime);
            }

            nextNoteTime += quarterNoteTime / 4; // 16th notes
            step = (step + 1) % 16;
        }
    }, 25);
}

function stopProceduralBeat() {
    if (beatInterval) {
        clearInterval(beatInterval);
        beatInterval = null;
    }
}


// --- UI INTERACTIONS & LONGPRESS ---
const btnKamase = document.getElementById('btn-kamase');
const buildupOverlay = document.getElementById('buildup-overlay');
const energyBar = document.getElementById('energy-bar');

const screenTop = document.getElementById('screen-top');
const screenResult = document.getElementById('screen-result');
const resultLyric = document.getElementById('result-lyric');

const btnRetry = document.getElementById('btn-retry');
const btnSave = document.getElementById('btn-save');
const btnShare = document.getElementById('btn-share');

let pressTimer = null;
let progress = 0;
let progressInterval = null;
const requiredDuration = 1500; // 1.5 seconds hold required

function startPress(e) {
    e.preventDefault();
    progress = 0;
    energyBar.style.width = '0%';
    buildupOverlay.classList.remove('hidden');

    progressInterval = setInterval(() => {
        progress += 20;
        let percentage = (progress / requiredDuration) * 100;
        if (percentage > 100) percentage = 100;
        energyBar.style.width = percentage + '%';

        if (progress >= requiredDuration) {
            clearInterval(progressInterval);
            triggerResult();
        }
    }, 20);
}

function cancelPress() {
    clearInterval(progressInterval);
    if (progress < requiredDuration) {
        buildupOverlay.classList.add('hidden');
        energyBar.style.width = '0%';
    }
}

function triggerResult() {
    buildupOverlay.classList.add('hidden');
    
    // Pick random lyric
    const randomIndex = Math.floor(Math.random() * lyricsDatabase.length);
    resultLyric.innerHTML = lyricsDatabase[randomIndex];
    
    // Switch Screen
    screenTop.classList.remove('active');
    screenResult.classList.add('active');
    
    // Fire up the HipHop Audio Background Loop
    startProceduralBeat();
}

// Event Listeners for Longpress (Supports Mouse and Touch)
btnKamase.addEventListener('mousedown', startPress);
btnKamase.addEventListener('touchstart', startPress, { passive: false });

window.addEventListener('mouseup', cancelPress);
window.addEventListener('touchend', cancelPress);

// Retry/Back Button
btnRetry.addEventListener('click', () => {
    stopProceduralBeat();
    screenResult.classList.remove('active');
    screenTop.classList.add('active');
});

// Mock feature triggers for Save & Share
btnSave.addEventListener('click', () => {
    alert('🔥 コレクションにリリックをキープしたぜ！マイメン！');
});

btnShare.addEventListener('click', () => {
    const text = resultLyric.innerText.replace(/\n/g, ' ');
    alert(`📢 SNSへシェア画面を起動:\n「今日の運勢これ、韻固すぎw 『${text}』 #神リリック」`);
});