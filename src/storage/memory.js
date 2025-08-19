// 你画我猜 - JSON 文件存储模块
const fs = require('fs').promises;
const path = require('path');

class JsonStorage {
    constructor() {
        this.storageDir = path.join(__dirname, 'rooms');
        this.cleanupInterval = 30 * 60 * 1000; // 30分钟清理一次
        this.roomTimeout = 30 * 60 * 1000; // 房间30分钟无活动则清理
        
        // 初始化存储目录
        this.initStorage();
        
        // 启动定时清理
        this.startCleanupTimer();
    }

    // 初始化存储目录
    async initStorage() {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
            console.log('JSON 存储目录已创建:', this.storageDir);
        } catch (error) {
            console.error('创建存储目录失败:', error);
        }
    }

    // 获取房间文件路径
    getRoomFilePath(roomId) {
        return path.join(this.storageDir, `${roomId}.json`);
    }

    // 读取房间数据
    async readRoom(roomId) {
        try {
            const filePath = this.getRoomFilePath(roomId);
            const data = await fs.readFile(filePath, 'utf-8');
            const room = JSON.parse(data);
            
            // 转换 Map 数据结构
            room.players = new Map(room.players || []);
            room.scores = new Map(room.scores || []);
            if (room.currentRound && room.currentRound.answers) {
                room.currentRound.answers = new Map(room.currentRound.answers || []);
            }
            
            return room;
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // 文件不存在
            }
            console.error(`读取房间 ${roomId} 失败:`, error);
            return null;
        }
    }

    // 写入房间数据
    async writeRoom(roomId, room) {
        try {
            const filePath = this.getRoomFilePath(roomId);
            
            // 转换 Map 为数组以便 JSON 序列化
            const dataToSave = {
                ...room,
                players: Array.from(room.players.entries()),
                scores: Array.from(room.scores.entries()),
                currentRound: room.currentRound ? {
                    ...room.currentRound,
                    answers: Array.from(room.currentRound.answers.entries())
                } : null
            };
            
            await fs.writeFile(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
            return true;
        } catch (error) {
            console.error(`写入房间 ${roomId} 失败:`, error);
            return false;
        }
    }

    // 删除房间文件
    async deleteRoomFile(roomId) {
        try {
            const filePath = this.getRoomFilePath(roomId);
            await fs.unlink(filePath);
            console.log(`房间文件 ${roomId}.json 已删除`);
            return true;
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`删除房间文件 ${roomId} 失败:`, error);
            }
            return false;
        }
    }

    // 创建房间数据结构
    createRoom(roomId) {
        const room = {
            roomId,
            players: new Map(),
            stage: 'idle', // idle, drawing, guessing, finished
            currentRound: null,
            scores: new Map(),
            gameHistory: [],
            createdAt: Date.now(),
            lastActivity: Date.now()
        };
        
        console.log(`房间 ${roomId} 已创建`);
        return room;
    }

    // 获取房间
    async getRoom(roomId) {
        return await this.readRoom(roomId);
    }

    // 获取或创建房间
    async getOrCreateRoom(roomId) {
        let room = await this.getRoom(roomId);
        if (!room) {
            room = this.createRoom(roomId);
            await this.writeRoom(roomId, room);
        }
        return room;
    }

    // 更新房间活动时间
    async updateRoomActivity(roomId) {
        const room = await this.getRoom(roomId);
        if (room) {
            room.lastActivity = Date.now();
            await this.writeRoom(roomId, room);
        }
    }

    // 玩家加入房间
    async addPlayer(roomId, playerId, playerName) {
        const room = await this.getOrCreateRoom(roomId);
        
        const player = {
            id: playerId,
            name: playerName,
            score: 0,
            joinTime: Date.now()
        };
        
        room.players.set(playerId, player);
        room.scores.set(playerId, 0);
        room.lastActivity = Date.now();
        
        await this.writeRoom(roomId, room);
        console.log(`玩家 ${playerName} 加入房间 ${roomId}`);
        return room;
    }

    // 玩家离开房间
    async removePlayer(roomId, playerId) {
        const room = await this.getRoom(roomId);
        if (!room) return false;
        
        const removed = room.players.delete(playerId);
        room.scores.delete(playerId);
        room.lastActivity = Date.now();
        
        await this.writeRoom(roomId, room);
        
        // 如果房间没人了，延迟删除房间
        if (room.players.size === 0) {
            setTimeout(async () => {
                await this.deleteRoom(roomId);
            }, 5000); // 5秒后删除空房间
        }
        
        console.log(`玩家 ${playerId} 离开房间 ${roomId}`);
        return removed;
    }

    // 开始新回合
    async startRound(roomId, drawerId, word) {
        const room = await this.getRoom(roomId);
        if (!room) return null;
        
        const round = {
            roundId: `round_${Date.now()}`,
            drawerId,
            word,
            imageData: null,
            answers: new Map(),
            startTime: Date.now(),
            endTime: null
        };
        
        room.currentRound = round;
        room.stage = 'drawing';
        room.lastActivity = Date.now();
        
        await this.writeRoom(roomId, room);
        console.log(`房间 ${roomId} 开始新回合，画家: ${drawerId}, 题目: ${word}`);
        return round;
    }

    // 提交画作
    async submitDrawing(roomId, playerId, imageData) {
        const room = await this.getRoom(roomId);
        if (!room || !room.currentRound || room.currentRound.drawerId !== playerId) {
            return false;
        }
        
        room.currentRound.imageData = imageData;
        room.stage = 'guessing';
        room.lastActivity = Date.now();
        
        await this.writeRoom(roomId, room);
        console.log(`房间 ${roomId} 收到画作提交`);
        return true;
    }

    // 提交答案
    async submitAnswer(roomId, playerId, answerText) {
        const room = await this.getRoom(roomId);
        if (!room || !room.currentRound || room.stage !== 'guessing') {
            return { success: false, reason: 'invalid_state' };
        }
        
        const round = room.currentRound;
        const isCorrect = answerText.toLowerCase().trim() === round.word.toLowerCase().trim();
        
        const answer = {
            text: answerText,
            correct: isCorrect,
            timestamp: Date.now()
        };
        
        round.answers.set(playerId, answer);
        room.lastActivity = Date.now();
        
        // 如果答对了，加分
        if (isCorrect) {
            const currentScore = room.scores.get(playerId) || 0;
            room.scores.set(playerId, currentScore + 1);
            
            // 画家也得分
            const drawerScore = room.scores.get(round.drawerId) || 0;
            room.scores.set(round.drawerId, drawerScore + 1);
            
            console.log(`房间 ${roomId} 玩家 ${playerId} 答对了！`);
        }
        
        await this.writeRoom(roomId, room);
        
        return {
            success: true,
            correct: isCorrect,
            scoreDelta: isCorrect ? 1 : 0
        };
    }

    // 结束当前回合
    async endRound(roomId) {
        const room = await this.getRoom(roomId);
        if (!room || !room.currentRound) return false;
        
        room.currentRound.endTime = Date.now();
        room.gameHistory.push({ ...room.currentRound });
        room.currentRound = null;
        room.stage = 'idle';
        room.lastActivity = Date.now();
        
        await this.writeRoom(roomId, room);
        console.log(`房间 ${roomId} 回合结束`);
        return true;
    }

    // 获取房间完整状态
    async getRoomState(roomId) {
        const room = await this.getRoom(roomId);
        if (!room) return null;
        
        // 更新活动时间
        room.lastActivity = Date.now();
        await this.writeRoom(roomId, room);
        
        return {
            roomId: room.roomId,
            players: Array.from(room.players.values()),
            scores: Object.fromEntries(room.scores),
            stage: room.stage,
            currentRound: room.currentRound ? {
                roundId: room.currentRound.roundId,
                drawerId: room.currentRound.drawerId,
                word: room.currentRound.word,
                imageData: room.currentRound.imageData,
                answers: Array.from(room.currentRound.answers.entries()).map(([playerId, answer]) => ({
                    playerId,
                    ...answer
                })),
                startTime: room.currentRound.startTime
            } : null,
            lastActivity: room.lastActivity,
            serverTime: Date.now()
        };
    }

    // 删除房间
    async deleteRoom(roomId) {
        await this.deleteRoomFile(roomId);
        console.log(`房间 ${roomId} 已删除`);
        return true;
    }

    // 获取所有房间文件列表
    async getAllRoomFiles() {
        try {
            const files = await fs.readdir(this.storageDir);
            return files.filter(file => file.endsWith('.json'));
        } catch (error) {
            console.error('读取房间目录失败:', error);
            return [];
        }
    }

    // 清理过期房间
    async cleanupExpiredRooms() {
        const now = Date.now();
        let cleanedCount = 0;
        
        const roomFiles = await this.getAllRoomFiles();
        
        for (const file of roomFiles) {
            const roomId = path.basename(file, '.json');
            const room = await this.readRoom(roomId);
            
            if (room && (now - room.lastActivity > this.roomTimeout)) {
                await this.deleteRoom(roomId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`清理了 ${cleanedCount} 个过期房间`);
        }
        
        return cleanedCount;
    }

    // 启动定时清理
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupExpiredRooms();
        }, this.cleanupInterval);
        
        console.log('JSON 存储模块已启动，定时清理已开启');
    }

    // 获取统计信息
    async getStats() {
        const roomFiles = await this.getAllRoomFiles();
        let totalPlayers = 0;
        let activeRooms = 0;
        
        for (const file of roomFiles) {
            const roomId = path.basename(file, '.json');
            const room = await this.readRoom(roomId);
            if (room) {
                totalPlayers += room.players.size;
                if (room.players.size > 0) {
                    activeRooms++;
                }
            }
        }
        
        return {
            totalRooms: roomFiles.length,
            activeRooms,
            totalPlayers,
            storageDir: this.storageDir
        };
    }
}

// 创建单例实例
const jsonStorage = new JsonStorage();

module.exports = jsonStorage;
