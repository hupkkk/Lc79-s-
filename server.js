const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// THUẬT TOÁN HOÀNG VIP WIN - BẢN DỊCH JAVASCRIPT (CỐT LÕI)
// ============================================================
class KhongGianHoangVip {
    constructor() {
        this.soChieu = 13;
        this.hangSoVip = Math.pow(Math.PI, Math.E) * Math.pow(1.618033988749895, 13);
        this.maTranCoSo = this._taoMaTranGoc();
        this.lichSuHash = [];
    }

    _taoMaTranGoc() {
        const maTran = [];
        for (let i = 0; i < this.soChieu; i++) {
            const hang = [];
            for (let j = 0; j < this.soChieu; j++) {
                const giaTri = (Math.sin(i * j * this.hangSoVip) * 1e18) % 256;
                hang.push(Math.floor(giaTri));
            }
            maTran.push(hang);
        }
        return maTran;
    }

    tichVoHuong(vectorA, vectorB) {
        return vectorA.reduce((acc, a, idx) => acc ^ (a * vectorB[idx]), 0);
    }
}

class DuDoanHoangVip {
    constructor() {
        this.khongGian = new KhongGianHoangVip();
        this.moHinh = new Map();
        this.soLanDuDoan = 0;
        this.tyLeChinhXac = 0.9999;
    }

    trichXuatDacTrung(chuoiHash) {
        const dacTrung = [];
        for (let i = 0; i < 13; i++) {
            const doan = chuoiHash.substring(i * 2, i * 2 + 2);
            dacTrung.push(doan ? parseInt(doan, 16) : 0);
        }
        const dacTrungBienDoi = [];
        for (let i = 0; i < this.khongGian.soChieu; i++) {
            const tich = this.khongGian.tichVoHuong(
                dacTrung,
                this.khongGian.maTranCoSo[i]
            );
            dacTrungBienDoi.push(tich % 256);
        }
        return dacTrungBienDoi;
    }

    duDoanHashTiepTheo(hashHienTai, soLuong = 5) {
        this.soLanDuDoan++;
        const dacTrung = this.trichXuatDacTrung(hashHienTai);
        const key = dacTrung.join(',');
        const duDoan = [];

        if (this.moHinh.has(key)) {
            const cacKhaNang = this.moHinh.get(key);
            const tanSuat = new Map();
            for (const k of cacKhaNang) {
                const kStr = k.join(',');
                tanSuat.set(kStr, (tanSuat.get(kStr) || 0) + 1);
            }
            const sorted = Array.from(tanSuat.entries()).sort((a, b) => b[1] - a[1]);
            for (const [kStr] of sorted.slice(0, soLuong)) {
                const dacTrungTuple = kStr.split(',').map(Number);
                const hashDuDoan = dacTrungTuple.map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 32);
                duDoan.push(hashDuDoan);
            }
        }

        while (duDoan.length < soLuong) {
            const hashMoi = this._ngoaiSuy(dacTrung);
            duDoan.push(hashMoi);
        }
        return duDoan;
    }

    _ngoaiSuy(dacTrung) {
        const hashMoi = [];
        for (let i = 0; i < dacTrung.length; i++) {
            const giaTri = (dacTrung[i] * Math.pow(this.khongGian.hangSoVip, i + 1) +
                            Math.sin(this.soLanDuDoan * Math.PI / 13) * 255) % 256;
            hashMoi.push(Math.floor(giaTri).toString(16).padStart(2, '0'));
        }
        return hashMoi.join('').slice(0, 32);
    }

    capNhatMoHinh(hashList) {
        for (let i = 0; i < hashList.length - 1; i++) {
            const dacTrungHienTai = this.trichXuatDacTrung(hashList[i]);
            const dacTrungTiep = this.trichXuatDacTrung(hashList[i + 1]);
            const key = dacTrungHienTai.join(',');
            if (!this.moHinh.has(key)) this.moHinh.set(key, []);
            this.moHinh.get(key).push(dacTrungTiep);
        }
    }
}

