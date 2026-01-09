
let DATASETS = {}; // Dynamically loaded
const LOTTIE_PATH = './assets/dog.json';

// --- Icons (SVG Strings) ---
const ICONS = {
    eye_off: '<svg viewBox="0 0 24 24" class="icon-svg"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>',
    eye_on: '<svg viewBox="0 0 24 24" class="icon-svg"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    speaker: '<svg viewBox="0 0 24 24" class="icon-svg"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>',
    home: '<svg viewBox="0 0 24 24" class="icon-sm" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
};

class App {
    constructor() {
        this.words = [];
        this.quizQueue = [];
        this.results = [];
        this.homeLottie = null;
        this.resultLottie = null;
        this.answering = false;
        this.speechUnlocked = false; // iOS PWA向け: SpeechSynthesis APIアンロック状態
        this.audioCtx = null;        // Web Audio API Context
        // Dataset key will be validated after loading datasets
        this.currentDatasetKey = localStorage.getItem('lab_dataset_key');
    }

    get currentConfig() { return DATASETS[this.currentDatasetKey]; }

    // --- Core Logic ---
    async init() {
        this.initAudio();
        await this.loadDatasets();
        if (!this.currentConfig) {
            // Fallback if saved key is invalid or null
            this.currentDatasetKey = Object.keys(DATASETS)[0];
            if (this.currentDatasetKey) {
                localStorage.setItem('lab_dataset_key', this.currentDatasetKey);
            }
        }

        if (this.currentConfig) {
            await this.loadData();
        } else {
            console.error("No valid dataset configuration found.");
        }

        // Dispatch init based on current page
        const path = window.location.pathname;
        if (path.includes('index.html') || path.endsWith('/')) this.initHome();
        else if (path.includes('priming.html')) this.initPriming();
        else if (path.includes('quiz.html')) this.initQuiz();
        else if (path.includes('result.html')) this.initResult();
        else if (path.includes('list.html')) this.initList();
        else if (path.includes('records.html')) this.initRecords();
        else if (path.includes('settings.html')) this.initSettings();
    }

