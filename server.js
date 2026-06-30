const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// THUẬT TOÁN HOÀNG VIP WIN - BẢN DỊCH JAVASCRIPT (TỐI ƯU)
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
        this.lichSuHash = [];
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
        this.lichSuHash.push(...hashList);
        if (this.lichSuHash.length > 10000) this.lichSuHash = this.lichSuHash.slice(-5000);
    }
}

// ============================================================
// SIÊU HỆ THỐNG DỰ ĐOÁN - TÍCH HỢP 21 THUẬT TOÁN TỪ ttoan.txt
// ============================================================
class UltraDicePredictionSystem {
    constructor() {
        this.history = [];
        this.models = {};
        this.weights = {};
        this.performance = {};
        this.patternDatabase = {};
        this.advancedPatterns = {};
        this.previousTopModels = [];
        this.sessionStats = {
            streaks: { T: 0, X: 0, maxT: 0, maxX: 0 },
            transitions: { TtoT: 0, TtoX: 0, XtoT: 0, XtoX: 0 },
            volatility: 0.5,
            patternConfidence: {},
            recentAccuracy: 0,
            bias: { T: 0, X: 0 }
        };
        this.marketState = {
            trend: 'neutral',
            momentum: 0,
            stability: 0.5,
            regime: 'normal'
        };
        this.adaptiveParameters = {
            patternMinLength: 3,
            patternMaxLength: 8,
            volatilityThreshold: 0.7,
            trendStrengthThreshold: 0.6,
            patternConfidenceDecay: 0.95,
            patternConfidenceGrowth: 1.05
        };
        // Khởi tạo các model
        this.initAllModels();
        // Khởi tạo Hoàng VIP
        this.hoangVip = new DuDoanHoangVip();
        this._initHoangVip();
    }

    _initHoangVip() {
        const mau = ['a'.repeat(32), 'b'.repeat(32), 'c'.repeat(32)];
        this.hoangVip.capNhatMoHinh(mau);
    }

    // Hàm tiện ích: kiểm tra và bind method an toàn
    _safeBind(methodName) {
        if (typeof this[methodName] === 'function') {
            return this[methodName].bind(this);
        }
        return null;
    }

    initAllModels() {
        // Định nghĩa các model (1-21) và các hàm hỗ trợ
        // Chúng ta sẽ gán trực tiếp vào this.models
        for (let i = 1; i <= 21; i++) {
            const mainMethod = this._safeBind(`model${i}`);
            if (mainMethod) {
                this.models[`model${i}`] = mainMethod;
                this.weights[`model${i}`] = 1;
                this.performance[`model${i}`] = {
                    correct: 0,
                    total: 0,
                    recentCorrect: 0,
                    recentTotal: 0,
                    streak: 0,
                    maxStreak: 0
                };
            }
            // Các hỗ trợ
            const s1 = this._safeBind(`model${i}Support1`);
            if (s1) this.models[`model${i}Support1`] = s1;
            const s2 = this._safeBind(`model${i}Support2`);
            if (s2) this.models[`model${i}Support2`] = s2;
            const s3 = this._safeBind(`model${i}Support3`);
            if (s3) this.models[`model${i}Support3`] = s3;
            const s4 = this._safeBind(`model${i}Support4`);
            if (s4) this.models[`model${i}Support4`] = s4;
        }

        // Pattern database
        this.initPatternDatabase();
        this.initAdvancedPatterns();
    }

    initPatternDatabase() {
        this.patternDatabase = {
            '1-1': { pattern: ['T', 'X', 'T', 'X'], probability: 0.7, strength: 0.8 },
            '1-2-1': { pattern: ['T', 'X', 'X', 'T'], probability: 0.65, strength: 0.75 },
            '2-1-2': { pattern: ['T', 'T', 'X', 'T', 'T'], probability: 0.68, strength: 0.78 },
            '3-1': { pattern: ['T', 'T', 'T', 'X'], probability: 0.72, strength: 0.82 },
            '1-3': { pattern: ['T', 'X', 'X', 'X'], probability: 0.72, strength: 0.82 },
            '2-2': { pattern: ['T', 'T', 'X', 'X'], probability: 0.66, strength: 0.76 },
            '2-3': { pattern: ['T', 'T', 'X', 'X', 'X'], probability: 0.71, strength: 0.81 },
            '3-2': { pattern: ['T', 'T', 'T', 'X', 'X'], probability: 0.73, strength: 0.83 },
            '4-1': { pattern: ['T', 'T', 'T', 'T', 'X'], probability: 0.76, strength: 0.86 },
            '1-4': { pattern: ['T', 'X', 'X', 'X', 'X'], probability: 0.76, strength: 0.86 },
        };
    }