// Tạo instance duy nhất cho toàn hệ thống
const duDoanHoang = new DuDoanHoangVip();

// ============================================================
// HỆ THỐNG DỰ ĐOÁN DỰA TRÊN HOÀNG VIP + CÁC THUẬT TOÁN MỚI
// ============================================================
class PredictorHoangVip {
    constructor() {
        this.history = [];
        this.predictions = [];
        // Khởi tạo một số hash mẫu cho Hoàng VIP học
        this._initHoangVip();
    }

    _initHoangVip() {
        // Tạo dữ liệu giả để huấn luyện ban đầu
        const mau = [];
        for (let i = 0; i < 100; i++) {
            const s = crypto.createHash('md5').update(i.toString()).digest('hex');
            mau.push(s);
        }
        duDoanHoang.capNhatMoHinh(mau);
    }

    addResult(phienId, result, dices) {
        const sum = dices ? dices.reduce((a,b) => a+b, 0) : 0;
        this.history.push({ id: phienId, result, dices: dices || [], sum, timestamp: Date.now() });
        // Cập nhật mô hình Hoàng VIP với hash của phiên mới
        const hashStr = crypto.createHash('md5').update(phienId.toString() + result + sum).digest('hex');
        // Cập nhật với lịch sử gần đây
        const recentHashes = this.history.slice(-10).map(h => 
            crypto.createHash('md5').update(h.id.toString() + h.result + h.sum).digest('hex')
        );
        duDoanHoang.capNhatMoHinh(recentHashes);
        // Giới hạn lịch sử
        if (this.history.length > 20000) this.history = this.history.slice(-10000);
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

    // ==================== THUẬT TOÁN HOÀNG VIP ====================
    predictHoangVip() {
        if (this.history.length < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        
        const recent = this.history.slice(-5);
        const hashList = recent.map(h => {
            const data = h.id + h.result + (h.sum || 0);
            return crypto.createHash('md5').update(data).digest('hex');
        });
        const hashHienTai = hashList[hashList.length-1] || '0'.repeat(32);
        const duDoanHash = duDoanHoang.duDoanHashTiepTheo(hashHienTai, 3);
        if (duDoanHash.length > 0) {
            const firstHash = duDoanHash[0];
            // Lấy tổng các chữ số hex
            let sum = 0;
            for (let i = 0; i < firstHash.length; i++) {
                sum += parseInt(firstHash[i], 16);
            }
            const probT = 0.5 + (sum - 128) / 256 * 0.3;
            const pred = probT > 0.5 ? 'T' : 'X';
            const conf = Math.min(0.9, 0.55 + Math.abs(probT-0.5)*1.2);
            return { pred, conf, detail: `Hoàng VIP: hash ${firstHash.slice(0,8)}` };
        }
        return { pred: 'T', conf: 0.5, detail: 'Hoàng VIP không dự đoán được' };
    }

    // ==================== THUẬT TOÁN BẺ CẦU 1: Streak + Đảo chiều ====================
    predictBreakStreak() {
        const streak = this.getCurrentStreak();
        if (streak < 3) return { pred: 'T', conf: 0.5, detail: 'Streak ngắn, chưa bẻ' };
        const last = this.history[this.history.length-1].result;
        if (streak >= 5) {
            const pred = last === 'T' ? 'X' : 'T';
            return { pred, conf: 0.8 + (streak-5)*0.03, detail: `Bẻ cầu mạnh (Streak ${streak})` };
        } else if (streak >= 4) {
            const pred = last === 'T' ? 'X' : 'T';
            return { pred, conf: 0.7, detail: `Bẻ cầu trung bình (Streak ${streak})` };
        }
        return { pred: last, conf: 0.6, detail: `Theo cầu (Streak ${streak})` };
    }

    // ==================== THUẬT TOÁN BẺ CẦU 2: Mean Reversion ====================
    predictMeanReversion() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const r10 = this.history.slice(-10).filter(e => e.result === 'T').length / 10;
        if (r10 >= 0.7) {
            return { pred: 'X', conf: 0.75, detail: `Tỷ lệ T quá cao (${r10.toFixed(2)}) → Bẻ xuống` };
        } else if (r10 <= 0.3) {
            return { pred: 'T', conf: 0.75, detail: `Tỷ lệ T quá thấp (${r10.toFixed(2)}) → Bẻ lên` };
        }
        return { pred: 'T', conf: 0.5, detail: 'Tỷ lệ cân bằng' };
    }

    // ==================== THUẬT TOÁN BẺ CẦU 3: Fibonacci Retracement ====================
    predictFibonacci() {
        const len = this.history.length;
        if (len < 15) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        // Chuyển thành chuỗi số 1/0
        const series = this.history.map(h => h.result === 'T' ? 1 : 0);
        // Tìm các đỉnh và đáy cục bộ (cửa sổ 5)
        let peaks = [], troughs = [];
        for (let i = 3; i < series.length - 3; i++) {
            if (series[i] > series[i-1] && series[i] > series[i+1] &&
                series[i] > series[i-2] && series[i] > series[i+2]) {
                peaks.push({ idx: i, val: series[i] });
            }
            if (series[i] < series[i-1] && series[i] < series[i+1] &&
                series[i] < series[i-2] && series[i] < series[i+2]) {
                troughs.push({ idx: i, val: series[i] });
            }
        }
        if (peaks.length < 2 || troughs.length < 2) return { pred: 'T', conf: 0.5, detail: 'Không đủ điểm' };
        const lastPeak = peaks[peaks.length-1];
        const lastTrough = troughs[troughs.length-1];
        const diff = lastPeak.val - lastTrough.val;
        if (diff === 0) return { pred: 'T', conf: 0.5, detail: 'Biên độ bằng 0' };
        const current = series[series.length-1];
        const currentLevel = (current - lastTrough.val) / diff;
        // Mức Fibonacci 0.618 và 0.382
        if (currentLevel > 0.618) {
            return { pred: 'X', conf: 0.72, detail: `Vùng quá mua (${currentLevel.toFixed(2)}) → Bẻ xuống` };
        } else if (currentLevel < 0.382) {
            return { pred: 'T', conf: 0.72, detail: `Vùng quá bán (${currentLevel.toFixed(2)}) → Bẻ lên` };
        }
        return { pred: 'T', conf: 0.5, detail: 'Trong vùng trung tính' };
    }

    // ==================== THUẬT TOÁN BẺ CẦU 4: RSI ====================
    predictRSI() {
        const len = this.history.length;
        if (len < 14) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        // Chuyển thành 1/0
        const wins = this.history.slice(-14).map(h => h.result === 'T' ? 1 : 0);
        const losses = wins.map(v => 1 - v);
        const avgWin = wins.reduce((a,b) => a+b, 0) / 14;
        const avgLoss = losses.reduce((a,b) => a+b, 0) / 14;
        if (avgLoss === 0) return { pred: 'X', conf: 0.8, detail: 'RSI quá cao (toàn T) → Bẻ xuống' };
        const rs = avgWin / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        if (rsi > 70) {
            return { pred: 'X', conf: 0.75, detail: `RSI ${rsi.toFixed(1)} >70 → Bẻ xuống` };
        } else if (rsi < 30) {
            return { pred: 'T', conf: 0.75, detail: `RSI ${rsi.toFixed(1)} <30 → Bẻ lên` };
        }
        return { pred: 'T', conf: 0.5, detail: `RSI ${rsi.toFixed(1)} trung tính` };
    }

    // ==================== THUẬT TOÁN THEO CẦU 1: Trend Following ====================
    predictTrend() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        const r5 = this.history.slice(-5).filter(e => e.result === 'T').length / 5;
        const r10 = this.history.slice(-10).filter(e => e.result === 'T').length / 10;
        const slope = r5 - r10;
        if (slope > 0.1) {
            return { pred: 'T', conf: 0.65, detail: `Xu hướng lên (${slope.toFixed(2)}) → Theo T` };
        } else if (slope < -0.1) {
            return { pred: 'X', conf: 0.65, detail: `Xu hướng xuống (${slope.toFixed(2)}) → Theo X` };
        }
        return { pred: 'T', conf: 0.5, detail: 'Xu hướng đi ngang' };
    }

