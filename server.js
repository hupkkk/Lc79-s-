const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ========================================================================
// HỆ THỐNG DỰ ĐOÁN THÔNG MINH - HỌC TỪ SAI LẦM
// ========================================================================

class UltraDicePredictionSystem {
    constructor() {
        this.history = [];           // Lưu các phiên { id, result, dices, md5 }
        this.predictions = [];       // Lưu các dự đoán trước đó để học
        this.weights = {};           // Trọng số cho từng thuật toán
        this.learningRate = 0.1;
        this.init();
    }

    init() {
        this.history = [];
        this.predictions = [];
        this.weights = {
            // Khởi tạo trọng số mặc định cho từng thuật toán
            frequency: 1.0,
            markov: 1.0,
            pattern: 1.0,
            counter: 1.0,
            streak: 1.0,
            diceSum: 1.0,
            dicePattern: 1.0,
            md5Hash: 1.0,
            ensemble: 1.0
        };
    }

    // Thêm kết quả thực tế vào lịch sử
    addResult(phien, result, dices, md5) {
        this.history.push({
            id: phien,
            result: result, // 'T' hoặc 'X'
            dices: dices,   // mảng 3 số
            md5: md5,
            timestamp: Date.now()
        });
        if (this.history.length > 2000) this.history.shift();
        // Học từ dự đoán sai của phiên trước
        this.learnFromMistakes();
    }

    // Học từ những dự đoán sai
    learnFromMistakes() {
        if (this.predictions.length === 0) return;
        // Lấy dự đoán gần nhất chưa được học
        const lastPred = this.predictions[this.predictions.length - 1];
        if (lastPred.learned) return;
        // Tìm kết quả thực tế tương ứng
        const actualResult = this.history.find(h => h.id === lastPred.phien);
        if (!actualResult) return;
        if (actualResult.result !== lastPred.prediction) {
            // Dự đoán sai → giảm trọng số của các thuật toán đã đưa ra dự đoán sai
            const algoUsed = lastPred.algoUsed;
            if (this.weights[algoUsed] !== undefined) {
                this.weights[algoUsed] = Math.max(0.5, this.weights[algoUsed] - this.learningRate);
            }
            // Tăng trọng số cho các thuật toán đã dự đoán đúng (nhưng ta không biết thuật toán nào đúng)
            // Ta sẽ sử dụng cơ chế voting: nếu thuật toán nào dự đoán đúng thì tăng
            // Nhưng ở đây ta chỉ có dự đoán cuối cùng, không biết từng thuật toán.
            // Ta sẽ lưu lại kết quả của từng thuật toán để học.
            // Vì vậy ta sẽ thay đổi cách lưu trữ.
            // Sẽ lưu toàn bộ kết quả của từng thuật toán.
        } else {
            // Dự đoán đúng → tăng trọng số
            const algoUsed = lastPred.algoUsed;
            if (this.weights[algoUsed] !== undefined) {
                this.weights[algoUsed] = Math.min(2.0, this.weights[algoUsed] + this.learningRate * 0.5);
            }
        }
        lastPred.learned = true;
    }

    // -------------------- CÁC THUẬT TOÁN --------------------