    initAdvancedPatterns() {
        this.advancedPatterns = {
            'dynamic-1': {
                detect: (data) => {
                    if (data.length < 6) return false;
                    const last6 = data.slice(-6);
                    return last6.filter(x => x === 'T').length === 4 &&
                        last6[last6.length - 1] === 'T';
                },
                predict: () => 'X',
                confidence: 0.72,
                description: "4T trong 6 phiên, cuối là T -> dự đoán X"
            },
            'dynamic-2': {
                detect: (data) => {
                    if (data.length < 8) return false;
                    const last8 = data.slice(-8);
                    const tCount = last8.filter(x => x === 'T').length;
                    return tCount >= 6 && last8[last8.length - 1] === 'T';
                },
                predict: () => 'X',
                confidence: 0.78,
                description: "6+T trong 8 phiên, cuối là T -> dự đoán X mạnh"
            },
            'alternating-3': {
                detect: (data) => {
                    if (data.length < 5) return false;
                    const last5 = data.slice(-5);
                    for (let i = 1; i < last5.length; i++) {
                        if (last5[i] === last5[i - 1]) return false;
                    }
                    return true;
                },
                predict: (data) => data[data.length - 1] === 'T' ? 'X' : 'T',
                confidence: 0.68,
                description: "5 phiên đan xen hoàn hảo -> dự đoán đảo chiều"
            },
            'cyclic-7': {
                detect: (data) => {
                    if (data.length < 14) return false;
                    const firstHalf = data.slice(-14, -7);
                    const secondHalf = data.slice(-7);
                    return this.arraysEqual(firstHalf, secondHalf);
                },
                predict: (data) => data[data.length - 7],
                confidence: 0.75,
                description: "Chu kỳ 7 phiên lặp lại -> dự đoán theo chu kỳ"
            },
            'momentum-break': {
                detect: (data) => {
                    if (data.length < 9) return false;
                    const first6 = data.slice(-9, -3);
                    const last3 = data.slice(-3);
                    const firstT = first6.filter(x => x === 'T').length;
                    const firstX = first6.filter(x => x === 'X').length;
                    return Math.abs(firstT - firstX) >= 4 &&
                        new Set(last3).size === 1 &&
                        last3[0] !== (firstT > firstX ? 'T' : 'X');
                },
                predict: (data) => {
                    const first6 = data.slice(-9, -3);
                    const firstT = first6.filter(x => x === 'T').length;
                    const firstX = first6.filter(x => x === 'X').length;
                    return firstT > firstX ? 'T' : 'X';
                },
                confidence: 0.71,
                description: "Momentum mạnh bị phá vỡ -> quay lại momentum chính"
            },
            'hybrid-pattern': {
                detect: (data) => {
                    if (data.length < 10) return false;
                    const segment = data.slice(-10);
                    const tCount = segment.filter(x => x === 'T').length;
                    const transitions = segment.slice(1).filter((x, i) => x !== segment[i]).length;
                    return tCount >= 3 && tCount <= 7 && transitions >= 6;
                },
                predict: (data) => {
                    const last = data[data.length - 1];
                    const secondLast = data[data.length - 2];
                    return last === secondLast ? (last === 'T' ? 'X' : 'T') : last;
                },
                confidence: 0.65,
                description: "Pattern hỗn hợp cao -> dự đoán based on last transitions"
            }
        };
    }

    arraysEqual(arr1, arr2) {
        if (arr1.length !== arr2.length) return false;
        for (let i = 0; i < arr1.length; i++) {
            if (arr1[i] !== arr2[i]) return false;
        }
        return true;
    }

    // ---- Các hàm cập nhật trạng thái ----
    addResult(result) {
        if (this.history.length > 0) {
            const lastResult = this.history[this.history.length - 1];
            const transitionKey = `${lastResult}to${result}`;
            this.sessionStats.transitions[transitionKey] = (this.sessionStats.transitions[transitionKey] || 0) + 1;

            if (result === lastResult) {
                this.sessionStats.streaks[result]++;
                this.sessionStats.streaks[`max${result}`] = Math.max(
                    this.sessionStats.streaks[`max${result}`],
                    this.sessionStats.streaks[result]
                );
            } else {
                this.sessionStats.streaks[result] = 1;
                this.sessionStats.streaks[lastResult] = 0;
            }
        } else {
            this.sessionStats.streaks[result] = 1;
        }

        this.history.push(result);
        if (this.history.length > 200) this.history.shift();

        this.updateVolatility();
        this.updatePatternConfidence();
        this.updateMarketState();
        this.updatePatternDatabase();
        this.updatePerformance(result); // Cập nhật hiệu suất các model
        // Cập nhật Hoàng VIP
        const hashStr = crypto.createHash('md5').update(Date.now().toString() + result + this.history.length).digest('hex');
        this.hoangVip.capNhatMoHinh([hashStr]);
    }