    // ==================== THUẬT TOÁN THEO CẦU 2: Pattern ====================
    predictPattern() {
        const len = this.history.length;
        if (len < 6) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const last3 = this.history.slice(-3).map(e => e.result).join('');
        let matches = [];
        for (let i = 0; i <= len - 4; i++) {
            const pattern = this.history.slice(i, i+3).map(e => e.result).join('');
            if (pattern === last3) matches.push(this.history[i+3].result);
        }
        if (matches.length >= 2) {
            const t = matches.filter(r => r === 'T').length;
            const probT = t / matches.length;
            const pred = probT > 0.5 ? 'T' : 'X';
            const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
            return { pred, conf, detail: `Mẫu ${last3}: T=${t}/${matches.length}` };
        }
        return { pred: 'T', conf: 0.5, detail: 'Không tìm thấy mẫu' };
    }

    // ==================== THUẬT TOÁN THEO CẦU 3: Markov Chain ====================
    predictMarkov() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        let tt=0, tx=0, xt=0, xx=0;
        for (let i=1; i<len; i++) {
            const p = this.history[i-1].result, c = this.history[i].result;
            if (p==='T' && c==='T') tt++; else if (p==='T' && c==='X') tx++;
            else if (p==='X' && c==='T') xt++; else if (p==='X' && c==='X') xx++;
        }
        const last = this.history[len-1].result;
        let probT = 0.5;
        if (last === 'T') {
            const total = tt+tx;
            probT = total > 0 ? tt/total : 0.5;
        } else {
            const total = xt+xx;
            probT = total > 0 ? xt/total : 0.5;
        }
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `P(T|${last})=${probT.toFixed(3)}` };
    }

    // ==================== TỔNG HỢP TẤT CẢ THUẬT TOÁN ====================
    getCombinedPrediction() {
        if (this.history.length < 5) {
            return { prediction: 'T', confidence: 0.5, reason: 'Chưa đủ dữ liệu' };
        }

        // Lấy dự đoán từ tất cả các thuật toán
        const results = {
            hoangVip: this.predictHoangVip(),
            breakStreak: this.predictBreakStreak(),
            meanRev: this.predictMeanReversion(),
            fibo: this.predictFibonacci(),
            rsi: this.predictRSI(),
            trend: this.predictTrend(),
            pattern: this.predictPattern(),
            markov: this.predictMarkov()
        };

        // Trọng số cố định cho từng thuật toán (có thể điều chỉnh sau)
        const weights = {
            hoangVip: 1.8,      // Ưu tiên Hoàng VIP cao hơn
            breakStreak: 1.5,
            meanRev: 1.4,
            fibo: 1.3,
            rsi: 1.3,
            trend: 1.0,
            pattern: 1.1,
            markov: 1.0
        };

        let totalWeight = 0, weightedProbT = 0;
        let reasons = [];
        let breakCount = 0; // Đếm số thuật toán bẻ cầu

        Object.keys(results).forEach(key => {
            const r = results[key];
            const w = weights[key] || 1.0;
            const predVal = r.pred === 'T' ? 1 : 0;
            // Tính probT dựa trên dự đoán và độ tin cậy
            const probT = predVal * r.conf + (1 - predVal) * (1 - r.conf);
            weightedProbT += probT * w;
            totalWeight += w;
            reasons.push(`${key}: ${r.pred}(${r.conf.toFixed(2)})`);
            // Nếu là thuật toán bẻ cầu và dự đoán khác với kết quả gần nhất?
            if (['breakStreak','meanRev','fibo','rsi'].includes(key) && r.pred !== this.history[this.history.length-1].result) {
                breakCount++;
            }
        });

        let probT = totalWeight > 0 ? weightedProbT / totalWeight : 0.5;
        let finalPred = probT > 0.5 ? 'T' : 'X';
        let confidence = Math.min(0.93, Math.max(0.6, Math.abs(probT-0.5)*2 + 0.55));

        // Logic bẻ cầu bổ sung dựa trên số lượng thuật toán bẻ cầu đồng thuận
        const lastResult = this.history[this.history.length-1].result;
        if (breakCount >= 3) {
            // Nếu có >= 3 thuật toán bẻ cầu cùng hướng, ưu tiên bẻ
            const breakPred = lastResult === 'T' ? 'X' : 'T';
            // Nếu dự đoán tổng hợp khác với breakPred, tăng xác suất cho breakPred
            if (finalPred !== breakPred) {
                // Điều chỉnh probT về phía breakPred
                const adjustment = 0.15 * (breakCount - 2);
                if (breakPred === 'T') {
                    probT = Math.min(0.85, probT + adjustment);
                } else {
                    probT = Math.max(0.15, probT - adjustment);
                }
                finalPred = probT > 0.5 ? 'T' : 'X';
                confidence = Math.min(0.9, confidence + 0.05);
            }
        }

        // Lý do chi tiết
        const strategy = (breakCount >= 3) ? `🔴 BẺ CẦU MẠNH (${breakCount}/4 thuật toán bẻ đồng thuận)` :
                         (breakCount >= 2) ? `🟠 BẺ CẦU VỪA (${breakCount}/4)` :
                         `🟢 THEO CẦU HOẶC CÂN BẰNG`;

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
        // Cập nhật độ chính xác sau mỗi lần dự đoán (sẽ được cập nhật khi có kết quả thực)
        return predEntry;
    }

    // Cập nhật kết quả thực tế và tính độ chính xác
    updatePredictionAccuracy(phienId, actual) {
        const pred = this.predictions.find(p => p.id === phienId);
        if (pred) {
            pred.actual = actual;
            pred.correct = (pred.predicted === actual) ? 1 : 0;
        }
    }

    getStats() {
        const completed = this.predictions.filter(p => p.actual !== null);
        const correct = completed.filter(p => p.correct === 1).length;
        return {
            totalPredictions: completed.length,
            correct,
            accuracy: completed.length ? correct / completed.length : 0,
            historyLength: this.history.length,
            recentPredictions: this.predictions.slice(-10).map(p => ({id: p.id, pred: p.predicted, actual: p.actual, correct: p.correct}))
        };
    }
}

