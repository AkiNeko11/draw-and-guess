// 你画我猜 - API 路由
const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

// 健康检查
router.get('/health', gameController.healthCheck);

// 房间管理
router.post('/join-room', gameController.joinRoom);
router.post('/leave-room', gameController.leaveRoom);

// 游戏状态轮询
router.get('/state', gameController.getRoomState);

// 游戏流程
router.post('/start-round', gameController.startRound);
router.post('/post-drawing', gameController.submitDrawing);
router.post('/submit-answer', gameController.submitAnswer);
router.post('/end-round', gameController.endRound);

// 系统管理
router.get('/stats', gameController.getSystemStats);
router.post('/cleanup', gameController.cleanupRooms);

module.exports = router; 