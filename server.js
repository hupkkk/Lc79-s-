const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ========================================================================
// HỆ THỐNG DỰ ĐOÁN CHUYÊN BẺ CẦU - 13 THUẬT TOÁN + ĐIỀU CHỈNH ĐỘNG
// ========================================================================
class UltraDicePredictionSystem {
    constructor() {
        this.history = [];
        this.lastPrediction = null;
        this.algoPerformance = {};
        this.init();
    }

    init() {
        this.history = [];
        this.algoPerformance = {};
    }

    addResult(result) {
        this.history.push(result);
        if (this.history.length > 1500) this.history.shift();
        this.updateAlgoPerformance(result);
        console.log(`📊 Lịch sử hiện tại: ${this.history.join('')} (${this.history.length} phiên)`);
    }

    updateAlgoPerformance(actual) {
        if (!this.lastPrediction) return;
        const algoNames = Object.keys(this.lastPrediction);
        algoNames.forEach(name => {
            if (this.lastPrediction[name] && this.lastPrediction[name].pred) {
                const pred = this.lastPrediction[name].pred;
                const correct = (pred === actual) ? 1 : 0;
                if (!this.algoPerformance[name]) {
                    this.algoPerformance[name] = { total: 0, correct: 0 };
                }
                this.algoPerformance[name].total += 1;
                this.algoPerformance[name].correct += correct;
            }
        });
    }

    // -------------------- CÁC THUẬT TOÁN BẺ CẦU (CHỦ LỰC) --------------------

