const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// THUẬT TOÁN HOÀNG VIP WIN - BẢN DỊCH JAVASCRIPT
// ============================================================
class KhongGianHoangVip {
    constructor() {
        this.soChieu = 13;
        this.hangSoVip = Math.pow(Math.PI, Math.E) * Math.pow(1.618033988749895, 13);
        this.maTranCoSo = this._taoMaTranGoc();
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

    // Thêm hàm cập nhật mô hình với dữ liệu mới
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

// Tạo instance dùng chung
const duDoanHoang = new DuDoanHoangVip();

// ============================================================
// HỆ THỐNG DỰ ĐOÁN TÀI/XỈU (CÓ TÍCH HỢP HOÀNG VIP)
// ============================================================
class SmartDicePredictor {
    constructor() {
        this.history = [];
        this.predictions = [];
        this.algoStats = {};
        this.algoWeights = {};
        this.initAlgos();
        // Khởi tạo dữ liệu cho Hoàng VIP với vài hash mẫu
        this._initHoangVip();
    }

    _initHoangVip() {
        // Tạo một số hash mẫu để huấn luyện sơ bộ
        const mau = ['a'.repeat(32), 'b'.repeat(32), 'c'.repeat(32)];
        duDoanHoang.capNhatMoHinh(mau);
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
            logistic: { name: 'Logistic', weight: 1.1 },
            hoangGay: { name: 'Hoàng VIP', weight: 1.5 }  // Thuật toán mới
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
        // Cập nhật mô hình Hoàng VIP với hash của phiên mới
        const hashStr = crypto.createHash('md5').update(phienId.toString() + result + sum).digest('hex');
        duDoanHoang.capNhatMoHinh([hashStr]);
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

    // -------------------- THUẬT TOÁN HOÀNG VIP --------------------
    predictHoangGay() {
        if (this.history.length < 2) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ dữ liệu' };
        
        // Lấy một vài hash từ lịch sử gần đây
        const recent = this.history.slice(-5);
        const hashList = recent.map(h => {
            const data = h.id + h.result + (h.sum || 0);
            return crypto.createHash('md5').update(data).digest('hex');
        });
        // Dùng thuật toán Hoàng VIP để dự đoán hash tiếp theo
        const hashHienTai = hashList[hashList.length-1] || '0'.repeat(32);
        const duDoanHash = duDoanHoang.duDoanHashTiepTheo(hashHienTai, 3);
        // Từ hash dự đoán, lấy giá trị để suy T/X
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

    // -------------------- CÁC HÀM KHÁC (giữ nguyên) --------------------
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
        return { pred: 'T', conf: 0.5, detail: 'Không mẫu' };
    }

    predictMarkov1() {
        const len = this.history.length;
        if (len < 10) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        let tt=0,tx=0,xt=0,xx=0;
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

    predictMarkov2() {
        const len = this.history.length;
        if (len < 15) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const states = new Map();
        for (let i=2; i<len; i++) {
            const key = this.history[i-2].result + this.history[i-1].result;
            const next = this.history[i].result;
            if (!states.has(key)) states.set(key, {T:0, X:0});
            states.get(key)[next] += 1;
        }
        const lastKey = this.history[len-2].result + this.history[len-1].result;
        const counts = states.get(lastKey);
        if (!counts) return { pred: 'T', conf: 0.5, detail: 'Không dữ liệu' };
        const probT = counts.T / (counts.T + counts.X);
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `P(T|${lastKey})=${probT.toFixed(3)}` };
    }

    predictMarkov3() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const states = new Map();
        for (let i=3; i<len; i++) {
            const key = this.history[i-3].result + this.history[i-2].result + this.history[i-1].result;
            const next = this.history[i].result;
            if (!states.has(key)) states.set(key, {T:0, X:0});
            states.get(key)[next] += 1;
        }
        const lastKey = this.history[len-3].result + this.history[len-2].result + this.history[len-1].result;
        const counts = states.get(lastKey);
        if (!counts) return { pred: 'T', conf: 0.5, detail: 'Không dữ liệu' };
        const probT = counts.T / (counts.T + counts.X);
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `P(T|${lastKey})=${probT.toFixed(3)}` };
    }

    predictDiceSum() {
        const len = this.history.length;
        if (len < 3) return { pred: 'T', conf: 0.5, detail: 'Chưa có dữ liệu xúc xắc' };
        const last = this.history[len-1];
        if (last.dices && last.dices.length === 3) {
            const sum = last.sum;
            const pred = sum >= 11 ? 'T' : 'X';
            const conf = 0.7 + Math.min(0.25, Math.abs(sum-10.5)/5);
            return { pred, conf, detail: `Tổng hiện tại = ${sum}` };
        } else {
            const sums = this.history.slice(-5).filter(e => e.dices.length===3).map(e => e.sum);
            if (sums.length === 0) return { pred: 'T', conf: 0.5, detail: 'Không có dữ liệu' };
            const avg = sums.reduce((a,b) => a+b, 0) / sums.length;
            const pred = avg >= 10.5 ? 'T' : 'X';
            const conf = 0.6 + Math.min(0.3, Math.abs(avg-10.5)/5);
            return { pred, conf, detail: `Trung bình tổng = ${avg.toFixed(1)}` };
        }
    }

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

    predictLogistic() {
        const len = this.history.length;
        if (len < 20) return { pred: 'T', conf: 0.5, detail: 'Chưa đủ' };
        const f5 = this.history.slice(-5).filter(e=>e.result==='T').length / 5;
        const f10 = this.history.slice(-10).filter(e=>e.result==='T').length / 10;
        const f20 = this.history.slice(-20).filter(e=>e.result==='T').length / 20;
        const streak = this.getCurrentStreak();
        const slope = (f10 - f20);
        const logit = -0.2 + 0.5*f5 + 0.8*f10 - 0.3*streak + 0.4*slope;
        const probT = 1 / (1 + Math.exp(-logit));
        const pred = probT > 0.5 ? 'T' : 'X';
        const conf = Math.min(0.9, Math.abs(probT-0.5)*2 + 0.5);
        return { pred, conf, detail: `Logit probT=${probT.toFixed(3)}` };
    }

    // -------------------- KẾT HỢP CÁC THUẬT TOÁN --------------------
    getCombinedPrediction() {
        if (this.history.length < 5) return { prediction: 'T', confidence: 0.5, reason: 'Chưa đủ dữ liệu' };

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
            logistic: this.predictLogistic(),
            hoangGay: this.predictHoangGay()   // Thêm thuật toán Hoàng VIP
        };

        let totalWeight = 0, weightedProbT = 0;
        let reasons = [];

        Object.keys(results).forEach(key => {
            const r = results[key];
            const w = this.algoWeights[key] || 1;
            weightedProbT += (r.pred === 'T' ? 1 : 0) * w * r.conf;
            totalWeight += w * r.conf;
            reasons.push(`${this.algos[key]?.name || key}: ${r.pred}(${r.conf.toFixed(2)})`);
        });

        let probT = totalWeight > 0 ? weightedProbT / totalWeight : 0.5;
        let finalPred = probT > 0.5 ? 'T' : 'X';
        let confidence = Math.min(0.93, Math.max(0.6, Math.abs(probT-0.5)*2 + 0.55));

        // === LOGIC BẺ CẦU MẠNH (dựa trên Hoàng VIP + MD5) ===
        const streak = this.getCurrentStreak();
        const last = this.history[this.history.length-1]?.result || 'T';
        const md5BreakCount = [results.md5hash, results.md5hash2, results.md5hash3, results.hoangGay]
            .filter(r => r && r.pred !== last).length;

        let strategy = '';
        if (streak >= 5 || (streak >= 4 && md5BreakCount >= 3)) {
            finalPred = last === 'T' ? 'X' : 'T';
            confidence = Math.min(0.92, 0.7 + streak * 0.05);
            strategy = `🔴 BẺ CẦU MẠNH (Streak ${streak} + ${md5BreakCount}/4 đồng thuận)`;
        } else if (streak >= 4 && md5BreakCount >= 2) {
            finalPred = last === 'T' ? 'X' : 'T';
            confidence = Math.min(0.88, 0.65 + streak * 0.04);
            strategy = `🟠 BẺ CẦU VỪA (Streak ${streak} + MD5)`;
        } else {
            strategy = `🟢 THEO CẦU HOẶC CÂN BẰNG`;
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
            algoStats: this.algoStats
        };
    }
}

// ============================================================
// SERVER
// ============================================================
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

app.get('/', (req, res) => res.send('🚀 Smart Tài Xỉu Server - Tích hợp Hoàng VIP MD5'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy port ${PORT}`));