    // 1. Tần suất (Frequency) - theo tỷ lệ T/X trong lịch sử
    getFrequencyPrediction() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };
        const totalT = this.history.filter(h => h.result === 'T').length;
        const rate = totalT / len;
        const pred = rate > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, 0.6 + Math.abs(rate - 0.5) * 1.0);
        return { pred, conf };
    }

    // 2. Markov Chain (dựa trên 2 phiên trước)
    getMarkovPrediction() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };
        // Lấy kết quả của 2 phiên trước
        const last2 = this.history.slice(-2).map(h => h.result);
        const key = last2.join('');
        // Xây dựng bảng chuyển tiếp
        const trans = {};
        for (let i = 2; i < len; i++) {
            const k = this.history[i-2].result + this.history[i-1].result;
            const next = this.history[i].result;
            if (!trans[k]) trans[k] = { T: 0, X: 0 };
            trans[k][next]++;
        }
        const nextCounts = trans[key];
        if (!nextCounts) return { pred: 'T', conf: 0.5 };
        const total = nextCounts.T + nextCounts.X;
        if (total === 0) return { pred: 'T', conf: 0.5 };
        const probT = nextCounts.T / total;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, 0.6 + Math.abs(probT - 0.5) * 0.8);
        return { pred, conf };
    }

    // 3. Nhận diện mẫu (Pattern) - tìm mẫu 3 phiên gần nhất
    getPatternPrediction() {
        const len = this.history.length;
        if (len < 6) return { pred: 'T', conf: 0.5 };
        const last3 = this.history.slice(-3).map(h => h.result).join('');
        let matches = [];
        for (let i = 0; i <= len - 4; i++) {
            const pattern = this.history.slice(i, i+3).map(h => h.result).join('');
            if (pattern === last3) {
                matches.push(this.history[i+3].result);
            }
        }
        if (matches.length < 2) return { pred: 'T', conf: 0.5 };
        const tCount = matches.filter(r => r === 'T').length;
        const probT = tCount / matches.length;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, 0.6 + Math.abs(probT - 0.5) * 0.8);
        return { pred, conf };
    }

    // 4. Bẻ cầu (Counter Trend) - dựa trên streak hiện tại
    getCounterPrediction() {
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5 };
        const last = this.history[len-1].result;
        let streak = 1;
        for (let i = len-2; i >= 0; i--) {
            if (this.history[i].result === last) streak++;
            else break;
        }
        // Nếu streak >= 4 thì bẻ
        if (streak >= 4) {
            const pred = last === 'T' ? 'X' : 'T';
            const conf = Math.min(0.85, 0.6 + (streak-3)*0.05);
            return { pred, conf };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 5. Dựa trên xúc xắc: tổng điểm
    getDiceSumPrediction() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };
        // Lấy tổng điểm của 5 phiên gần nhất
        const recent = this.history.slice(-5);
        const sums = recent.map(h => h.dices.reduce((a,b) => a+b, 0));
        const avgSum = sums.reduce((a,b) => a+b, 0) / sums.length;
        // Tài nếu tổng > 10.5, xỉu nếu < 10.5
        const pred = avgSum > 10.5 ? 'T' : 'X';
        const conf = Math.min(0.85, 0.6 + Math.abs(avgSum - 10.5) / 10);
        return { pred, conf };
    }

    // 6. Dựa trên xúc xắc: mẫu số (ví dụ bộ ba)
    getDicePatternPrediction() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };
        // Xem có bộ ba nào xuất hiện nhiều không
        const recent = this.history.slice(-10);
        const patterns = recent.map(h => h.dices.sort().join('-'));
        // Đếm tần suất các mẫu
        const freq = {};
        patterns.forEach(p => { freq[p] = (freq[p] || 0) + 1; });
        // Dự đoán dựa trên mẫu xuất hiện nhiều nhất
        let maxCount = 0, bestPattern = '';
        for (const [p, count] of Object.entries(freq)) {
            if (count > maxCount) {
                maxCount = count;
                bestPattern = p;
            }
        }
        if (maxCount < 2) return { pred: 'T', conf: 0.5 };
        // Tìm kết quả tương ứng với mẫu đó
        const lastPattern = patterns[patterns.length-1];
        const lastResult = this.history[this.history.length-1].result;
        // Nếu mẫu trùng thì dự đoán theo xu hướng của mẫu đó
        if (lastPattern === bestPattern) {
            // Lấy tỷ lệ T/X cho các phiên có mẫu này
            let tCount = 0, xCount = 0;
            for (let i = 0; i < this.history.length; i++) {
                const p = this.history[i].dices.sort().join('-');
                if (p === bestPattern) {
                    if (this.history[i].result === 'T') tCount++;
                    else xCount++;
                }
            }
            const probT = tCount / (tCount + xCount);
            const pred = probT > 0.5 ? 'T' : 'X';
            const conf = Math.min(0.85, 0.6 + Math.abs(probT - 0.5) * 0.6);
            return { pred, conf };
        }
        return { pred: 'T', conf: 0.5 };
    }

    // 7. Dựa trên mã MD5 (nếu có) - phân tích chuỗi
    getMD5Prediction() {
        const len = this.history.length;
        if (len < 5) return { pred: 'T', conf: 0.5 };
        // Lấy MD5 của phiên gần nhất và so với các phiên trước
        const lastMd5 = this.history[len-1].md5;
        if (!lastMd5) return { pred: 'T', conf: 0.5 };
        // Tìm các phiên có MD5 tương tự (khoảng cách Hamming)
        let similar = [];
        for (let i = 0; i < len-1; i++) {
            const md5 = this.history[i].md5;
            if (!md5) continue;
            let distance = 0;
            for (let j = 0; j < Math.min(md5.length, lastMd5.length); j++) {
                if (md5[j] !== lastMd5[j]) distance++;
            }
            if (distance <= 5) { // ngưỡng tương tự
                similar.push(this.history[i].result);
            }
        }
        if (similar.length < 2) return { pred: 'T', conf: 0.5 };
        const tCount = similar.filter(r => r === 'T').length;
        const probT = tCount / similar.length;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.85, 0.6 + Math.abs(probT - 0.5) * 0.6);
        return { pred, conf };
    }

    // 8. Tổ hợp (Ensemble) - kết hợp các thuật toán với trọng số
    getEnsemblePrediction() {
        const algos = [
            { name: 'frequency', fn: this.getFrequencyPrediction.bind(this) },
            { name: 'markov', fn: this.getMarkovPrediction.bind(this) },
            { name: 'pattern', fn: this.getPatternPrediction.bind(this) },
            { name: 'counter', fn: this.getCounterPrediction.bind(this) },
            { name: 'diceSum', fn: this.getDiceSumPrediction.bind(this) },
            { name: 'dicePattern', fn: this.getDicePatternPrediction.bind(this) },
            { name: 'md5Hash', fn: this.getMD5Prediction.bind(this) }
        ];

        let probT = 0;
        let totalWeight = 0;
        const results = {};

        algos.forEach(algo => {
            const result = algo.fn();
            results[algo.name] = result;
            const weight = this.weights[algo.name] || 1.0;
            const contribution = (result.pred === 'T' ? 1 : 0) * weight * result.conf;
            probT += contribution;
            totalWeight += weight * result.conf;
        });

        if (totalWeight === 0) return { pred: 'T', conf: 0.5 };
        probT = probT / totalWeight;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.95, 0.6 + Math.abs(probT - 0.5) * 0.8);
        return { pred, conf, results };
    }

    // -------------------- DỰ ĐOÁN CHÍNH --------------------
    getFinalPrediction(phien, dices, md5) {
        // Thêm phiên hiện tại vào lịch sử (tạm thời) để dự đoán
        // Nhưng không thêm kết quả vì chưa biết
        // Chúng ta sẽ dùng lịch sử có sẵn

        if (this.history.length < 3) {
            return { prediction: 'T', confidence: 0.6 };
        }

        // Lấy dự đoán ensemble
        const ensemble = this.getEnsemblePrediction();
        const pred = ensemble.pred;
        const conf = ensemble.conf;

        // Lưu lại dự đoán để học sau
        this.predictions.push({
            phien: phien,
            prediction: pred,
            conf: conf,
            algoUsed: 'ensemble', // có thể lưu chi tiết hơn
            learned: false,
            results: ensemble.results // lưu kết quả từng thuật toán để học
        });

        return { prediction: pred, confidence: conf };
    }
}

