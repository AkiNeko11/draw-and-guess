// 你画我猜 - 服务器入口文件
const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');
const gameService = require('./services/gameService');

const app = express();
const PORT = process.env.PORT || 6000;

// 中间件配置
app.use(cors({
    origin: ['http://localhost:6000', 'http://127.0.0.1:6000', 'http://localhost:8080'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); // 支持大图片上传
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

// 静态文件服务（服务前端文件）
app.use(express.static(path.join(__dirname, '../frontend')));

// API 路由
app.use('/api', apiRoutes);

// 前端路由处理（SPA 支持）
app.get('/pages/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', req.path));
});

// 根路径重定向到欢迎页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/welcome.html'));
});

// 404 处理
app.use('*', (req, res) => {
    if (req.originalUrl.startsWith('/api/')) {
        res.status(404).json({
            ok: false,
            error: 'API endpoint not found'
        });
    } else {
        res.status(404).sendFile(path.join(__dirname, '../frontend/pages/index.html'));
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    
    if (req.originalUrl.startsWith('/api/')) {
        res.status(500).json({
            ok: false,
            error: '服务器内部错误'
        });
    } else {
        res.status(500).send('服务器内部错误');
    }
});

// 启动服务器
async function startServer() {
    try {
        // 初始化游戏服务
        await gameService.initialize();
        
        // 启动HTTP服务器
        app.listen(PORT, () => {
            console.log(`你画我猜服务器启动成功！`);
            console.log(`服务器地址: http://localhost:${PORT}`);
            console.log(`游戏入口: http://localhost:${PORT}`);
            console.log(`健康检查: http://localhost:${PORT}/api/health`);
            console.log(`系统统计: http://localhost:${PORT}/api/stats`);
            console.log('准备就绪，开始游戏吧！');
        });
    } catch (error) {
        console.error('服务器启动失败:', error);
        process.exit(1);
    }
}

// 启动服务器
startServer();

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('收到 SIGTERM 信号，正在关闭服务器...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('收到 SIGINT 信号，正在关闭服务器...');
    process.exit(0);
});

module.exports = app; 