// 你画我猜 - 游戏房间脚本

// 获取URL参数
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const playerName = urlParams.get('name');

// Canvas 绘图相关
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let lineWidth = 3;

// 初始化函数
function initializeGame() {
    // 显示房间信息
    document.getElementById('roomId').textContent = roomId || '未知';
    
    // 初始化画布
    initCanvas();
    
    // 绑定事件
    bindEvents();
    
    // 模拟玩家列表（稍后替换为真实API）
    loadMockData();
}

// 初始化画布
function initCanvas() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = currentColor;
}

// 绑定事件监听器
function bindEvents() {
    // 工具选择
    document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.tool-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
            
            if (currentTool === 'eraser') {
                ctx.globalCompositeOperation = 'destination-out';
                ctx.lineWidth = 10;
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.lineWidth = lineWidth;
                ctx.strokeStyle = currentColor;
            }
        });
    });
    
    // 颜色选择
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.color-btn.active').classList.remove('active');
            btn.classList.add('active');
            currentColor = btn.dataset.color;
            if (currentTool === 'pen') {
                ctx.strokeStyle = currentColor;
            }
        });
    });
    
    // 绘图事件
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // 回车提交猜题
    document.getElementById('guessInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitGuess();
        }
    });
}

// 绘图函数
function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

// 清空画布
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 提交画作
function submitDrawing() {
    const imageData = canvas.toDataURL('image/png');
    console.log('提交画作:', imageData.substr(0, 50) + '...');
    // TODO: 发送到服务器
    alert('画作已提交！');
}

// 提交猜题
function submitGuess() {
    const guess = document.getElementById('guessInput').value.trim();
    if (!guess) return;
    
    console.log('提交答案:', guess);
    // TODO: 发送到服务器
    
    // 模拟添加到历史
    const history = document.getElementById('guessHistory');
    const item = document.createElement('div');
    item.className = 'guess-item guess-wrong';
    item.textContent = `${playerName}: ${guess}`;
    history.appendChild(item);
    history.scrollTop = history.scrollHeight;
    
    document.getElementById('guessInput').value = '';
}

// 退出房间
function leaveRoom() {
    if (confirm('确定要退出房间吗？')) {
        window.location.href = 'index.html';
    }
}

// 加载模拟数据
function loadMockData() {
    setTimeout(() => {
        const playerList = document.getElementById('playerList');
        playerList.innerHTML = `
            <li class="player-item">
                <span class="player-name">${playerName} <span class="current-drawer">画家</span></span>
                <span class="player-score">0</span>
            </li>
            <li class="player-item">
                <span class="player-name">玩家2</span>
                <span class="player-score">0</span>
            </li>
        `;
        
        document.getElementById('gameStatus').textContent = '你来画画！';
        document.getElementById('currentWord').textContent = '苹果';
        document.getElementById('wordHint').textContent = '画出这个水果';
        document.getElementById('submitBtn').style.display = 'block';
    }, 1000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeGame); 