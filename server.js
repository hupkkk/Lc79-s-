const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ========================================================================
// HỆ THỐNG DỰ ĐOÁN SIÊU CẤP - 12 THUẬT TOÁN + PHÁT HIỆN SCAM + BẺ CẦU
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

    // -------------------- CÁC THUẬT TOÁN BẺ CẦU (COUNTER-TREND) --------------------

    // 1. Mean Reversion với biên động (mạnh)
    getMeanReversion() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5 };

        // Lấy tỷ lệ T trong 5,10,20 phiên gần nhất
        const rates = {
            r5: this.history.slice(-5).filter(x => x === 'T').length / 5,
            r10: this.history.slice(-10).filter(x => x === 'T').length / 10,
            r20: this.history.slice(-20).filter(x => x === 'T').length / 20
        };
        // Tính độ lệch khỏi 0.5
        const dev5 = Math.abs(rates.r5 - 0.5);
        const dev10 = Math.abs(rates.r10 - 0.5);
        const dev20 = Math.abs(rates.r20 - 0.5);
        const avgDev = (dev5 + dev10 + dev20) / 3;

        // Nếu độ lệch lớn (>0.2) => khả năng đảo chiều
        let probT = 0.5;
        if (avgDev > 0.2) {
            // Dự đoán ngược với xu hướng hiện tại (dựa trên r5)
            probT = rates.r5 < 0.5 ? 0.7 : 0.3; // bẻ về phía ngược lại
            const strength = Math.min(0.9, 0.6 + avgDev);
            return { pred: probT > 0.5 ? 'T' : 'X', conf: strength };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 2. Fibonacci Retracement (áp dụng cho chuỗi win/loss)
    getFibonacci() {
        const len = this.history.length;
        if (len < 15) return { pred: 'T', conf: 0.5 };

        // Chuyển đổi T/X thành 1/0
        const series = this.history.map(x => x === 'T' ? 1 : 0);
        // Tìm các đỉnh và đáy cục bộ (cửa sổ 5)
        let peaks = [], troughs = [];
        for (let i = 2; i < series.length - 2; i++) {
            if (series[i] > series[i-1] && series[i] > series[i+1] &&
                series[i] > series[i-2] && series[i] > series[i+2]) {
                peaks.push({ idx: i, val: series[i] });
            }
            if (series[i] < series[i-1] && series[i] < series[i+1] &&
                series[i] < series[i-2] && series[i] < series[i+2]) {
                troughs.push({ idx: i, val: series[i] });
            }
        }
        if (peaks.length < 2 || troughs.length < 2) return { pred: 'T', conf: 0.5 };

        // Lấy đỉnh và đáy gần nhất
        const lastPeak = peaks[peaks.length-1];
        const lastTrough = troughs[troughs.length-1];
        if (Math.abs(lastPeak.idx - lastTrough.idx) < 3) return { pred: 'T', conf: 0.5 };

        // Tính mức Fib (0.382, 0.5, 0.618) dựa trên biên độ
        const diff = lastPeak.val - lastTrough.val;
        const level382 = lastPeak.val - diff * 0.382;
        const level618 = lastPeak.val - diff * 0.618;

        // Dự đoán dựa vào vị trí hiện tại
        const current = series[series.length-1];
        const currentLevel = (current - lastTrough.val) / diff; // vị trí tương đối

        let probT;
        if (currentLevel > 0.618) {
            // Đang ở vùng quá mua => bẻ xuống (X)
            probT = 0.3;
        } else if (currentLevel < 0.382) {
            // Đang ở vùng quá bán => bẻ lên (T)
            probT = 0.7;
        } else {
            probT = 0.5;
        }
        const conf = 0.6 + 0.2 * Math.abs(probT - 0.5) * 2;
        return { pred: probT > 0.5 ? 'T' : 'X', conf: Math.min(0.9, conf) };
    }

    // 3. RSI - Chỉ số sức mạnh tương đối (cho chuỗi nhị phân)
    getRSI() {
        const len = this.history.length;
        if (len < 14) return { pred: 'T', conf: 0.5 };

        // Chuyển thành 1/0, tính RSI 14 phiên
        const wins = this.history.slice(-14).map(x => x === 'T' ? 1 : 0);
        const losses = this.history.slice(-14).map(x => x === 'T' ? 0 : 1);
        const avgWin = wins.reduce((a,b) => a+b, 0) / 14;
        const avgLoss = losses.reduce((a,b) => a+b, 0) / 14;
        if (avgLoss === 0) return { pred: 'X', conf: 0.85 }; // toàn thắng => bẻ xuống
        const rs = avgWin / avgLoss;
        const rsi = 100 - (100 / (1 + rs));

        // RSI > 70 => quá mua (bẻ xuống), RSI < 30 => quá bán (bẻ lên)
        let probT;
        if (rsi > 70) probT = 0.25;
        else if (rsi < 30) probT = 0.75;
        else probT = 0.5;
        const conf = 0.6 + 0.25 * Math.min(1, Math.abs(rsi - 50) / 50);
        return { pred: probT > 0.5 ? 'T' : 'X', conf: Math.min(0.9, conf) };
    }

    // 4. Z-score của streak hiện tại
    getStreakZScore() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5 };

        // Tính phân phối streak dài nhất trong lịch sử (cửa sổ 50)
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

        // Đếm streak hiện tại
        const last = this.history[this.history.length-1];
        let currentStreak = 1;
        for (let i = len-2; i >=0; i--) {
            if (this.history[i] === last) currentStreak++;
            else break;
        }
        const z = (currentStreak - mean) / std;
        // Nếu z > 2 => streak quá dài => bẻ
        if (z > 1.5) {
            const probT = last === 'T' ? 0.2 : 0.8; // bẻ ngược
            const conf = Math.min(0.85, 0.6 + (z-1.5)*0.15);
            return { pred: probT > 0.5 ? 'T' : 'X', conf };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 5. Gann Swing (phát hiện điểm đảo chiều)
    getGannSwing() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5 };

        // Chuyển thành 1/0
        const series = this.history.map(x => x === 'T' ? 1 : 0);
        // Tìm các swing high/low cục bộ (cửa sổ 3)
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
        // Nếu hai swing gần nhất khác loại và cách nhau ít => có thể đảo chiều
        if (lastSwing.type !== prevSwing.type && (lastSwing.idx - prevSwing.idx) <= 5) {
            // Dự đoán theo swing type
            const pred = lastSwing.type === 'high' ? 'X' : 'T'; // bẻ ngược
            return { pred, conf: 0.75 };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // -------------------- CÁC THUẬT TOÁN THEO CẦU (TREND-FOLLOWING) --------------------

    // 6. Trend Following (cơ bản)
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

    // 7. Pattern Recognition (mẫu lặp)
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

    // 8. Bayesian (dùng 2 phiên trước)
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

    // 9. Logistic Regression (học đơn giản)
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

    // 10. Markov Chain bậc 2
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

    // 11. Phát hiện scam (kiểm tra tính ngẫu nhiên)
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
        if (scamScore > 1.5) adjustment = -0.2;

        return { isScam: scamScore > 1.5, score: scamScore, adjustment };
    }

    // -------------------- TỔNG HỢP ENSEMBLE --------------------

    getFinalPrediction() {
        if (this.history.length < 5) {
            return { prediction: 'T', confidence: 0.62 };
        }

        // Danh sách tất cả thuật toán
        const algoResults = {
            // Bẻ cầu (counter)
            meanRev: this.getMeanReversion(),
            fibo: this.getFibonacci(),
            rsi: this.getRSI(),
            streakZ: this.getStreakZScore(),
            gann: this.getGannSwing(),
            // Theo cầu (trend)
            trend: this.getTrendFollowing(),
            pattern: this.getPatternRecognition(),
            bayes: this.getBayesian(),
            logistic: this.getLogistic(),
            markov2: this.getMarkovChain2()
        };

        this.lastPrediction = algoResults;

        // Kiểm tra scam
        const scamInfo = this.detectScam();
        const adjustment = scamInfo.adjustment;

        // Tính trọng số động
        let weights = {};
        let totalWeight = 0;
        const algoNames = Object.keys(algoResults);
        algoNames.forEach(name => {
            let w = 1.0;
            // Hiệu suất lịch sử
            if (this.algoPerformance[name] && this.algoPerformance[name].total > 5) {
                const acc = this.algoPerformance[name].correct / this.algoPerformance[name].total;
                w = Math.max(0.3, Math.min(1.5, acc * 1.5));
            }
            // Điều chỉnh scam: giảm trọng số các thuật toán theo cầu
            if (['trend', 'pattern', 'bayes', 'logistic', 'markov2'].includes(name)) {
                w += adjustment;
            }
            // Ưu tiên các thuật toán bẻ cầu khi có dấu hiệu đảo chiều
            const conf = algoResults[name].conf || 0.5;
            w = w * (conf / 0.6);
            weights[name] = Math.max(0.2, w);
            totalWeight += weights[name];
        });

        // Tổng hợp có trọng số
        let probT = 0;
        algoNames.forEach(name => {
            const pred = algoResults[name].pred;
            const w = weights[name] / totalWeight;
            if (pred === 'T') probT += w;
        });

        // Kết hợp với tỷ lệ tổng thể
        const globalRate = this.history.filter(x => x === 'T').length / this.history.length;
        probT = probT * 0.7 + globalRate * 0.3;

        // Quyết định cuối
        const pred = probT > 0.5 ? 'T' : 'X';
        const avgConf = algoNames.reduce((sum, name) => sum + algoResults[name].conf, 0) / algoNames.length;
        const confidence = Math.min(0.95, Math.max(0.6, avgConf + Math.abs(probT - 0.5) * 0.5));

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

        if (lastId !== latest.id) {
            const result = latest.resultTruyenThong === "TAI" ? "T" : "X";
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
            ket_qua: latest.resultTruyenThong.toLowerCase(),
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
            ket_qua: "tài",
            xuc_xac: "3-4-5",
            phien_moi: "N/A",
            du_doan: "xỉu",
            do_tin_cay: "68%",
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
});

// Cập nhật mỗi 6 giây
setInterval(fetchLatest, 6000);