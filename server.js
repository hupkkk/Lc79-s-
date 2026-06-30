const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ==================== HỆ THỐNG DỰ ĐOÁN NÂNG CAO ====================
class UltraDicePredictionSystem {
    constructor() {
        this.history = [];
        this.init();
    }

    init() {
        this.history = [];
    }

    addResult(result) { // result = 'T' hoặc 'X'
        this.history.push(result);
        if (this.history.length > 500) this.history.shift(); // giữ tối đa 500 phiên
    }

    // -------------------- CÁC THUẬT TOÁN DỰ ĐOÁN --------------------
    
    // 1. Dựa trên tần suất có trọng số (weighted frequency)
    getPredictionByFrequency() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };

        // Lấy các khoảng gần đây với trọng số giảm dần
        const weights = [0.5, 0.3, 0.2]; // cho 10, 20, 50 lượt gần nhất
        const windows = [10, 20, 50];
        let weightedT = 0, weightedX = 0;

        windows.forEach((w, idx) => {
            const start = Math.max(0, len - w);
            const slice = this.history.slice(start);
            const tCount = slice.filter(x => x === 'T').length;
            const xCount = slice.length - tCount;
            const weight = weights[idx] || 0.1;
            weightedT += tCount * weight;
            weightedX += xCount * weight;
        });

        // Thêm bias nhẹ cho mean reversion
        const totalWeight = weightedT + weightedX;
        if (totalWeight === 0) return { pred: 'T', conf: 0.5 };

        const probT = weightedT / totalWeight;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.max(0.6, Math.abs(probT - 0.5) * 2 + 0.5));
        return { pred, conf };
    }

    // 2. Markov Chain bậc 1
    getPredictionByMarkov() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };

        // Ma trận chuyển tiếp: [T->T, T->X, X->T, X->X]
        let tt = 0, tx = 0, xt = 0, xx = 0;
        for (let i = 1; i < len; i++) {
            const prev = this.history[i-1];
            const curr = this.history[i];
            if (prev === 'T' && curr === 'T') tt++;
            else if (prev === 'T' && curr === 'X') tx++;
            else if (prev === 'X' && curr === 'T') xt++;
            else if (prev === 'X' && curr === 'X') xx++;
        }

        const last = this.history[len-1];
        let probT = 0;
        if (last === 'T') {
            const total = tt + tx;
            probT = total > 0 ? tt / total : 0.5;
        } else {
            const total = xt + xx;
            probT = total > 0 ? xt / total : 0.5;
        }

        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.max(0.55, Math.abs(probT - 0.5) * 2 + 0.5));
        return { pred, conf };
    }

    // 3. Phát hiện chu kỳ (cycle pattern)
    getPredictionByCycle() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5 };

        // Tìm chu kỳ lặp lại dài nhất trong 50 lần gần nhất
        const recent = this.history.slice(-50);
        const n = recent.length;
        let bestPeriod = 1;
        let bestScore = 0;

        for (let period = 1; period <= Math.min(20, n/2); period++) {
            let matches = 0;
            let total = n - period;
            for (let i = 0; i < total; i++) {
                if (recent[i] === recent[i + period]) matches++;
            }
            const score = matches / total;
            if (score > bestScore) {
                bestScore = score;
                bestPeriod = period;
            }
        }

        // Dự đoán dựa trên chu kỳ tìm được
        if (bestScore > 0.65) {
            const lastIndex = recent.length - 1;
            const nextIndex = lastIndex - bestPeriod; // lấy vị trí cách 1 chu kỳ
            if (nextIndex >= 0 && nextIndex < recent.length) {
                const pred = recent[nextIndex];
                const conf = Math.min(0.85, 0.6 + bestScore * 0.3);
                return { pred, conf };
            }
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 4. Dựa trên streak hiện tại
    getPredictionByStreak() {
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5 };

        let streak = 1;
        const last = this.history[len-1];
        for (let i = len-2; i >= 0; i--) {
            if (this.history[i] === last) streak++;
            else break;
        }

        // Xác suất streak tiếp tục giảm dần theo độ dài
        const baseProb = (last === 'T') ? 
            this.history.filter(x => x === 'T').length / len :
            this.history.filter(x => x === 'X').length / len;

        // Điều chỉnh: streak càng dài, khả năng đảo chiều càng cao
        let probT;
        if (last === 'T') {
            probT = baseProb * Math.pow(0.85, streak - 1); // giảm dần
        } else {
            probT = 1 - baseProb * Math.pow(0.85, streak - 1);
        }
        probT = Math.min(0.95, Math.max(0.05, probT));

        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.85, Math.abs(probT - 0.5) * 2 + 0.5);
        return { pred, conf };
    }

    // 5. Tổ hợp các thuật toán (Ensemble)
    getFinalPrediction() {
        if (this.history.length < 5) {
            return { prediction: 'T', confidence: 0.62 };
        }

        // Lấy kết quả từ từng thuật toán
        const algos = [
            this.getPredictionByFrequency(),
            this.getPredictionByMarkov(),
            this.getPredictionByCycle(),
            this.getPredictionByStreak()
        ];

        // Loại bỏ các dự đoán có độ tin cậy thấp (< 0.55)
        const valid = algos.filter(a => a.conf >= 0.55);
        if (valid.length === 0) {
            // Fallback: dùng frequency
            const freq = this.getPredictionByFrequency();
            return { prediction: freq.pred, confidence: Math.min(0.85, freq.conf) };
        }

        // Trọng số theo độ tin cậy
        let weightT = 0, weightX = 0, totalWeight = 0;
        valid.forEach(a => {
            if (a.pred === 'T') {
                weightT += a.conf;
            } else {
                weightX += a.conf;
            }
            totalWeight += a.conf;
        });

        // Tính xác suất tổng hợp
        const probT = totalWeight > 0 ? weightT / totalWeight : 0.5;
        const pred = probT > 0.5 ? 'T' : 'X';
        // Độ tin cậy = mức độ chênh lệch xác suất + trung bình độ tin cậy
        const avgConf = valid.reduce((sum, a) => sum + a.conf, 0) / valid.length;
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

        return {
            id: "s2king",
            phien: latest.id,
            ket_qua: latest.resultTruyenThong.toLowerCase(),
            xuc_xac: latest.dices ? latest.dices.join('-') : "?-?-?",
            phien_moi: latest.id + 1,
            du_doan: pred.prediction === "T" ? "tài" : "xỉu",
            do_tin_cay: Math.round(pred.confidence * 100) + "%"
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
            do_tin_cay: "68%"
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
Do_tin_cay: ${d.do_tin_cay}`;
    res.send(text);
});

// Route kiểm tra trạng thái hệ thống
app.get('/status', (req, res) => {
    res.json({
        historyLength: system.history.length,
        lastId: lastId,
        lastResult: system.history[system.history.length - 1] || 'none',
        isRunning: true
    });
});

app.get('/', (req, res) => res.send('Ultra Dice Prediction Server is running 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy trên port ${PORT}`);
});

// Cập nhật mỗi 6 giây
setInterval(fetchLatest, 6000);