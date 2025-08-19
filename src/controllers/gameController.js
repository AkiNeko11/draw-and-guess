// 你画我猜 - 游戏控制器
const gameService = require('../services/gameService');

class GameController {
    // 加入房间
    async joinRoom(req, res) {
        try {
            const { roomId, playerName } = req.body;
            
            if (!roomId || !playerName) {
                return res.status(400).json({
                    ok: false,
                    error: '房间号和玩家昵称不能为空'
                });
            }

            const result = await gameService.joinRoom(roomId, playerName);
            
            if (result.success) {
                res.json({
                    ok: true,
                    playerId: result.playerId,
                    roomId: result.roomId,
                    players: result.room.players,
                    state: result.room
                });
            } else {
                res.status(400).json({
                    ok: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('joinRoom error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 离开房间
    async leaveRoom(req, res) {
        try {
            const { roomId, playerId } = req.body;
            
            if (!roomId || !playerId) {
                return res.status(400).json({
                    ok: false,
                    error: '房间号和玩家ID不能为空'
                });
            }

            const result = await gameService.leaveRoom(roomId, playerId);
            
            res.json({
                ok: result.success
            });
        } catch (error) {
            console.error('leaveRoom error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 获取房间状态（轮询接口）
    async getRoomState(req, res) {
        try {
            const { roomId } = req.query;
            const since = req.query.since ? parseInt(req.query.since) : null;
            
            if (!roomId) {
                return res.status(400).json({
                    ok: false,
                    error: '房间号不能为空'
                });
            }

            const result = await gameService.getRoomState(roomId, since);
            
            if (result.success) {
                res.json({
                    ok: true,
                    room: result.room,
                    serverTime: result.serverTime
                });
            } else {
                res.status(404).json({
                    ok: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('getRoomState error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 开始新回合
    async startRound(req, res) {
        try {
            const { roomId, starterId, word } = req.body;
            
            if (!roomId || !starterId) {
                return res.status(400).json({
                    ok: false,
                    error: '房间号和出题者ID不能为空'
                });
            }

            const result = await gameService.startRound(roomId, starterId, word);
            
            if (result.success) {
                res.json({
                    ok: true,
                    roundId: result.roundId,
                    word: result.word
                });
            } else {
                res.status(400).json({
                    ok: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('startRound error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 提交画作
    async submitDrawing(req, res) {
        try {
            const { roomId, playerId, roundId, imageBase64 } = req.body;
            
            if (!roomId || !playerId || !roundId || !imageBase64) {
                return res.status(400).json({
                    ok: false,
                    error: '所有参数都不能为空'
                });
            }

            const result = await gameService.submitDrawing(roomId, playerId, roundId, imageBase64);
            
            if (result.success) {
                res.json({
                    ok: true
                });
            } else {
                res.status(400).json({
                    ok: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('submitDrawing error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 提交答案
    async submitAnswer(req, res) {
        try {
            const { roomId, playerId, roundId, answerText } = req.body;
            
            if (!roomId || !playerId || !roundId || !answerText) {
                return res.status(400).json({
                    ok: false,
                    error: '所有参数都不能为空'
                });
            }

            const result = await gameService.submitAnswer(roomId, playerId, roundId, answerText);
            
            if (result.success) {
                res.json({
                    ok: true,
                    correct: result.correct,
                    scoreDelta: result.scoreDelta
                });
            } else {
                res.status(400).json({
                    ok: false,
                    error: result.error,
                    reason: result.reason
                });
            }
        } catch (error) {
            console.error('submitAnswer error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 结束回合
    async endRound(req, res) {
        try {
            const { roomId } = req.body;
            
            if (!roomId) {
                return res.status(400).json({
                    ok: false,
                    error: '房间号不能为空'
                });
            }

            const result = await gameService.endRound(roomId);
            
            res.json({
                ok: result.success
            });
        } catch (error) {
            console.error('endRound error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 获取系统统计信息
    async getSystemStats(req, res) {
        try {
            const result = await gameService.getSystemStats();
            
            if (result.success) {
                res.json({
                    ok: true,
                    stats: result.stats
                });
            } else {
                res.status(500).json({
                    ok: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('getSystemStats error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 手动清理房间
    async cleanupRooms(req, res) {
        try {
            const result = await gameService.cleanupRooms();
            
            if (result.success) {
                res.json({
                    ok: true,
                    cleanedCount: result.cleanedCount
                });
            } else {
                res.status(500).json({
                    ok: false,
                    error: result.error
                });
            }
        } catch (error) {
            console.error('cleanupRooms error:', error);
            res.status(500).json({
                ok: false,
                error: '服务器内部错误'
            });
        }
    }

    // 健康检查
    async healthCheck(req, res) {
        res.json({
            ok: true,
            message: '你画我猜服务运行正常',
            timestamp: new Date().toISOString()
        });
    }
}

// 创建单例实例
const gameController = new GameController();

module.exports = gameController; 