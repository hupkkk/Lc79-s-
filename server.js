const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ========================================================================
// HỆ THỐNG DỰ ĐOÁN TÀI/XỈU THÔNG MINH (KHÔNG GIỚI HẠN PHIÊN, TỰ HỌC)
// ========================================================================

class SmartDicePredictor {
    constructor() {
        this.history = []; // lưu các phiên { id, result, dices, sum, timestamp }
        this.predictions = []; // lưu các dự đoán đã đưa ra
        this.algoStats = {}; // thống kê từng thuật toán
        this.algoWeights = {}; // trọng số hiện tại của từng thuật toán
        this.lastPrediction = null;
        this.initAlgos();
    }

    initAlgos() {
        this.algos = {
            frequency: { name: 'Tần suất', weight: 1.0 },
            streak: { name: 'Streak', weight: 1.0 },
            pattern: { name: 'Mẫu lặp', weight: 1.0 },
            markov1: { name: 'Markov bậc 1', weight: 1.0 },
            markov2: { name: 'Markov bậc 2', weight: 1.0 },
            markov3: { name: 'Markov bậc 3', weight: 1.0 },
            diceSum: { name: 'Tổng xúc xắc', weight: 1.0 },
            md5hash: { name: 'MD5 Hash 1', weight: 0.7 },
            md5hash2: { name: 'MD5 Hash 2', weight: 0.7 },
            md5hash3: { name: 'MD5 Hash 3', weight: 0.7 },
            meanRev: { name: 'Mean Reversion', weight: 1.2 },
            logistic: { name: 'Logistic', weight: 1.0 }
        };
        Object.keys(this.algos).forEach(key => {
            this.algoStats[key] = { total: 0, correct: 0 };
            this.algoWeights[key] = this.algos[key].weight;
        });
    }

    // Thêm kết quả thực tế
    addResult(phienId, result, dices) {
        const sum = dices ? dices.reduce((a,b) => a+b, 0) : 0;
        const entry = {
            id: phienId,
            result: result,
            dices: dices || [],
            sum: sum,
            timestamp: Date.now()
        };
        this.history.push(entry);
        this.updatePredictionAccuracy(phienId, result);
        this.updateWeights();

        if (this.history.length > 20000) {
            this.history = this.history.slice(-10000);
        }
    }

    updatePredictionAccuracy(phienId, actual) {
        const pred = this.predictions.find(p => p.id === phienId);
        if (pred) {
            pred.actual = actual;
            const correct = (pred.predicted === actual) ? 1 : 0;
            if (pred.algoWeights) {
                Object.keys(pred.algoWeights).forEach(algo => {
                    if (this.algoStats[algo]) {
                        this.algoStats[algo].total += 1;
                        if (correct === 1) this.algoStats[algo].correct += 1;
                    }
                });
            }
            pred.correct = correct;
        }
    }

    updateWeights() {
        const totalPredictions = this.predictions.length;
        if (totalPredictions < 5) return;

        Object.keys(this.algoStats).forEach(algo => {
            const stats = this.algoStats[algo];
            if (stats.total > 0) {
                const acc = stats.correct / stats.total;
                let newWeight = acc * 1.5;
                newWeight = Math.min(2.0, Math.max(0.3, newWeight));
                this.algoWeights[algo] = newWeight;
            }
        });
    }

    // ==================== CÁC HÀM DỰ ĐOÁN ====================

