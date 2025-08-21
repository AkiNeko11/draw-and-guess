// 你画我猜 - 游戏房间脚本

// API 基础配置
const API_BASE = '/api';

// 获取URL参数和本地存储的游戏数据
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('room');
const playerName = urlParams.get('name');

// 游戏相关变量
let gameData = null;
let isDrawer = false;
let currentRound = null;
let currentPlayers = [];
let isReady = false; // 添加准备状态变量

// 画布相关变量
let canvas, ctx;
let isDrawing = false;
let currentTool = 'pen';
let currentColor = '#000000';
let lineWidth = 3;
let hasInitializedCanvas = false;

// 轮询相关
let pollInterval = null;

// 初始化函数
async function initializeGame() {
    console.log('初始化游戏...');
    
    // 从本地存储获取完整游戏数据
    try {
        gameData = JSON.parse(localStorage.getItem('gameData'));
    } catch (e) {
        console.warn('无法获取游戏数据:', e);
    }
    
    // 如果没有游戏数据，返回主页
    if (!gameData || !gameData.playerId) {
        console.warn('缺少游戏数据，返回主页');
        window.location.href = 'index.html';
        return;
    }
    
    // 初始化画布
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    
    // 更新页面显示
    document.getElementById('roomId').textContent = gameData.roomId;
    
    // 初始化画布
    initCanvas();
    
    // 绑定事件
    bindEvents();
    
    // 初始化绘图工具状态
    updateDrawingToolsState();
    
    // 开始轮询房间状态
    startPolling();
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
            if (!isDrawer) return; // 只有画家才能选择工具
            
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
            if (!isDrawer) return; // 只有画家才能选择颜色
            
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
    if (!isDrawer) return; // 只有画家才能画画
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
    if (!isDrawing || !isDrawer) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

// 清空画布
function clearCanvas() {
    if (!isDrawer) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 更新绘图工具状态
function updateDrawingToolsState() {
    const toolBtns = document.querySelectorAll('.tool-btn[data-tool]');
    const colorBtns = document.querySelectorAll('.color-btn');
    const clearBtn = document.querySelector('[onclick="clearCanvas()"]');
    
    if (isDrawer) {
        // 画家 - 启用所有工具
        toolBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        colorBtns.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        });
        if (clearBtn) {
            clearBtn.disabled = false;
            clearBtn.style.opacity = '1';
            clearBtn.style.cursor = 'pointer';
        }
    } else {
        // 非画家 - 禁用所有工具
        toolBtns.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.3';
            btn.style.cursor = 'not-allowed';
        });
        colorBtns.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.3';
            btn.style.cursor = 'not-allowed';
        });
        if (clearBtn) {
            clearBtn.disabled = true;
            clearBtn.style.opacity = '0.3';
            clearBtn.style.cursor = 'not-allowed';
        }
    }
}