    async loadDatasets() {
        try {
            const res = await fetch('./words/lists.csv');
            if (res.ok) {
                const text = await res.text();
                const rows = this.parseRawCSV(text);

                DATASETS = {};
                // Skip header (i=1)
                for (let i = 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row.length < 2) continue;

                    const filename = row[0];
                    const desc = row[1];
                    // Derive key from filename (e.g., 'NGSL.csv' -> 'NGSL')
                    const key = filename.replace('.csv', '');

                    // Maintain backward compatibility for storage keys where possible
                    let storageKey = 'lab_data_' + key.toLowerCase();
                    if (key === 'NGSL') storageKey = 'lab_data_v30';
                    if (filename === 'IELTS3500.csv') storageKey = 'lab_data_ielts';

                    DATASETS[key] = {
                        label: desc,
                        path: './words/' + filename,
                        storageKey: storageKey
                    };
                }
            } else {
                console.error("Failed to load lists.csv");
            }
        } catch (e) { console.error("Load Datasets Error", e); }
    }

    async loadData() {
        const config = this.currentConfig;
        if (!config) return;

        const local = localStorage.getItem(config.storageKey);
        if (local) {
            this.words = JSON.parse(local);
            // Migration: Cap level at 4 (Remove Lv5)
            this.words.forEach(w => {
                if (w.stats && w.stats.level > 4) w.stats.level = 4;
            });
        } else {
            try {
                const res = await fetch(config.path);
                if (res.ok) {
                    const text = await res.text();
                    this.parseCSV(text, true);
                }
            } catch (e) { console.error("Load Data Error", e); }
        }
    }

    saveData() {
        if (this.currentConfig) {
            localStorage.setItem(this.currentConfig.storageKey, JSON.stringify(this.words));
        }
    }

    // A robust CSV parser that handles quoted fields and commas inside them
    parseRawCSV(text) {
        const arr = [];
        let quote = false;  // 'true' means we're inside a quoted field
        let col = 0;    // current column index
        let row = 0;    // current row index

        for (let c = 0; c < text.length; c++) {
            let cc = text[c], nc = text[c + 1];        // current character, next character
            arr[row] = arr[row] || [];             // create a new row if necessary
            arr[row][col] = arr[row][col] || '';   // create a new column (start with empty string) if necessary

            if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  // escape double quotes
            if (cc == '"') { quote = !quote; continue; }
            if (cc == ',' && !quote) { ++col; continue; }
            if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
            if (cc == '\n' && !quote) { ++row; col = 0; continue; }
            if (cc == '\r' && !quote) { ++row; col = 0; continue; }

            arr[row][col] += cc;
        }
        return arr;
    }

    parseCSV(text, isInit = false) {
        const rows = this.parseRawCSV(text);
        const newItems = [];

        // Assume row 0 is header, start from 1
        for (let i = 1; i < rows.length; i++) {
            const c = rows[i];
            if (c.length < 6) continue; // Skip empty/invalid rows (need at least 6 required columns)

            // Expected format based on headers: ID,単語,品詞,意味,例文,訳文,発音記号,類義語,反意語,SVL
            // c[0]: ID, c[1]: Word, c[2]: POS, c[3]: Meaning, c[4]: Example, c[5]: Translation
            // c[6]: Pronunciation (optional), c[7]: Synonyms (optional), c[8]: Antonyms (optional), c[9]: SVL (optional)

            // ID Generation: Prioritize valid number in c[0], otherwise use index (1-based)
            let id = i;
            const csvId = parseInt(c[0]);
            if (!isNaN(csvId) && csvId > 0) {
                id = csvId;
            }

            newItems.push({
                id: id,
                en: c[1] || "",
                pos: c[2] ? c[2].split('/')[0] : "", // Handle potential splits like "接続詞/代名詞"
                ja: c[3] || "",
                ex: c[4] || "",
                exJa: c[5] || "",
                pronunciation: c[6] || "",
                synonyms: c[7] || "",
                antonyms: c[8] || "",
                svl: c[9] || "",
                stats: { level: 0, nextReview: 0 }
            });
        }
        if (isInit) {
            this.words = newItems;
            this.saveData();
        }
        return newItems;
    }

    // --- Home Screen ---
    initHome() {
        document.getElementById('total-words-count').innerText = this.words.length;
        this.renderChart('home-chart', this.getLevelDistribution());
        this.renderHearts('home-hearts');
        this.updateHearts('home-hearts');
        this.initLottie('lottie-dog', true);
        this.startRandomMessages();

        // Chart click handler
        const chartTitle = document.getElementById('home-chart-title');
        if (chartTitle) {
            chartTitle.onclick = () => this.showLevelHelp();
        }

        // Affinity Progress
        const hearts = document.getElementById('home-hearts');
        if (hearts) {
            hearts.style.cursor = 'pointer';
            hearts.onclick = () => this.showAffinityProgress();
        }

        // Restore settings and attach listeners
        this.loadHomeSettings();
        this.bindHomeSettingsEvents();

        // iOS Add to Home Screen Banner
        this.checkA2HSBanner();
    }

    startRandomMessages() {
        const delay = Math.floor(Math.random() * 10000) + 5000; // 5-15s
        setTimeout(() => {
            const bubble = document.getElementById('dog-bubble');
            if (bubble && window.getComputedStyle(bubble).display !== 'none') {
                this.petDog();
                this.startRandomMessages();
            }
        }, delay);
    }

    showLevelHelp() {
        const existing = document.getElementById('custom-modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'custom-modal-overlay';
        overlay.className = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">レベル別出題形式</div>
                <div class="modal-content">
                    <div class="modal-row"><span class="modal-badge lv0" style="min-width:100px;">未学習・苦手</span> <span class="modal-desc">英→日</span></div>
                    <div class="modal-row"><span class="modal-badge lv2" style="min-width:100px;">うろ覚え</span> <span class="modal-desc">英→日 (非表示)</span></div>
                    <div class="modal-row"><span class="modal-badge lv3" style="min-width:100px;">ほぼ覚えた</span> <span class="modal-desc">日→英</span></div>
                    <div class="modal-row"><span class="modal-badge lv4" style="min-width:100px;">覚えた</span> <span class="modal-desc">例文穴埋め</span></div>
                </div>
                <button class="modal-close-btn" onclick="document.getElementById('custom-modal-overlay').remove()">閉じる</button>
            </div>
        `;
        overlay.onclick = (e) => {
            if (e.target === overlay) overlay.remove();
        };
        document.body.appendChild(overlay);
    }

    startSession(config = null) {
        // iOS PWAでSpeechSynthesisをアンロック（ユーザーアクション中に実行）
        this.unlockSpeech();

        let method, problem, limit, timer, priming, levelSelect;

        if (config) {
            // Support legacy config structure just in case, though structure changed
            method = config.method || 'auto';
            problem = config.problem || 'auto';
            limit = config.limit || 10;
            timer = config.timer || 10;
            priming = config.priming;
            levelSelect = config.levelSelect || 'auto';
            // Legacy mapping
            if (config.mode) problem = (config.mode === 'new') ? 'auto' : 'auto';
        } else {
            method = document.getElementById('method-select').value;
            problem = document.getElementById('problem-select').value;
            limit = parseInt(document.getElementById('limit-select').value);
            timer = parseInt(document.getElementById('timer-select').value);
            priming = document.getElementById('use-priming').checked;
            levelSelect = 'auto'; // Force auto since UI is removed

            // Save config for retry
            sessionStorage.setItem('lab_session_config', JSON.stringify({ method, problem, limit, timer, priming, levelSelect }));
        }

        const now = Date.now();
        let forceLevel = null;
        let q = [];

        // 1. Filter by Level (if specified)
        if (levelSelect !== 'auto') {
            const targetLevel = parseInt(levelSelect);
            q = this.words.filter(w => w.stats.level === targetLevel);
            forceLevel = targetLevel;
        }

        // 2. Filter by Problem setting
        if (q.length === 0) {
            // If specific level yielded no results or was 'auto', try Problem logic
            if (problem === 'unlearned') {
                q = this.words.filter(w => w.stats.level === 0);
            }

            // Fallback (or 'auto'): Review > Unlearned > Random mix
            if (q.length === 0) {
                // Prioritize Review
                let reviews = this.words.filter(w => w.stats.nextReview <= now && w.stats.level > 0);
                let unlearned = this.words.filter(w => w.stats.level === 0);

                // Simple Mix: Review first, then unlearned
                q = [...reviews, ...unlearned];
            }
        }

        // 3. Final Fallback (Random if empty? usually q has something unless empty DB)
        if (q.length === 0) {
            q = [...this.words];
        }

        // Shuffle and Limit
        q.sort(() => 0.5 - Math.random());
        q = q.slice(0, limit);

        if (!q.length) return alert("学習対象がありません");

        // Save Session
        // forceLevel is passed to enforce quiz type if needed (though Method overrides it now)
        sessionStorage.setItem('lab_session', JSON.stringify({
            queue: q,
            idx: 0,
            results: [],
            forceLevel: forceLevel,
            method: method,
            timer: timer,
            saved: false
        }));

        if (priming) window.location.href = 'priming.html';
        else window.location.href = 'quiz.html';
    }

    // --- Priming Screen ---
    initPriming() {
        const session = JSON.parse(sessionStorage.getItem('lab_session'));
        if (!session) return window.location.href = 'index.html';

        const list = document.getElementById('priming-list');
        session.queue.forEach(w => {
            const div = document.createElement('div');
            div.className = 'priming-item';
            div.innerHTML = `
                <div class="priming-row-1"><div class="priming-en">${w.en}</div></div>
                <div class="priming-row-2">
                    <div style="display:flex; align-items:center; gap:6px;">
                        <span class="priming-pos-badge">${w.pos}</span>
                        <span class="priming-ja">${w.ja}</span>
                    </div>
                    <button class="audio-btn-mini" onclick="app.speak('${w.en.replace(/'/g, "\\'")}')">${ICONS.speaker}</button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    // --- Quiz Screen ---
    initQuiz() {
        const session = JSON.parse(sessionStorage.getItem('lab_session'));
        if (!session) return window.location.href = 'index.html';
        this.quizQueue = session.queue;
        this.idx = session.idx;
        this.results = session.results;
        this.forceLevel = session.forceLevel; // Load forceLevel
        this.sessionMethod = session.method || 'auto';
        this.sessionTimer = session.timer || 10;

        this.nextQ();
    }

    nextQ() {
        if (this.idx >= this.quizQueue.length) {
            // Finish
            sessionStorage.setItem('lab_session', JSON.stringify({ queue: this.quizQueue, idx: this.idx, results: this.results, forceLevel: this.forceLevel, method: this.sessionMethod, timer: this.sessionTimer }));
            return window.location.href = 'result.html';
        }

        const q = this.quizQueue[this.idx];
        this.curr = q;
        this.maskRevealed = false;

        let type = 'standard';

        // METHOD LOGIC
        if (this.sessionMethod && this.sessionMethod !== 'auto') {
            type = this.sessionMethod;
        } else {
            // Use forceLevel if present, otherwise actual level
            const effectiveLv = (this.forceLevel !== null && this.forceLevel !== undefined) ? this.forceLevel : q.stats.level;
            if (effectiveLv >= 4) type = 'fill-in'; else if (effectiveLv >= 3) type = 'reverse'; else if (effectiveLv === 2) type = 'masked';
        }

        this.currType = type;

        // Effective Level (for display mainly, and fallback logic)
        const effectiveLv = (this.forceLevel !== null && this.forceLevel !== undefined) ? this.forceLevel : q.stats.level;
        this.renderQ(q, type, effectiveLv);

        // Audio Logic
        if (type !== 'reverse' && type !== 'fill-in') {
            setTimeout(() => this.speak(q.en), 300);
        }
    }

    renderQ(q, type, lv) {
        // ... (Logic from v48) ...
        const labels = ["未学習", "苦手", "うろ覚え", "ほぼ覚えた", "覚えた"];
        const colors = ["var(--lv0)", "var(--lv1)", "var(--lv2)", "var(--lv3)", "var(--lv4)"];

        document.getElementById('quiz-level-display').innerHTML = labels[lv];
        document.getElementById('quiz-level-display').style.background = colors[lv];

        document.getElementById('quiz-progress').innerText = `${this.idx + 1} / ${this.quizQueue.length}`;

        const qText = document.getElementById('q-text');
        const posBadge = document.getElementById('pos-badge');
        const spkBtn = document.getElementById('speaker-btn');
        const eyeBtn = document.getElementById('mask-toggle-btn');
        const feedbackEl = document.getElementById('inline-feedback');

        // Reset styles
        qText.classList.remove('long', 'masked');
        feedbackEl.className = 'inline-feedback';
        feedbackEl.innerText = '';

        // Reset feedback icon
        const feedbackIcon = document.getElementById('feedback-icon');
        if (feedbackIcon) {
            feedbackIcon.classList.remove('show');
            feedbackIcon.style.display = 'none';
        }

        // Icon Visibility Control
        const showIcons = (type !== 'reverse' && type !== 'fill-in');

        posBadge.style.display = (type === 'standard' && q.pos) ? 'inline-block' : 'none';
        posBadge.innerText = q.pos;

        spkBtn.style.display = showIcons ? 'flex' : 'none';
        eyeBtn.style.display = showIcons ? 'flex' : 'none';

        // Setup Eye Icon (Default Off)
        eyeBtn.innerHTML = ICONS.eye_off;

        if (type === 'masked') {
            qText.innerText = q.en;
            qText.classList.add('masked');
            // 音声再生はnextQ()で一元管理するためここでは呼ばない
        } else if (type === 'reverse') {
            qText.innerText = q.ja;
        } else if (type === 'fill-in' && q.ex) {
            const safe = q.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            qText.innerHTML = q.ex.replace(new RegExp(`\\b${safe}\\b`, 'gi'), '_______');
            qText.classList.add('long');
        } else {
            qText.innerText = q.en;
            // standard mode speaks automatically in nextQ
        }

        // Choices
        const area = document.getElementById('choices-area');
        area.innerHTML = '';
        let isRev = (type === 'reverse');
        let pool = isRev ? this.words.map(w => w.en) : this.words.map(w => w.ja);
        if (type === 'fill-in') pool = this.words.map(w => w.en);
        let correct = isRev ? q.en : q.ja;
        if (type === 'fill-in') correct = q.en;

        let wrongs = [];
        while (wrongs.length < 3) {
            const r = pool[Math.floor(Math.random() * pool.length)];
            if (r !== correct && !wrongs.includes(r)) wrongs.push(r);
        }
        const choices = [...wrongs, correct].sort(() => 0.5 - Math.random());
        choices.forEach(t => {
            const b = document.createElement('div');
            b.className = 'choice-btn'; b.innerText = t;
            // Store correct status in data attribute for easy finding later
            b.dataset.isCorrect = (t === correct);
            b.onclick = (e) => this.answer(t === correct, b);
            area.appendChild(b);
        });

        this.startTimer();
    }

    toggleMask() {
        const el = document.getElementById('q-text');
        const btn = document.getElementById('mask-toggle-btn');
        if (el.classList.contains('masked')) {
            el.classList.remove('masked');
            btn.innerHTML = ICONS.eye_on;
            this.maskRevealed = true;
        } else {
            el.classList.add('masked');
            btn.innerHTML = ICONS.eye_off;
        }
    }

    startTimer() {
        const bar = document.getElementById('timer-bar');
        const duration = (this.sessionTimer || 10) * 1000;

        bar.style.transition = 'none'; bar.style.width = '100%';
        // Force reflow
        bar.offsetHeight;

        setTimeout(() => {
            bar.style.transition = `width ${duration / 1000}s linear`;
            bar.style.width = '0%';
        }, 10);

        this.startTime = Date.now();
        this.timer = setTimeout(() => this.answer(false, null), duration);
    }

    answer(isCorrect, btn) {
        if (this.answering) return; // Prevent double click
        this.answering = true;

        const timeTaken = Date.now() - this.startTime;
        const limit = (this.sessionTimer || 10) * 1000;
        let isExcellent = isCorrect && (timeTaken <= limit / 4);
        let isGreat = isCorrect && !isExcellent && (timeTaken <= limit / 2);

        // Sound Effect -> TTS Feedback
        if (isCorrect) {
            if (isExcellent) this.speakFeedback("Excellent!");
            else if (isGreat) this.speakFeedback("Great!");
            else this.speakFeedback("Good!");
        } else {
            this.speakFeedback("Uh-oh...");
        }

        // Immediate Style Feedback
        if (btn) {
            btn.classList.add(isCorrect ? 'correct' : 'wrong');
        } else if (!isCorrect) {
            // Skip or Time out
        }

        // If wrong answer, show the correct one
        if (!isCorrect) {
            const correctBtn = document.querySelector('.choice-btn[data-is-correct="true"]');
            if (correctBtn) correctBtn.classList.add('correct-highlight');
        }

        if (this.timer) clearTimeout(this.timer);
        const q = this.curr;

        // Update Stats in Master Data
        const masterIdx = this.words.findIndex(w => w.id === q.id);
        let newLevel = q.stats.level;
        const oldLevel = q.stats.level;

        if (masterIdx > -1) {
            const w = this.words[masterIdx];

            // Updated SRS Logic (Fixed Intervals)
            // Lv.0(Unlearned), Lv.1(1d), Lv.2(3d), Lv.3(1w), Lv.4(2w)
            const INTERVALS = [0, 1, 3, 7, 14];

            if (isCorrect) {
                // Excellent: +3, Great: +2, Good: +1
                const increment = isExcellent ? 3 : (isGreat ? 2 : 1);
                w.stats.level = Math.min(4, w.stats.level + increment);
                w.stats.nextReview = Date.now() + INTERVALS[w.stats.level] * 86400000;
            } else {
                // Incorrect: Level -1 (min 0)
                w.stats.level = Math.max(0, w.stats.level - 1);
                w.stats.nextReview = Date.now() + INTERVALS[w.stats.level] * 86400000;
            }
            newLevel = w.stats.level;
            this.saveData(); // Persist immediately

            let quality = isCorrect ? (isExcellent ? 'excellent' : (isGreat ? 'great' : 'good')) : 'bad';

            // Push result with updated state and oldLevel
            this.results.push({ word: w, correct: isCorrect, diff: isCorrect ? 1 : 0, oldLevel: oldLevel, newLevel: w.stats.level, quality: quality });
        }

        // Update Daily Count
        this.incrementDailyCount();

        // Update Affinity Points (New System)
        if (isCorrect) {
            const bonus = (isExcellent || isGreat) ? 0.5 : 0;
            this.addAffinityPoints(1 + bonus);
        }

        // UI Feedback (Inline)
        // マスクが適用されていれば解除する
        const qText = document.getElementById('q-text');
        if (qText && qText.classList.contains('masked')) {
            qText.classList.remove('masked');
            const maskBtn = document.getElementById('mask-toggle-btn');
            if (maskBtn) maskBtn.innerHTML = ICONS.eye_on;
        }

        const fb = document.getElementById('inline-feedback');
        const feedbackIcon = document.getElementById('feedback-icon');
        if (isCorrect) {
            if (isExcellent) {
                fb.innerHTML = "Excellent!";
                fb.className = 'inline-feedback excellent';
                if (feedbackIcon) {
                    feedbackIcon.src = './assets/flower-circle.svg';
                    feedbackIcon.style.display = 'block';
                    setTimeout(() => feedbackIcon.classList.add('show'), 10);
                }
            } else if (isGreat) {
                fb.innerHTML = "Great!";
                fb.className = 'inline-feedback great';
                if (feedbackIcon) {
                    feedbackIcon.src = './assets/double_circle.svg';
                    feedbackIcon.style.display = 'block';
                    setTimeout(() => feedbackIcon.classList.add('show'), 10);
                }
            } else {
                fb.innerHTML = "Good";
                fb.className = 'inline-feedback good';
                if (feedbackIcon) {
                    feedbackIcon.src = './assets/circle.svg';
                    feedbackIcon.style.display = 'block';
                    setTimeout(() => feedbackIcon.classList.add('show'), 10);
                }
            }
        } else {
            // No text for wrong answer
        }

        setTimeout(() => {
            this.idx++;
            this.answering = false;
            // Save Session
            sessionStorage.setItem('lab_session', JSON.stringify({ queue: this.quizQueue, idx: this.idx, results: this.results, forceLevel: this.forceLevel, method: this.sessionMethod, timer: this.sessionTimer }));
            this.nextQ();
        }, 1000);
    }

    incrementDailyCount() {
        const today = new Date().toLocaleDateString('ja-JP'); // YYYY/MM/DD
        let stored = JSON.parse(localStorage.getItem('lab_today_count')) || { date: today, count: 0 };

        if (stored.date !== today) {
            stored = { date: today, count: 0 };
        }
        stored.count++;
        localStorage.setItem('lab_today_count', JSON.stringify(stored));
    }

    // --- Result Screen ---
    initResult() {
        const session = JSON.parse(sessionStorage.getItem('lab_session'));
        if (!session) return window.location.href = 'index.html';

        this.results = session.results;

        // Calculate & Render Points Info
        const infoEl = document.getElementById('result-points-info');
        if (infoEl) {
            // 1. Gained points (sum of level increase)
            let gained = 0;
            let correctCount = 0;
            this.results.forEach(r => {
                if (r.correct) correctCount++;
                if (r.oldLevel !== undefined && r.newLevel !== undefined) {
                    const diff = r.newLevel - r.oldLevel;
                    if (diff > 0) gained += diff;
                }
            });

            // 2. Next Heart Progress (New Affinity System)
            let progressHtml = '';
            const points = this.getAffinityPoints();
            const currentAff = Math.floor(points / 10);

            if (currentAff < 10) {
                const nextTarget = (currentAff + 1) * 10;
                const diff = nextTarget - points;
                progressHtml = `<span style="font-size:0.85rem; color:#888;">次のハートまであと <strong>${Math.ceil(diff)}</strong> ポイント</span>`;
            } else {
                progressHtml = `<span style="font-size:0.85rem; color:var(--accent);">親密度MAX 達成中！</span>`;
            }

            const totalQ = this.results.length;
            let mainMsg = '';
            if (gained > 0) {
                mainMsg = `+${gained} ポイントゲット！`;
            } else {
                mainMsg = `${correctCount}/${totalQ}問 正解！ Keep it up!`;
            }

            infoEl.innerHTML = `
                <div style="font-size:1.1rem; color:#5D4037; font-weight:bold; margin-bottom:2px;">
                    ${mainMsg}
                </div>
                ${progressHtml}
            `;
            infoEl.style.display = 'block';
        }

        // Render Daily Count
        const countEl = document.getElementById('today-count');
        if (countEl) {
            const today = new Date().toLocaleDateString('ja-JP');
            let stored = JSON.parse(localStorage.getItem('lab_today_count')) || { date: today, count: 0 };
            if (stored.date !== today) stored = { date: today, count: 0 }; // Reset if different day
            countEl.innerText = stored.count;
        }



        // Save History
        if (!session.saved) {
            let g = 0, c = 0;
            const bd = [0, 0, 0, 0, 0];
            this.results.forEach(r => {
                if (r.correct) c++;
                if (r.oldLevel !== undefined && r.newLevel !== undefined && r.newLevel > r.oldLevel) g += (r.newLevel - r.oldLevel);

                const lvl = (r.newLevel !== undefined) ? r.newLevel : r.oldLevel;
                if (lvl !== undefined && lvl >= 0 && lvl <= 4) bd[lvl]++;
            });

            const now = new Date();
            const dateStr = `${now.getFullYear()}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const hist = JSON.parse(localStorage.getItem('lab_history')) || [];

            // Try to merge if same day
            const todayKey = dateStr.substring(0, 10);
            let merged = false;

            if (hist.length > 0) {
                const latest = hist[0];
                if (latest.date && latest.date.substring(0, 10) === todayKey) {
                    latest.date = dateStr; // Update timestamp
                    latest.count += this.results.length;
                    latest.correct += c;
                    latest.points += g;
                    latest.totalPoints = this.getTotalPoints();

                    if (!latest.breakdown) latest.breakdown = [0, 0, 0, 0, 0];
                    bd.forEach((val, i) => latest.breakdown[i] += val);

                    merged = true;
                }
            }

            if (!merged) {
                hist.unshift({ date: dateStr, count: this.results.length, correct: c, points: g, breakdown: bd, totalPoints: this.getTotalPoints() });
            }
            if (hist.length > 50) hist.pop();
            localStorage.setItem('lab_history', JSON.stringify(hist));

            session.saved = true;
            sessionStorage.setItem('lab_session', JSON.stringify(session));
        }

        // Render Chart
        this.renderResultChart('result-chart');

        const list = document.getElementById('result-list');
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        this.results.forEach(r => {
            let hl = "";
            if (r.word.ex && r.word.en) {
                try { hl = r.word.ex.replace(new RegExp(`\\b${escapeRegExp(r.word.en)}\\b`, 'gi'), '<span class="highlight">$&</span>'); }
                catch (e) { hl = r.word.ex; }
            }
            // Determine quality label if missing (backward compat)
            let qLabel = r.quality;
            if (!qLabel) qLabel = r.correct ? 'good' : 'bad';

            // Map label to display text
            const qMap = { bad: 'Bad', good: 'Good', great: 'Great', excellent: 'Excellent' };
            const qText = qMap[qLabel] || 'Bad';

            const div = document.createElement('div');
            div.className = 'result-item';
            div.innerHTML = `
                <div class="result-row-flex">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:60px; flex-shrink:0;">
                         <div class="res-quality ${qLabel}">${qText}</div>
                         <div class="res-progress">
                            ${["未学習", "苦手", "うろ覚え", "ほぼ覚えた", "覚えた", "覚えた"][r.oldLevel]}<br>↓<br>${["未学習", "苦手", "うろ覚え", "ほぼ覚えた", "覚えた", "覚えた"][r.newLevel]}
                         </div>
                    </div>
                    <div class="res-main-info">
                        <div class="res-word-row">
                            <span class="res-word">${r.word.en}</span>
                            <span class="wl-pronunciation" style="font-size:0.8rem;">/${r.word.pronunciation || ''}/</span>
                            <span class="wl-svl-badge" style="margin-left:4px;">SVL ${r.word.svl || '?'}</span>
                            <button class="audio-btn-mini" style="margin-left:auto;" onclick="app.speak('${r.word.en.replace(/'/g, "\\'")}')">${ICONS.speaker}</button>
                        </div>
                        <div class="res-meaning-row" style="margin-top:2px;">
                             <span class="priming-pos-badge" style="margin-right:4px;">${r.word.pos || '?'}</span>
                             <span class="res-meaning">${r.word.ja}</span>
                        </div>
                    </div>
                </div>
                <div class="wl-ex-box">
                    <div class="wl-ex-en">${hl}</div>
                    <div class="wl-ex-ja">${r.word.exJa}</div>
                </div>`;
            list.appendChild(div);
        });
    }

    renderResultChart(id) {
        // Calculate After
        const distAfter = this.getLevelDistribution(); // Current state

        // Calculate Before
        const distBefore = [...distAfter];
        this.results.forEach(r => {
            if (r.oldLevel !== undefined && r.newLevel !== undefined) {
                if (r.newLevel !== r.oldLevel) {
                    distBefore[r.newLevel]--;
                    distBefore[r.oldLevel]++;
                }
            }
        });

        // Render with Diffs
        const c = document.getElementById(id);
        if (!c) return;
        c.innerHTML = '';
        const max = Math.max(...distAfter, ...distBefore) || 1;
        const labels = ["未学習", "苦手", "うろ覚え", "ほぼ覚えた", "覚えた"];

        distAfter.forEach((v, i) => {
            const h = (v / max) * 80;
            const diffVal = v - distBefore[i];
            let diffHtml = '';
            if (diffVal > 0) diffHtml = `<div class="chart-diff diff-plus show">+${diffVal}</div>`;
            if (diffVal < 0) diffHtml = `<div class="chart-diff diff-minus show">${diffVal}</div>`;

            c.innerHTML += `<div class="chart-bar-group">
                 <div class="chart-info">
                    ${diffHtml}
                    <div class="chart-count">${v}</div>
                 </div>
                 <div class="chart-bar bar-${i}" style="height:${Math.max(4, h)}%"></div>
                 <div class="chart-label">${labels[i]}</div>
             </div>`;
        });
    }

    // --- List Screen ---
    initList() {
        const list = document.getElementById('list-content');
        if (!list) return;

        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const frag = document.createDocumentFragment();
        this.words.forEach(w => {
            const div = document.createElement('div');
            div.className = 'word-list-item';
            let hl = "";
            if (w.ex && w.en) {
                try {
                    hl = w.ex.replace(new RegExp(`\\b${escapeRegExp(w.en)}\\b`, 'gi'), '<span class="highlight">$&</span>');
                } catch (e) { hl = w.ex; }
            }
            const posText = w.pos ? `[${w.pos}]` : "";

            const svlHtml = w.svl ? `<span class="wl-svl-badge">SVL${w.svl}</span>` : "";
            const pronHtml = w.pronunciation ? `<span class="wl-pronunciation">/${w.pronunciation}/</span>` : "";
            const relHtml = (w.synonyms || w.antonyms) ?
                `<div class="wl-row-rel">` +
                (w.synonyms ? `<span class="wl-rel-label">類義</span>${w.synonyms} ` : "") +
                (w.antonyms ? `<span class="wl-rel-label">反意</span>${w.antonyms}` : "") +
                `</div>` : "";

            div.innerHTML = `
                <div class="wl-header"><div class="wl-word"><span class="wl-id">${w.id}.</span> ${w.en}${pronHtml}</div><div style="display:flex;align-items:center;">${svlHtml}<span class="wl-level-badge" style="background:var(--lv${w.stats.level})">${["未学習", "苦手", "うろ覚え", "ほぼ覚えた", "覚えた", "覚えた"][w.stats.level]}</span></div></div>
                <div class="wl-meaning"><span class="priming-pos-badge" style="margin-right:4px;">${w.pos || "?"}</span>${w.ja}</div>
                ${relHtml}
                <div class="wl-ex-box"><div class="wl-ex-en">${hl}</div><div class="wl-ex-ja">${w.exJa}</div></div>`;
            frag.appendChild(div);
        });
        list.innerHTML = "";
        list.appendChild(frag);
    }

    // --- Records Screen ---
    initRecords() {
        const tbody = document.getElementById('records-tbody');
        if (!tbody) return;

        const hist = JSON.parse(localStorage.getItem('lab_history')) || [];
        const noMsg = document.getElementById('no-records-msg');
        const chartEl = document.getElementById('records-chart');
        const legendEl = document.getElementById('records-chart-legend');

        if (hist.length === 0) {
            if (noMsg) noMsg.style.display = 'block';
            if (legendEl) legendEl.style.display = 'none';
            if (chartEl) chartEl.style.display = 'none';
            return;
        }

        // Render Legend
        if (legendEl) {
            const colors = ["var(--lv0)", "var(--lv1)", "var(--lv2)", "var(--lv3)", "var(--lv4)"];
            const labels = ["未学習", "苦手", "うろ覚え", "ほぼ覚えた", "覚えた"];
            let lHtml = '';
            labels.forEach((l, i) => {
                lHtml += `<div class="legend-item"><div class="legend-color" style="background:${colors[i]}"></div>${l}</div>`;
            });
            legendEl.innerHTML = lHtml;
        }

        // Render Chart
        if (chartEl) {
            chartEl.style.display = '';
            chartEl.className = 'chart-wrapper';
            const recent = hist.slice(0, 20).reverse();
            const rawMax = Math.max(1, ...recent.map(r => r.count || 0));
            const maxCount = Math.ceil(rawMax / 10) * 10;

            // Y-Axis Labels
            let yHtml = '';
            for (let v = 0; v <= maxCount; v += 10) {
                if (v > 0) {
                    const bPct = (v / maxCount) * 100;
                    yHtml += `<div class="chart-y-label" style="bottom:${bPct}%; transform:translateY(50%);">${v}</div>`;
                }
            }

            // Grid Lines
            let gridHtml = '';
            for (let v = 10; v <= maxCount; v += 10) {
                const bPct = (v / maxCount) * 100;
                gridHtml += `<div class="chart-grid-line" style="bottom:${bPct}%;"></div>`;
            }

            // Bars
            let barsHtml = '';
            recent.forEach(r => {
                const d = r.date ? r.date.substring(5, 10) : '-';
                let stackHtml = '';

                if (r.breakdown) {
                    r.breakdown.forEach((c, i) => {
                        if (c > 0) {
                            stackHtml += `<div class="stack-segment" style="flex:${c}; background:var(--lv${i});" title="Lv${i}: ${c}"></div>`;
                        }
                    });
                }

                if (!stackHtml) {
                    stackHtml = `<div class="stack-segment" style="flex:1; background:#ccc;" title="詳細なし"></div>`;
                }

                const hPct = ((r.count || 0) / maxCount) * 100;

                barsHtml += `
                    <div class="chart-column-group">
                        <div class="chart-bar-stack" style="height:${hPct}%;">
                            ${stackHtml}
                        </div>
                        <div class="chart-date-label">${d}</div>
                    </div>
                `;
            });

            chartEl.innerHTML = `
                <div class="chart-y-axis">
                    ${yHtml}
                </div>
                <div class="chart-scroll-area">
                    ${gridHtml}
                    ${barsHtml}
                    <div style="min-width:10px;"></div>
                </div>
            `;
        }

        const frag = document.createDocumentFragment();
        hist.forEach(r => {
            if (!r || !r.date) return;
            const tr = document.createElement('tr');
            // YYYY/MM/DD (0-10)
            const dateShort = r.date.substring(0, 10);

            tr.innerHTML = `
                <td>${dateShort}</td>
                <td>${r.count}</td>
                <td style="color:${r.correct === r.count ? 'var(--primary-dark)' : 'inherit'}; font-weight:${r.correct === r.count ? 'bold' : 'normal'}">${r.correct}</td>
                <td style="color:var(--primary-dark); font-weight:${r.points > 0 ? 'bold' : 'normal'}">${(r.points > 0 ? '+' + r.points : '-') + (r.totalPoints !== undefined ? ` <span style="font-size:0.8em; color:#666">(${r.totalPoints})</span>` : '')}</td>
            `;
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
    }

    // --- Settings ---
    initSettings() {
        const sel = document.getElementById('dataset-select');
        if (sel) {
            sel.innerHTML = '';
            for (const [k, v] of Object.entries(DATASETS)) {
                const opt = document.createElement('option');
                opt.value = k;
                opt.textContent = v.label;
                if (k === this.currentDatasetKey) opt.selected = true;
                sel.appendChild(opt);
            }
        }

        // Voice Settings Init
        this.populateVoiceSelects();
        // Retry population when voices load (async)
        if (speechSynthesis.onvoiceschanged !== undefined) {
            const prev = speechSynthesis.onvoiceschanged;
            speechSynthesis.onvoiceschanged = () => {
                if (prev) prev();
                this.populateVoiceSelects();
            };
        }
    }

    changeDataset(val) {
        if (DATASETS[val]) {
            this.currentDatasetKey = val;
            localStorage.setItem('lab_dataset_key', val);
            window.location.reload();
        }
    }

    resetStats() {
        if (confirm('現在の単語帳の学習記録をリセットしますか？\n（この操作は取り消せません）')) {
            localStorage.removeItem(this.currentConfig.storageKey);
            localStorage.removeItem('lab_history');
            window.location.reload();
        }
    }

    async updateApp() {
        if (!confirm('アプリを更新しますか？\n（キャッシュをクリアして最新版を取得します）')) return;

        try {
            // Service Worker のキャッシュを削除
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(key => caches.delete(key)));
                console.log('Cache cleared:', keys);
            }

            // Service Worker を更新
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.getRegistration();
                if (registration) {
                    await registration.update();
                    console.log('Service Worker updated');
                }
            }

            alert('キャッシュをクリアしました。\nページをリロードします。');
            window.location.reload();
        } catch (e) {
            console.error('Update failed:', e);
            alert('更新に失敗しました。手動でページをリロードしてください。');
            window.location.reload();
        }
    }

    // --- Shared Utils ---
    getTotalPoints() {
        return this.words.reduce((sum, w) => sum + (w.stats.level || 0), 0);
    }

    getLevelDistribution() {
        const d = [0, 0, 0, 0, 0];
        this.words.forEach(w => d[Math.min(4, w.stats.level)]++);
        return d;
    }

    renderChart(id, dist) {
        const c = document.getElementById(id);
        if (!c) return;
        c.innerHTML = '';

        // Remove class that enforces flex/height for bar chart functionality if present
        c.classList.remove('chart-wrapper');
        // Add container class for centering
        c.className = 'chart-container';

        const total = dist.reduce((a, b) => a + b, 0);
        const colors = ["var(--lv0)", "var(--lv1)", "var(--lv2)", "var(--lv3)", "var(--lv4)"];
        const labels = ["未学習", "苦手", "うろ覚え", "ほぼ覚えた", "覚えた"];

        let gradients = [];
        let currentDeg = 0;

        if (total > 0) {
            dist.forEach((v, i) => {
                if (v === 0) return;
                const deg = (v / total) * 360;
                gradients.push(`${colors[i]} ${currentDeg}deg ${currentDeg + deg}deg`);
                currentDeg += deg;
            });
        } else {
            gradients.push("#eee 0deg 360deg");
        }

        const bg = gradients.join(', ');

        // Generate Legend HTML
        let legendHtml = '';
        const handledLabels = new Set();
        // Simply iterate all levels to show full breakdown
        dist.forEach((v, i) => {
            // Show label even if count is 0
            legendHtml += `<div class="legend-item"><div class="legend-color" style="background:${colors[i]}"></div>${labels[i]}: ${v}</div>`;
        });

        // Use a simpler approach for legend if empty (all zero)
        if (total === 0) legendHtml = '<div style="font-size:0.8rem; color:#999;">データなし</div>';

        c.innerHTML = `
            <div class="donut-chart" style="background: conic-gradient(${bg});">
                <div class="donut-hole">
                    <div class="donut-total-label">Total</div>
                    <div class="donut-total-val">${total}</div>
                </div>
            </div>
            <div class="chart-legend">${legendHtml}</div>
        `;
    }

    renderHearts(id) {
        const c = document.getElementById(id);
        if (!c) return;
        c.innerHTML = '';
        const path = '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';
        for (let i = 0; i < 10; i++) c.innerHTML += `<svg class="heart-icon" viewBox="0 0 24 24">${path}</svg>`;
    }

    updateHearts(id) {
        // Apply decay first
        this.applyAffinityDecay();

        const points = this.getAffinityPoints();
        const active = Math.min(10, Math.floor(points / 10)); // 10 points = 1 heart
        const hearts = document.getElementById(id)?.querySelectorAll('.heart-icon');
        if (hearts) {
            hearts.forEach((h, i) => {
                if (i < active) h.classList.add('active');
                else h.classList.remove('active');
            });
        }
    }

    // --- Affinity Point System ---
    getAffinityPoints() {
        return parseInt(localStorage.getItem('lab_affinity') || '0');
    }

    setAffinityPoints(val) {
        const clamped = Math.max(0, Math.min(100, val)); // 0-100
        localStorage.setItem('lab_affinity', clamped.toString());
    }

    addAffinityPoints(amount) {
        const current = this.getAffinityPoints();
        this.setAffinityPoints(current + amount);
        // Update last study date
        localStorage.setItem('lab_last_study', new Date().toLocaleDateString('ja-JP'));
    }

    applyAffinityDecay() {
        const lastStudy = localStorage.getItem('lab_last_study');
        if (!lastStudy) {
            // First time, set today
            localStorage.setItem('lab_last_study', new Date().toLocaleDateString('ja-JP'));
            return;
        }

        const today = new Date().toLocaleDateString('ja-JP');
        if (lastStudy === today) return; // Studied today, no decay

        // Calculate days since last study
        const parseDate = (str) => {
            const [y, m, d] = str.split('/').map(Number);
            return new Date(y, m - 1, d);
        };
        const lastDate = parseDate(lastStudy);
        const todayDate = parseDate(today);
        const diffDays = Math.floor((todayDate - lastDate) / 86400000);

        if (diffDays > 0) {
            const decay = diffDays * 20; // -20 points per day
            const current = this.getAffinityPoints();
            this.setAffinityPoints(current - decay);
            // Update last study to today (decay applied)
            localStorage.setItem('lab_last_study', today);
        }
    }

    initLottie(id, interactive) {
        if (window.lottie) {
            const c = document.getElementById(id);
            if (c) {
                const anim = lottie.loadAnimation({ container: c, renderer: 'svg', loop: true, autoplay: true, path: LOTTIE_PATH });
                if (interactive) c.onclick = () => this.petDog();
            }
        }
    }

    petDog() {
        const b = document.getElementById('dog-bubble');
        if (!b) return;

        // Calculate affinity for messages (new point system)
        const points = this.getAffinityPoints();
        const aff = Math.min(10, Math.floor(points / 10)); // 0-10

        const msgMap = {
            0: ["...ワン", "お腹すいたワン...", "遊んでほしいな..."],
            1: ["ワン！", "誰かいる？", "ちょっと元気出てきた"],
            2: ["ご主人様？", "しっぽフリフリ", "撫でてくれる？"],
            3: ["遊ぼう！", "くんくん...", "ボール投げて！"],
            4: ["楽しいワン！", "もっと遊ぼう！", "わくわく！"],
            5: ["嬉しいワン！", "一緒にいると楽しい！", "おやつちょうだい！"],
            6: ["大好きだワン！", "撫でて〜", "もふもふ"],
            7: ["楽しいね！", "毎日会いたいワン！", "ずっと一緒がいい！"],
            8: ["君といると幸せ！", "信頼してるワン！", "最高の友達！"],
            9: ["ずっと一緒だよ！", "君は最高のパートナー！", "愛してるワン！"],
            10: ["幸せだワン！", "運命の出会いだった！", "永遠にそばにいるワン！"]
        };

        const msgs = msgMap[aff] || msgMap[0];

        b.innerText = msgs[Math.floor(Math.random() * msgs.length)];
        b.classList.add('show');
        setTimeout(() => b.classList.remove('show'), 3000);
    }

    showAffinityProgress() {
        const b = document.getElementById('dog-bubble');
        if (!b) return;

        const points = this.getAffinityPoints();
        const currentAff = Math.floor(points / 10);

        if (currentAff >= 10) {
            b.innerText = "親密度MAXだワン！ありがとう！";
        } else {
            const nextTarget = (currentAff + 1) * 10;
            const diff = nextTarget - points;
            b.innerText = `❤ x ${currentAff + 1} まで\nあと ${Math.ceil(diff)} ポイント！`;
        }

        b.classList.add('show');
        setTimeout(() => b.classList.remove('show'), 4000);
    }

    // --- Audio System (TTS Feedback) ---
    initAudio() {
        // Init voices
        const load = () => {
            const all = speechSynthesis.getVoices();
            // Filter English voices
            const en = all.filter(v => v.lang.startsWith('en'));
            if (en.length > 0) {
                // Load Saved Settings
                const savedQ = localStorage.getItem('lab_voice_q');
                const savedFB = localStorage.getItem('lab_voice_fb');

                // Sort to try to get consistent order. Prioritize US.
                en.sort((a, b) => {
                    if (a.lang === 'en-US' && b.lang !== 'en-US') return -1;
                    if (a.lang !== 'en-US' && b.lang === 'en-US') return 1;
                    return 0;
                });

                // Set Question Voice (from saved or default: prefer Samantha)
                if (savedQ) {
                    this.voiceQ = en.find(v => v.name === savedQ) || en[0];
                } else {
                    this.voiceQ = en.find(v => v.name === 'Samantha') || en[0];
                }

                // Set Feedback Voice (from saved or default: prefer Fred)
                if (savedFB) {
                    this.voiceFB = en.find(v => v.name === savedFB) || this.voiceQ;
                } else {
                    this.voiceFB = en.find(v => v.name === 'Fred') || en.find(v => v.name !== this.voiceQ.name) || this.voiceQ;
                }
            }
        };

        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = load;
        }
        load(); // Try immediately
    }

    speakFeedback(text) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 1.2;
        u.pitch = 1.1;
        if (this.voiceFB) u.voice = this.voiceFB;
        speechSynthesis.speak(u);
    }

    // --- Settings / Voice Management ---
    populateVoiceSelects() {
        const qSel = document.getElementById('voice-q-select');
        const fbSel = document.getElementById('voice-fb-select');
        if (!qSel || !fbSel) return;

        const all = speechSynthesis.getVoices();
        const en = all.filter(v => v.lang.startsWith('en'));

        en.sort((a, b) => {
            if (a.lang === 'en-US' && b.lang !== 'en-US') return -1;
            if (a.lang !== 'en-US' && b.lang === 'en-US') return 1;
            return a.name.localeCompare(b.name);
        });

        const createOpts = (sel, current) => {
            sel.innerHTML = '';
            en.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.name;
                opt.textContent = `${v.name} (${v.lang})`;
                if (current && v.name === current.name) opt.selected = true;
                sel.appendChild(opt);
            });
            if (en.length === 0) {
                const opt = document.createElement('option');
                opt.textContent = "音声読み込み中...";
                sel.appendChild(opt);
            }
        };

        createOpts(qSel, this.voiceQ);
        createOpts(fbSel, this.voiceFB);
    }

    saveVoiceSettings() {
        const qSel = document.getElementById('voice-q-select');
        const fbSel = document.getElementById('voice-fb-select');
        if (!qSel || !fbSel) return;

        const all = speechSynthesis.getVoices();

        const vQ = all.find(v => v.name === qSel.value);
        if (vQ) {
            this.voiceQ = vQ;
            localStorage.setItem('lab_voice_q', vQ.name);
        }

        const vFB = all.find(v => v.name === fbSel.value);
        if (vFB) {
            this.voiceFB = vFB;
            localStorage.setItem('lab_voice_fb', vFB.name);
        }
    }

    previewVoice(type) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(type === 'q' ? "This is a test." : "Excellent!");
        u.lang = 'en-US';
        const v = (type === 'q') ? this.voiceQ : this.voiceFB;
        if (v) u.voice = v;
        if (type === 'fb') {
            u.rate = 1.2;
            u.pitch = 1.1;
        }
        speechSynthesis.speak(u);
    }

    // iOS PWA向け: ユーザーアクション時にサイレント発話でAPIをアンロックする
    unlockSpeech() {
        // Re-trigger voice load just in case
        this.initAudio();

        if (this.speechUnlocked) return;
        try {
            speechSynthesis.cancel(); // 既存の発話をキャンセル
            const u = new SpeechSynthesisUtterance('');
            u.volume = 0;
            u.onend = () => {
                speechSynthesis.cancel(); // 終了後にもキャンセルして確実にクリア
            };
            speechSynthesis.speak(u);
            this.speechUnlocked = true;
        } catch (e) {
            console.warn('Speech unlock failed:', e);
        }
    }

    speak(txt) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'en-US';
        if (this.voiceQ) u.voice = this.voiceQ;
        speechSynthesis.speak(u);
    }
    replaySpeak() { if (this.curr) this.speak(this.curr.en); }

    confirmHome() {
        if (confirm('学習を中断してホームに戻りますか？')) {
            window.location.href = 'index.html';
        }
    }

    nextSession() {
        const config = JSON.parse(sessionStorage.getItem('lab_session_config'));
        if (config) {
            this.startSession(config);
        } else {
            window.location.href = 'index.html';
        }
    }

    reviewSameSession() {
        const session = JSON.parse(sessionStorage.getItem('lab_session'));
        if (!session) return window.location.href = 'index.html';

        // Extract IDs from previous session
        const ids = session.queue.map(w => w.id);

        // Re-fetch current state of these words from master list
        // This ensures we use updated levels/stats
        const q = this.words.filter(w => ids.includes(w.id));

        // Preserve original order or shuffle?
        // "Review Same Problems" usually implies same set, maybe shuffled.
        q.sort(() => 0.5 - Math.random());

        if (!q.length) return alert("エラー: 単語が見つかりません");

        // Keep same settings (Timer, Method, etc)
        const method = session.method;
        const timer = session.timer;
        const forceLevel = session.forceLevel;

        // Start New Session
        sessionStorage.setItem('lab_session', JSON.stringify({
            queue: q,
            idx: 0,
            results: [],
            forceLevel: forceLevel,
            method: method,
            timer: timer
        }));

        window.location.href = 'quiz.html';
    }

    loadHomeSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('lab_home_settings'));
            if (settings) {
                if (settings.method) document.getElementById('method-select').value = settings.method;
                if (settings.problem) document.getElementById('problem-select').value = settings.problem;
                if (settings.limit) document.getElementById('limit-select').value = settings.limit;
                if (settings.timer) document.getElementById('timer-select').value = settings.timer;
                if (settings.priming !== undefined) document.getElementById('use-priming').checked = settings.priming;
            }
        } catch (e) { console.error("Failed to load settings", e); }
    }

    saveHomeSettings() {
        try {
            const settings = {
                method: document.getElementById('method-select').value,
                problem: document.getElementById('problem-select').value,
                limit: document.getElementById('limit-select').value,
                timer: document.getElementById('timer-select').value,
                priming: document.getElementById('use-priming').checked
            };
            localStorage.setItem('lab_home_settings', JSON.stringify(settings));
        } catch (e) { console.error("Failed to save settings", e); }
    }

    bindHomeSettingsEvents() {
        const ids = ['method-select', 'problem-select', 'limit-select', 'timer-select', 'use-priming'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.saveHomeSettings());
            }
        });
    }

    // --- iOS Add to Home Screen ---
    checkA2HSBanner() {
        // Skip if already dismissed
        if (localStorage.getItem('lab_a2hs_dismissed')) return;

        // Skip if already in standalone mode (PWA)
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        if (window.navigator.standalone === true) return; // iOS Safari PWA

        // Only show on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (!isIOS) return;

        // Show banner
        const banner = document.getElementById('a2hs-banner');
        if (banner) {
            banner.style.display = 'block';
        }
    }

    dismissA2HSBanner() {
        const banner = document.getElementById('a2hs-banner');
        if (banner) {
            banner.style.display = 'none';
        }
        localStorage.setItem('lab_a2hs_dismissed', 'true');
    }

}

const app = new App();
window.app = app;