    predictFrequency() { /* giữ nguyên */ 
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const windows = [5, 10, 20];
        const weights = [0.5, 0.3, 0.2];
        let totalT = 0, totalX = 0;
        windows.forEach((w, idx) => {
            const slice = this.history.slice(-w);
            const t = slice.filter(e => e.result === 'T').length;
            const x = w - t;
            totalT += t * weights[idx];
            totalX += x * weights[idx];
        });
        const probT = totalT / (totalT + totalX);
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.max(0.55, Math.abs(probT-0.5)*2 + 0.5));
        const detail = `Tỷ lệ T: ${this.history.slice(-5).filter(e=>e.result==='T').length/5.toFixed(2)}, ${this.history.slice(-10).filter(e=>e.result==='T').length/10.toFixed(2)}`;
        return { pred, conf, detail };
    }

    predictStreak() { /* giữ nguyên */ 
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        let streak = 1;
        const last = this.history[len-1].result;
        for (let i = len-2; i >= 0; i--) {
            if (this.history[i].result === last) streak++;
            else break;
        }
        if (streak >= 4) {
            const pred = last === 'T' ? 'X' : 'T';
            const conf = Math.min(0.85, 0.6 + (streak-3)*0.05);
            return { pred, conf, detail: `Streak dài ${streak}, khả năng đảo chiều` };
        } else {
            const pred = last === 'T' ? 'T' : 'X';
            const conf = 0.55 + (streak-1)*0.05;
            return { pred, conf, detail: `Streak ${streak}, theo xu hướng` };
        }
    }

    // ... (các hàm Markov, Pattern, DiceSum, MeanRev, Logistic giữ nguyên như cũ)

    predictMD5() { /* MD5 1 */ 
        const len = this.history.length;
        if (len < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const lastId = this.history[len-1].id;
        const prevResult = this.history[len-2].result;
        const data = lastId + prevResult + Date.now().toString().slice(-4);
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const firstChar = parseInt(hash[0], 16);
        const probT = 0.5 + (firstChar - 7.5) / 15 * 0.3;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = 0.5 + Math.abs(probT-0.5)*1.5;
        return { pred, conf, detail: `MD5 1: ${hash.slice(0,6)}...` };
    }

    predictMD5_2() { /* MD5 2 */ 
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const last = this.history[len-1];
        const streak = this.getCurrentStreak();
        const data = `${last.id || '0'}${last.sum || 0}${streak}${Date.now().toString().slice(-6)}`;
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const charVal = parseInt(hash.slice(0,4), 16) % 100;
        const probT = 0.5 + (charVal - 50) / 50 * 0.25;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = 0.55 + Math.abs(probT - 0.5) * 1.2;
        return { pred, conf, detail: `MD5 2: val=${charVal}` };
    }

    predictMD5_3() { /* MD5 3 */ 
        const len = this.history.length;
        if (len < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const lastId = this.history[len-1].id;
        const data1 = lastId + 'seed1';
        const data2 = Date.now().toString() + lastId + 'seed2';
        const hash1 = crypto.createHash('md5').update(data1).digest('hex');
        const hash2 = crypto.createHash('md5').update(data2).digest('hex');
        const val = (parseInt(hash1[5], 16) + parseInt(hash2[10], 16)) % 16;
        const probT = 0.5 + (val - 7.5) / 15 * 0.35;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = 0.5 + Math.abs(probT-0.5)*1.6;
        return { pred, conf, detail: `MD5 3: entropy ${val}` };
    }

    getCurrentStreak() {
        const len = this.history.length;
        if (len < 1) return 0;
        let streak = 1;
        const last = this.history[len-1].result;
        for (let i = len-2; i >= 0; i--) {
            if (this.history[i].result === last) streak++;
            else break;
        }
        return streak;
    }

    getCombinedPrediction() {
        if (this.history.length < 5) {
            return { prediction: 'T', confidence: 0.5, reason: 'Chưa đủ dữ liệu' };
        }

        const results = {
            frequency: this.predictFrequency(),
            streak: this.predictStreak(),
            pattern: this.predictPattern(),
            markov1: this.predictMarkov1(),
            markov2: this.predictMarkov2(),
            markov3: this.predictMarkov3(),
            diceSum: this.predictDiceSum(),
            md5hash: this.predictMD5(),
            md5hash2: this.predictMD5_2(),
            md5hash3: this.predictMD5_3(),
            meanRev: this.predictMeanRev(),
            logistic: this.predictLogistic()
        };

        let totalWeight = 0;
        let weightedProbT = 0;
        let reasons = [];

        Object.keys(results).forEach(algo => {
            const r = results[algo];
            const w = this.algoWeights[algo] || 1.0;
            const predVal = r.pred === 'T' ? 1 : 0;
            weightedProbT += predVal * w * r.conf;
            totalWeight += w * r.conf;
            reasons.push(`${this.algos[algo].name}: ${r.pred} (${r.detail})`);
        });

        const probT = totalWeight > 0 ? weightedProbT / totalWeight : 0.5;
        const finalPred = probT > 0.5 ? 'T' : 'X';
        const confidence = Math.min(0.95, Math.max(0.6, Math.abs(probT-0.5)*2 + 0.5));

        // === LÝ DO MẠNH MẼ ===
        let strategyReason = '';
        const streakInfo = this.getCurrentStreak();
        const lastResult = this.history.length > 0 ? this.history[this.history.length-1].result : 'T';
        const recentT = this.history.slice(-10).filter(e => e.result === 'T').length / Math.min(10, this.history.length);

        if (streakInfo >= 5) {
            strategyReason = `🔴 Streak dài ${streakInfo} → BẺ CẦU mạnh (MeanRev + Markov) `;
        } else if (recentT > 0.7 || recentT < 0.3) {
            strategyReason = `🔴 Xu hướng lệch mạnh (${(recentT*100).toFixed(0)}%) → Khuyến nghị đảo chiều `;
        } else if (streakInfo >= 3) {
            strategyReason = `🟢 Streak ${streakInfo} → THEO CẦU an toàn `;
        } else {
            strategyReason = `🟡 Cân bằng đa mô hình (MD5 + Markov + Frequency) `;
        }

        const reasonText = strategyReason + reasons.slice(0, 5).join('; ');

        return {
            prediction: finalPred,
            confidence: confidence,
            probT: probT,
            reason: reasonText
        };
    }

    makePrediction(phienId, dices) {
        const combined = this.getCombinedPrediction();
        const predEntry = {
            id: phienId,
            predicted: combined.prediction,
            actual: null,
            algoWeights: { ...this.algoWeights },
            reason: combined.reason,
            confidence: combined.confidence,
            probT: combined.probT,
            timestamp: Date.now()
        };
        this.predictions.push(predEntry);
        if (this.predictions.length > 5000) this.predictions = this.predictions.slice(-4000);
        this.lastPrediction = predEntry;
        return predEntry;
    }

    getStats() {
        const total = this.predictions.filter(p => p.actual !== null).length;
        const correct = this.predictions.filter(p => p.actual !== null && p.predicted === p.actual).length;
        const rate = total > 0 ? correct / total : 0;
        const recent10 = this.predictions.slice(-10).filter(p => p.actual !== null);
        const recentCorrect = recent10.filter(p => p.predicted === p.actual).length;

        const algoStats = {};
        Object.keys(this.algoStats).forEach(key => {
            const s = this.algoStats[key];
            algoStats[key] = {
                name: this.algos[key].name,
                total: s.total,
                correct: s.correct,
                rate: s.total > 0 ? s.correct / s.total : 0,
                weight: this.algoWeights[key]
            };
        });

        return {
            totalPredictions: total,
            correct: correct,
            accuracy: rate,
            recent10Accuracy: recent10.length > 0 ? (recentCorrect / recent10.length * 100).toFixed(1) + '%' : 'N/A',
            algoStats: algoStats,
            historyLength: this.history.length,
            totalSessionsTracked: this.history.length
        };
    }
}

// ==================== KHỞI TẠO ====================
const predictor = new SmartDicePredictor();

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=15766f58a95cb4f95975ffcf643f524c";
let lastId = null;
let currentPrediction = null;

// (Phần updateDataAndPredict, routes giữ nguyên như file cũ)

async function updateDataAndPredict() { /* giữ nguyên */ 
    try {
        const resp = await axios.get(API_URL, { timeout: 10000 });
        const list = resp.data?.list || [];
        if (!list.length) return;

        const latest = list[0];
        const phienId = latest.id;
        const resultStr = latest.resultTruyenThong;
        const dices = latest.dices || [];

        if (lastId !== phienId) {
            let result = resultStr ? (resultStr.toUpperCase() === "TAI" ? "T" : "X") : 
                        (dices.length === 3 ? (dices.reduce((a,b)=>a+b,0) >= 11 ? "T" : "X") : "T");

            predictor.addResult(phienId, result, dices);
            const predEntry = predictor.makePrediction(phienId + 1, dices);

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
            console.log(`✅ Phiên ${phienId} → ${result}, Dự đoán: ${predEntry.predicted}`);
        }
    } catch (err) {
        console.error("API Error:", err.message);
    }
}

updateDataAndPredict();
setInterval(updateDataAndPredict, 6000);

// ==================== ROUTES ====================
app.get('/predict', (req, res) => currentPrediction ? res.json(currentPrediction) : res.json({ status: 'Đang tải...' }));

app.get('/predict/text', (req, res) => {
    if (!currentPrediction) return res.send('Đang tải dữ liệu...');
    const d = currentPrediction;
    const text = `Id: ${d.id}\nPhien: ${d.phien}\nKet qua: ${d.ket_qua}\nXuc xac: ${d.xuc_xac}\nPhien moi: ${d.phien_moi}\nDu doan: ${d.du_doan}\nDo tin cay: ${d.do_tin_cay}\nLy do: ${d.ly_do}\nTy le tai: ${d.ty_le_tai}\n--- Thong ke ---\nTong: ${d.thong_ke.totalPredictions} | Dung: ${d.thong_ke.correct} | Ty le: ${(d.thong_ke.accuracy*100).toFixed(1)}%\nRecent 10: ${d.thong_ke.recent10Accuracy}`;
    res.send(text);
});

app.get('/stats', (req, res) => res.json(predictor.getStats()));
app.get('/', (req, res) => res.send('Smart Dice Prediction Server running 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy trên port ${PORT}`));