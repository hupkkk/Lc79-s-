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
        this.predictions = []; // lưu các dự đoán đã đưa ra { id, predicted, actual, algoWeights, reason }
        this.algoStats = {}; // thống kê từng thuật toán { total, correct }
        this.algoWeights = {}; // trọng số hiện tại của từng thuật toán
        this.lastPrediction = null; // dự đoán mới nhất
        this.initAlgos();
    }

    initAlgos() {
        // Danh sách các thuật toán, mỗi thuật toán có tên và hàm dự đoán
        this.algos = {
            frequency: { name: 'Tần suất', weight: 1.0 },
            streak: { name: 'Streak', weight: 1.0 },
            pattern: { name: 'Mẫu lặp', weight: 1.0 },
            markov1: { name: 'Markov bậc 1', weight: 1.0 },
            markov2: { name: 'Markov bậc 2', weight: 1.0 },
            markov3: { name: 'Markov bậc 3', weight: 1.0 },
            diceSum: { name: 'Tổng xúc xắc', weight: 1.0 },
            md5hash: { name: 'MD5 Hash', weight: 0.7 },
            meanRev: { name: 'Mean Reversion', weight: 1.2 },
            logistic: { name: 'Logistic', weight: 1.0 }
        };
        // Khởi tạo stats
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
            result: result, // 'T' hoặc 'X'
            dices: dices || [],
            sum: sum,
            timestamp: Date.now()
        };
        this.history.push(entry);
        // Nếu có dự đoán trước đó cho phiên này, cập nhật kết quả thực tế và học
        this.updatePredictionAccuracy(phienId, result);
        // Cập nhật trọng số thuật toán dựa trên hiệu suất gần đây
        this.updateWeights();
        // Xóa lịch sử quá cũ? Giữ nguyên không giới hạn, nhưng để tránh tràn, có thể giới hạn 10000
        if (this.history.length > 10000) {
            this.history = this.history.slice(-5000);
        }
    }

    // Cập nhật độ chính xác cho dự đoán đã lưu
    updatePredictionAccuracy(phienId, actual) {
        const pred = this.predictions.find(p => p.id === phienId);
        if (pred) {
            pred.actual = actual;
            const correct = (pred.predicted === actual) ? 1 : 0;
            // Cập nhật stats cho từng thuật toán đã dùng
            if (pred.algoWeights) {
                Object.keys(pred.algoWeights).forEach(algo => {
                    if (this.algoStats[algo]) {
                        this.algoStats[algo].total += 1;
                        if (correct === 1) this.algoStats[algo].correct += 1;
                    }
                });
            }
            // Cập nhật tỷ lệ đúng tổng thể
            pred.correct = correct;
        }
    }

    // Cập nhật trọng số thuật toán dựa trên tỷ lệ đúng gần đây
    updateWeights() {
        const recent = 20; // xem xét 20 phiên gần nhất
        const totalPredictions = this.predictions.length;
        if (totalPredictions < 5) return;

        // Tính điểm cho từng thuật toán dựa trên tỷ lệ đúng trên tổng số
        Object.keys(this.algoStats).forEach(algo => {
            const stats = this.algoStats[algo];
            if (stats.total > 0) {
                const acc = stats.correct / stats.total;
                // Trọng số mới = tỷ lệ đúng * 1.5 (để tăng biên độ)
                let newWeight = acc * 1.5;
                // Giới hạn trong khoảng 0.3 đến 2.0
                newWeight = Math.min(2.0, Math.max(0.3, newWeight));
                this.algoWeights[algo] = newWeight;
            }
        });
    }

    // ----- CÁC HÀM DỰ ĐOÁN CỦA TỪNG THUẬT TOÁN -----

    // 1. Tần suất (weighted)
    predictFrequency() {
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
        const detail = `Tỷ lệ T trong 5,10,20 phiên: ${(this.history.slice(-5).filter(e=>e.result==='T').length/5).toFixed(2)}, ${(this.history.slice(-10).filter(e=>e.result==='T').length/10).toFixed(2)}, ${(this.history.slice(-20).filter(e=>e.result==='T').length/20).toFixed(2)}`;
        return { pred, conf, detail };
    }

    // 2. Streak (bẻ cầu nếu streak dài)
    predictStreak() {
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        let streak = 1;
        const last = this.history[len-1].result;
        for (let i = len-2; i >= 0; i--) {
            if (this.history[i].result === last) streak++;
            else break;
        }
        // Nếu streak >= 4, khả năng đảo chiều
        if (streak >= 4) {
            const pred = last === 'T' ? 'X' : 'T';
            const conf = Math.min(0.85, 0.6 + (streak-3)*0.05);
            return { pred, conf, detail: `Streak dài ${streak} phiên, khả năng đảo chiều` };
        } else {
            // Nếu streak ngắn, theo xu hướng hiện tại
            const probT = last === 'T' ? 0.6 : 0.4;
            const pred = probT > 0.5 ? 'T' : 'X';
            const conf = 0.55 + (streak-1)*0.05;
            return { pred, conf, detail: `Streak ${streak} phiên, theo xu hướng` };
        }
    }

    // 3. Pattern (mẫu 3 phiên)
    predictPattern() {
        const len = this.history.length;
        if (len < 6) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const last3 = this.history.slice(-3).map(e => e.result).join('');
        let matches = [];
        for (let i = 0; i <= len - 4; i++) {
            const pattern = this.history.slice(i, i+3).map(e => e.result).join('');
            if (pattern === last3) {
                const next = this.history[i+3].result;
                matches.push(next);
            }
        }
        if (matches.length >= 2) {
            const t = matches.filter(r => r === 'T').length;
            const probT = t / matches.length;
            const pred = probT > 0.5 ? 'T' : 'X';
            const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
            return { pred, conf, detail: `Mẫu ${last3} xuất hiện ${matches.length} lần, kết quả sau: T=${t}, X=${matches.length-t}` };
        }
        return { pred: 'T', conf: 0.5, detail: 'Không tìm thấy mẫu lặp' };
    }

    // 4. Markov bậc 1
    predictMarkov1() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        let tt=0, tx=0, xt=0, xx=0;
        for (let i=1; i<len; i++) {
            const prev = this.history[i-1].result;
            const curr = this.history[i].result;
            if (prev==='T' && curr==='T') tt++;
            else if (prev==='T' && curr==='X') tx++;
            else if (prev==='X' && curr==='T') xt++;
            else if (prev==='X' && curr==='X') xx++;
        }
        const last = this.history[len-1].result;
        let probT;
        if (last === 'T') {
            const total = tt + tx;
            probT = total > 0 ? tt / total : 0.5;
        } else {
            const total = xt + xx;
            probT = total > 0 ? xt / total : 0.5;
        }
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `P(T|${last}) = ${probT.toFixed(3)}` };
    }

    // 5. Markov bậc 2
    predictMarkov2() {
        const len = this.history.length;
        if (len < 15) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const states = {};
        for (let i=2; i<len; i++) {
            const key = this.history[i-2].result + this.history[i-1].result;
            const next = this.history[i].result;
            if (!states[key]) states[key] = { T:0, X:0 };
            states[key][next] += 1;
        }
        const lastKey = this.history[len-2].result + this.history[len-1].result;
        const counts = states[lastKey];
        if (!counts) return { pred: 'T', conf: 0.5, detail: 'Không có dữ liệu cho trạng thái này' };
        const total = counts.T + counts.X;
        const probT = counts.T / total;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `P(T|${lastKey}) = ${probT.toFixed(3)}` };
    }

    // 6. Markov bậc 3
    predictMarkov3() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const states = {};
        for (let i=3; i<len; i++) {
            const key = this.history[i-3].result + this.history[i-2].result + this.history[i-1].result;
            const next = this.history[i].result;
            if (!states[key]) states[key] = { T:0, X:0 };
            states[key][next] += 1;
        }
        const lastKey = this.history[len-3].result + this.history[len-2].result + this.history[len-1].result;
        const counts = states[lastKey];
        if (!counts) return { pred: 'T', conf: 0.5, detail: 'Không có dữ liệu' };
        const total = counts.T + counts.X;
        const probT = counts.T / total;
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `P(T|${lastKey}) = ${probT.toFixed(3)}` };
    }

    // 7. Tổng xúc xắc (dice sum)
    predictDiceSum() {
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5, detail: 'Chưa có dữ liệu xúc xắc' };
        // Lấy tổng của phiên gần nhất (nếu có dices)
        const last = this.history[len-1];
        if (!last.dices || last.dices.length !== 3) {
            // Dùng trung bình tổng trong 5 phiên gần
            const sums = this.history.slice(-5).filter(e => e.dices && e.dices.length===3).map(e => e.sum);
            if (sums.length === 0) return { pred: 'T', conf: 0.5, detail: 'Không có dữ liệu xúc xắc' };
            const avg = sums.reduce((a,b) => a+b, 0) / sums.length;
            const pred = avg >= 10.5 ? 'T' : 'X';
            const conf = 0.6 + Math.min(0.3, Math.abs(avg-10.5)/5);
            return { pred, conf, detail: `Tổng trung bình 5 phiên = ${avg.toFixed(1)}` };
        } else {
            const sum = last.sum;
            const pred = sum >= 11 ? 'T' : 'X';
            const conf = 0.7 + Math.min(0.25, Math.abs(sum-10.5)/5);
            return { pred, conf, detail: `Tổng xúc xắc phiên hiện tại = ${sum}` };
        }
    }

    // 8. MD5 hash (sử dụng id + result trước để tạo bit)
    predictMD5() {
        const len = this.history.length;
        if (len < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const lastId = this.history[len-1].id;
        const prevResult = this.history[len-2].result;
        const data = lastId + prevResult + Date.now().toString().slice(-4);
        const hash = crypto.createHash('md5').update(data).digest('hex');
        const firstChar = parseInt(hash[0], 16); // 0-15
        const probT = 0.5 + (firstChar - 7.5) / 15 * 0.3; // -0.15 đến +0.15
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = 0.5 + Math.abs(probT-0.5)*1.5;
        return { pred, conf, detail: `MD5: ${hash.slice(0,6)}... (${firstChar})` };
    }

    // 9. Mean Reversion (bẻ khi lệch nhiều)
    predictMeanRev() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const r5 = this.history.slice(-5).filter(e => e.result==='T').length / 5;
        const r10 = this.history.slice(-10).filter(e => e.result==='T').length / 10;
        const r20 = this.history.slice(-20).filter(e => e.result==='T').length / 20;
        const dev = Math.abs(r5 - 0.5) + Math.abs(r10 - 0.5) + Math.abs(r20 - 0.5);
        if (dev > 0.3) {
            // Dự đoán ngược với xu hướng gần nhất (r5)
            const pred = r5 > 0.5 ? 'X' : 'T';
            const conf = 0.6 + dev * 0.5;
            return { pred, conf, detail: `Độ lệch tổng = ${dev.toFixed(2)}, dự đoán đảo chiều` };
        }
        return { pred: 'T', conf: 0.5, detail: 'Độ lệch thấp, không đảo chiều' };
    }

    // 10. Logistic Regression đơn giản (dùng các đặc trưng)
    predictLogistic() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const f5 = this.history.slice(-5).filter(e=>e.result==='T').length / 5;
        const f10 = this.history.slice(-10).filter(e=>e.result==='T').length / 10;
        const f20 = this.history.slice(-20).filter(e=>e.result==='T').length / 20;
        let streak = 1;
        const last = this.history[len-1].result;
        for (let i=len-2; i>=0; i--) {
            if (this.history[i].result === last) streak++;
            else break;
        }
        const slope = (f10 - f20);
        const w0 = -0.2, w1=0.5, w2=0.8, w3=-0.3, w4=0.4;
        const logit = w0 + w1*f5 + w2*f10 + w3*streak + w4*slope;
        const probT = 1 / (1 + Math.exp(-logit));
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `Logistic probT = ${probT.toFixed(3)}` };
    }

    // Hàm tổng hợp tất cả thuật toán
    getCombinedPrediction() {
        if (this.history.length < 5) {
            // Dự đoán mặc định 50-50
            return { prediction: 'T', confidence: 0.5, reason: 'Chưa đủ dữ liệu, dự đoán ngẫu nhiên' };
        }

        // Gọi tất cả thuật toán
        const results = {
            frequency: this.predictFrequency(),
            streak: this.predictStreak(),
            pattern: this.predictPattern(),
            markov1: this.predictMarkov1(),
            markov2: this.predictMarkov2(),
            markov3: this.predictMarkov3(),
            diceSum: this.predictDiceSum(),
            md5hash: this.predictMD5(),
            meanRev: this.predictMeanRev(),
            logistic: this.predictLogistic()
        };

        // Tính tổng có trọng số
        let totalWeight = 0;
        let weightedProbT = 0;
        let reasons = [];
        Object.keys(results).forEach(algo => {
            const r = results[algo];
            const w = this.algoWeights[algo] || 1.0;
            const predVal = r.pred === 'T' ? 1 : 0;
            weightedProbT += predVal * w * r.conf;
            totalWeight += w * r.conf;
            reasons.push(`${this.algos[algo].name}: ${r.pred} (${r.detail}) conf=${r.conf.toFixed(2)}`);
        });

        const probT = totalWeight > 0 ? weightedProbT / totalWeight : 0.5;
        const finalPred = probT > 0.5 ? 'T' : 'X';
        const confidence = Math.min(0.95, Math.max(0.6, Math.abs(probT-0.5)*2 + 0.5));

        // Lý do chi tiết
        const reasonText = reasons.join('; ');

        return {
            prediction: finalPred,
            confidence: confidence,
            probT: probT,
            reason: reasonText
        };
    }

    // Lưu dự đoán và học sau
    makePrediction(phienId, dices) {
        const combined = this.getCombinedPrediction();
        const predEntry = {
            id: phienId,
            predicted: combined.prediction,
            actual: null, // sẽ cập nhật sau
            algoWeights: { ...this.algoWeights },
            reason: combined.reason,
            confidence: combined.confidence,
            probT: combined.probT,
            timestamp: Date.now()
        };
        this.predictions.push(predEntry);
        // Giữ tối đa 2000 dự đoán
        if (this.predictions.length > 2000) this.predictions = this.predictions.slice(-1000);
        this.lastPrediction = predEntry;
        return predEntry;
    }

    // Lấy thống kê
    getStats() {
        const total = this.predictions.filter(p => p.actual !== null).length;
        const correct = this.predictions.filter(p => p.actual !== null && p.predicted === p.actual).length;
        const rate = total > 0 ? correct / total : 0;
        // Stats cho từng thuật toán
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
            algoStats: algoStats,
            historyLength: this.history.length
        };
    }
}

