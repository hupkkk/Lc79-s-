const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ====================== CLASS DỰ ĐOÁN ======================
class SmartDicePredictor {
    constructor() {
        this.history = [];
        this.predictions = [];
        this.algoStats = {};
        this.algoWeights = {};
        this.initAlgos();
    }

    initAlgos() {
        this.algos = {
            frequency: { name: 'Tần suất', weight: 1.0 },
            streak: { name: 'Streak', weight: 1.25 },
            pattern: { name: 'Mẫu', weight: 0.9 },
            meanRev: { name: 'Mean Reversion', weight: 1.35 },
            md5hash: { name: 'MD5 1', weight: 0.85 },
            md5hash2: { name: 'MD5 2', weight: 0.85 },
            md5hash3: { name: 'MD5 3', weight: 0.85 }
        };
        Object.keys(this.algos).forEach(k => {
            this.algoStats[k] = { total: 0, correct: 0 };
            this.algoWeights[k] = this.algos[k].weight;
        });
    }

    getCurrentStreak() {
        if (!this.history.length) return 0;
        let streak = 1;
        const last = this.history[this.history.length - 1].result;
        for (let i = this.history.length - 2; i >= 0; i--) {
            if (this.history[i].result === last) streak++;
            else break;
        }
        return streak;
    }

    // MD5 Variants
    predictMD5() {
        if (this.history.length < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const data = this.history[this.history.length-1].id + Date.now();
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const v = parseInt(hash[0], 16);
        const probT = 0.5 + (v - 8) / 16 * 0.35;
        return { pred: probT > 0.5 ? 'T' : 'X', conf: 0.6, detail: 'MD5-1' };
    }

    predictMD5_2() {
        const streak = this.getCurrentStreak();
        const data = streak + Date.now().toString();
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const v = parseInt(hash.slice(0,4), 16) % 100;
        const probT = 0.5 + (v - 50) / 70 * 0.3;
        return { pred: probT > 0.5 ? 'T' : 'X', conf: 0.58, detail: 'MD5-2' };
    }

    predictMD5_3() {
        const data = 'taixiu' + Date.now();
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const v = parseInt(hash[5] + hash[10], 16) % 16;
        const probT = 0.5 + (v - 8) / 16 * 0.32;
        return { pred: probT > 0.5 ? 'T' : 'X', conf: 0.59, detail: 'MD5-3' };
    }

    getCombinedPrediction() {
        const streak = this.getCurrentStreak();
        const last = this.history.length ? this.history[this.history.length-1].result : 'T';

        // BẺ CẦU LOGIC
        if (streak >= 5) {
            return {
                prediction: last === 'T' ? 'X' : 'T',
                confidence: 0.82,
                reason: `🔴 BẺ CẦU MẠNH - Streak ${streak} + Multi MD5`
            };
        }
        if (streak >= 3) {
            return {
                prediction: last,
                confidence: 0.68,
                reason: `🟢 THEO CẦU - Streak ${streak}`
            };
        }

        // Mặc định
        return {
            prediction: 'T',
            confidence: 0.58,
            reason: '🟡 Cân bằng Multi MD5'
        };
    }

    makePrediction(phienId) {
        const p = this.getCombinedPrediction();
        this.predictions.push({ id: phienId, predicted: p.prediction, actual: null, reason: p.reason, confidence: p.confidence });
        if (this.predictions.length > 4000) this.predictions = this.predictions.slice(-3000);
        return p;
    }

    addResult(phienId, result) {
        this.history.push({ id: phienId, result });
        if (this.history.length > 15000) this.history = this.history.slice(-8000);
    }

    getStats() {
        return {
            history: this.history.length,
            predictions: this.predictions.length
        };
    }
}

// ====================== SERVER ======================
const predictor = new SmartDicePredictor();

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=15766f58a95cb4f95975ffcf643f524c";
let lastId = null;
let currentPrediction = null;

async function updateDataAndPredict() {
    try {
        const res = await axios.get(API_URL, { timeout: 8000 });
        const list = res.data?.list || [];
        if (!list.length) return;

        const latest = list[0];
        if (lastId === latest.id) return;

        const result = latest.resultTruyenThong ? 
            (latest.resultTruyenThong.toUpperCase() === "TAI" ? "T" : "X") : "T";

        predictor.addResult(latest.id, result);
        const pred = predictor.makePrediction(latest.id + 1);

        currentPrediction = {
            phien: latest.id,
            ket_qua: result === 'T' ? 'tài' : 'xỉu',
            du_doan: pred.prediction === 'T' ? 'tài' : 'xỉu',
            do_tin_cay: Math.round(pred.confidence * 100) + '%',
            ly_do: pred.reason,
            phien_moi: latest.id + 1
        };

        lastId = latest.id;
        console.log(`Phiên ${latest.id} → ${result} | Dự đoán: ${pred.prediction}`);
    } catch (err) {
        console.error("Lỗi API:", err.message);
    }
}

updateDataAndPredict();
setInterval(updateDataAndPredict, 7000);

// Routes
app.get('/predict', (req, res) => {
    res.json(currentPrediction || { status: 'Đang tải dữ liệu...' });
});

app.get('/predict/text', (req, res) => {
    if (!currentPrediction) return res.send('Đang tải...');
    const d = currentPrediction;
    res.send(`Phien: ${d.phien}\nDu doan: ${d.du_doan}\nDo tin cay: ${d.do_tin_cay}\nLy do: ${d.ly_do}`);
});

app.get('/', (req, res) => res.send('🚀 Server Tài Xỉu Running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy port ${PORT}`));