    // 1. Mean Reversion nâng cao
    getMeanReversion() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5 };
        // Tính độ lệch của tỷ lệ T ở các khung
        const r5 = this.history.slice(-5).filter(x => x === 'T').length / 5;
        const r10 = this.history.slice(-10).filter(x => x === 'T').length / 10;
        const r20 = this.history.slice(-20).filter(x => x === 'T').length / 20;
        const dev5 = Math.abs(r5 - 0.5);
        const dev10 = Math.abs(r10 - 0.5);
        const dev20 = Math.abs(r20 - 0.5);
        // Độ lệch trung bình
        const avgDev = (dev5 + dev10 + dev20) / 3;
        // Nếu độ lệch lớn, dự đoán ngược chiều
        if (avgDev > 0.15) {
            // Lấy hướng ngược lại theo khung 5
            const probT = r5 > 0.5 ? 0.25 : 0.75;
            const conf = Math.min(0.9, 0.55 + avgDev * 1.2);
            return { pred: probT > 0.5 ? 'T' : 'X', conf };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 2. Fibonacci kết hợp với RSI (tổ hợp)
    getFiboRSI() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5 };
        // Chuyển sang 1/0
        const series = this.history.map(x => x === 'T' ? 1 : 0);
        // Tìm đỉnh đáy cục bộ
        let peaks = [], troughs = [];
        for (let i = 3; i < series.length - 3; i++) {
            if (series[i] > series[i-1] && series[i] > series[i+1] &&
                series[i] > series[i-2] && series[i] > series[i+2]) peaks.push({ idx: i, val: series[i] });
            if (series[i] < series[i-1] && series[i] < series[i+1] &&
                series[i] < series[i-2] && series[i] < series[i+2]) troughs.push({ idx: i, val: series[i] });
        }
        if (peaks.length < 2 || troughs.length < 2) return { pred: 'T', conf: 0.5 };
        const lastPeak = peaks[peaks.length-1];
        const lastTrough = troughs[troughs.length-1];
        if (Math.abs(lastPeak.idx - lastTrough.idx) < 4) return { pred: 'T', conf: 0.5 };
        const diff = lastPeak.val - lastTrough.val;
        const level382 = lastPeak.val - diff * 0.382;
        const level618 = lastPeak.val - diff * 0.618;
        const current = series[series.length-1];
        const currentLevel = (current - lastTrough.val) / diff;
        // Tính RSI 14
        const wins = this.history.slice(-14).map(x => x === 'T' ? 1 : 0);
        const losses = this.history.slice(-14).map(x => x === 'T' ? 0 : 1);
        const avgWin = wins.reduce((a,b) => a+b, 0) / 14;
        const avgLoss = losses.reduce((a,b) => a+b, 0) / 14;
        if (avgLoss === 0) return { pred: 'X', conf: 0.85 };
        const rs = avgWin / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        // Kết hợp Fib và RSI
        let probT = 0.5;
        let conf = 0.5;
        if (currentLevel > 0.618 && rsi > 65) {
            probT = 0.2; // quá mua -> bẻ xuống
            conf = 0.75;
        } else if (currentLevel < 0.382 && rsi < 35) {
            probT = 0.8; // quá bán -> bẻ lên
            conf = 0.75;
        } else {
            return { pred: 'T', conf: 0.5 };
        }
        return { pred: probT > 0.5 ? 'T' : 'X', conf };
    }

    // 3. Z-score Streak cải tiến
    getStreakZScore() {
        const len = this.history.length;
        if (len < 30) return { pred: 'T', conf: 0.5 };
        const window = this.history.slice(-50);
        let streaks = [];
        let curr = 1;
        for (let i = 1; i < window.length; i++) {
            if (window[i] === window[i-1]) curr++;
            else {
                streaks.push(curr);
                curr = 1;
            }
        }
        streaks.push(curr);
        const mean = streaks.reduce((a,b) => a+b, 0) / streaks.length;
        const std = Math.sqrt(streaks.reduce((a,b) => a + Math.pow(b-mean,2), 0) / streaks.length);
        if (std === 0) return { pred: 'T', conf: 0.5 };
        const last = this.history[this.history.length-1];
        let currentStreak = 1;
        for (let i = len-2; i >=0; i--) {
            if (this.history[i] === last) currentStreak++;
            else break;
        }
        const z = (currentStreak - mean) / std;
        if (z > 1.2) {
            const probT = last === 'T' ? 0.15 : 0.85;
            const conf = Math.min(0.9, 0.6 + (z-1.2)*0.2);
            return { pred: probT > 0.5 ? 'T' : 'X', conf };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 4. Phát hiện đảo chiều qua Swing (Gann)
    getGannSwing() {
        const len = this.history.length;
        if (len < 12) return { pred: 'T', conf: 0.5 };
        const series = this.history.map(x => x === 'T' ? 1 : 0);
        let swings = [];
        for (let i = 2; i < series.length - 2; i++) {
            if (series[i] > series[i-1] && series[i] > series[i+1]) {
                swings.push({ idx: i, type: 'high', val: series[i] });
            } else if (series[i] < series[i-1] && series[i] < series[i+1]) {
                swings.push({ idx: i, type: 'low', val: series[i] });
            }
        }
        if (swings.length < 3) return { pred: 'T', conf: 0.5 };
        const lastSwing = swings[swings.length-1];
        const prevSwing = swings[swings.length-2];
        // Nếu hai swing gần nhất khác loại và cách nhau ≤5 -> đảo chiều
        if (lastSwing.type !== prevSwing.type && (lastSwing.idx - prevSwing.idx) <= 5) {
            const pred = lastSwing.type === 'high' ? 'X' : 'T';
            // Thêm kiểm tra nếu đã có 3 phiên cùng hướng sau swing
            const afterSwing = this.history.slice(lastSwing.idx+1);
            if (afterSwing.length >= 3) {
                const firstThree = afterSwing.slice(0,3);
                if (firstThree.every(x => x === (lastSwing.type === 'high' ? 'T' : 'X'))) {
                    // Đã có 3 phiên theo hướng swing -> đảo chiều mạnh
                    return { pred, conf: 0.82 };
                }
            }
            return { pred, conf: 0.7 };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 5. Divergence (phân kỳ giá - chỉ báo)
    getDivergence() {
        const len = this.history.length;
        if (len < 30) return { pred: 'T', conf: 0.5 };
        // Tính RSI 14 và giá (tỷ lệ T)
        const values = this.history.map(x => x === 'T' ? 1 : 0);
        let rsiValues = [];
        for (let i = 14; i < values.length; i++) {
            const window = values.slice(i-14, i);
            const wins = window.filter(x => x === 1).length;
            const losses = 14 - wins;
            const rs = losses === 0 ? 100 : wins / losses;
            const rsi = 100 - (100 / (1 + rs));
            rsiValues.push(rsi);
        }
        // Tìm đỉnh/đáy của giá và RSI
        const price = values.slice(14);
        // So sánh 5 điểm gần nhất
        const last5Price = price.slice(-5);
        const last5Rsi = rsiValues.slice(-5);
        // Tìm xu hướng của giá và RSI
        const priceSlope = (last5Price[4] - last5Price[0]) / 4;
        const rsiSlope = (last5Rsi[4] - last5Rsi[0]) / 4;
        // Phân kỳ: giá tăng nhưng RSI giảm -> đảo chiều giảm
        if (priceSlope > 0 && rsiSlope < -0.5) {
            return { pred: 'X', conf: 0.75 };
        }
        // Phân kỳ: giá giảm nhưng RSI tăng -> đảo chiều tăng
        if (priceSlope < 0 && rsiSlope > 0.5) {
            return { pred: 'T', conf: 0.75 };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 6. Bẻ theo xu hướng dài hạn (Counter Trend dài)
    getLongTermCounter() {
        const len = this.history.length;
        if (len < 50) return { pred: 'T', conf: 0.5 };
        const totalT = this.history.filter(x => x === 'T').length;
        const totalRate = totalT / len;
        // Nếu tỷ lệ T > 0.65 trong 50 phiên -> khả năng đảo chiều
        if (totalRate > 0.65) {
            return { pred: 'X', conf: 0.7 };
        }
        if (totalRate < 0.35) {
            return { pred: 'T', conf: 0.7 };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // -------------------- THUẬT TOÁN THEO CẦU (PHỤ TRỢ) --------------------

    getTrendFollowing() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };
        const windowSizes = [10, 20, 30];
        let slopes = [];
        windowSizes.forEach(w => {
            if (len >= w) {
                const firstHalf = this.history.slice(len - w, len - w/2);
                const secondHalf = this.history.slice(len - w/2);
                const rate1 = firstHalf.filter(x => x === 'T').length / firstHalf.length;
                const rate2 = secondHalf.filter(x => x === 'T').length / secondHalf.length;
                slopes.push(rate2 - rate1);
            }
        });
        const avgSlope = slopes.reduce((a,b) => a+b, 0) / (slopes.length || 1);
        const probT = 0.5 + avgSlope * 0.5;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.max(0.55, Math.abs(probT - 0.5) * 2 + 0.5));
        return { pred, conf };
    }

    getPatternRecognition() {
        const len = this.history.length;
        if (len < 6) return { pred: 'T', conf: 0.5 };
        const last3 = this.history.slice(-3).join('');
        let matches = [];
        for (let i = 0; i <= len - 4; i++) {
            const pattern = this.history.slice(i, i+3).join('');
            if (pattern === last3) {
                const next = this.history[i+3];
                matches.push(next);
            }
        }
        if (matches.length >= 2) {
            const tCount = matches.filter(x => x === 'T').length;
            const probT = tCount / matches.length;
            const pred = probT > 0.5 ? 'T' : 'X';
            const conf = Math.min(0.9, Math.abs(probT - 0.5) * 2 + 0.5);
            return { pred, conf };
        }
        return { pred: 'T', conf: 0.5 };
    }

    getBayesian() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5 };
        const states = {};
        for (let i = 2; i < len; i++) {
            const key = this.history[i-2] + this.history[i-1];
            const curr = this.history[i];
            if (!states[key]) states[key] = { T: 0, X: 0 };
            states[key][curr] += 1;
        }
        const lastKey = this.history[len-2] + this.history[len-1];
        const counts = states[lastKey];
        if (!counts || (counts.T + counts.X) < 2) return { pred: 'T', conf: 0.5 };
        const probT = counts.T / (counts.T + counts.X);
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT - 0.5) * 2 + 0.5);
        return { pred, conf };
    }

    getLogistic() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5 };
        const f5 = this.history.slice(-5).filter(x => x === 'T').length / 5;
        const f10 = this.history.slice(-10).filter(x => x === 'T').length / 10;
        const f20 = this.history.slice(-20).filter(x => x === 'T').length / 20;
        const streak = this.getStreak();
        const slope = (f10 - f20) || 0;
        const w0 = -0.2, w1 = 0.5, w2 = 0.8, w3 = -0.3, w4 = 0.4;
        const logit = w0 + w1*f5 + w2*f10 + w3*streak + w4*slope;
        const probT = 1 / (1 + Math.exp(-logit));
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT - 0.5) * 2 + 0.5);
        return { pred, conf };
    }

    getStreak() {
        if (this.history.length === 0) return 0;
        let s = 1;
        const last = this.history[this.history.length-1];
        for (let i=this.history.length-2; i>=0; i--) {
            if (this.history[i] === last) s++;
            else break;
        }
        return s;
    }

    getMarkovChain2() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5 };
        const states = {};
        for (let i = 2; i < len; i++) {
            const key = this.history[i-2] + this.history[i-1];
            const next = this.history[i];
            if (!states[key]) states[key] = { T: 0, X: 0 };
            states[key][next] += 1;
        }
        const lastKey = this.history[len-2] + this.history[len-1];
        const counts = states[lastKey];
        if (!counts) return { pred: 'T', conf: 0.5 };
        const total = counts.T + counts.X;
        const probT = counts.T / total;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT - 0.5) * 2 + 0.5);
        return { pred, conf };
    }

    // -------------------- PHÁT HIỆN SCAM --------------------
    detectScam() {
        const len = this.history.length;
        if (len < 30) return { isScam: false, score: 0, adjustment: 0 };
        const tCount = this.history.filter(x => x === 'T').length;
        const xCount = len - tCount;
        const expected = len / 2;
        const chi2 = Math.pow(tCount - expected, 2) / expected + Math.pow(xCount - expected, 2) / expected;
        const isScam = chi2 > 3.84;
        let repeats = 0;
        for (let i = 1; i < len; i++) {
            if (this.history[i] === this.history[i-1]) repeats++;
        }
        const repeatRate = repeats / (len-1);
        const diffRepeat = Math.abs(repeatRate - 0.5);
        const scamScore = (chi2 / 10) + diffRepeat * 2;
        let adjustment = 0;
        if (scamScore > 1.5) adjustment = -0.3;
        return { isScam: scamScore > 1.5, score: scamScore, adjustment };
    }

    // -------------------- TỔNG HỢP ENSEMBLE (ƯU TIÊN BẺ CẦU) --------------------
    getFinalPrediction() {
        // Nếu chưa có đủ dữ liệu, trả về dự đoán ngẫu nhiên hợp lý (50-50)
        if (this.history.length < 5) {
            // Dùng tỷ lệ tổng thể nếu có, ngược lại 50-50
            const rate = this.history.length > 0 ? this.history.filter(x => x === 'T').length / this.history.length : 0.5;
            const pred = rate > 0.5 ? 'T' : 'X';
            const conf = 0.6 + Math.abs(rate - 0.5) * 0.3;
            return { prediction: pred, confidence: Math.min(0.85, conf) };
        }

        // 1. Lấy tất cả thuật toán
        const algoResults = {
            // Bẻ cầu (6 thuật toán)
            meanRev: this.getMeanReversion(),
            fiboRsi: this.getFiboRSI(),
            streakZ: this.getStreakZScore(),
            gann: this.getGannSwing(),
            divergence: this.getDivergence(),
            longCounter: this.getLongTermCounter(),
            // Theo cầu (5 thuật toán)
            trend: this.getTrendFollowing(),
            pattern: this.getPatternRecognition(),
            bayes: this.getBayesian(),
            logistic: this.getLogistic(),
            markov2: this.getMarkovChain2()
        };

        this.lastPrediction = algoResults;

        const scamInfo = this.detectScam();
        const adjustment = scamInfo.adjustment;

        // 2. Phân loại thuật toán
        const counterAlgos = ['meanRev', 'fiboRsi', 'streakZ', 'gann', 'divergence', 'longCounter'];
        const trendAlgos = ['trend', 'pattern', 'bayes', 'logistic', 'markov2'];

        // 3. Tính trọng số cơ bản
        let weights = {};
        let totalWeight = 0;
        const algoNames = Object.keys(algoResults);

        // Đếm số phiên streak hiện tại
        const streak = this.getStreak();
        const isLongStreak = streak >= 4;

        // Trọng số mặc định: ưu tiên bẻ cầu (tăng 30%)
        const baseCounterWeight = 1.3;
        const baseTrendWeight = 0.8;

        algoNames.forEach(name => {
            let w = 1.0;
            // Hiệu suất lịch sử
            if (this.algoPerformance[name] && this.algoPerformance[name].total > 5) {
                const acc = this.algoPerformance[name].correct / this.algoPerformance[name].total;
                w = Math.max(0.3, Math.min(1.8, acc * 1.5));
            }

            // Ưu tiên bẻ cầu khi streak dài
            if (counterAlgos.includes(name)) {
                w *= baseCounterWeight;
                if (isLongStreak) w *= 1.5; // tăng thêm nếu streak dài
            } else if (trendAlgos.includes(name)) {
                w *= baseTrendWeight;
                if (isLongStreak) w *= 0.7; // giảm nếu streak dài
            }

            // Điều chỉnh scam
            w += adjustment;

            // Độ tin cậy hiện tại
            const conf = algoResults[name].conf || 0.5;
            w = w * (conf / 0.6);

            weights[name] = Math.max(0.2, w);
            totalWeight += weights[name];
        });

        // 4. Tổng hợp có trọng số
        let probT = 0;
        algoNames.forEach(name => {
            const pred = algoResults[name].pred;
            const w = weights[name] / totalWeight;
            if (pred === 'T') probT += w;
        });

        // 5. Thêm bias cho bẻ cầu nếu các thuật toán bẻ cầu đồng thuận
        let counterConsensus = 0;
        let consensusPred = null;
        counterAlgos.forEach(name => {
            const p = algoResults[name].pred;
            if (p === 'T') counterConsensus++;
            else counterConsensus--;
        });
        // Nếu có >= 4/6 thuật toán bẻ cầu đồng thuận thì tăng cường
        if (Math.abs(counterConsensus) >= 4) {
            // Điều chỉnh probT theo hướng đồng thuận của bẻ cầu
            const consensusPred = counterConsensus > 0 ? 'T' : 'X';
            if (consensusPred === 'T') {
                probT = Math.min(0.9, probT + 0.15);
            } else {
                probT = Math.max(0.1, probT - 0.15);
            }
        }

        // Kết hợp với tỷ lệ tổng thể (giảm tác động)
        const globalRate = this.history.filter(x => x === 'T').length / this.history.length;
        probT = probT * 0.8 + globalRate * 0.2; // tỷ lệ tổng thể ít ảnh hưởng

        // 6. Quyết định cuối
        const pred = probT > 0.5 ? 'T' : 'X';
        const avgConf = algoNames.reduce((sum, name) => sum + algoResults[name].conf, 0) / algoNames.length;
        let confidence = avgConf + Math.abs(probT - 0.5) * 0.5;
        confidence = Math.min(0.95, Math.max(0.6, confidence));

        console.log(`🔮 Dự đoán: ${pred === 'T' ? 'TÀI' : 'XỈU'} (độ tin cậy ${Math.round(confidence*100)}%) - probT=${probT.toFixed(3)}`);

        return { prediction: pred, confidence: confidence };
    }
}