// ==================== KHỞI TẠO HỆ THỐNG ====================
const predictor = new SmartDicePredictor();

const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=15766f58a95cb4f95975ffcf643f524c";
let lastId = null;
let currentPrediction = null; // dự đoán hiện tại để trả về API

// Hàm cập nhật dữ liệu và dự đoán
async function updateDataAndPredict() {
    try {
        const resp = await axios.get(API_URL, { timeout: 10000 });
        const list = resp.data?.list || [];
        if (!list.length) return;

        const latest = list[0];
        const phienId = latest.id;
        const resultStr = latest.resultTruyenThong;
        const dices = latest.dices || [];

        // Nếu có phiên mới
        if (lastId !== phienId) {
            // Xác định kết quả T/X
            let result = null;
            if (resultStr) {
                result = resultStr.toUpperCase() === "TAI" ? "T" : "X";
            } else {
                // Nếu không có result, dùng tổng xúc xắc để suy
                if (dices.length === 3) {
                    const sum = dices.reduce((a,b) => a+b, 0);
                    result = sum >= 11 ? "T" : "X";
                } else {
                    result = "T"; // mặc định
                }
            }

            // Thêm vào lịch sử
            predictor.addResult(phienId, result, dices);

            // Dự đoán cho phiên tiếp theo (phienId + 1) nhưng dùng dữ liệu hiện tại
            // Tạo dự đoán cho phiên mới (phienId + 1)
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
                thong_ke: predictor.getStats() // thêm thống kê
            };

            lastId = phienId;
            console.log(`✅ Cập nhật phiên ${phienId} → ${result}, dự đoán tiếp theo: ${predEntry.predicted}`);
        } else {
            // Nếu đã có phiên này, có thể cập nhật thông tin nếu cần
            // (ví dụ: cập nhật dices nếu thay đổi)
        }
    } catch (err) {
        console.error("API Error:", err.message);
    }
}

