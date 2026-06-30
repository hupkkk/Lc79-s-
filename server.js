const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ========================================================================
// HỆ THỐNG DỰ ĐOÁN TÀI/XỈU THÔNG MINH - BẺ CẦU MẠNH + MULTI MD5
// ========================================================================

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
            streak: { name: 'Streak', weight: 1.2 },
            pattern: { name: 'Mẫu lặp', weight: 1.0 },
            markov1: { name: 'Markov 1', weight: 1.1 },
            markov2: { name: 'Markov 2', weight: 1.0 },
            markov3: { name: 'Markov 3', weight: 0.9 },
            diceSum: { name: 'Tổng xúc xắc', weight: 1.0 },
            md5hash: { name: 'MD5 1', weight: 0.8 },
            md5hash2: { name: 'MD5 2', weight: 0.8 },
            md5hash3: { name: 'MD5 3', weight: 0.8 },
            meanRev: { name: 'Mean Reversion', weight: 1.3 },
            logistic: { name: 'Logistic', weight: 1.1 }
        };
        Object.keys(this.algos).forEach(key => {
            this.algoStats[key] = { total: 0, correct: 0 };
            this.algoWeights[key] = this.algos[key].weight;
        });
    }

    addResult(phienId, result, dices) {
        const sum = dices ? dices.reduce((a,b) => a+b, 0) : 0;
        this.history.push({ id: phienId, result, dices: dices || [], sum, timestamp: Date.now() });
        this.updatePredictionAccuracy(phienId, result);
        this.updateWeights();
        if (this.history.length > 20000) this.history = this.history.slice(-10000);
    }

    updatePredictionAccuracy(phienId, actual) {
        const pred = this.predictions.find(p => p.id === phienId);
        if (pred) {
            pred.actual = actual;
            const correct = pred.predicted === actual ? 1 : 0;
            if (pred.algoWeights) {
                Object.keys(pred.algoWeights).forEach(algo => {
                    if (this.algoStats[algo]) {
                        this.algoStats[algo].total += 1;
                        if (correct) this.algoStats[algo].correct += 1;
                    }
                });
            }
            pred.correct = correct;
        }
    }

    updateWeights() {
        if (this.predictions.length < 5) return;
        Object.keys(this.algoStats).forEach(algo => {
            const s = this.algoStats[algo];
            if (s.total > 0) {
                let newW = (s.correct / s.total) * 1.6;
                this.algoWeights[algo] = Math.min(2.2, Math.max(0.3, newW));
            }
        });
    }

    getCurrentStreak() {
        if (this.history.length === 0) return 0;
        let streak = 1;
        const last = this.history[this.history.length-1].result;
        for (let i = this.history.length-2; i >= 0; i--) {
            if (this.history[i].result === last) streak++;
            else break;
        }
        return streak;
    }

    // ==================== MD5 MULTI ====================
    predictMD5() {
        if (this.history.length < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const lastId = this.history[this.history.length-1].id;
        const prev = this.history[this.history.length-2].result;
        const data = lastId + prev + Date.now().toString().slice(-4);
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const val = parseInt(hash[0], 16);
        const probT = 0.5 + (val - 7.5) / 15 * 0.32;
        return { pred: probT > 0.5 ? 'T' : 'X', conf: 0.55 + Math.abs(probT-0.5)*1.4, detail: `MD5-1 ${hash.slice(0,6)}` };
    }

    predictMD5_2() {
        if (this.history.length < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const last = this.history[this.history.length-1];
        const streak = this.getCurrentStreak();
        const data = `${last.id}${last.sum || 0}${streak}${Date.now()}`;
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const val = parseInt(hash.slice(0,4), 16) % 100;
        const probT = 0.5 + (val - 50) / 60 * 0.28;
        return { pred: probT > 0.5 ? 'T' : 'X', conf: 0.54 + Math.abs(probT-0.5)*1.3, detail: `MD5-2 ${val}` };
    }

    predictMD5_3() {
        if (this.history.length < 1) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const id = this.history[this.history.length-1].id.toString();
        const h1 = crypto.createHash('md5').update(id + 'seedx').digest('hex');
        const h2 = crypto.createHash('md5').update(Date.now().toString() + id).digest('hex');
        const val = (parseInt(h1[3],16) + parseInt(h2[7],16)) % 16;
        const probT = 0.5 + (val - 8) / 16 * 0.33;
        return { pred: probT > 0.5 ? 'T' : 'X', conf: 0.56 + Math.abs(probT-0.5)*1.5, detail: `MD5-3 ${val}` };
    }

    // ==================== CÁC HÀM KHÁC (rút gọn) ====================
    predictFrequency() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const t5 = this.history.slice(-5).filter(e => e.result === 'T').length / 5;
        const pred = t5 > 0.5 ? 'T' : 'X';
        return { pred, conf: 0.55 + Math.abs(t5-0.5)*0.8, detail: `Tần suất ${t5.toFixed(2)}` };
    }

    predictStreak() {
        const streak = this.getCurrentStreak();
        if (streak < 2) return { pred: 'T', conf: 0.5, detail: 'Streak ngắn' };
        const last = this.history[this.history.length-1].result;
        if (streak >= 4) {
            const pred = last === 'T' ? 'X' : 'T';
            return { pred, conf: 0.7 + (streak-4)*0.08, detail: `Streak ${streak} → Bẻ` };
        }
        return { pred: last, conf: 0.6 + (streak-1)*0.05, detail: `Streak ${streak} → Theo` };
    }

    predictMeanRev() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const r = this.history.slice(-10).filter(e => e.result === 'T').length / 10;
        if (Math.abs(r - 0.5) > 0.3) {
            const pred = r > 0.5 ? 'X' : 'T';
            return { pred, conf: 0.68 + Math.abs(r-0.5)*0.6, detail: `Lệch ${r.toFixed(2)} → Bẻ` };
        }
        return { pred: 'T', conf: 0.52, detail: 'Cân bằng' };
    }

    // ... (các hàm Markov, Pattern, DiceSum, Logistic giữ nguyên hoặc rút gọn nếu cần)

    getCombinedPrediction() {
        if (this.history.length < 5) return { prediction: 'T', confidence: 0.5, reason: 'Chưa đủ dữ liệu' };

        const results = {
            frequency: this.predictFrequency(),
            streak: this.predictStreak(),
            meanRev: this.predictMeanRev(),
            md5hash: this.predictMD5(),
            md5hash2: this.predictMD5_2(),
            md5hash3: this.predictMD5_3(),
            // Thêm các hàm khác nếu cần
        };

        let totalWeight = 0, weightedProbT = 0;
        let reasons = [];

        Object.keys(results).forEach(key => {
            const r = results[key];
            const w = this.algoWeights[key] || 1;
            weightedProbT += (r.pred === 'T' ? 1 : 0) * w * r.conf;
            totalWeight += w * r.conf;
            reasons.push(`${key}: ${r.pred}(${r.conf.toFixed(2)})`);
        });

        let probT = totalWeight > 0 ? weightedProbT / totalWeight : 0.5;
        let finalPred = probT > 0.5 ? 'T' : 'X';
        let confidence = Math.min(0.93, Math.max(0.6, Math.abs(probT-0.5)*2 + 0.55));

        // === BẺ CẦU LOGIC MẠNH ===
        const streak = this.getCurrentStreak();
        const last = this.history[this.history.length-1]?.result || 'T';
        const md5BreakCount = [results.md5hash, results.md5hash2, results.md5hash3].filter(r => r && r.pred !== last).length;

        let strategy = '';
        if (streak >= 5 || (streak >= 4 && md5BreakCount >= 2)) {
            finalPred = last === 'T' ? 'X' : 'T';
            confidence = Math.min(0.92, 0.68 + streak * 0.05);
            strategy = `🔴 BẺ CẦU MẠNH (Streak ${streak} + MD5 đồng thuận)`;
        } else if (streak >= 3) {
            strategy = `🟢 THEO CẦU (Streak ${streak})`;
        } else {
            strategy = `🟡 Cân bằng Multi-MD5 + MeanRev`;
        }

        return {
            prediction: finalPred,
            confidence: confidence,
            probT: probT,
            reason: `${strategy}. ${reasons.join(' | ')}`
        };
    }

    makePrediction(phienId) {
        const combined = this.getCombinedPrediction();
        const predEntry = {
            id: phienId,
            predicted: combined.prediction,
            actual: null,
            reason: combined.reason,
            confidence: combined.confidence,
            probT: combined.probT,
            timestamp: Date.now()
        };
        this.predictions.push(predEntry);
        if (this.predictions.length > 5000) this.predictions = this.predictions.slice(-4000);
        return predEntry;
    }

    getStats() {
        const completed = this.predictions.filter(p => p.actual !== null);
        const correct = completed.filter(p => p.predicted === p.actual).length;
        return {
            totalPredictions: completed.length,
            correct,
            accuracy: completed.length ? correct / completed.length : 0,
            historyLength: this.history.length,
            recent10Accuracy: "Xem /stats"
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
        const resp = await axios.get(API_URL, { timeout: 10000 });
        const list = resp.data?.list || [];
        if (!list.length) return;

        const latest = list[0];
        const phienId = latest.id;
        const resultStr = latest.resultTruyenThong;
        const dices = latest.dices || [];

        if (lastId !== phienId) {
            let result = resultStr ? (resultStr.toUpperCase() === "TAI" ? "T" : "X") 
                        : (dices.length === 3 ? (dices.reduce((a,b)=>a+b,0) >= 11 ? "T" : "X") : "T");

            predictor.addResult(phienId, result, dices);
            const predEntry = predictor.makePrediction(phienId + 1);

            currentPrediction = {
                id: "s2king",
                phien: phienId,
                ket_qua: resultStr ? resultStr.toLowerCase() : (result === 'T' ? 'tài' : 'xỉu'),
                xuc_xac: dices.length === 3 ? dices.join('-') : "?-?-?",
                phien_moi: phienId + 1,
                du_doan: predEntry.predicted === 'T' ? 'tài' : 'xỉu',
                do_tin_cay: Math.round(predEntry.confidence * 100) + '%',
                ly_do: predEntry.reason,
                ty_le_tai: predEntry.probT.toFixed(3),
                thong_ke: predictor.getStats()
            };

            lastId = phienId;
            console.log(`[${new Date().toLocaleTimeString()}] Phiên ${phienId} → ${result} | DD: ${predEntry.predicted}`);
        }
    } catch (e) {
        console.error("API Error:", e.message);
    }
}

updateDataAndPredict();
setInterval(updateDataAndPredict, 6000);

// Routes
app.get('/predict', (req, res) => currentPrediction || { status: 'Đang tải...' });
app.get('/stats', (req, res) => res.json(predictor.getStats()));
app.get('/', (req, res) => res.send('🚀 Smart Tài Xỉu Server - Bẻ cầu mạnh'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy port ${PORT}`));