    updateVolatility() {
        if (this.history.length < 10) return;
        const recent = this.history.slice(-10);
        let changes = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] !== recent[i - 1]) changes++;
        }
        this.sessionStats.volatility = changes / (recent.length - 1);
    }

    updatePatternConfidence() {
        for (const [patternName, confidence] of Object.entries(this.sessionStats.patternConfidence)) {
            if (this.history.length < 2) continue;
            const lastResult = this.history[this.history.length - 1];
            if (this.advancedPatterns[patternName]) {
                const prediction = this.advancedPatterns[patternName].predict(this.history.slice(0, -1));
                if (prediction !== lastResult) {
                    this.sessionStats.patternConfidence[patternName] = Math.max(
                        0.1,
                        confidence * this.adaptiveParameters.patternConfidenceDecay
                    );
                } else {
                    this.sessionStats.patternConfidence[patternName] = Math.min(
                        0.95,
                        confidence * this.adaptiveParameters.patternConfidenceGrowth
                    );
                }
            }
        }
    }

    updateMarketState() {
        if (this.history.length < 15) return;
        const recent = this.history.slice(-15);
        const tCount = recent.filter(x => x === 'T').length;
        const xCount = recent.filter(x => x === 'X').length;
        const trendStrength = Math.abs(tCount - xCount) / recent.length;

        if (trendStrength > this.adaptiveParameters.trendStrengthThreshold) {
            this.marketState.trend = tCount > xCount ? 'up' : 'down';
        } else {
            this.marketState.trend = 'neutral';
        }

        let momentum = 0;
        for (let i = 1; i < recent.length; i++) {
            if (recent[i] === recent[i - 1]) {
                momentum += recent[i] === 'T' ? 0.1 : -0.1;
            }
        }
        // Tanh an toàn
        this.marketState.momentum = Math.tanh ? Math.tanh(momentum) :
            (Math.exp(2 * momentum) - 1) / (Math.exp(2 * momentum) + 1);
        this.marketState.stability = 1 - this.sessionStats.volatility;

        if (this.sessionStats.volatility > this.adaptiveParameters.volatilityThreshold) {
            this.marketState.regime = 'volatile';
        } else if (trendStrength > 0.7) {
            this.marketState.regime = 'trending';
        } else if (trendStrength < 0.3) {
            this.marketState.regime = 'random';
        } else {
            this.marketState.regime = 'normal';
        }
    }

    updatePatternDatabase() {
        if (this.history.length < 10) return;
        for (let length = this.adaptiveParameters.patternMinLength;
            length <= this.adaptiveParameters.patternMaxLength; length++) {
            for (let i = 0; i <= this.history.length - length; i++) {
                const segment = this.history.slice(i, i + length);
                const patternKey = segment.join('-');
                if (!this.patternDatabase[patternKey]) {
                    let count = 0;
                    for (let j = 0; j <= this.history.length - length - 1; j++) {
                        const testSegment = this.history.slice(j, j + length);
                        if (testSegment.join('-') === patternKey) {
                            count++;
                        }
                    }
                    if (count > 2) {
                        const probability = count / (this.history.length - length);
                        const strength = Math.min(0.9, probability * 1.2);
                        this.patternDatabase[patternKey] = {
                            pattern: segment,
                            probability: probability,
                            strength: strength
                        };
                    }
                }
            }
        }
    }

    updatePerformance(actualResult) {
        const predictions = this.getAllPredictions();
        for (const [modelName, prediction] of Object.entries(predictions)) {
            if (prediction && prediction.prediction) {
                if (!this.performance[modelName]) {
                    this.performance[modelName] = { correct: 0, total: 0, recentCorrect: 0, recentTotal: 0, streak: 0, maxStreak: 0 };
                }
                this.performance[modelName].total++;
                this.performance[modelName].recentTotal++;
                if (prediction.prediction === actualResult) {
                    this.performance[modelName].correct++;
                    this.performance[modelName].recentCorrect++;
                    this.performance[modelName].streak++;
                    this.performance[modelName].maxStreak = Math.max(
                        this.performance[modelName].maxStreak,
                        this.performance[modelName].streak
                    );
                } else {
                    this.performance[modelName].streak = 0;
                }
                if (this.performance[modelName].recentTotal > 50) {
                    this.performance[modelName].recentTotal--;
                    if (this.performance[modelName].recentCorrect > 0 &&
                        this.performance[modelName].recentCorrect / this.performance[modelName].recentTotal >
                        this.performance[modelName].correct / this.performance[modelName].total) {
                        this.performance[modelName].recentCorrect--;
                    }
                }
                const acc = this.performance[modelName].total > 0 ? this.performance[modelName].correct / this.performance[modelName].total : 0.5;
                this.weights[modelName] = Math.max(0.1, Math.min(2, acc * 2));
            }
        }
        const totalPreds = Object.values(predictions).filter(p => p && p.prediction).length;
        const correctPreds = Object.values(predictions).filter(p => p && p.prediction === actualResult).length;
        this.sessionStats.recentAccuracy = totalPreds > 0 ? correctPreds / totalPreds : 0;
    }

    // ---- CÁC MODEL 1-21 (triển khai đầy đủ) ----
    model1() {
        const recent = this.history.slice(-10);
        if (recent.length < 4) return null;
        const patterns = this.model1Mini(recent);
        if (patterns.length === 0) return null;
        const bestPattern = patterns.reduce((best, current) =>
            current.probability > best.probability ? current : best
        );
        let confidence = bestPattern.probability * 0.8;
        if (this.marketState.regime === 'trending') confidence *= 1.1;
        else if (this.marketState.regime === 'volatile') confidence *= 0.9;
        return {
            prediction: bestPattern.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Phát hiện pattern ${bestPattern.type} (xác suất ${bestPattern.probability.toFixed(2)})`
        };
    }
    model1Mini(data) {
        const patterns = [];
        for (const [type, patternData] of Object.entries(this.patternDatabase)) {
            const pattern = patternData.pattern;
            if (data.length < pattern.length) continue;
            const segment = data.slice(-pattern.length + 1);
            const patternWithoutLast = pattern.slice(0, -1);
            if (segment.join('-') === patternWithoutLast.join('-')) {
                patterns.push({
                    type: type,
                    prediction: pattern[pattern.length - 1],
                    probability: patternData.probability,
                    strength: patternData.strength
                });
            }
        }
        return patterns;
    }
    model1Support1() { return { status: "Phân tích pattern nâng cao", totalPatterns: Object.keys(this.patternDatabase).length }; }
    model1Support2() { return { status: "Đánh giá độ tin cậy pattern" }; }
    model1Support3() { return { status: "Phân tích hiệu suất pattern" }; }
    model1Support4() { return { status: "Tối ưu parameters pattern", parameters: this.adaptiveParameters }; }

    model2() {
        const shortTerm = this.history.slice(-5);
        const longTerm = this.history.slice(-20);
        if (shortTerm.length < 3 || longTerm.length < 10) return null;
        const shortAnalysis = this.model2Mini(shortTerm);
        const longAnalysis = this.model2Mini(longTerm);
        let prediction, confidence, reason;
        if (shortAnalysis.trend === longAnalysis.trend) {
            prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
            confidence = (shortAnalysis.strength + longAnalysis.strength) / 2;
            reason = `Xu hướng ngắn và dài hạn cùng ${shortAnalysis.trend}`;
        } else {
            if (shortAnalysis.strength > longAnalysis.strength * 1.5) {
                prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = shortAnalysis.strength;
                reason = `Xu hướng ngắn hạn mạnh hơn dài hạn`;
            } else {
                prediction = longAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = longAnalysis.strength;
                reason = `Xu hướng dài hạn ổn định hơn`;
            }
        }
        if (this.marketState.regime === 'trending') confidence *= 1.15;
        else if (this.marketState.regime === 'volatile') confidence *= 0.85;
        return { prediction, confidence: Math.min(0.95, confidence * 0.9), reason };
    }
    model2Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        let trend = tCount > xCount ? 'up' : (xCount > tCount ? 'down' : 'neutral');
        let strength = Math.abs(tCount - xCount) / data.length;
        let changes = 0;
        for (let i = 1; i < data.length; i++) if (data[i] !== data[i-1]) changes++;
        const volatility = changes / (data.length - 1);
        strength = strength * (1 - volatility / 2);
        return { trend, strength, volatility };
    }
    model2Support1() { return { status: "Phân tích chất lượng trend" }; }
    model2Support2() { return { status: "Xác định điểm đảo chiều" }; }

    model3() {
        const recent = this.history.slice(-12);
        if (recent.length < 12) return null;
        const analysis = this.model3Mini(recent);
        if (analysis.difference < 0.4) return null;
        let confidence = analysis.difference * 0.8;
        if (this.marketState.regime === 'random') confidence *= 1.1;
        else if (this.marketState.regime === 'trending') confidence *= 0.9;
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Chênh lệch cao (${Math.round(analysis.difference * 100)}%) trong 12 phiên`
        };
    }
    model3Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        const total = data.length;
        const difference = Math.abs(tCount - xCount) / total;
        return { difference, prediction: tCount > xCount ? 'X' : 'T', tCount, xCount };
    }
    model3Support1() { return { status: "Phân tích hiệu quả mean reversion" }; }
    model3Support2() { return { status: "Tìm ngưỡng chênh lệch tối ưu" }; }

    model4() {
        const recent = this.history.slice(-6);
        if (recent.length < 4) return null;
        const analysis = this.model4Mini(recent);
        if (analysis.confidence < 0.6) return null;
        let confidence = analysis.confidence;
        if (this.marketState.regime === 'trending') confidence *= 1.1;
        else if (this.marketState.regime === 'volatile') confidence *= 0.9;
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Cầu ngắn hạn ${analysis.trend} với độ tin cậy ${analysis.confidence.toFixed(2)}`
        };
    }
    model4Mini(data) {
        const last3 = data.slice(-3);
        const tCount = last3.filter(x => x === 'T').length;
        const xCount = last3.filter(x => x === 'X').length;
        let prediction, confidence, trend;
        if (tCount === 3) { prediction = 'T'; confidence = 0.7; trend = 'Tăng mạnh'; }
        else if (xCount === 3) { prediction = 'X'; confidence = 0.7; trend = 'Giảm mạnh'; }
        else if (tCount === 2) { prediction = 'T'; confidence = 0.65; trend = 'Tăng nhẹ'; }
        else if (xCount === 2) { prediction = 'X'; confidence = 0.65; trend = 'Giảm nhẹ'; }
        else {
            const changes = data.slice(-4).filter((val, idx, arr) => idx > 0 && val !== arr[idx-1]).length;
            if (changes >= 3) {
                prediction = data[data.length-1] === 'T' ? 'X' : 'T';
                confidence = 0.6;
                trend = 'Đảo chiều';
            } else {
                prediction = data[data.length-1];
                confidence = 0.55;
                trend = 'Ổn định';
            }
        }
        return { prediction, confidence, trend };
    }
    model4Support1() { return { status: "Phân tích hiệu quả momentum ngắn hạn" }; }
    model4Support2() { return { status: "Tối ưu khung thời gian momentum" }; }

    model5() {
        const predictions = this.getAllPredictions();
        const tPredictions = Object.values(predictions).filter(p => p && p.prediction === 'T').length;
        const xPredictions = Object.values(predictions).filter(p => p && p.prediction === 'X').length;
        const total = tPredictions + xPredictions;
        if (total < 5) return null;
        const difference = Math.abs(tPredictions - xPredictions) / total;
        if (difference > 0.6) {
            return {
                prediction: tPredictions > xPredictions ? 'X' : 'T',
                confidence: difference * 0.9,
                reason: `Cân bằng tỷ lệ chênh lệch cao (${Math.round(difference * 100)}%)`
            };
        }
        return null;
    }
    model5Support1() { return { status: "Phân tích đồng thuận model" }; }
    model5Support2() { return { status: "Phân tích phân kỳ model" }; }

    model6() {
        const trendAnalysis = this.model2();
        if (!trendAnalysis) return null;
        const continuity = this.model6Mini(this.history.slice(-8));
        const breakProbability = this.model10Mini(this.history);
        if (continuity.streak >= 5 && breakProbability > 0.7) {
            return {
                prediction: trendAnalysis.prediction === 'T' ? 'X' : 'T',
                confidence: breakProbability * 0.8,
                reason: `Cầu liên tục ${continuity.streak} lần, xác suất bẻ cầu ${breakProbability.toFixed(2)}`
            };
        }
        return {
            prediction: trendAnalysis.prediction,
            confidence: trendAnalysis.confidence * 0.9,
            reason: `Tiếp tục theo xu hướng`
        };
    }
    model6Mini(data) {
        if (data.length < 2) return { streak: 0, direction: 'neutral', maxStreak: 0 };
        let currentStreak = 1;
        let maxStreak = 1;
        let direction = data[data.length - 1];
        for (let i = data.length - 1; i > 0; i--) {
            if (data[i] === data[i - 1]) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else break;
        }
        return { streak: currentStreak, direction, maxStreak };
    }
    model6Support1() { return { status: "Phân tích hiệu quả bẻ cầu" }; }
    model6Support2() { return { status: "Xác định điều kiện bẻ cầu tối ưu" }; }

    model7() {
        const performanceStats = this.model13Mini();
        const imbalance = this.model7Mini(performanceStats);
        if (imbalance > 0.3) {
            this.adjustWeights(performanceStats);
            return {
                prediction: null,
                confidence: 0,
                reason: `Điều chỉnh trọng số do chênh lệch hiệu suất ${imbalance.toFixed(2)}`
            };
        }
        return null;
    }
    model7Mini(performanceStats) {
        const accuracies = Object.values(performanceStats).map(p => p.accuracy);
        if (accuracies.length < 2) return 0;
        const maxAccuracy = Math.max(...accuracies);
        const minAccuracy = Math.min(...accuracies);
        return (maxAccuracy - minAccuracy) / maxAccuracy;
    }
    adjustWeights(performanceStats) {
        const avgAccuracy = Object.values(performanceStats).reduce((sum, p) => sum + p.accuracy, 0) /
            Object.values(performanceStats).length;
        for (const [model, stats] of Object.entries(performanceStats)) {
            const deviation = stats.accuracy - avgAccuracy;
            this.weights[model] = Math.max(0.1, Math.min(2, 1 + deviation * 2));
        }
    }
    model7Support1() { return { status: "Phân tích phân bố trọng số" }; }
    model7Support2() { return { status: "Tối ưu điều chỉnh trọng số" }; }

    model8() {
        const randomness = this.model8Mini(this.history.slice(-15));
        if (randomness > 0.7) {
            ['model1', 'model4', 'model9', 'model12'].forEach(model => {
                this.weights[model] = Math.max(0.3, this.weights[model] * 0.7);
            });
            ['model3', 'model5', 'model6'].forEach(model => {
                this.weights[model] = Math.min(2, this.weights[model] * 1.2);
            });
            return {
                prediction: null,
                confidence: 0,
                reason: `Phát hiện cầu xấu (độ ngẫu nhiên ${randomness.toFixed(2)})`
            };
        }
        return null;
    }
    model8Mini(data) {
        if (data.length < 10) return 0;
        let changes = 0;
        for (let i = 1; i < data.length; i++) if (data[i] !== data[i-1]) changes++;
        const changeRatio = changes / (data.length - 1);
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        const distribution = Math.abs(tCount - xCount) / data.length;
        const pT = tCount / data.length;
        const pX = xCount / data.length;
        let entropy = 0;
        const log2 = (x) => Math.log(x) / Math.LN2;
        if (pT > 0) entropy -= pT * log2(pT);
        if (pX > 0) entropy -= pX * log2(pX);
        return (changeRatio * 0.4 + (1 - distribution) * 0.3 + entropy * 0.3);
    }
    model8Support1() { return { status: "Phân tích đặc điểm cầu xấu" }; }
    model8Support2() { return { status: "Đề xuất chiến lược cho cầu xấu" }; }

    model9() {
        const recent = this.history.slice(-12);
        if (recent.length < 8) return null;
        const complexPatterns = this.model9Mini(recent);
        if (complexPatterns.length === 0) return null;
        const bestPattern = complexPatterns.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );
        let confidence = bestPattern.confidence;
        if (this.marketState.regime === 'trending') confidence *= 1.1;
        else if (this.marketState.regime === 'volatile') confidence *= 0.9;
        return {
            prediction: bestPattern.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Phát hiện pattern phức tạp: ${bestPattern.type}`
        };
    }
    model9Mini(data) {
        const patterns = [];
        for (let patternLength = 4; patternLength <= 6; patternLength++) {
            if (data.length < patternLength) continue;
            const segment = data.slice(-patternLength);
            const patternKey = segment.join('-');
            if (this.patternDatabase[patternKey]) {
                patterns.push({
                    type: patternKey,
                    prediction: this.patternDatabase[patternKey].pattern[
                        this.patternDatabase[patternKey].pattern.length - 1
                    ],
                    confidence: this.patternDatabase[patternKey].probability * 0.75
                });
            }
        }
        return patterns;
    }
    model9Support1() { return { status: "Phân tích độ phức tạp pattern" }; }
    model9Support2() { return { status: "Đánh giá khả năng tồn tại pattern" }; }

    model10() {
        const breakProb = this.model10Mini(this.history);
        return {
            prediction: null,
            confidence: breakProb,
            reason: `Xác suất bẻ cầu: ${breakProb.toFixed(2)}`
        };
    }
    model10Mini(data) {
        if (data.length < 20) return 0.5;
        let breakCount = 0;
        let totalOpportunities = 0;
        for (let i = 5; i < data.length; i++) {
            const segment = data.slice(i - 5, i);
            const streak = this.model6Mini(segment).streak;
            if (streak >= 4) {
                totalOpportunities++;
                if (data[i] !== segment[segment.length - 1]) breakCount++;
            }
        }
        return totalOpportunities > 0 ? breakCount / totalOpportunities : 0.5;
    }
    model10Support1() { return { status: "Phân tích yếu tố ảnh hưởng bẻ cầu" }; }
    model10Support2() { return { status: "Dự báo xác suất bẻ cầu" }; }

    model11() {
        const volatility = this.model11Mini(this.history.slice(-20));
        const prediction = this.model11Predict(volatility);
        return {
            prediction: prediction.value,
            confidence: prediction.confidence,
            reason: `Biến động ${volatility.level}, dự đoán ${prediction.value}`
        };
    }
    model11Mini(data) {
        if (data.length < 10) return { level: 'medium', value: 0.5 };
        let changes = 0;
        for (let i = 1; i < data.length; i++) if (data[i] !== data[i-1]) changes++;
        const changeRatio = changes / (data.length - 1);
        if (changeRatio < 0.3) return { level: 'low', value: changeRatio };
        if (changeRatio > 0.7) return { level: 'high', value: changeRatio };
        return { level: 'medium', value: changeRatio };
    }
    model11Predict(volatility) {
        if (volatility.level === 'low') {
            const last = this.history[this.history.length - 1];
            return { value: last, confidence: 0.7 };
        } else if (volatility.level === 'high') {
            return { value: Math.random() > 0.5 ? 'T' : 'X', confidence: 0.5 };
        } else {
            const trend = this.model2Mini(this.history.slice(-10));
            return { value: trend.trend === 'up' ? 'T' : 'X', confidence: trend.strength * 0.8 };
        }
    }
    model11Support1() { return { status: "Phân tích nguyên nhân biến động" }; }
    model11Support2() { return { status: "Dự báo biến động" }; }

    model12() {
        const shortPatterns = this.model12Mini(this.history.slice(-8));
        if (shortPatterns.length === 0) return null;
        const bestPattern = shortPatterns.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );
        return {
            prediction: bestPattern.prediction,
            confidence: bestPattern.confidence,
            reason: `Mẫu cầu ngắn: ${bestPattern.type}`
        };
    }
    model12Mini(data) {
        const patterns = [];
        const shortPatterns = {
            'T-X-T': { prediction: 'X', confidence: 0.65 },
            'X-T-X': { prediction: 'T', confidence: 0.65 },
            'T-T-X': { prediction: 'X', confidence: 0.7 },
            'X-X-T': { prediction: 'T', confidence: 0.7 },
            'T-X-X': { prediction: 'T', confidence: 0.6 },
            'X-T-T': { prediction: 'X', confidence: 0.6 },
            'T-T-T-X': { prediction: 'X', confidence: 0.72 },
            'X-X-X-T': { prediction: 'T', confidence: 0.72 },
            'T-X-T-X': { prediction: 'X', confidence: 0.68 },
            'X-T-X-T': { prediction: 'T', confidence: 0.68 }
        };
        if (data.length >= 3) {
            const last3 = data.slice(-3).join('-');
            if (shortPatterns[last3]) patterns.push({
                type: last3,
                prediction: shortPatterns[last3].prediction,
                confidence: shortPatterns[last3].confidence
            });
        }
        if (data.length >= 4) {
            const last4 = data.slice(-4).join('-');
            if (shortPatterns[last4]) patterns.push({
                type: last4,
                prediction: shortPatterns[last4].prediction,
                confidence: shortPatterns[last4].confidence
            });
        }
        return patterns;
    }
    model12Support1() { return { status: "Phân tích hiệu suất mẫu ngắn" }; }
    model12Support2() { return { status: "Tối ưu độ dài mẫu ngắn" }; }

    model13() {
        const performance = this.model13Mini();
        if (Object.keys(performance).length === 0) return null;
        const bestModel = Object.entries(performance).reduce((best, [model, stats]) =>
            stats.accuracy > best.accuracy ? { model, ...stats } : best,
            { model: null, accuracy: 0 });
        return {
            prediction: null,
            confidence: bestModel.accuracy,
            reason: `Model hiệu suất cao nhất: ${bestModel.model} (${bestModel.accuracy.toFixed(2)})`
        };
    }
    model13Mini() {
        const stats = {};
        for (const [model, perf] of Object.entries(this.performance)) {
            if (perf.total > 0) {
                stats[model] = {
                    accuracy: perf.correct / perf.total,
                    recentAccuracy: perf.recentTotal > 0 ? perf.recentCorrect / perf.recentTotal : 0,
                    total: perf.total,
                    recentTotal: perf.recentTotal,
                    streak: perf.streak,
                    maxStreak: perf.maxStreak
                };
            }
        }
        return stats;
    }
    model13Support1() { return { status: "Phân tích xu hướng hiệu suất" }; }
    model13Support2() { return { status: "Đề xuất cải thiện hiệu suất" }; }

    model14() {
        const breakProb = this.model14Mini(this.history);
        return {
            prediction: null,
            confidence: breakProb,
            reason: `Xác suất bẻ cầu xu hướng: ${breakProb.toFixed(2)}`
        };
    }
    model14Mini(data) {
        if (data.length < 15) return 0.5;
        let breakCount = 0;
        let trendCount = 0;
        for (let i = 10; i < data.length; i++) {
            const segment = data.slice(i - 10, i);
            const trend = this.model2Mini(segment);
            if (trend.strength > 0.6) {
                trendCount++;
                if (data[i] !== (trend.trend === 'up' ? 'T' : 'X')) breakCount++;
            }
        }
        return trendCount > 0 ? breakCount / trendCount : 0.5;
    }
    model14Support1() { return { status: "Phân tích yếu tố bẻ cầu xu hướng" }; }
    model14Support2() { return { status: "Dự báo xác suất bẻ cầu xu hướng" }; }

    model15() {
        const trend = this.model2();
        if (!trend) return null;
        const breakProb = this.model14Mini(this.history);
        const shouldFollow = this.model15Mini(trend.confidence, breakProb);
        return {
            prediction: shouldFollow ? trend.prediction : (trend.prediction === 'T' ? 'X' : 'T'),
            confidence: shouldFollow ? trend.confidence : (1 - trend.confidence),
            reason: shouldFollow ? `Nên theo xu hướng (xác suất bẻ thấp)` : `Nên bẻ xu hướng (xác suất bẻ cao)`
        };
    }
    model15Mini(trendConfidence, breakProbability) {
        return trendConfidence > breakProbability * 1.5;
    }
    model15Support1() { return { status: "Phân tích risk/reward theo xu hướng" }; }
    model15Support2() { return { status: "Tối ưu ngưỡng quyết định xu hướng" }; }

    model16() {
        const breakProb = this.model16Mini(this.history);
        return {
            prediction: null,
            confidence: breakProb,
            reason: `Xác suất bẻ cầu tổng hợp: ${breakProb.toFixed(2)}`
        };
    }
    model16Mini(data) {
        const prob1 = this.model10Mini(data);
        const prob2 = this.model14Mini(data);
        let recentBreaks = 0;
        let recentOpportunities = 0;
        for (let i = Math.max(0, data.length - 10); i < data.length - 1; i++) {
            if (i >= 5) {
                const segment = data.slice(i - 5, i);
                const streak = this.model6Mini(segment).streak;
                if (streak >= 3) {
                    recentOpportunities++;
                    if (data[i] !== segment[segment.length - 1]) recentBreaks++;
                }
            }
        }
        const prob3 = recentOpportunities > 0 ? recentBreaks / recentOpportunities : 0.5;
        return (prob1 * 0.4 + prob2 * 0.4 + prob3 * 0.2);
    }
    model16Support1() { return { status: "Phân tích độ tin cậy xác suất bẻ" }; }
    model16Support2() { return { status: "Tối ưu trọng số xác suất bẻ" }; }

    model17() {
        const performance = this.model13Mini();
        const imbalance = this.model17Mini(performance);
        if (imbalance > 0.25) {
            this.adjustWeightsAdvanced(performance);
            return {
                prediction: null,
                confidence: 0,
                reason: `Cân bằng trọng số nâng cao, độ chênh lệch: ${imbalance.toFixed(2)}`
            };
        }
        return null;
    }
    model17Mini(performance) {
        const accuracies = Object.values(performance).map(p => p.accuracy);
        if (accuracies.length < 2) return 0;
        const mean = accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
        const variance = accuracies.reduce((sum, acc) => sum + Math.pow(acc - mean, 2), 0) / accuracies.length;
        return Math.sqrt(variance) / mean;
    }
    adjustWeightsAdvanced(performance) {
        const meanAccuracy = Object.values(performance).reduce((sum, p) => sum + p.accuracy, 0) /
            Object.values(performance).length;
        for (const [model, stats] of Object.entries(performance)) {
            if (stats.accuracy > meanAccuracy * 1.2) {
                this.weights[model] = Math.min(2, this.weights[model] * 1.1);
            } else if (stats.accuracy < meanAccuracy * 0.8) {
                this.weights[model] = Math.max(0.1, this.weights[model] * 0.9);
            }
        }
    }
    model17Support1() { return { status: "Phân tích ảnh hưởng điều chỉnh trọng số" }; }
    model17Support2() { return { status: "Tối ưu tần suất điều chỉnh trọng số" }; }

    model18() {
        const shortTrend = this.model18Mini(this.history.slice(-6));
        return {
            prediction: shortTrend.prediction,
            confidence: shortTrend.confidence,
            reason: `Xu hướng ngắn hạn: ${shortTrend.trend}`
        };
    }
    model18Mini(data) {
        if (data.length < 4) return { prediction: null, confidence: 0, trend: 'Không xác định' };
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        let prediction, confidence, trend;
        if (tCount > xCount * 1.5) { prediction = 'T'; confidence = 0.7; trend = 'Mạnh T'; }
        else if (xCount > tCount * 1.5) { prediction = 'X'; confidence = 0.7; trend = 'Mạnh X'; }
        else if (tCount > xCount) { prediction = 'T'; confidence = 0.6; trend = 'Nhẹ T'; }
        else if (xCount > tCount) { prediction = 'X'; confidence = 0.6; trend = 'Nhẹ X'; }
        else { prediction = data[data.length-1] === 'T' ? 'X' : 'T'; confidence = 0.55; trend = 'Cân bằng'; }
        return { prediction, confidence, trend };
    }
    model18Support1() { return { status: "Phân tích độ nhạy xu hướng ngắn hạn" }; }
    model18Support2() { return { status: "Tối ưu khung thời gian xu hướng ngắn hạn" }; }

    model19() {
        const commonTrends = this.model19Mini(this.history.slice(-30));
        if (commonTrends.length === 0) return null;
        const bestTrend = commonTrends.reduce((best, current) =>
            current.frequency > best.frequency ? current : best
        );
        return {
            prediction: bestTrend.prediction,
            confidence: bestTrend.confidence,
            reason: `Xu hướng phổ biến: ${bestTrend.pattern} (tần suất ${bestTrend.frequency})`
        };
    }
    model19Mini(data) {
        const trends = [];
        const patternCounts = {};
        for (let length = 3; length <= 5; length++) {
            for (let i = 0; i <= data.length - length; i++) {
                const pattern = data.slice(i, i + length).join('-');
                patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
            }
        }
        for (const [pattern, count] of Object.entries(patternCounts)) {
            if (count >= 3) {
                const patternParts = pattern.split('-');
                const prediction = patternParts[patternParts.length - 1];
                const frequency = count / (data.length - patternParts.length + 1);
                trends.push({
                    pattern,
                    prediction,
                    frequency,
                    confidence: Math.min(0.8, frequency * 2)
                });
            }
        }
        return trends;
    }
    model19Support1() { return { status: "Phân tích sự ổn định xu hướng" }; }
    model19Support2() { return { status: "Dự báo xu hướng phổ biến" }; }

    model20() {
        const performance = this.model13Mini();
        const bestModels = Object.entries(performance)
            .filter(([_, stats]) => stats.total > 10)
            .sort((a, b) => b[1].accuracy - a[1].accuracy)
            .slice(0, 3);
        if (bestModels.length === 0) return null;
        const predictions = {};
        for (const [model] of bestModels) {
            if (this.models[model]) predictions[model] = this.models[model]();
        }
        let tScore = 0, xScore = 0;
        for (const [model, prediction] of Object.entries(predictions)) {
            if (prediction && prediction.prediction) {
                const weight = performance[model].accuracy;
                if (prediction.prediction === 'T') tScore += weight * prediction.confidence;
                else xScore += weight * prediction.confidence;
            }
        }
        const totalScore = tScore + xScore;
        if (totalScore === 0) return null;
        return {
            prediction: tScore > xScore ? 'T' : 'X',
            confidence: Math.max(tScore, xScore) / totalScore,
            reason: `Kết hợp ${bestModels.length} model hiệu suất cao nhất`
        };
    }
    model20Support1() { return { status: "Phân tích tính ổn định model hiệu suất cao" }; }
    model20Support2() { return { status: "Tối ưu số lượng model trong combination" }; }

    model21() {
        const predictions = this.getAllPredictions();
        const tCount = Object.values(predictions).filter(p => p && p.prediction === 'T').length;
        const xCount = Object.values(predictions).filter(p => p && p.prediction === 'X').length;
        const total = tCount + xCount;
        if (total < 8) return null;
        const difference = Math.abs(tCount - xCount) / total;
        if (difference > 0.5) {
            const adjustedPredictions = this.model21Mini(predictions, difference);
            let tScore = 0, xScore = 0;
            for (const prediction of Object.values(adjustedPredictions)) {
                if (prediction && prediction.prediction) {
                    if (prediction.prediction === 'T') tScore += prediction.confidence;
                    else xScore += prediction.confidence;
                }
            }
            const totalScore = tScore + xScore;
            if (totalScore === 0) return null;
            return {
                prediction: tScore > xScore ? 'T' : 'X',
                confidence: Math.max(tScore, xScore) / totalScore,
                reason: `Cân bằng tổng thể, chênh lệch ban đầu: ${difference.toFixed(2)}`
            };
        }
        return null;
    }
    model21Mini(predictions, difference) {
        const adjusted = {};
        const adjustment = 1 - difference;
        for (const [model, prediction] of Object.entries(predictions)) {
            if (prediction) {
                adjusted[model] = {
                    ...prediction,
                    confidence: prediction.confidence * adjustment
                };
            }
        }
        return adjusted;
    }
    model21Support1() { return { status: "Phân tích hiệu quả cơ chế cân bằng" }; }
    model21Support2() { return { status: "Tối ưu ngưỡng cân bằng" }; }

    // ---- Utility ----
    getAllPredictions() {
        const predictions = {};
        for (let i = 1; i <= 21; i++) {
            const model = `model${i}`;
            if (this.models[model]) {
                predictions[model] = this.models[model]();
            }
        }
        return predictions;
    }

    getFinalPrediction() {
        const predictions = this.getAllPredictions();
        let tScore = 0, xScore = 0;
        let reasons = [];
        for (const [modelName, prediction] of Object.entries(predictions)) {
            if (prediction && prediction.prediction) {
                const weight = this.weights[modelName] || 1;
                const score = prediction.confidence * weight;
                if (prediction.prediction === 'T') tScore += score;
                else if (prediction.prediction === 'X') xScore += score;
                reasons.push(`${modelName}: ${prediction.reason} (${prediction.confidence.toFixed(2)})`);
            }
        }
        // Tích hợp Hoàng VIP
        if (this.history.length > 2) {
            const lastId = this.history[this.history.length-1]?.id || Date.now();
            const hashStr = crypto.createHash('md5').update(lastId.toString() + this.history.length).digest('hex');
            const hvPreds = this.hoangVip.duDoanHashTiepTheo(hashStr, 3);
            if (hvPreds.length > 0) {
                let hvScore = 0;
                let hvT = 0, hvX = 0;
                hvPreds.forEach(h => {
                    const sum = h.split('').reduce((a,b) => a + parseInt(b,16), 0);
                    const probT = 0.5 + (sum - 128) / 256 * 0.3;
                    if (probT > 0.5) hvT += probT;
                    else hvX += (1 - probT);
                });
                if (hvT > hvX) tScore += hvT * 0.8;
                else xScore += hvX * 0.8;
                reasons.push(`HoàngVIP: ${hvT > hvX ? 'T' : 'X'} (${Math.max(hvT,hvX).toFixed(2)})`);
            }
        }

        const totalScore = tScore + xScore;
        if (totalScore === 0) return null;
        let finalPrediction = tScore > xScore ? 'T' : 'X';
        let finalConfidence = Math.max(tScore, xScore) / totalScore;
        finalConfidence = this.adjustConfidenceByVolatility(finalConfidence);
        return {
            prediction: finalPrediction,
            confidence: finalConfidence,
            reasons: reasons.slice(0, 5), // lấy 5 lý do đầu
            details: predictions,
            sessionStats: this.sessionStats,
            marketState: this.marketState
        };
    }

    adjustConfidenceByVolatility(confidence) {
        if (this.sessionStats.volatility > 0.7) return confidence * 0.8;
        if (this.sessionStats.volatility < 0.3) return Math.min(0.95, confidence * 1.1);
        return confidence;
    }

    // Thêm kết quả và cập nhật dự đoán
    addResultAndUpdate(phienId, result, dices) {
        this.addResult(result);
        return this.getFinalPrediction();
    }
}

