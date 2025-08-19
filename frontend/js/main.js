// 你画我猜 - 主页脚本
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
    } else {
        createBtn.classList.remove('enabled');
    }
}

function joinGame() {
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
    
    // 跳转到游戏页面，传递参数
    window.location.href = `game.html?room=${encodeURIComponent(roomId)}&name=${encodeURIComponent(playerName)}`;
}

function createRoom() {
    const playerName = document.getElementById('playerName').value.trim();
    
    if (!playerName) {
        showError('请先输入你的昵称');
        return;
    }
    
    const newRoomId = generateRoomId();
    document.getElementById('roomId').value = newRoomId;
    
    // 自动跳转
    setTimeout(() => {
        joinGame();
    }, 500);
}

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', function() {
    const playerNameInput = document.getElementById('playerName');
    
    // 监听昵称输入变化
    playerNameInput.addEventListener('input', updateCreateRoomButton);
    
    // 初始化按钮状态
    updateCreateRoomButton();
});

// 回车键支持
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        joinGame();
    }
}); 