// 切换准备状态
async function toggleReady() {
    try {
        const response = await fetch(`${API_BASE}/toggle-ready`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomId: gameData.roomId,
                playerId: gameData.playerId
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            isReady = result.isReady;
            
            // 更新按钮状态
            const readyBtn = document.getElementById('readyBtn');
            if (isReady) {
                readyBtn.textContent = '❌ 取消准备';
                readyBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #e74c3c)';
            } else {
                readyBtn.textContent = '✅ 准备';
                readyBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            }
            
            // 显示准备状态信息
            updateGameStatus(`准备状态: ${result.readyCount}/${result.totalPlayers} 名玩家已准备`);
            
            // 如果游戏自动开始了
            if (result.gameStarted) {
                currentRound = {
                    roundId: result.roundId,
                    drawerId: result.drawerId,
                    word: result.drawerId === gameData.playerId ? result.word : null
                };
                
                isDrawer = result.drawerId === gameData.playerId;
                readyBtn.style.display = 'none';
                
                // 清空画布
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hasInitializedCanvas = true;
                
                if (isDrawer) {
                    updateGameStatus('游戏开始！你来画画 🎨');
                } else {
                    updateGameStatus('游戏开始！等待画家作画...');
                }
            }
        } else {
            alert('操作失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('切换准备状态错误:', error);
        alert('网络错误，操作失败');
    }
}

// 结束当前回合
async function endCurrentRound() {
    if (!isDrawer || !currentRound) return;
    
    if (!confirm('确定要结束当前回合吗？回合结束后将显示正确答案。')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/end-round`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomId: gameData.roomId
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            updateGameStatus('回合已结束！');
        } else {
            alert('结束回合失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('结束回合错误:', error);
        alert('网络错误，结束回合失败');
    }
}

// 提交画作
async function submitDrawing() {
    if (!isDrawer || !currentRound) return;

    try {
        const imageData = canvas.toDataURL('image/png');
        
        const response = await fetch(`${API_BASE}/post-drawing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomId: gameData.roomId,
                playerId: gameData.playerId,
                roundId: currentRound.roundId,
                imageBase64: imageData
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn.textContent.includes('重新提交')) {
                updateGameStatus('画作已重新提交！继续修改或等待猜题结果');
            } else {
                updateGameStatus('画作已提交！其他玩家开始猜题了，你还可以继续修改');
            }
        } else {
            alert('提交失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('提交画作错误:', error);
        alert('网络错误，提交失败');
    }
}

// 提交猜题
async function submitGuess() {
    const guess = document.getElementById('guessInput').value.trim();
    if (!guess || !currentRound || isDrawer) return;
    
    try {
        const response = await fetch(`${API_BASE}/submit-answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                roomId: gameData.roomId,
                playerId: gameData.playerId,
                roundId: currentRound.roundId,
                answerText: guess
            })
        });

        const result = await response.json();
        
        if (result.ok) {
            document.getElementById('guessInput').value = '';
            
            if (result.correct) {
                addGuessToHistory(playerName, guess, true);
                updateGameStatus('恭喜你答对了！🎉');
            } else {
                addGuessToHistory(playerName, guess, false);
            }
        } else {
            alert('提交失败: ' + (result.error || '未知错误'));
        }
    } catch (error) {
        console.error('提交答案错误:', error);
        alert('网络错误，提交失败');
    }
}

// 开始轮询房间状态
function startPolling() {
    // 立即获取一次状态
    pollRoomState();
    
    // 每3秒轮询一次
    pollInterval = setInterval(pollRoomState, 3000);
}

// 轮询房间状态
async function pollRoomState() {
    try {
        const response = await fetch(`${API_BASE}/state?roomId=${encodeURIComponent(gameData.roomId)}&playerId=${encodeURIComponent(gameData.playerId)}`);
        const result = await response.json();
        
        if (result.ok) {
            updateGameState(result.room);
        } else {
            console.error('获取房间状态失败:', result.error);
            if (result.error === 'Room not found') {
                alert('房间不存在或已被删除');
                window.location.href = 'index.html';
            }
        }
    } catch (error) {
        console.error('轮询状态错误:', error);
    }
}

// 更新游戏状态
function updateGameState(room) {
    // 更新玩家列表
    updatePlayerList(room.players, room.scores, room.readyPlayers);
    
    // 更新当前回合
    if (room.currentRound) {
        const wasDrawer = isDrawer;
        const previousRoundId = currentRound ? currentRound.roundId : null;
        
        currentRound = room.currentRound;
        isDrawer = currentRound.drawerId === gameData.playerId;
        
        // 如果是新回合或者角色发生变化，重置画布初始化状态
        if (previousRoundId !== currentRound.roundId || wasDrawer !== isDrawer) {
            hasInitializedCanvas = false;
        }
        
        // 隐藏准备按钮
        document.getElementById('readyBtn').style.display = 'none';
        
        // 更新界面状态
        updateRoundState(room.stage);
        
        // 显示画作逻辑：
        // 1. 非画家始终更新画布
        // 2. 画家只在首次进入回合时更新画布（如果有现有画作）
        if (room.currentRound.imageData) {
            if (!isDrawer) {
                // 非画家始终显示最新画作
                displayDrawing(room.currentRound.imageData);
            } else if (!hasInitializedCanvas) {
                // 画家首次进入，加载现有画作（如果有）
                displayDrawing(room.currentRound.imageData);
                hasInitializedCanvas = true;
            }
            // 画家在已初始化后不再被覆盖
        }
        
        // 更新答案历史
        updateGuessHistory(room.currentRound.answers);
    } else {
        // 空闲状态
        currentRound = null;
        isDrawer = false;
        hasInitializedCanvas = false;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 重置界面
        document.getElementById('currentWord').textContent = '等待开始...';
        document.getElementById('wordHint').textContent = '等待所有玩家准备';
        document.getElementById('submitBtn').style.display = 'none';
        document.getElementById('endBtn').style.display = 'none';
        document.getElementById('guessInput').disabled = true;
        document.querySelector('.guess-btn').disabled = true;
        
        // 显示准备按钮（如果房间有至少2个玩家）
        if (room.players.length >= 2) {
            const readyBtn = document.getElementById('readyBtn');
            readyBtn.style.display = 'block';
            
            // 更新按钮状态
            const myId = gameData.playerId;
            isReady = room.readyPlayers.includes(myId);
            
            if (isReady) {
                readyBtn.textContent = '❌ 取消准备';
                readyBtn.style.background = 'linear-gradient(45deg, #ff6b6b, #e74c3c)';
            } else {
                readyBtn.textContent = '✅ 准备';
                readyBtn.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
            }
            
            const readyCount = room.readyPlayers.length;
            const totalPlayers = room.players.length;
            updateGameStatus(`准备中... (${readyCount}/${totalPlayers} 名玩家已准备)`);
        } else {
            document.getElementById('readyBtn').style.display = 'none';
            updateGameStatus('等待更多玩家加入（至少需要2人）...');
        }
        
        // 清空猜题历史
        document.getElementById('guessHistory').innerHTML = '<div class="guess-item">等待游戏开始...</div>';
    }
    
    // 更新绘图工具状态
    updateDrawingToolsState();
}

// 更新玩家列表
function updatePlayerList(players, scores, readyPlayers = []) {
    // 保存当前玩家列表供其他函数使用
    currentPlayers = players;
    
    const playerList = document.getElementById('playerList');
    
    playerList.innerHTML = players.map(player => {
        const isCurrentDrawer = currentRound && currentRound.drawerId === player.id;
        const isPlayerReady = readyPlayers.includes(player.id);
        const readyStatus = isPlayerReady ? '<span class="ready-status">✅</span>' : '<span class="ready-status">⏳</span>';
        
        return `
        <li class="player-item">
            <span class="player-name">
                ${player.name}
                ${isCurrentDrawer ? '<span class="current-drawer">🎨 画家</span>' : ''}
                ${currentRound ? '' : readyStatus}
            </span>
            <span class="player-score">${scores[player.id] || 0}</span>
        </li>
    `}).join('');
}

// 更新回合状态
function updateRoundState(stage) {
    const submitBtn = document.getElementById('submitBtn');
    const guessInput = document.getElementById('guessInput');
    const guessBtn = document.querySelector('.guess-btn');
    const endBtn = document.getElementById('endBtn');
    
    if (isDrawer) {
        // 画家视角
        document.getElementById('currentWord').textContent = currentRound.word || '等待题目...';
        document.getElementById('wordHint').textContent = '请画出这个词语';
        
        if (stage === 'drawing') {
            submitBtn.style.display = 'block';
            submitBtn.textContent = '📤 提交画作';
            endBtn.style.display = 'none';
            updateGameStatus('你来画画！开始创作吧 🎨');
        } else if (stage === 'guessing') {
            // 猜题阶段，画家可以继续修改画作
            submitBtn.style.display = 'block';
            submitBtn.textContent = '🔄 重新提交画作';
            endBtn.style.display = 'block';
            updateGameStatus('其他玩家正在猜题，你可以继续修改画作');
        } else {
            submitBtn.style.display = 'none';
            endBtn.style.display = 'none';
            updateGameStatus('等待其他玩家猜题...');
        }
        
        guessInput.disabled = true;
        guessBtn.disabled = true;
    } else {
        // 猜题者视角
        document.getElementById('currentWord').textContent = '？？？';
        endBtn.style.display = 'none';
        
        if (stage === 'drawing') {
            document.getElementById('wordHint').textContent = '画家正在创作中...';
            updateGameStatus('等待画家完成画作...');
            guessInput.disabled = true;
            guessBtn.disabled = true;
        } else if (stage === 'guessing') {
            document.getElementById('wordHint').textContent = '看图猜词语！';
            updateGameStatus('快来猜猜画的是什么！🤔');
            guessInput.disabled = false;
            guessBtn.disabled = false;
        }
    }
}

// 显示画作
function displayDrawing(imageData) {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
}

// 更新游戏状态文本
function updateGameStatus(message) {
    document.getElementById('gameStatus').textContent = message;
}

// 添加猜题到历史
function addGuessToHistory(name, guess, correct) {
    const history = document.getElementById('guessHistory');
    const item = document.createElement('div');
    item.className = `guess-item ${correct ? 'guess-correct' : 'guess-wrong'}`;
    item.textContent = `${name}: ${guess}`;
    history.appendChild(item);
    history.scrollTop = history.scrollHeight;
}

// 更新猜题历史
function updateGuessHistory(answers) {
    const history = document.getElementById('guessHistory');
    history.innerHTML = '';
    
    if (answers && answers.length > 0) {
        answers.forEach(answer => {
            const playerName = getPlayerNameById(answer.playerId);
            addGuessToHistory(playerName, answer.text, answer.correct);
        });
    } else {
        history.innerHTML = '<div class="guess-item">等待其他玩家猜题...</div>';
    }
}

// 根据玩家ID获取玩家名称
function getPlayerNameById(playerId) {
    // 从当前玩家列表中查找
    const player = currentPlayers.find(p => p.id === playerId);
    return player ? player.name : '未知玩家';
}

// 退出房间
async function leaveRoom() {
    if (confirm('确定要退出房间吗？')) {
        try {
            // 停止轮询
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            
            // 通知服务器离开房间
            await fetch(`${API_BASE}/leave-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    roomId: gameData.roomId,
                    playerId: gameData.playerId
                })
            });
        } catch (error) {
            console.error('离开房间错误:', error);
        } finally {
            // 清理本地数据并返回主页
            localStorage.removeItem('gameData');
            window.location.href = 'index.html';
        }
    }
}

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeGame); 