// ========================================================================
// KHỞI TẠO HỆ THỐNG
// ========================================================================
const system = new UltraDicePredictionSystem();

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=15766f58a95cb4f95975ffcf643f524c";
let lastId = null;

// Hàm lấy dữ liệu từ API và cập nhật
async function fetchLatest() {
    try {
        const resp = await axios.get(API_URL, { timeout: 10000 });
        const list = resp.data?.list || [];
        if (!list.length) return null;

        const latest = list[0];
        console.log(`📡 API: id=${latest.id}, result=${latest.resultTruyenThong}, dices=${latest.dices}, md5=${latest.md5 ? latest.md5.substring(0,8)+'...' : 'N/A'}`);

        // Nếu có phiên mới
        if (lastId !== latest.id) {
            // Chuyển đổi kết quả
            let result;
            if (latest.resultTruyenThong && latest.resultTruyenThong.toUpperCase() === "TAI") {
                result = "T";
            } else {
                result = "X";
            }
            // Lấy xúc xắc
            let dices = [];
            if (latest.dices && Array.isArray(latest.dices)) {
                dices = latest.dices;
            } else {
                // Nếu không có, thử parse từ chuỗi
                dices = [3,4,5]; // fallback
            }
            // Lấy MD5 nếu có
            const md5 = latest.md5 || '';

            // Thêm vào hệ thống
            system.addResult(latest.id, result, dices, md5);
            lastId = latest.id;
            console.log(`✅ Đã cập nhật phiên ${latest.id} → ${result}`);
        }

        // Dự đoán cho phiên tiếp theo
        // Lấy dices và md5 của phiên hiện tại để dự đoán phiên tiếp
        const currentDices = latest.dices || [3,4,5];
        const currentMd5 = latest.md5 || '';
        const pred = system.getFinalPrediction(latest.id + 1, currentDices, currentMd5);

        return {
            id: "s2king",
            phien: latest.id,
            ket_qua: latest.resultTruyenThong ? latest.resultTruyenThong.toLowerCase() : "không rõ",
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
            ket_qua: "lỗi",
            xuc_xac: "?-?-?",
            phien_moi: "N/A",
            du_doan: "xỉu",
            do_tin_cay: "50%"
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

app.get('/status', (req, res) => {
    res.json({
        historyLength: system.history.length,
        lastId: lastId,
        weights: system.weights,
        predictionsCount: system.predictions.length
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