// ============================================================
// SERVER
// ============================================================
const predictor = new PredictorHoangVip();

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

            // Cập nhật kết quả thực cho dự đoán trước đó (nếu có)
            if (lastId !== null) {
                predictor.updatePredictionAccuracy(phienId, result);
            }

            // Thêm kết quả mới vào lịch sử
            predictor.addResult(phienId, result, dices);
            
            // Tạo dự đoán cho phiên tiếp theo
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
            console.log(`[${new Date().toLocaleTimeString()}] Phiên ${phienId} → ${result} | Dự đoán: ${predEntry.predicted} (${(predEntry.confidence*100).toFixed(1)}%)`);
        }
    } catch (e) {
        console.error("API Error:", e.message);
    }
}

// Chạy lần đầu
updateDataAndPredict();
// Cập nhật mỗi 6 giây
setInterval(updateDataAndPredict, 6000);

// Routes
app.get('/predict', (req, res) => {
    if (currentPrediction) res.json(currentPrediction);
    else res.json({ status: 'Đang tải dữ liệu...' });
});

app.get('/predict/text', (req, res) => {
    if (!currentPrediction) return res.send('Đang tải...');
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
Ty le dung: ${(d.thong_ke.accuracy * 100).toFixed(1)}%`;
    res.send(text);
});

app.get('/stats', (req, res) => res.json(predictor.getStats()));

app.get('/', (req, res) => res.send('🚀 Hoàng VIP MD5 Predictor - Bẻ cầu mạnh mẽ'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy port ${PORT}`));