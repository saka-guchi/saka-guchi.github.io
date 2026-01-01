
const STORAGE_KEY = 'lab_data_v30';
const CSV_PATH = './words.csv';
const LOTTIE_PATH = './dog.json';

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
        this.debugAffinity = null;
        this.answering = false;
    }

    // --- Core Logic ---
    async init() {
        await this.loadData();
        
        // Dispatch init based on current page
        const path = window.location.pathname;
        if(path.includes('index.html') || path.endsWith('/')) this.initHome();
        else if(path.includes('priming.html')) this.initPriming();
        else if(path.includes('quiz.html')) this.initQuiz();
        else if(path.includes('result.html')) this.initResult();
        else if(path.includes('list.html')) this.initList();
        else if(path.includes('settings.html')) this.initSettings();
    }

    async loadData() {
        const local = localStorage.getItem(STORAGE_KEY);
        if(local) {
            this.words = JSON.parse(local);
        } else {
            try {
                const res = await fetch(CSV_PATH);
                if(res.ok) {
                    const text = await res.text();
                    this.parseCSV(text, true);
                }
            } catch(e) { console.error("Load Error", e); }
        }
    }

    saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.words)); }

    parseCSV(text, isInit=false) {
        const lines = text.split(/\r\n|\n/);
        const newItems = [];
        let start = 0;
        if(lines[0].includes("単語") || lines[0].includes("word")) start = 1;
        if(lines.length>1 && lines[0].includes("0,1,2")) start = 2;

        for(let i=start; i<lines.length; i++) {
            const line = lines[i].trim();
            if(!line) continue;
            // Simple split (Production should use regex CSV parser)
            const c = line.split(','); 
            if(c.length < 2) continue;
            
            // Assume format: id, en, ja, pos, ex, exJa
            // Fallback: If id is not number, shift
            let en=c[1], ja=c[2], pos=c[3]||"", ex=c[4]||"", exJa=c[5]||"";
            if(isNaN(parseInt(c[0]))) { en=c[0]; ja=c[1]; pos=c[2]||""; ex=c[3]||""; exJa=c[4]||""; }
            
            newItems.push({
                id: Date.now() + i,
                en: en.replace(/"/g,''),
                ja: ja.replace(/"/g,''),
                pos: pos.split('/')[0].replace(/"/g,''),
                ex: ex.replace(/"/g,''),
                exJa: exJa.replace(/"/g,''),
                stats: { level: 0, nextReview: 0, interval: 1 }
            });
        }
        if(isInit) {
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

        // Chart click handler
        const chartTitle = document.getElementById('home-chart-title');
        if(chartTitle) {
            chartTitle.onclick = () => {
                 alert("【レベル別出題形式】\nLv.0-1: Standard (英→日)\nLv.2: Masked (英単語マスク)\nLv.3: Reverse (日→英)\nLv.4+: Fill-in (穴埋め)");
            };
        }
    }

    debugHeart(diff) {
        let current = this.debugAffinity;
        if(current === null) {
             // Initial estimate
             const total = this.words.reduce((s,w)=>s+(w.stats.level||0),0);
             const aff = Math.floor((total/(this.words.length*5))*100);
             current = Math.floor(aff/10);
        }
        this.debugAffinity = Math.max(0, Math.min(10, current + diff));
        this.updateHearts('home-hearts');
        this.petDog();
    }
    
    startSession(config = null) {
        let mode, limit, priming;

        if (config) {
            mode = config.mode;
            limit = config.limit;
            priming = config.priming;
        } else {
            mode = document.querySelector('input[name="mode"]:checked').value;
            limit = parseInt(document.querySelector('input[name="limit"]:checked').value);
            priming = document.getElementById('use-priming').checked;

            // Save config for retry
            sessionStorage.setItem('lab_session_config', JSON.stringify({ mode, limit, priming }));
        }

        const now = Date.now();
        
        let q = [];
        if(mode==='review') q = this.words.filter(w=>w.stats.nextReview<=now);
        if(q.length===0) q = this.words.filter(w=>w.stats.level===0); 
        q.sort(()=>0.5-Math.random());
        q = q.slice(0, limit);
        
        if(!q.length) return alert("学習対象がありません");
        
        // Save Session
        sessionStorage.setItem('lab_session', JSON.stringify({queue: q, idx: 0, results: []}));
        
        if(priming) window.location.href = 'priming.html';
        else window.location.href = 'quiz.html';
    }

    // --- Priming Screen ---
    initPriming() {
        const session = JSON.parse(sessionStorage.getItem('lab_session'));
        if(!session) return window.location.href='index.html';
        
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
                    <button class="audio-btn-flat" onclick="app.speak('${w.en.replace(/'/g,"\\'")}')">${ICONS.speaker}</button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    // --- Quiz Screen ---
    initQuiz() {
        const session = JSON.parse(sessionStorage.getItem('lab_session'));
        if(!session) return window.location.href='index.html';
        this.quizQueue = session.queue;
        this.idx = session.idx;
        this.results = session.results;
        
        this.nextQ();
    }
    
    nextQ() {
        if(this.idx >= this.quizQueue.length) {
            // Finish
            sessionStorage.setItem('lab_session', JSON.stringify({queue:this.quizQueue, idx:this.idx, results:this.results}));
            return window.location.href = 'result.html';
        }
        
        const q = this.quizQueue[this.idx];
        this.curr = q;
        this.maskRevealed = false;
        
        let type = 'standard';
        const lv = q.stats.level;
        if(lv>=4) type='fill-in'; else if(lv>=3) type='reverse'; else if(lv===2) type='masked';
        this.currType = type;
        
        this.renderQ(q, type, lv);
    }
    
    renderQ(q, type, lv) {
        // ... (Logic from v48) ...
        const labels = ["未学習","翌日","3日後","1週後","2週後","完了"];
        const colors = ["var(--lv0)","var(--lv1)","var(--lv2)","var(--lv3)","var(--lv4)","var(--lv5)"];
        
        document.getElementById('quiz-level-display').innerHTML = `Lv.${lv}<br>${labels[lv]}`;
        document.getElementById('quiz-level-display').style.background = colors[lv];
        
        document.getElementById('quiz-progress').innerText = `${this.idx+1} / ${this.quizQueue.length}`;
        
        const qText = document.getElementById('q-text');
        const posBadge = document.getElementById('pos-badge');
        const spkBtn = document.getElementById('speaker-btn');
        const eyeBtn = document.getElementById('mask-toggle-btn');
        
        qText.classList.remove('long', 'masked');
        posBadge.style.display = (type==='standard' && q.pos) ? 'inline-block' : 'none';
        posBadge.innerText = q.pos;
        spkBtn.style.display = (type==='reverse') ? 'none' : 'flex';
        
        // Setup Eye Icon (Default Off)
        eyeBtn.innerHTML = ICONS.eye_off;
        
        if(type==='masked') {
            qText.innerText = q.en;
            qText.classList.add('masked');
            this.speak(q.en);
        } else if(type==='reverse') {
            qText.innerText = q.ja;
        } else if(type==='fill-in' && q.ex) {
             const safe = q.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
             qText.innerHTML = q.ex.replace(new RegExp(`\\b${safe}\\b`, 'gi'), '_______');
             qText.classList.add('long');
        } else {
            qText.innerText = q.en;
            this.speak(q.en);
        }
        
        // Choices
        const area = document.getElementById('choices-area');
        area.innerHTML = '';
        let isRev = (type==='reverse');
        let pool = isRev ? this.words.map(w=>w.en) : this.words.map(w=>w.ja);
        if(type==='fill-in') pool = this.words.map(w=>w.en);
        let correct = isRev ? q.en : q.ja;
        if(type==='fill-in') correct = q.en;
        
        let wrongs = [];
        while(wrongs.length < 3) {
            const r = pool[Math.floor(Math.random()*pool.length)];
            if(r!==correct && !wrongs.includes(r)) wrongs.push(r);
        }
        const choices = [...wrongs, correct].sort(()=>0.5-Math.random());
        choices.forEach(t => {
            const b = document.createElement('div');
            b.className='choice-btn'; b.innerText=t;
            b.onclick = (e) => this.answer(t===correct, b);
            area.appendChild(b);
        });
        
        this.startTimer();
    }
    
    toggleMask() {
        const el = document.getElementById('q-text');
        const btn = document.getElementById('mask-toggle-btn');
        if(el.classList.contains('masked')) {
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
        bar.style.transition = 'none'; bar.style.width = '100%';
        setTimeout(()=>{ bar.style.transition='width 10s linear'; bar.style.width='0%'; }, 10);
        this.startTime = Date.now();
        this.timer = setTimeout(()=>this.answer(false,null), 10000);
    }
    
    answer(isCorrect, btn) {
        if(this.answering) return; // Prevent double click
        this.answering = true;

        // Immediate Style Feedback
        if(btn) {
            btn.classList.add(isCorrect ? 'correct' : 'wrong');
        }

        if(this.timer) clearTimeout(this.timer);
        const q = this.curr;
        
        // Update Stats in Master Data
        const masterIdx = this.words.findIndex(w=>w.id===q.id);
        if(masterIdx > -1) {
            const w = this.words[masterIdx];
            const oldLevel = w.stats.level;

            if(isCorrect) {
                let m = (Date.now()-this.startTime<2000) ? 2.5 : 1.5;
                if(this.maskRevealed) m *= 0.5;
                w.stats.interval = Math.max(1, w.stats.interval*m);
                w.stats.level = Math.min(5, w.stats.level+1);
                w.stats.nextReview = Date.now() + w.stats.interval*86400000;
            } else {
                w.stats.interval = 1; w.stats.level = 0;
                w.stats.nextReview = Date.now();
            }
            this.saveData(); // Persist immediately
            
            // Push result with updated state and oldLevel
            this.results.push({word: w, correct: isCorrect, diff: isCorrect?1:0, oldLevel: oldLevel, newLevel: w.stats.level});
        }
        
        // UI Feedback
        const ov = document.getElementById('feedback-overlay');
        document.getElementById('fb-icon').innerText = isCorrect?'◯':'✕';
        document.getElementById('fb-icon').style.color = isCorrect?'var(--correct)':'var(--wrong)';
        document.getElementById('fb-msg').innerText = isCorrect?'Excellent!':'Oops!';
        ov.style.opacity = 1;
        
        setTimeout(()=>{
            ov.style.opacity = 0;
            this.idx++;
            this.answering = false;
            // Save Session
            sessionStorage.setItem('lab_session', JSON.stringify({queue:this.quizQueue, idx:this.idx, results:this.results}));
            this.nextQ();
        }, 1000);
    }

    // --- Result Screen ---
    initResult() {
        const session = JSON.parse(sessionStorage.getItem('lab_session'));
        if(!session) return window.location.href='index.html';
        
        this.results = session.results;
        
        // Render Chart
        this.renderResultChart('result-chart');
        
        const list = document.getElementById('result-list');
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        this.results.forEach(r => {
             let hl = "";
             if(r.word.ex && r.word.en) {
                 try { hl = r.word.ex.replace(new RegExp(`\\b${escapeRegExp(r.word.en)}\\b`,'gi'), '<span class="highlight">$&</span>'); }
                 catch(e){ hl = r.word.ex; }
             }
             const div = document.createElement('div');
             div.className = 'result-item';
             div.innerHTML = `
                <button class="result-audio-btn" onclick="app.speak('${r.word.en.replace(/'/g,"\\'")}')">${ICONS.speaker}</button>
                <div class="result-content">
                    <div class="result-main"><span>${r.word.en}</span> <span class="${r.correct?'mark-o':'mark-x'}">${r.correct?'◯':'✕'}</span></div>
                    <div class="result-sub">Lv.${r.word.stats.level}</div>
                    <div class="result-example-box"><div class="ex-en">${hl}</div><div class="ex-ja">${r.word.exJa}</div></div>
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
            if(r.oldLevel !== undefined && r.newLevel !== undefined) {
                 if(r.newLevel !== r.oldLevel) {
                     distBefore[r.newLevel]--;
                     distBefore[r.oldLevel]++;
                 }
            }
        });

        // Render with Diffs
        const c = document.getElementById(id);
        if(!c) return;
        c.innerHTML = '';
        const max = Math.max(...distAfter, ...distBefore) || 1;
        const labels = ["未学習","翌日","3日後","1週後","2週後","1ヶ月後"];

        distAfter.forEach((v,i) => {
             const h = (v/max)*80;
             const diffVal = v - distBefore[i];
             let diffHtml = '';
             if(diffVal > 0) diffHtml = `<div class="chart-diff diff-plus show">+${diffVal}</div>`;
             if(diffVal < 0) diffHtml = `<div class="chart-diff diff-minus show">${diffVal}</div>`;

             c.innerHTML += `<div class="chart-bar-group">
                 <div class="chart-info">
                    ${diffHtml}
                    <div class="chart-count">${v}</div>
                 </div>
                 <div class="chart-bar bar-${i}" style="height:${Math.max(4,h)}%"></div>
                 <div class="chart-label">Lv.${i}<br>${labels[i]}</div>
             </div>`;
        });
    }

    // --- List Screen ---
    initList() {
        const list = document.getElementById('list-content');
        if(!list) return;

        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const frag = document.createDocumentFragment();
        this.words.forEach(w => {
             const div = document.createElement('div');
             div.className = 'word-list-item';
             let hl = "";
             if(w.ex && w.en) {
                 try {
                    hl = w.ex.replace(new RegExp(`\\b${escapeRegExp(w.en)}\\b`,'gi'), '<span class="highlight">$&</span>');
                 } catch(e) { hl = w.ex; }
             }
             const posText = w.pos ? `[${w.pos}]` : "";

             div.innerHTML = `
                <div class="wl-header"><div class="wl-word"><span class="wl-id">${w.id}.</span> ${w.en}</div><span class="wl-level-badge" style="background:var(--lv${w.stats.level})">Lv.${w.stats.level}</span></div>
                <div class="wl-meaning"><span style="font-size:0.75rem; color:#888; margin-right:4px;">${posText}</span>${w.ja}</div>
                <div class="wl-ex-box"><div class="wl-ex-en">${hl}</div><div class="wl-ex-ja">${w.exJa}</div></div>`;
             frag.appendChild(div);
        });
        list.innerHTML = "";
        list.appendChild(frag);
    }
    
    // --- Settings ---
    initSettings() {
        // Bind handlers
    }
    
    // --- Shared Utils ---
    getLevelDistribution() {
        const d = [0,0,0,0,0,0];
        this.words.forEach(w => d[Math.min(5, w.stats.level)]++);
        return d;
    }
    
    renderChart(id, dist) {
        const c = document.getElementById(id);
        if(!c) return;
        c.innerHTML = '';
        const max = Math.max(...dist)||1;
        const labels = ["未学習","翌日","3日後","1週後","2週後","完了"];
        dist.forEach((v,i) => {
             const h = (v/max)*80;
             c.innerHTML += `<div class="chart-bar-group"><div class="chart-info"><div class="chart-count">${v}</div></div><div class="chart-bar bar-${i}" style="height:${Math.max(4,h)}%"></div><div class="chart-label">Lv.${i}<br>${labels[i]}</div></div>`;
        });
    }

    renderHearts(id) {
        const c = document.getElementById(id);
        if(!c) return;
        c.innerHTML = '';
        const path = '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>';
        for(let i=0; i<10; i++) c.innerHTML += `<svg class="heart-icon" viewBox="0 0 24 24">${path}</svg>`;
    }
    
    updateHearts(id) {
        if(!this.words.length) return;
        let active;
        if(this.debugAffinity !== null) {
            active = this.debugAffinity;
        } else {
            const total = this.words.reduce((s,w)=>s+(w.stats.level||0),0);
            const aff = Math.floor((total/(this.words.length*5))*100);
            active = Math.floor(aff/10);
        }
        const hearts = document.getElementById(id).querySelectorAll('.heart-icon');
        hearts.forEach((h,i) => { if(i<active) h.classList.add('active'); else h.classList.remove('active'); });
    }

    initLottie(id, interactive) {
        if(window.lottie) {
            const c = document.getElementById(id);
            if(c) {
                const anim = lottie.loadAnimation({ container:c, renderer:'svg', loop:true, autoplay:true, path: LOTTIE_PATH });
                if(interactive) c.onclick = () => this.petDog();
            }
        }
    }
    
    petDog() {
        const b = document.getElementById('dog-bubble');

        // Calculate affinity for messages
        let aff = 0;
        if (this.debugAffinity !== null) {
            aff = this.debugAffinity;
        } else if (this.words.length > 0) {
            const total = this.words.reduce((s,w)=>s+(w.stats.level||0),0);
            const score = Math.floor((total/(this.words.length*5))*100);
            aff = Math.floor(score/10);
        }

        const msgs = ["ワン！"];
        if(aff >= 3) msgs.push("遊ぼう！", "くんくん...");
        if(aff >= 6) msgs.push("大好きだワン！", "楽しいね！", "撫でて〜");
        if(aff >= 9) msgs.push("ずっと一緒だよ！", "君は最高のパートナー！", "幸せだワン！");

        b.innerText = msgs[Math.floor(Math.random()*msgs.length)];
        b.classList.add('show');
        setTimeout(()=>b.classList.remove('show'), 2000);
    }
    
    speak(txt) { speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(txt); u.lang='en-US'; speechSynthesis.speak(u); }
    replaySpeak() { if(this.curr) this.speak(this.curr.en); }

    confirmHome() {
        if(confirm('学習を中断してホームに戻りますか？')) {
            window.location.href='index.html';
        }
    }

    retrySession() {
        const config = JSON.parse(sessionStorage.getItem('lab_session_config'));
        if (config) {
            this.startSession(config);
        } else {
            window.location.href='index.html';
        }
    }
}

const app = new App();
window.app = app;