// ============================================================
// SERVER
// ============================================================
const predictor = new UltraDicePredictionSystem();

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

            const predEntry = predictor.addResultAndUpdate(phienId, result, dices);

            currentPrediction = {
                id: "s2king",
                phien: phienId,
                ket_qua: resultStr ? resultStr.toLowerCase() : (result === 'T' ? 'tài' : 'xỉu'),
                xuc_xac: dices.length === 3 ? dices.join('-') : "?-?-?",
                phien_moi: phienId + 1,
                du_doan: predEntry ? (predEntry.prediction === 'T' ? 'tài' : 'xỉu') : 'chờ',
                do_tin_cay: predEntry ? Math.round(predEntry.confidence * 100) + '%' : 'N/A',
                ly_do: predEntry ? predEntry.reasons.join('; ') : 'Chưa đủ dữ liệu',
                ty_le_tai: predEntry ? predEntry.confidence.toFixed(3) : '0',
                thong_ke: {
                    totalPredictions: Object.values(predictor.performance).reduce((s, p) => s + p.total, 0),
                    correct: Object.values(predictor.performance).reduce((s, p) => s + p.correct, 0),
                    accuracy: (() => {
                        const t = Object.values(predictor.performance).reduce((s, p) => s + p.total, 0);
                        const c = Object.values(predictor.performance).reduce((s, p) => s + p.correct, 0);
                        return t > 0 ? c / t : 0;
                    })(),
                    historyLength: predictor.history.length
                }
            };

            lastId = phienId;
            console.log(`[${new Date().toLocaleTimeString()}] Phiên ${phienId} → ${result} | DD: ${predEntry ? predEntry.prediction : 'N/A'}`);
        }
    } catch (e) {
        console.error("API Error:", e.message);
    }
}

// Khởi tạo lần đầu
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

app.get('/stats', (req, res) => {
    const stats = {
        totalPredictions: Object.values(predictor.performance).reduce((s, p) => s + p.total, 0),
        correct: Object.values(predictor.performance).reduce((s, p) => s + p.correct, 0),
        accuracy: (() => {
            const t = Object.values(predictor.performance).reduce((s, p) => s + p.total, 0);
            const c = Object.values(predictor.performance).reduce((s, p) => s + p.correct, 0);
            return t > 0 ? c / t : 0;
        })(),
        historyLength: predictor.history.length,
        sessionStats: predictor.sessionStats,
        marketState: predictor.marketState
    };
    res.json(stats);
});

app.get('/', (req, res) => res.send('🚀 SIÊU DỰ ĐOÁN TÀI XỈU - 21 THUẬT TOÁN + HOÀNG VIP'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server chạy port ${PORT}`));