// ==================== KHỞI TẠO HỆ THỐNG ====================
const system = new UltraDicePredictionSystem();

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=15766f58a95cb4f95975ffcf643f524c";
let lastId = null;

async function fetchLatest() {
    try {
        const resp = await axios.get(API_URL, { timeout: 10000 });
        const list = resp.data?.list || [];
        if (!list.length) return null;

        const latest = list[0];
        console.log(`📡 API trả về: id=${latest.id}, result=${latest.resultTruyenThong}, dices=${latest.dices}`);

        if (lastId !== latest.id) {
            let result;
            if (latest.resultTruyenThong && latest.resultTruyenThong.toUpperCase() === "TAI") {
                result = "T";
            } else {
                result = "X";
            }
            system.addResult(result);
            lastId = latest.id;
            console.log(`✅ Cập nhật phiên ${latest.id} → ${result}`);
        }

        const pred = system.getFinalPrediction();
        const scamInfo = system.detectScam();
        const scamStatus = scamInfo.isScam ? "⚠️ Có dấu hiệu bất thường" : "✅ Bình thường";

        return {
            id: "s2king",
            phien: latest.id,
            ket_qua: latest.resultTruyenThong ? latest.resultTruyenThong.toLowerCase() : "không rõ",
            xuc_xac: latest.dices ? latest.dices.join('-') : "?-?-?",
            phien_moi: latest.id + 1,
            du_doan: pred.prediction === "T" ? "tài" : "xỉu",
            do_tin_cay: Math.round(pred.confidence * 100) + "%",
            kiem_tra_scam: scamStatus,
            chi_so_ngau_nhien: scamInfo.score.toFixed(2)
        };
    } catch (err) {
        console.error("API Error:", err.message);
        return {
            id: "s2king",
            phien: "Error",
            ket_qua: "lỗi",
            xuc_xac: "?-?-?",
            phien_moi: "N/A",
            du_doan: "xỉu",
            do_tin_cay: "50%",
            kiem_tra_scam: "⚠️ Không kiểm tra được",
            chi_so_ngau_nhien: "0"
        };
    }
}

// ==================== ROUTES ====================
app.get('/predict', async (req, res) => {
    const data = await fetchLatest();
    res.json(data);
});

app.get('/predict/text', async (req, res) => {
    const d = await fetchLatest();
    const text = `Id: ${d.id}
Phien: ${d.phien}
ket_qua: ${d.ket_qua}
Xuc_xac: ${d.xuc_xac}
Phien_moi: ${d.phien_moi}
Du_doan: ${d.du_doan}
Do_tin_cay: ${d.do_tin_cay}
Kiem tra scam: ${d.kiem_tra_scam}
Chi so ngau nhien: ${d.chi_so_ngau_nhien}`;
    res.send(text);
});

app.get('/status', (req, res) => {
    res.json({
        historyLength: system.history.length,
        lastId: lastId,
        lastResult: system.history[system.history.length - 1] || 'none',
        isRunning: true,
        algoPerformance: system.algoPerformance
    });
});

app.get('/', (req, res) => res.send('Ultra Dice Prediction Server is running 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy trên port ${PORT}`);
    console.log('⏳ Đang chờ dữ liệu từ API...');
});

// Cập nhật mỗi 6 giây
setInterval(fetchLatest, 6000);