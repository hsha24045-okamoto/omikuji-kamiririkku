// --- LYRICS DATABASE ---
const lyricsDatabase = [
    "テストの点数で決まるわけない将来！<br>ここから巻き起こすぜ巨大な大限界突破！！",
    "学校生まれ スマホ画面育ち！<br>令和のダチは大体友達！！",
    "高い飯より、ダチとのサイゼ！<br>マニュアルは無いぜ、自分を開拓！！",
    "狭い校舎（フッド）から、飛び出す世界！<br>お前が主役で、代わりはいない！！",
    "お前の悩みはただの一時のナイトメア！<br>ここから飛び出すキミはタイムマシーン！！"
];

// --- WEB AUDIO API (Procedural Track Generator) ---
let audioCtx = null;
let beatInterval = null;

function startProceduralBeat() {
    if (!audioCtx) { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    let tempo = 90;
    let quarterNoteTime = 60 / tempo;
    let nextNoteTime = audioCtx.currentTime;
    let step = 0;

    function playKick(time) {
        let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(120, time); osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
        gain.gain.setValueAtTime(1, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        osc.start(time); osc.stop(time + 0.3);
    }
    function playSnare(time) {
        let bufferSize = audioCtx.sampleRate * 0.15; let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        let noise = audioCtx.createBufferSource(); noise.buffer = buffer;
        let filter = audioCtx.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 1000;
        let gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.7, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
        noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        noise.start(time); noise.stop(time + 0.15);
    }
    function playHiHat(time) {
        let bufferSize = audioCtx.sampleRate * 0.04; let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; }
        let noise = audioCtx.createBufferSource(); noise.buffer = buffer;
        let filter = audioCtx.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = 7000;
        let gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.3, time); gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);
        noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        noise.start(time); noise.stop(time + 0.04);
    }

    beatInterval = setInterval(() => {
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            if (step === 0 || step === 4 || step === 10) playKick(nextNoteTime);
            if (step === 4 || step === 12) playSnare(nextNoteTime);
            if (step % 2 === 0) playHiHat(nextNoteTime);
            nextNoteTime += quarterNoteTime / 4;
            step = (step + 1) % 16;
        }
    }, 25);
}

function stopProceduralBeat() {
    if (beatInterval) { clearInterval(beatInterval); beatInterval = null; }
}

// --- DOM NAVIGATION & SCREEN LOGIC ---
const btnKamase = document.getElementById('btn-kamase');
const buildupOverlay = document.getElementById('buildup-overlay');
const energyBar = document.getElementById('energy-bar');

const screenTop = document.getElementById('screen-top');
const screenResult = document.getElementById('screen-result');
const screenCollection = document.getElementById('screen-collection');

const resultLyric = document.getElementById('result-lyric');
const collectionList = document.getElementById('collection-list');

const btnRetry = document.getElementById('btn-retry');
const btnSave = document.getElementById('btn-save');
const btnShare = document.getElementById('btn-share');
const btnGoCollection = document.getElementById('btn-go-collection');
const btnBackToTop = document.getElementById('btn-back-to-top');

let currentLyric = "";
let progress = 0;
let progressInterval = null;
const requiredDuration = 1500;

// 長押しロジック
function startPress(e) {
    e.preventDefault();
    progress = 0; energyBar.style.width = '0%';
    buildupOverlay.classList.remove('hidden');
    progressInterval = setInterval(() => {
        progress += 20;
        let percentage = (progress / requiredDuration) * 100;
        if (percentage > 100) percentage = 100;
        energyBar.style.width = percentage + '%';
        if (progress >= requiredDuration) { clearInterval(progressInterval); triggerResult(); }
    }, 20);
}
function cancelPress() {
    clearInterval(progressInterval);
    if (progress < requiredDuration) { buildupOverlay.classList.add('hidden'); energyBar.style.width = '0%'; }
}

function triggerResult() {
    buildupOverlay.classList.add('hidden');
    const randomIndex = Math.floor(Math.random() * lyricsDatabase.length);
    currentLyric = lyricsDatabase[randomIndex];
    resultLyric.innerHTML = currentLyric;
    
    screenTop.classList.remove('active');
    screenResult.classList.add('active');
    startProceduralBeat();
}

btnKamase.addEventListener('mousedown', startPress);
btnKamase.addEventListener('touchstart', startPress, { passive: false });
window.addEventListener('mouseup', cancelPress);
window.addEventListener('touchend', cancelPress);

btnRetry.addEventListener('click', () => {
    stopProceduralBeat();
    screenResult.classList.remove('active');
    screenTop.classList.add('active');
});

// --- 【追加】LOCAL STORAGE を使ったセーブ機能 ---
btnSave.addEventListener('click', () => {
    if (!currentLyric) return;
    
    // 現在LocalStorageにあるデータを取得
    let savedLyrics = JSON.parse(localStorage.getItem('saved_lyrics')) || [];
    
    // 同じリリックの重複登録を防ぐ
    if (!savedLyrics.includes(currentLyric)) {
        savedLyrics.push(currentLyric);
        localStorage.setItem('saved_lyrics', JSON.stringify(savedLyrics));
        alert('🔥 リリックをコレクションにキープしたぜ！');
    } else {
        alert('📢 そのリリックはすでにコレクション済みだぜ！');
    }
});

// リリック帳（コレクション）の表示更新
function updateCollectionUI() {
    let savedLyrics = JSON.parse(localStorage.getItem('saved_lyrics')) || [];
    collectionList.innerHTML = ""; // 画面を一度リセット
    
    if (savedLyrics.length === 0) {
        collectionList.innerHTML = `<p class="empty-message">まだリリックが保存されてないぜ！<br>トップに戻ってカマしてきな！</p>`;
    } else {
        // 新しく保存したものほど上に表示（reverse）
        savedLyrics.reverse().forEach(lyric => {
            const div = document.createElement('div');
            div.className = 'saved-lyric-item';
            div.innerHTML = lyric;
            collectionList.appendChild(div);
        });
    }
}

// 画面遷移：コレクションへ
btnGoCollection.addEventListener('click', () => {
    stopProceduralBeat(); // 画面移動時はバックトラックをストップ
    updateCollectionUI();
    screenTop.classList.remove('active');
    screenResult.classList.remove('active');
    screenCollection.classList.add('active');
});

// 画面遷移：トップに戻る
btnBackToTop.addEventListener('click', () => {
    screenCollection.classList.remove('active');
    screenTop.classList.add('active');
});

btnShare.addEventListener('click', () => {
    const text = resultLyric.innerText.replace(/\n/g, ' ');
    alert(`📢 SNSへシェア:\n「今日の神リリック：『${text}』 #神リリック」`);
});