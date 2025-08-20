// 你画我猜 - 游戏服务层
const storage = require('../storage/memory');

class GameService {
    constructor() {
        this.words = [
            '苹果', '香蕉', '汽车', '飞机', '房子', '太阳', '月亮', '星星',
            '猫咪', '小狗', '鱼儿', '鸟儿', '树木', '花朵', '蝴蝶', '蜜蜂',
            '电脑', '手机', '书本', '铅笔', '杯子', '桌子', '椅子', '床铺',
            '雨伞', '帽子', '眼镜', '手表', '钥匙', '钱包', '背包', '鞋子'
        ];
    }

    // 初始化服务（服务器启动时调用）
    async initialize() {
        console.log('🧹 正在清理遗留的空房间...');
        await storage.cleanupEmptyRooms();
        console.log('✅ 游戏服务初始化完成');
    }

    // 生成玩家ID
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // 生成房间ID
    generateRoomId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // 随机选择题目
    getRandomWord() {
        return this.words[Math.floor(Math.random() * this.words.length)];
    }

    // 玩家加入房间
    async joinRoom(roomId, playerName) {
        try {
            if (!roomId || !playerName) {
                return { success: false, error: 'roomId and playerName are required' };
            }

            const playerId = this.generatePlayerId();
            const room = await storage.addPlayer(roomId, playerId, playerName.trim());

            return {
                success: true,
                playerId,
                roomId,
                room: this.formatRoomForClient(room, playerId)
            };
        } catch (error) {
            console.error('加入房间失败:', error);
            return { success: false, error: '加入房间失败' };
        }
    }

    // 玩家离开房间
    async leaveRoom(roomId, playerId) {
        try {
            if (!roomId || !playerId) {
                return { success: false, error: 'roomId and playerId are required' };
            }

            const result = await storage.removePlayer(roomId, playerId);
            return { success: result };
        } catch (error) {
            console.error('离开房间失败:', error);
            return { success: false, error: '离开房间失败' };
        }
    }

    // 获取房间状态
    async getRoomState(roomId, requestingPlayerId = null, since = null) {
        try {
            if (!roomId) {
                return { success: false, error: 'roomId is required' };
            }

            const roomState = await storage.getRoomState(roomId);
            if (!roomState) {
                return { success: false, error: 'Room not found' };
            }

            // 如果提供了since参数，可以在这里做增量更新优化
            return {
                success: true,
                room: this.formatRoomForClient(roomState, requestingPlayerId),
                serverTime: Date.now()
            };
        } catch (error) {
            console.error('获取房间状态失败:', error);
            return { success: false, error: '获取房间状态失败' };
        }
    }

    // 开始新回合
    async startRound(roomId, starterId, word = null) {
        try {
            if (!roomId || !starterId) {
                return { success: false, error: 'roomId and starterId are required' };
            }

            // 如果没有提供题目，随机选择一个
            const selectedWord = word || this.getRandomWord();

            const round = await storage.startRound(roomId, starterId, selectedWord);
            if (!round) {
                return { success: false, error: 'Failed to start round' };
            }

            return {
                success: true,
                roundId: round.roundId,
                word: selectedWord // 只返回给出题者
            };
        } catch (error) {
            console.error('开始回合失败:', error);
            return { success: false, error: '开始回合失败' };
        }
    }

    // 提交画作
    async submitDrawing(roomId, playerId, roundId, imageBase64) {
        try {
            if (!roomId || !playerId || !roundId || !imageBase64) {
                return { success: false, error: 'All parameters are required' };
            }

            // 验证图片格式
            if (!imageBase64.startsWith('data:image/')) {
                return { success: false, error: 'Invalid image format' };
            }

            const result = await storage.submitDrawing(roomId, playerId, imageBase64);
            if (!result) {
                return { success: false, error: 'Failed to submit drawing' };
            }

            return { success: true };
        } catch (error) {
            console.error('提交画作失败:', error);
            return { success: false, error: '提交画作失败' };
        }
    }

    // 提交答案
    async submitAnswer(roomId, playerId, roundId, answerText) {
        try {
            if (!roomId || !playerId || !roundId || !answerText) {
                return { success: false, error: 'All parameters are required' };
            }

            const result = await storage.submitAnswer(roomId, playerId, answerText.trim());
            return result;
        } catch (error) {
            console.error('提交答案失败:', error);
            return { success: false, error: '提交答案失败' };
        }
    }

    // 结束回合
    async endRound(roomId) {
        try {
            if (!roomId) {
                return { success: false, error: 'roomId is required' };
            }

            const result = await storage.endRound(roomId);
            return { success: result };
        } catch (error) {
            console.error('结束回合失败:', error);
            return { success: false, error: '结束回合失败' };
        }
    }

    // 获取下一个画家
    getNextDrawer(room) {
        const players = Array.from(room.players.values());
        if (players.length === 0) return null;

        // 如果没有当前回合，选择第一个玩家
        if (!room.currentRound) {
            return players[0].id;
        }

        // 找到当前画家在列表中的位置，选择下一个
        const currentIndex = players.findIndex(p => p.id === room.currentRound.drawerId);
        const nextIndex = (currentIndex + 1) % players.length;
        return players[nextIndex].id;
    }

    // 检查游戏是否可以开始
    canStartGame(room) {
        return room.players.size >= 2 && room.stage === 'idle';
    }

    // 格式化房间数据供客户端使用
    formatRoomForClient(room, requestingPlayerId = null) {
        const formatted = {
            roomId: room.roomId,
            players: room.players || [],
            scores: room.scores || {},
            stage: room.stage,
            lastActivity: room.lastActivity,
            serverTime: Date.now()
        };

        // 处理当前回合信息
        if (room.currentRound) {
            formatted.currentRound = {
                roundId: room.currentRound.roundId,
                drawerId: room.currentRound.drawerId,
                startTime: room.currentRound.startTime,
                answers: room.currentRound.answers || []
            };

            // 只在猜题阶段返回画作
            if (room.stage === 'guessing' && room.currentRound.imageData) {
                formatted.currentRound.imageData = room.currentRound.imageData;
            }

            // 返回题目的条件：
            // 1. 游戏结束时所有人都能看到
            // 2. 绘画阶段和猜题阶段，只有画家能看到
            if (room.stage === 'finished' || 
                (requestingPlayerId && requestingPlayerId === room.currentRound.drawerId)) {
                formatted.currentRound.word = room.currentRound.word;
            }
        }

        return formatted;
    }

    // 获取系统统计信息
    async getSystemStats() {
        try {
            const stats = await storage.getStats();
            return {
                success: true,
                stats: {
                    ...stats,
                    wordsCount: this.words.length,
                    version: '1.0.0'
                }
            };
        } catch (error) {
            console.error('获取统计信息失败:', error);
            return { success: false, error: '获取统计信息失败' };
        }
    }

    // 清理过期房间（手动触发）
    async cleanupRooms() {
        try {
            const count = await storage.cleanupExpiredRooms();
            return { success: true, cleanedCount: count };
        } catch (error) {
            console.error('清理房间失败:', error);
            return { success: false, error: '清理房间失败' };
        }
    }
}

// 创建单例实例
const gameService = new GameService();

module.exports = gameService; 