// Chạy cập nhật lần đầu
updateDataAndPredict();

// Cập nhật mỗi 6 giây
setInterval(updateDataAndPredict, 6000);

// ==================== ROUTES ====================
app.get('/predict', (req, res) => {
    if (currentPrediction) {
        res.json(currentPrediction);
    } else {
        res.json({ status: 'Đang tải dữ liệu...' });
    }
});

app.get('/predict/text', (req, res) => {
    if (!currentPrediction) {
        return res.send('Đang tải dữ liệu...');
    }
    const d = currentPrediction;
    const text = `Id: ${d.id}
Phien: ${d.phien}
Ket qua: ${d.ket_qua}
Xuc xac: ${d.xuc_xac}
Phien moi: ${d.phien_moi}
Du doan: ${d.du_doan}
Do tin cay: ${d.do_tin_cay}
Ly do: ${d.ly_do}
Ty le tai: ${d.ty_le_tai}
--- Thong ke ---
Tong du doan: ${d.thong_ke.totalPredictions}
Dung: ${d.thong_ke.correct}
Ty le dung: ${(d.thong_ke.accuracy * 100).toFixed(1)}%
`;
    res.send(text);
});

app.get('/stats', (req, res) => {
    const stats = predictor.getStats();
    res.json(stats);
});

app.get('/', (req, res) => res.send('Smart Dice Prediction Server running 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server chạy trên port ${PORT}`);
});