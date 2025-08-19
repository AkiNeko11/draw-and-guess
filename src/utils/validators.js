// 你画我猜 - 工具函数
class Validators {
    // 验证房间ID格式
    static isValidRoomId(roomId) {
        if (!roomId || typeof roomId !== 'string') {
            return false;
        }
        // 6位大写字母数字组合
        return /^[A-Z0-9]{6}$/.test(roomId);
    }

    // 验证玩家名称
    static isValidPlayerName(name) {
        if (!name || typeof name !== 'string') {
            return false;
        }
        const trimmed = name.trim();
        // 1-20个字符，不能只有空白
        return trimmed.length >= 1 && trimmed.length <= 20;
    }

    // 验证玩家ID格式
    static isValidPlayerId(playerId) {
        if (!playerId || typeof playerId !== 'string') {
            return false;
        }
        // player_时间戳_随机字符串 格式
        return /^player_\d+_[a-z0-9]+$/.test(playerId);
    }

    // 验证回合ID格式
    static isValidRoundId(roundId) {
        if (!roundId || typeof roundId !== 'string') {
            return false;
        }
        // round_时间戳 格式
        return /^round_\d+$/.test(roundId);
    }

    // 验证图片数据格式
    static isValidImageData(imageData) {
        if (!imageData || typeof imageData !== 'string') {
            return false;
        }
        // 必须是 data:image/ 开头的 base64 格式
        return /^data:image\/(png|jpeg|jpg|gif|webp);base64,/.test(imageData);
    }

    // 验证答案文本
    static isValidAnswerText(text) {
        if (!text || typeof text !== 'string') {
            return false;
        }
        const trimmed = text.trim();
        // 1-50个字符
        return trimmed.length >= 1 && trimmed.length <= 50;
    }

    // 清理和标准化输入
    static sanitizeInput(input) {
        if (typeof input !== 'string') {
            return '';
        }
        return input.trim().replace(/\s+/g, ' '); // 合并多个空格为一个
    }

    // 生成安全的随机字符串
    static generateRandomString(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // 检查文本相似度（用于答案匹配）
    static calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        
        if (s1 === s2) return 1.0;
        
        // 简单的编辑距离计算
        const longer = s1.length > s2.length ? s1 : s2;
        const shorter = s1.length > s2.length ? s2 : s1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    // 计算编辑距离
    static levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    // 检查答案是否正确（支持模糊匹配）
    static isCorrectAnswer(userAnswer, correctAnswer, fuzzyMatch = false) {
        const user = this.sanitizeInput(userAnswer).toLowerCase();
        const correct = this.sanitizeInput(correctAnswer).toLowerCase();
        
        // 完全匹配
        if (user === correct) {
            return true;
        }
        
        // 模糊匹配（相似度 > 0.8）
        if (fuzzyMatch) {
            return this.calculateSimilarity(user, correct) > 0.8;
        }
        
        return false;
    }

    // 格式化时间戳为可读格式
    static formatTimestamp(timestamp) {
        return new Date(timestamp).toLocaleString('zh-CN');
    }

    // 计算时间差（秒）
    static getTimeDifferenceInSeconds(start, end = Date.now()) {
        return Math.floor((end - start) / 1000);
    }

    // 限制字符串长度
    static truncateString(str, maxLength, suffix = '...') {
        if (!str || str.length <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength - suffix.length) + suffix;
    }

    // 检查对象是否为空
    static isEmpty(obj) {
        if (obj == null) return true;
        if (Array.isArray(obj) || typeof obj === 'string') {
            return obj.length === 0;
        }
        return Object.keys(obj).length === 0;
    }

    // 深拷贝对象
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (Array.isArray(obj)) {
            return obj.map(item => this.deepClone(item));
        }
        
        const cloned = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        
        return cloned;
    }
}

module.exports = Validators; 