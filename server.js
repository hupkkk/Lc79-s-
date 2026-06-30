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
        this.lichSuHash = [];
        // Khởi tạo với dữ liệu mẫu
        const mau = [];
        for (let i = 0; i < 20; i++) {
            mau.push(crypto.createHash('md5').update('hoangvip_seed_' + i + '_' + Date.now()).digest('hex'));
        }
        this.capNhatMoHinh(mau);
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
// HỆ THỐNG DỰ ĐOÁN 21 THUẬT TOÁN
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
        this.hoangVip = new DuDoanHoangVip();
        this.initAllModels();
        // Khởi tạo với dữ liệu mẫu
        this._initSampleData();
    }

    _initSampleData() {
        // Tạo 20 phiên mẫu ngẫu nhiên
        const sampleResults = [];
        let last = 'T';
        for (let i = 0; i < 20; i++) {
            // Tạo chuỗi ngẫu nhiên nhưng có xu hướng
            let r;
            if (i < 5) r = 'T';
            else if (i < 10) r = 'X';
            else {
                const rand = Math.random();
                if (rand < 0.45) r = 'T';
                else if (rand < 0.9) r = 'X';
                else r = last;
            }
            sampleResults.push(r);
            last = r;
        }
        sampleResults.forEach(r => this.addResult(r));
    }

    _safeBind(methodName) {
        if (typeof this[methodName] === 'function') {
            return this[methodName].bind(this);
        }
        return null;
    }

    initAllModels() {
        for (let i = 1; i <= 21; i++) {
            const mainMethod = this._safeBind(`model${i}`);
            if (mainMethod) {
                this.models[`model${i}`] = mainMethod;
                this.weights[`model${i}`] = 1;
                this.performance[`model${i}`] = {
                    correct: 0, total: 0, recentCorrect: 0, recentTotal: 0, streak: 0, maxStreak: 0
                };
            }
        }
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
        };
    }

    initAdvancedPatterns() {
        this.advancedPatterns = {
            'dynamic-1': {
                detect: (data) => {
                    if (data.length < 6) return false;
                    const last6 = data.slice(-6);
                    return last6.filter(x => x === 'T').length === 4 && last6[last6.length - 1] === 'T';
                },
                predict: () => 'X',
                confidence: 0.72,
                description: "4T trong 6 phiên -> dự đoán X"
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
                description: "5 phiên đan xen -> đảo chiều"
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
        this.updatePerformance(result);
        
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
        // Đơn giản hóa
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
        this.marketState.stability = 1 - this.sessionStats.volatility;
    }

    updatePatternDatabase() {
        // Đơn giản hóa
    }

    updatePerformance(actualResult) {
        const predictions = this.getAllPredictions();
        for (const [modelName, prediction] of Object.entries(predictions)) {
            if (prediction && prediction.prediction) {
                if (!this.performance[modelName]) {
                    this.performance[modelName] = { correct: 0, total: 0, recentCorrect: 0, recentTotal: 0, streak: 0, maxStreak: 0 };
                }
                this.performance[modelName].total++;
                if (prediction.prediction === actualResult) {
                    this.performance[modelName].correct++;
                }
                const acc = this.performance[modelName].total > 0 ? this.performance[modelName].correct / this.performance[modelName].total : 0.5;
                this.weights[modelName] = Math.max(0.1, Math.min(2, acc * 2));
            }
        }
    }

    // --- CÁC MODEL 1-21 (RÚT GỌN) ---
    model1() {
        const recent = this.history.slice(-10);
        if (recent.length < 4) return null;
        const patterns = this.model1Mini(recent);
        if (patterns.length === 0) return null;
        const bestPattern = patterns.reduce((best, current) =>
            current.probability > best.probability ? current : best
        );
        let confidence = bestPattern.probability * 0.8;
        return {
            prediction: bestPattern.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Pattern ${bestPattern.type}`
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

    model2() {
        const shortTerm = this.history.slice(-5);
        const longTerm = this.history.slice(-20);
        if (shortTerm.length < 3 || longTerm.length < 10) return null;
        const shortAnalysis = this.model2Mini(shortTerm);
        const longAnalysis = this.model2Mini(longTerm);
        let prediction, confidence;
        if (shortAnalysis.trend === longAnalysis.trend) {
            prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
            confidence = (shortAnalysis.strength + longAnalysis.strength) / 2;
        } else {
            if (shortAnalysis.strength > longAnalysis.strength * 1.5) {
                prediction = shortAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = shortAnalysis.strength;
            } else {
                prediction = longAnalysis.trend === 'up' ? 'T' : 'X';
                confidence = longAnalysis.strength;
            }
        }
        return { prediction, confidence: Math.min(0.95, confidence * 0.9), reason: `Xu hướng` };
    }
    model2Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        let trend = tCount > xCount ? 'up' : (xCount > tCount ? 'down' : 'neutral');
        let strength = Math.abs(tCount - xCount) / data.length;
        return { trend, strength };
    }

    model3() {
        const recent = this.history.slice(-12);
        if (recent.length < 12) return null;
        const analysis = this.model3Mini(recent);
        if (analysis.difference < 0.4) return null;
        let confidence = analysis.difference * 0.8;
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, confidence),
            reason: `Chênh lệch ${Math.round(analysis.difference * 100)}%`
        };
    }
    model3Mini(data) {
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        const difference = Math.abs(tCount - xCount) / data.length;
        return { difference, prediction: tCount > xCount ? 'X' : 'T' };
    }

    model4() {
        const recent = this.history.slice(-6);
        if (recent.length < 4) return null;
        const analysis = this.model4Mini(recent);
        if (analysis.confidence < 0.6) return null;
        return {
            prediction: analysis.prediction,
            confidence: Math.min(0.95, analysis.confidence),
            reason: `Cầu ngắn ${analysis.trend}`
        };
    }
    model4Mini(data) {
        const last3 = data.slice(-3);
        const tCount = last3.filter(x => x === 'T').length;
        const xCount = last3.filter(x => x === 'X').length;
        let prediction, confidence, trend;
        if (tCount === 3) { prediction = 'T'; confidence = 0.7; trend = 'Tăng'; }
        else if (xCount === 3) { prediction = 'X'; confidence = 0.7; trend = 'Giảm'; }
        else if (tCount === 2) { prediction = 'T'; confidence = 0.65; trend = 'Tăng nhẹ'; }
        else if (xCount === 2) { prediction = 'X'; confidence = 0.65; trend = 'Giảm nhẹ'; }
        else {
            const changes = data.slice(-4).filter((val, idx, arr) => idx > 0 && val !== arr[idx-1]).length;
            if (changes >= 3) {
                prediction = data[data.length-1] === 'T' ? 'X' : 'T';
                confidence = 0.6;
                trend = 'Đảo';
            } else {
                prediction = data[data.length-1];
                confidence = 0.55;
                trend = 'Ổn';
            }
        }
        return { prediction, confidence, trend };
    }

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
                reason: `Cân bằng chênh lệch ${Math.round(difference * 100)}%`
            };
        }
        return null;
    }

    model6() {
        const trendAnalysis = this.model2();
        if (!trendAnalysis) return null;
        const continuity = this.model6Mini(this.history.slice(-8));
        const breakProbability = this.model10Mini(this.history);
        if (continuity.streak >= 5 && breakProbability > 0.7) {
            return {
                prediction: trendAnalysis.prediction === 'T' ? 'X' : 'T',
                confidence: breakProbability * 0.8,
                reason: `Bẻ cầu streak ${continuity.streak}`
            };
        }
        return {
            prediction: trendAnalysis.prediction,
            confidence: trendAnalysis.confidence * 0.9,
            reason: `Theo xu hướng`
        };
    }
    model6Mini(data) {
        if (data.length < 2) return { streak: 0 };
        let currentStreak = 1;
        for (let i = data.length - 1; i > 0; i--) {
            if (data[i] === data[i - 1]) currentStreak++;
            else break;
        }
        return { streak: currentStreak };
    }

    model7() {
        const performanceStats = this.model13Mini();
        const imbalance = this.model7Mini(performanceStats);
        if (imbalance > 0.3) {
            this.adjustWeights(performanceStats);
            return { prediction: null, confidence: 0, reason: `Điều chỉnh trọng số` };
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

    model8() {
        const randomness = this.model8Mini(this.history.slice(-15));
        if (randomness > 0.7) {
            ['model1', 'model4', 'model9', 'model12'].forEach(model => {
                this.weights[model] = Math.max(0.3, this.weights[model] * 0.7);
            });
            ['model3', 'model5', 'model6'].forEach(model => {
                this.weights[model] = Math.min(2, this.weights[model] * 1.2);
            });
            return { prediction: null, confidence: 0, reason: `Cầu xấu, ngẫu nhiên ${randomness.toFixed(2)}` };
        }
        return null;
    }
    model8Mini(data) {
        if (data.length < 10) return 0;
        let changes = 0;
        for (let i = 1; i < data.length; i++) if (data[i] !== data[i-1]) changes++;
        const changeRatio = changes / (data.length - 1);
        return changeRatio;
    }

    model9() {
        const recent = this.history.slice(-12);
        if (recent.length < 8) return null;
        const complexPatterns = this.model9Mini(recent);
        if (complexPatterns.length === 0) return null;
        const bestPattern = complexPatterns.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );
        return {
            prediction: bestPattern.prediction,
            confidence: Math.min(0.95, bestPattern.confidence),
            reason: `Pattern phức tạp: ${bestPattern.type}`
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

    model10() {
        const breakProb = this.model10Mini(this.history);
        return { prediction: null, confidence: breakProb, reason: `Xác suất bẻ: ${breakProb.toFixed(2)}` };
    }
    model10Mini(data) {
        if (data.length < 20) return 0.5;
        let breakCount = 0, totalOpportunities = 0;
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

    model11() {
        const volatility = this.model11Mini(this.history.slice(-20));
        const prediction = this.model11Predict(volatility);
        return {
            prediction: prediction.value,
            confidence: prediction.confidence,
            reason: `Biến động ${volatility.level}`
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
        } else {
            const trend = this.model2Mini(this.history.slice(-10));
            return { value: trend.trend === 'up' ? 'T' : 'X', confidence: trend.strength * 0.8 };
        }
    }

    model12() {
        const shortPatterns = this.model12Mini(this.history.slice(-8));
        if (shortPatterns.length === 0) return null;
        const bestPattern = shortPatterns.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );
        return {
            prediction: bestPattern.prediction,
            confidence: bestPattern.confidence,
            reason: `Mẫu ngắn: ${bestPattern.type}`
        };
    }
    model12Mini(data) {
        const patterns = [];
        const shortPatterns = {
            'T-X-T': { prediction: 'X', confidence: 0.65 },
            'X-T-X': { prediction: 'T', confidence: 0.65 },
            'T-T-X': { prediction: 'X', confidence: 0.7 },
            'X-X-T': { prediction: 'T', confidence: 0.7 }
        };
        if (data.length >= 3) {
            const last3 = data.slice(-3).join('-');
            if (shortPatterns[last3]) patterns.push({
                type: last3,
                prediction: shortPatterns[last3].prediction,
                confidence: shortPatterns[last3].confidence
            });
        }
        return patterns;
    }

    model13() {
        const performance = this.model13Mini();
        if (Object.keys(performance).length === 0) return null;
        const bestModel = Object.entries(performance).reduce((best, [model, stats]) =>
            stats.accuracy > best.accuracy ? { model, ...stats } : best,
            { model: null, accuracy: 0 });
        return {
            prediction: null,
            confidence: bestModel.accuracy,
            reason: `Model tốt: ${bestModel.model}`
        };
    }
    model13Mini() {
        const stats = {};
        for (const [model, perf] of Object.entries(this.performance)) {
            if (perf.total > 0) {
                stats[model] = {
                    accuracy: perf.correct / perf.total,
                    total: perf.total
                };
            }
        }
        return stats;
    }

    model14() {
        const breakProb = this.model14Mini(this.history);
        return { prediction: null, confidence: breakProb, reason: `Bẻ xu hướng: ${breakProb.toFixed(2)}` };
    }
    model14Mini(data) {
        if (data.length < 15) return 0.5;
        let breakCount = 0, trendCount = 0;
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

    model15() {
        const trend = this.model2();
        if (!trend) return null;
        const breakProb = this.model14Mini(this.history);
        const shouldFollow = this.model15Mini(trend.confidence, breakProb);
        return {
            prediction: shouldFollow ? trend.prediction : (trend.prediction === 'T' ? 'X' : 'T'),
            confidence: shouldFollow ? trend.confidence : (1 - trend.confidence),
            reason: shouldFollow ? `Theo xu hướng` : `Bẻ xu hướng`
        };
    }
    model15Mini(trendConfidence, breakProbability) {
        return trendConfidence > breakProbability * 1.5;
    }

    model16() {
        const breakProb = this.model16Mini(this.history);
        return { prediction: null, confidence: breakProb, reason: `Bẻ tổng hợp: ${breakProb.toFixed(2)}` };
    }
    model16Mini(data) {
        const prob1 = this.model10Mini(data);
        const prob2 = this.model14Mini(data);
        return (prob1 * 0.5 + prob2 * 0.5);
    }

    model17() {
        const performance = this.model13Mini();
        const imbalance = this.model17Mini(performance);
        if (imbalance > 0.25) {
            this.adjustWeightsAdvanced(performance);
            return { prediction: null, confidence: 0, reason: `Cân bằng trọng số` };
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

    model18() {
        const shortTrend = this.model18Mini(this.history.slice(-6));
        return {
            prediction: shortTrend.prediction,
            confidence: shortTrend.confidence,
            reason: `Xu hướng ngắn: ${shortTrend.trend}`
        };
    }
    model18Mini(data) {
        if (data.length < 4) return { prediction: null, confidence: 0, trend: 'Không' };
        const tCount = data.filter(x => x === 'T').length;
        const xCount = data.filter(x => x === 'X').length;
        let prediction, confidence, trend;
        if (tCount > xCount * 1.5) { prediction = 'T'; confidence = 0.7; trend = 'Tăng'; }
        else if (xCount > tCount * 1.5) { prediction = 'X'; confidence = 0.7; trend = 'Giảm'; }
        else { prediction = data[data.length-1] === 'T' ? 'X' : 'T'; confidence = 0.55; trend = 'Cân'; }
        return { prediction, confidence, trend };
    }

    model19() {
        const commonTrends = this.model19Mini(this.history.slice(-30));
        if (commonTrends.length === 0) return null;
        const bestTrend = commonTrends.reduce((best, current) =>
            current.frequency > best.frequency ? current : best
        );
        return {
            prediction: bestTrend.prediction,
            confidence: bestTrend.confidence,
            reason: `Xu hướng phổ biến: ${bestTrend.pattern}`
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
            reason: `Kết hợp ${bestModels.length} model tốt`
        };
    }

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
                reason: `Cân bằng tổng thể`
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
                reasons.push(`${modelName}: ${prediction.reason}`);
            }
        }

        // Tích hợp Hoàng VIP
        if (this.history.length > 2) {
            const hashStr = crypto.createHash('md5').update(Date.now().toString() + this.history.length).digest('hex');
            const hvPreds = this.hoangVip.duDoanHashTiepTheo(hashStr, 3);
            if (hvPreds.length > 0) {
                let hvT = 0, hvX = 0;
                hvPreds.forEach(h => {
                    const sum = h.split('').reduce((a,b) => a + parseInt(b,16), 0);
                    const probT = 0.5 + (sum - 128) / 256 * 0.3;
                    if (probT > 0.5) hvT += probT;
                    else hvX += (1 - probT);
                });
                if (hvT > hvX) tScore += hvT * 0.8;
                else xScore += hvX * 0.8;
                reasons.push(`HoàngVIP: ${hvT > hvX ? 'T' : 'X'}`);
            }
        }

        const totalScore = tScore + xScore;
        if (totalScore === 0) return null;
        let finalPrediction = tScore > xScore ? 'T' : 'X';
        let finalConfidence = Math.max(tScore, xScore) / totalScore;
        return {
            prediction: finalPrediction,
            confidence: finalConfidence,
            reasons: reasons.slice(0, 5)
        };
    }

    addResultAndUpdate(phienId, result, dices) {
        this.addResult(result);
        return this.getFinalPrediction();
    }
}

// ============================================================
// SERVER - LUÔN TRẢ VỀ DỮ LIỆU NGAY LẬP TỨC
// ============================================================
const predictor = new UltraDicePredictionSystem();

// Tạo dự đoán mặc định ngay khi khởi động
let currentPrediction = null;

function generateDefaultPrediction() {
    const predEntry = predictor.getFinalPrediction();
    currentPrediction = {
        id: "s2king",
        phien: "demo",
        ket_qua: "tài",
        xuc_xac: "4-5-6",
        phien_moi: "demo",
        du_doan: predEntry ? (predEntry.prediction === 'T' ? 'tài' : 'xỉu') : 'chờ',
        do_tin_cay: predEntry ? Math.round(predEntry.confidence * 100) + '%' : 'N/A',
        ly_do: predEntry ? predEntry.reasons.join('; ') : 'Đang khởi tạo...',
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
}

// Tạo dự đoán mặc định
generateDefaultPrediction();

// Cập nhật từ API (chạy ngầm, không ảnh hưởng response)
const API_URL = "https://wtxmd52.tele68.com/v1/txmd5/lite-sessions?cp=R&cl=R&pf=web&at=15766f58a95cb4f95975ffcf643f524c";
let lastId = null;

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
            console.log(`[${new Date().toLocaleTimeString()}] ✅ Cập nhật phiên ${phienId} → ${result}`);
        }
    } catch (e) {
        // Lỗi API - vẫn giữ dự đoán hiện tại
        console.log(`[${new Date().toLocaleTimeString()}] ⚠️ API lỗi: ${e.message}`);
    }
}

// Chạy cập nhật lần đầu (ngầm)
setTimeout(() => {
    updateDataAndPredict();
}, 1000);

// Cập nhật mỗi 10 giây
setInterval(updateDataAndPredict, 10000);

// ============================================================
// ROUTES - LUÔN TRẢ VỀ DỮ LIỆU NGAY
// ============================================================
app.get('/predict', (req, res) => {
    res.json(currentPrediction);
});

app.get('/predict/text', (req, res) => {
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
        marketState: predictor.marketState,
        weights: predictor.weights
    };
    res.json(stats);
});

app.get('/', (req, res) => res.send('🚀 SIÊU DỰ ĐOÁN TÀI XỈU - 21 THUẬT TOÁN + HOÀNG VIP'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server chạy port ${PORT}`);
    console.log(`📊 Đã có ${predictor.history.length} phiên trong lịch sử`);
    console.log(`🔮 Dự đoán sẵn sàng: ${currentPrediction.du_doan} (${currentPrediction.do_tin_cay})`);
    console.log(`📡 Đang cập nhật từ API mỗi 10 giây...`);
});