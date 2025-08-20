// 你画我猜 - 主页脚本

// API 基础配置
const API_BASE = '/api';

function showError(message) {
    const errorDiv = document.getElementById('errorMsg');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

function generateRoomId() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function updateCreateRoomButton() {
    const playerName = document.getElementById('playerName').value.trim();
    const createBtn = document.querySelector('.btn-secondary');
    
    if (playerName) {
        createBtn.classList.add('enabled');
        createBtn.textContent = '➕ 创建新房间';
    } else {
        createBtn.classList.remove('enabled');
        createBtn.textContent = '➕ 创建房间';
    }
}

// 加入房间（连接后端 API）
async function joinGame() {
    const playerName = document.getElementById('playerName').value.trim();
    const roomId = document.getElementById('roomId').value.trim();
    
    if (!playerName) {
        showError('请输入你的昵称');
        return;
    }
    
    if (!roomId) {
        showError('请输入房间号或点击创建房间');
        return;
    }

    try {
        // 显示加载状态
        const joinBtn = document.querySelector('.btn');
        const originalText = joinBtn.textContent;
        joinBtn.textContent = '🔄 正在加入...';
        joinBtn.disabled = true;

        // 调用后端 API 加入房间
        const response = await fetch(`${API_BASE}/join-room`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomId: roomId,
                playerName: playerName
            })
        });

        const result = await response.json();

        if (result.ok) {
            // 成功加入房间，存储玩家信息并跳转
            localStorage.setItem('gameData', JSON.stringify({
                playerId: result.playerId,
                playerName: playerName,
                roomId: result.roomId
            }));

            // 跳转到游戏页面
            window.location.href = `game.html?room=${encodeURIComponent(roomId)}&name=${encodeURIComponent(playerName)}`;
        } else {
            showError(result.error || '加入房间失败');
        }
    } catch (error) {
        console.error('加入房间错误:', error);
        showError('网络错误，请检查服务器连接');
    } finally {
        // 恢复按钮状态
        const joinBtn = document.querySelector('.btn');
        joinBtn.textContent = originalText;
        joinBtn.disabled = false;
    }
}

async function createRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        showError('请先输入你的昵称');
        return;
    }
    
    // 生成新房间号并填入
    const newRoomId = generateRoomId();
    document.getElementById('roomId').value = newRoomId;
    
    // 直接调用加入房间逻辑
    await joinGame();
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', function() {
    const playerNameInput = document.getElementById('playerName');
    
    // 监听昵称输入变化
    playerNameInput.addEventListener('input', updateCreateRoomButton);
    
    // 初始化按钮状态
    updateCreateRoomButton();

    // 清理之前的游戏数据
    localStorage.removeItem('gameData');
});

// 回车键支持
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        joinGame();
    }
}); 