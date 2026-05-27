// --- LYRICS DATABASE (神リリック 5大アレンジ・セレクション) ---
// 有名ラッパーのレジェンド級リリックを高校生向けにバチバチにサンプリング・アレンジ！
const lyricsDatabase = [
    // 1. R-指定（Creepy Nuts）オマージュ 【限界突破・テスト対策】
    "テストの点数で決まるわけない将来！<br>ここから巻き起こすぜ巨大な大限界突破！！",
    
    // 2. Zeebra / Dragon Ashオマージュ 【ストリート・ダチ最高】
    "学校生まれ スマホ画面育ち！<br>令和のダチは大体友達！！",
    
    // 3. ZORNオマージュ 【チル・等身大の日常・エモ】
    "高い飯より、ダチとのサイゼ！<br>マニュアルは無いぜ、自分を開拓！！",
    
    // 4. BAD HOPオマージュ 【成り上がり・圧倒的自信】
    "狭い校舎（フッド）から、飛び出す世界！<br>お前が主役で、代わりはいない！！",
    
    // 5. Novel Coreオマージュ 【スピード感・悩み撃破】
    "お前の悩みはただの一時のナイトメア！<br>ここから飛び出すキミはタイムマシーン！！"
];

// --- WEB AUDIO API を用いたビート（バックトラック）動的生成 ---
// シンセサイザーの仕組みを使い、数行の数学処理で実機スピーカーからLo-Fiドラムループをループ再生させます。
let audioCtx = null;
let beatInterval = null;

function startProceduralBeat() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    let tempo = 90; // HipHop定番のBPM 90
    let quarterNoteTime = 60 / tempo;
    let nextNoteTime = audioCtx.currentTime;
    let step = 0;

    // キック（バスドラム）の数式生成
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

    // スネアドラムのホワイトノイズ生成
    function playSnare(time) {
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

    // ハイハットの金属音生成
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

    // 16ステップシーケンサーのループ起動
    beatInterval = setInterval(() => {
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            if (step === 0 || step === 4 || step === 10) {
                playKick(nextNoteTime);
            }
            if (step === 4 || step === 12) {
                playSnare(nextNoteTime);
            }
            if (step % 2 === 0) {
                playHiHat(nextNoteTime);
            }
            nextNoteTime += quarterNoteTime / 4;
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


// --- 長押し（ロングプレス）イベントハンドラー群 ---
const btnKamase = document.getElementById('btn-kamase');
const buildupOverlay = document.getElementById('buildup-overlay');
const energyBar = document.getElementById('energy-bar');
const screenTop = document.getElementById('screen-top');
const screenResult = document.getElementById('screen-result');
const resultLyric = document.getElementById('result-lyric');
const btnRetry = document.getElementById('btn-retry');
const btnSave = document.getElementById('btn-save');
const btnShare = document.getElementById('btn-share');

let progress = 0;
let progressInterval = null;
const requiredDuration = 1500; // 1.5秒間のホールドで抽選完了

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
    
    // ランダムで新アレンジリリックを決定
    const randomIndex = Math.floor(Math.random() * lyricsDatabase.length);
    resultLyric.innerHTML = lyricsDatabase[randomIndex];
    
    // 画面切り替え
    screenTop.classList.remove('active');
    screenResult.classList.add('active');
    
    // ビート再生開始
    startProceduralBeat();
}

// マウスとスマホ（タッチ）の両方の長押しに対応
btnKamase.addEventListener('mousedown', startPress);
btnKamase.addEventListener('touchstart', startPress, { passive: false });
window.addEventListener('mouseup', cancelPress);
window.addEventListener('touchend', cancelPress);

// 「もう一度かます」ボタンの処理
btnRetry.addEventListener('click', () => {
    stopProceduralBeat();
    screenResult.classList.remove('active');
    screenTop.classList.add('active');
});

// コレクション機能のモック
btnSave.addEventListener('click', () => {
    alert('🔥 コレクションに神リリックをキープしたぜ！マイメン！');
});

// SNSシェア機能のモック
btnShare.addEventListener('click', () => {
    const text = resultLyric.innerText.replace(/<br>/g, ' ');
    alert(`📢 SNSへシェア画面を起動:\n「今日の運勢これ、韻固すぎw 『${text}』 #神リリック」`);
});