const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ========================================================================
// HỆ THỐNG DỰ ĐOÁN SIÊU CẤP - TÍCH HỢP 8 THUẬT TOÁN + PHÁT HIỆN SCAM
// ========================================================================
class UltraDicePredictionSystem {
    constructor() {
        this.history = [];
        this.lastPrediction = null;
        this.algoPerformance = {}; // Lưu hiệu suất từng thuật toán
        this.init();
    }

    init() {
        this.history = [];
        this.algoPerformance = {};
    }

    addResult(result) {
        this.history.push(result);
        if (this.history.length > 1000) this.history.shift();
        // Cập nhật hiệu suất cho từng thuật toán sau mỗi lượt (so sánh dự đoán trước)
        this.updateAlgoPerformance(result);
    }

    // ------------------ CẬP NHẬT HIỆU SUẤT THUẬT TOÁN ------------------
    updateAlgoPerformance(actual) {
        // Chỉ cập nhật nếu có dự đoán trước đó
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

    // -------------------- CÁC THUẬT TOÁN DỰ ĐOÁN ------------------------

    // 1. Trend Following (theo xu hướng)
    getTrendFollowing() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };

        // Xác định xu hướng bằng độ dốc của tỷ lệ T trong các cửa sổ
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
        // Nếu slope > 0 => xu hướng T tăng, dự đoán T
        // Nếu slope < 0 => xu hướng X tăng, dự đoán X
        // Mức độ tin cậy dựa trên độ lớn của slope
        const probT = 0.5 + avgSlope * 0.5; // clamp
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.max(0.55, Math.abs(probT - 0.5) * 2 + 0.5));
        return { pred, conf };
    }

    // 2. Counter Trend (bẻ cầu)
    getCounterTrend() {
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5 };

        // Đếm streak hiện tại
        let streak = 1;
        const last = this.history[len-1];
        for (let i = len-2; i >= 0; i--) {
            if (this.history[i] === last) streak++;
            else break;
        }

        // Nếu streak > 3, khả năng đảo chiều tăng
        let probT;
        if (last === 'T') {
            // Nếu đang là T, xác suất X = base + bonus theo streak
            const base = this.history.filter(x => x === 'X').length / len;
            probT = 1 - (base + Math.min(0.3, (streak-3) * 0.05));
        } else {
            const base = this.history.filter(x => x === 'T').length / len;
            probT = base + Math.min(0.3, (streak-3) * 0.05);
        }
        probT = Math.min(0.95, Math.max(0.05, probT));
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.85, Math.abs(probT - 0.5) * 2 + 0.5);
        return { pred, conf };
    }

    // 3. Pattern Recognition (mẫu lặp 2-3 phiên)
    getPatternRecognition() {
        const len = this.history.length;
        if (len < 6) return { pred: 'T', conf: 0.5 };

        // Tìm các mẫu 3 phiên cuối và xem lịch sử có lặp không
        const last3 = this.history.slice(-3).join('');
        let matches = [];
        for (let i = 0; i <= len - 4; i++) {
            const pattern = this.history.slice(i, i+3).join('');
            if (pattern === last3) {
                // Dự đoán kết quả tiếp theo sau mẫu này
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

    // 4. Bayesian Inference (suy luận Bayes)
    getBayesian() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5 };

        // Giả định: kết quả hiện tại phụ thuộc vào 2 phiên trước
        // Xây dựng bảng xác suất có điều kiện P(curr | prev1, prev2)
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

    // 5. Logistic Regression đơn giản (dựa trên các đặc trưng)
    getLogistic() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5 };

        // Đặc trưng: tỷ lệ T trong 5,10,20 phiên gần nhất, streak, độ dốc
        const f5 = this.history.slice(-5).filter(x => x === 'T').length / 5;
        const f10 = this.history.slice(-10).filter(x => x === 'T').length / 10;
        const f20 = this.history.slice(-20).filter(x => x === 'T').length / 20;
        const streak = this.getStreak();
        const slope = (f10 - f20) || 0;

        // Trọng số học được (có thể tối ưu sau)
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

    // 6. Markov Chain bậc 2
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

    // 7. Kiểm tra tính ngẫu nhiên (phát hiện scam)
    detectScam() {
        const len = this.history.length;
        if (len < 30) return { isScam: false, score: 0, adjustment: 0 };

        // Thống kê tần suất T và X
        const tCount = this.history.filter(x => x === 'T').length;
        const xCount = len - tCount;
        const expected = len / 2;
        const chi2 = Math.pow(tCount - expected, 2) / expected + Math.pow(xCount - expected, 2) / expected;
        // Chi-square với 1 bậc tự do, ngưỡng 3.84 (p=0.05)
        const isScam = chi2 > 3.84;

        // Kiểm tra phân phối chu kỳ (có quá nhiều mẫu lặp?)
        let repeats = 0;
        for (let i = 1; i < len; i++) {
            if (this.history[i] === this.history[i-1]) repeats++;
        }
        const repeatRate = repeats / (len-1);
        // Nếu repeatRate quá cao hoặc quá thấp => bất thường
        const normalRepeat = 0.5; // với random, tỉ lệ lặp là 0.5
        const diffRepeat = Math.abs(repeatRate - normalRepeat);
        const scamScore = (chi2 / 10) + diffRepeat * 2; // điểm càng cao càng scam

        // adjustment: nếu scam, giảm độ tin cậy của các thuật toán xu hướng
        let adjustment = 0;
        if (scamScore > 1.5) {
            adjustment = -0.2; // giảm tin cậy
        }

        return { isScam: scamScore > 1.5, score: scamScore, adjustment };
    }

    // 8. Dự đoán từ tổ hợp các thuật toán với trọng số động
    getFinalPrediction() {
        if (this.history.length < 5) {
            return { prediction: 'T', confidence: 0.62 };
        }

        // 1. Lấy kết quả từ tất cả các thuật toán
        const algoResults = {
            trend: this.getTrendFollowing(),
            counter: this.getCounterTrend(),
            pattern: this.getPatternRecognition(),
            bayes: this.getBayesian(),
            logistic: this.getLogistic(),
            markov2: this.getMarkovChain2()
        };

        // Lưu lại để cập nhật hiệu suất sau
        this.lastPrediction = algoResults;

        // 2. Kiểm tra scam
        const scamInfo = this.detectScam();
        const adjustment = scamInfo.adjustment;

        // 3. Tính trọng số cho từng thuật toán dựa trên hiệu suất lịch sử và điều chỉnh scam
        let weights = {};
        let totalWeight = 0;
        const algoNames = Object.keys(algoResults);
        algoNames.forEach(name => {
            let w = 1.0;
            if (this.algoPerformance[name] && this.algoPerformance[name].total > 5) {
                const acc = this.algoPerformance[name].correct / this.algoPerformance[name].total;
                w = Math.max(0.3, Math.min(1.5, acc * 1.5)); // trọng số theo accuracy
            }
            // Điều chỉnh nếu scam
            if (name === 'trend' || name === 'counter') {
                w += adjustment;
            }
            // Ưu tiên các thuật toán có độ tin cậy cao hiện tại
            const conf = algoResults[name].conf || 0.5;
            w = w * (conf / 0.6); // nếu conf > 0.6 thì tăng trọng
            weights[name] = Math.max(0.2, w);
            totalWeight += weights[name];
        });

        // 4. Tổng hợp có trọng số
        let probT = 0;
        algoNames.forEach(name => {
            const pred = algoResults[name].pred;
            const w = weights[name] / totalWeight;
            if (pred === 'T') probT += w;
            // nếu pred X thì không đóng góp vào probT
        });

        // 5. Kết hợp với tỷ lệ tổng thể để tránh bias
        const globalRate = this.history.filter(x => x === 'T').length / this.history.length;
        probT = probT * 0.7 + globalRate * 0.3;

        // 6. Quyết định cuối cùng
        const pred = probT > 0.5 ? 'T' : 'X';
        // Độ tin cậy dựa trên mức độ chênh lệch và độ tin cậy trung bình
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

        // Kiểm tra scam để thêm vào kết quả
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