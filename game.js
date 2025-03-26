// 遊戲常量
const GRAVITY = 0.15;  // 降低重力，使小鳥掉落更慢
const FLAP_STRENGTH = -4;  // 減小飛行力度，使控制更平滑
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 180;  // 增加管道間隙，使通過更容易
const PIPE_SPACING = 250;  // 增加管道間距，給玩家更多反應時間
const GROUND_HEIGHT = 20;

// 遊戲變量
let canvas, ctx;
let bird;
let pipes = [];
let score = 0;
let highScore = parseInt(localStorage.getItem('highScore')) || 0;
let gameSpeed = 2;
let gameRunning = false;
let lastPipeTime = 0;
let particles = [];
let encouragements = [
    '你是最棒的！',
    '繼續飛，別停下！',
    '小鳥都被你感動了！',
    '哇！你真是太厲害了！',
    '飛得比老鷹還高！',
    '你的操作簡直神了！',
    '這波操作很秀啊！',
    '太強了，給你打call！',
    '你是遊戲界的天才！',
    '這個分數，我酸了！',
    '厲害了我的鳥！',
    '這技術，職業級別的！',
    '簡直就是飛行大師！',
    '這操作，教科書級別！',
    '你的小鳥飛得真優雅！'
];

// DOM元素
let startScreen, gameScreen, gameOverScreen;
let scoreElement, finalScoreElement, highScoreElement;
let encouragementElement;
let startButton, restartButton;

// 初始化遊戲
function init() {
    // 獲取DOM元素
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    startScreen = document.getElementById('startScreen');
    gameScreen = document.getElementById('gameScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    scoreElement = document.getElementById('score');
    finalScoreElement = document.getElementById('finalScore');
    highScoreElement = document.getElementById('highScore');
    encouragementElement = document.getElementById('encouragement');
    startButton = document.getElementById('startButton');
    restartButton = document.getElementById('restartButton');
    
    // 設置畫布尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 添加事件監聽器
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    canvas.addEventListener('click', flapBird);
    canvas.addEventListener('touchstart', flapBird);
    
    // 添加鍵盤事件監聽器，支持空白鍵控制
    window.addEventListener('keydown', function(event) {
        // 空白鍵的keyCode是32
        if (event.keyCode === 32 || event.key === ' ') {
            flapBird(event);
        }
    });
    
    // 顯示開始畫面
    showScreen(startScreen);
    hideScreen(gameScreen);
    hideScreen(gameOverScreen);
    
    // 顯示最高分
    highScoreElement.textContent = highScore;
    
    // 預渲染背景
    preRenderBackground();
}

// 調整畫布尺寸
function resizeCanvas() {
    const container = canvas.parentElement.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // 如果遊戲正在運行，重新繪製
    if (gameRunning) {
        draw();
    } else {
        drawBackground();
    }
}

// 預渲染背景
let bgCanvas, bgCtx;
function preRenderBackground() {
    bgCanvas = document.createElement('canvas');
    bgCtx = bgCanvas.getContext('2d');
    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    
    // 繪製天空
    const skyGradient = bgCtx.createLinearGradient(0, 0, 0, canvas.height);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F6FF');
    bgCtx.fillStyle = skyGradient;
    bgCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 繪製雲朵
    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.5;
        const size = 20 + Math.random() * 40;
        drawCloud(bgCtx, x, y, size);
    }
    
    // 繪製遠景山脈
    bgCtx.fillStyle = '#7BB087';
    bgCtx.beginPath();
    bgCtx.moveTo(0, canvas.height - 80);
    
    for (let i = 0; i < canvas.width; i += 50) {
        const height = 50 + Math.random() * 30;
        bgCtx.lineTo(i, canvas.height - height);
    }
    
    bgCtx.lineTo(canvas.width, canvas.height - 60);
    bgCtx.lineTo(canvas.width, canvas.height);
    bgCtx.lineTo(0, canvas.height);
    bgCtx.closePath();
    bgCtx.fill();
    
    // 繪製地面
    bgCtx.fillStyle = '#8B4513';
    bgCtx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);
    
    // 繪製草地
    bgCtx.fillStyle = '#7CFC00';
    bgCtx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, 5);
}

// 繪製雲朵
function drawCloud(context, x, y, size) {
    context.beginPath();
    context.arc(x, y, size, 0, Math.PI * 2);
    context.arc(x + size * 0.5, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
    context.arc(x + size, y, size * 0.7, 0, Math.PI * 2);
    context.arc(x + size * 1.5, y, size * 0.6, 0, Math.PI * 2);
    context.closePath();
    context.fill();
}

// 繪製背景
function drawBackground() {
    if (bgCanvas && bgCtx) {
        ctx.drawImage(bgCanvas, 0, 0, canvas.width, canvas.height);
    }
}

// 顯示屏幕
function showScreen(screen) {
    screen.style.display = 'flex';
    screen.style.opacity = '1';
}

// 隱藏屏幕
function hideScreen(screen) {
    screen.style.opacity = '0';
    setTimeout(() => {
        screen.style.display = 'none';
    }, 500);
}

// 開始遊戲
function startGame() {
    // 重置遊戲狀態
    bird = {
        x: canvas.width / 4,
        y: canvas.height / 2,
        velocity: FLAP_STRENGTH / 2, // 給予小鳥一個初始向上的力，避免立即掉落
        width: BIRD_WIDTH,
        height: BIRD_HEIGHT,
        wingPosition: 0,
        wingDirection: 1
    };
    
    pipes = [];
    score = 0;
    gameSpeed = 1.5;  // 降低初始遊戲速度
    gameRunning = true;
    lastPipeTime = 0;
    particles = [];
    
    // 更新UI
    scoreElement.textContent = score;
    encouragementElement.textContent = '';
    encouragementElement.classList.remove('show');
    
    // 切換屏幕
    hideScreen(startScreen);
    hideScreen(gameOverScreen);
    showScreen(gameScreen);
    
    // 開始遊戲循環
    requestAnimationFrame(gameLoop);
    
    // 播放背景音樂
    if (window.audioManager) {
        window.audioManager.playBackgroundMusic();
    }
}

// 遊戲循環
function gameLoop(timestamp) {
    if (!gameRunning) return;
    
    // 更新遊戲狀態
    update(timestamp);
    
    // 繪製遊戲畫面
    draw();
    
    // 繼續遊戲循環
    requestAnimationFrame(gameLoop);
}

// 更新遊戲狀態
function update(timestamp) {
    // 更新小鳥位置
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // 更新小鳥翅膀動畫
    bird.wingPosition += 0.2 * bird.wingDirection;
    if (bird.wingPosition > 1 || bird.wingPosition < -1) {
        bird.wingDirection *= -1;
    }
    
    // 檢查小鳥是否碰到地面或天花板
    if (bird.y + bird.height > canvas.height - GROUND_HEIGHT) {
        bird.y = canvas.height - GROUND_HEIGHT - bird.height;
        gameOver();
    } else if (bird.y < 0) {
        bird.y = 0;
        bird.velocity = 0;
    }
    
    // 生成新的管道
    if (timestamp - lastPipeTime > 2000) {  // 增加管道生成間隔，減少障礙物出現頻率
        generatePipe();
        lastPipeTime = timestamp;
    }
    
    // 更新管道位置
    for (let i = 0; i < pipes.length; i++) {
        pipes[i].x -= gameSpeed;
        
        // 檢查是否得分
        if (!pipes[i].passed && pipes[i].x + PIPE_WIDTH < bird.x) {
            pipes[i].passed = true;
            score++;
            scoreElement.textContent = score;
            
            // 增加遊戲速度
            if (score % 10 === 0) {  // 減少速度增加頻率
                gameSpeed += 0.3;  // 減少每次速度增加的幅度
            }
            
            // 顯示鼓勵語
            showEncouragement();
            
            // 生成粒子特效
            generateParticles();
            
            // 播放得分音效
            if (window.audioManager) {
                window.audioManager.playScoreSound();
            }
        }
        
        // 檢查碰撞
        if (checkCollision(bird, pipes[i])) {
            gameOver();
            break;
        }
    }
    
    // 移除超出畫面的管道
    pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    
    // 更新粒子
    updateParticles();
}

// 繪製遊戲畫面
function draw() {
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製背景
    drawBackground();
    
    // 繪製管道
    drawPipes();
    
    // 繪製小鳥
    drawBird();
    
    // 繪製粒子
    drawParticles();
}

// 繪製小鳥
function drawBird() {
    // 小鳥身體
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.ellipse(
        bird.x, 
        bird.y, 
        bird.width / 2, 
        bird.height / 2, 
        0, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // 小鳥眼睛
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(
        bird.x + bird.width / 4, 
        bird.y - bird.height / 6, 
        bird.width / 10, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
    
    // 小鳥嘴巴
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.width / 2, bird.y);
    ctx.lineTo(bird.x + bird.width / 2 + bird.width / 4, bird.y);
    ctx.lineTo(bird.x + bird.width / 2, bird.y + bird.height / 6);
    ctx.closePath();
    ctx.fill();
    
    // 小鳥翅膀
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(
        bird.x - bird.width / 4, 
        bird.y + bird.wingPosition * (bird.height / 4), 
        bird.width / 3, 
        bird.height / 4, 
        Math.PI / 4, 
        0, 
        Math.PI * 2
    );
    ctx.fill();
}

// 生成管道
function generatePipe() {
    const gapPosition = PIPE_GAP + Math.random() * (canvas.height - PIPE_GAP - GROUND_HEIGHT - 100);
    
    pipes.push({
        x: canvas.width,
        gapY: gapPosition,
        passed: false
    });
}

// 繪製管道
function drawPipes() {
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        
        // 上方管道
        drawPipe(pipe.x, 0, PIPE_WIDTH, pipe.gapY - PIPE_GAP / 2, true);
        
        // 下方管道
        drawPipe(pipe.x, pipe.gapY + PIPE_GAP / 2, PIPE_WIDTH, canvas.height - (pipe.gapY + PIPE_GAP / 2) - GROUND_HEIGHT, false);
    }
}

// 繪製單個管道
function drawPipe(x, y, width, height, isTop) {
    // 樹幹 (深棕色)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + width/4, y, width/2, height); // 樹幹寬度為管道寬度的一半
    
    // 樹葉 (綠色，圓形)
    ctx.fillStyle = '#228B22';
    
    if (isTop) {
        // 上方樹 (倒掛的樹)
        const leafY = y + height - width/2;
        // 繪製幾層樹葉
        for (let i = 0; i < 3; i++) {
            const radius = width * (1 - i * 0.2);
            ctx.beginPath();
            ctx.arc(x + width/2, leafY - i * width/3, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // 下方樹 (正常的樹)
        const leafY = y + width/2;
        // 繪製幾層樹葉
        for (let i = 0; i < 3; i++) {
            const radius = width * (1 - i * 0.2);
            ctx.beginPath();
            ctx.arc(x + width/2, leafY + i * width/3, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // 樹幹紋理 (靜態的，不會動)
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    for (let i = 10; i < height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(x + width/4, y + i);
        ctx.lineTo(x + width*3/4, y + i);
        ctx.stroke();
    }
}

// 檢查碰撞
function checkCollision(bird, pipe) {
    // 更精確的碰撞檢測，縮小判定範圍
    const birdRight = bird.x + bird.width / 4; // 更小的碰撞判定範圍
    const birdLeft = bird.x - bird.width / 4; // 更小的碰撞判定範圍
    const birdTop = bird.y - bird.height / 4; // 更小的碰撞判定範圍
    const birdBottom = bird.y + bird.height / 4; // 更小的碰撞判定範圍
    
    // 樹幹位置 (樹幹寬度為管道寬度的一半)
    const trunkLeft = pipe.x + PIPE_WIDTH/4;
    const trunkRight = pipe.x + PIPE_WIDTH*3/4;
    const topPipeBottom = pipe.gapY - PIPE_GAP / 2;
    const bottomPipeTop = pipe.gapY + PIPE_GAP / 2;
    
    // 檢查是否與樹幹碰撞
    if (birdRight < trunkLeft || birdLeft > trunkRight) {
        // 沒有碰到樹幹，檢查是否碰到樹葉
        
        // 上方樹葉的位置
        const topTreeLeafCenter = {x: pipe.x + PIPE_WIDTH/2, y: topPipeBottom};
        const topLeafRadius = PIPE_WIDTH * 0.6; // 進一步減小樹葉的碰撞範圍
        
        // 下方樹葉的位置
        const bottomTreeLeafCenter = {x: pipe.x + PIPE_WIDTH/2, y: bottomPipeTop};
        const bottomLeafRadius = PIPE_WIDTH * 0.6; // 進一步減小樹葉的碰撞範圍
        
        // 檢查與上方樹葉的碰撞 (圓形碰撞檢測)
        const distToTopLeaf = Math.sqrt(
            Math.pow(bird.x - topTreeLeafCenter.x, 2) + 
            Math.pow(bird.y - topTreeLeafCenter.y, 2)
        );
        
        // 檢查與下方樹葉的碰撞 (圓形碰撞檢測)
        const distToBottomLeaf = Math.sqrt(
            Math.pow(bird.x - bottomTreeLeafCenter.x, 2) + 
            Math.pow(bird.y - bottomTreeLeafCenter.y, 2)
        );
        
        if (distToTopLeaf < (bird.width/4 + topLeafRadius) || 
            distToBottomLeaf < (bird.width/4 + bottomLeafRadius)) {
            
            // 播放碰撞音效
            if (window.audioManager) {
                window.audioManager.playHitSound();
            }
            
            return true;
        }
        
        return false;
    }
    
    // 檢查垂直碰撞 (與樹幹)
    if (birdTop > topPipeBottom && birdBottom < bottomPipeTop) {
        return false;
    }
    
    // 播放碰撞音效
    if (window.audioManager) {
        window.audioManager.playHitSound();
    }
    
    return true;
}

// 小鳥飛行
function flapBird(event) {
    event.preventDefault();
    
    if (!gameRunning) return;
    
    bird.velocity = FLAP_STRENGTH;
    
    // 播放飛行音效
    if (window.audioManager) {
        window.audioManager.playFlapSound();
    }
}

// 遊戲結束
function gameOver() {
    gameRunning = false;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore.toString());
    }
    
    // 更新UI
    finalScoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    
    // 顯示遊戲結束畫面
    setTimeout(() => {
        hideScreen(gameScreen);
        showScreen(gameOverScreen);
    }, 1000);
    
    // 停止背景音樂
    if (window.audioManager) {
        window.audioManager.stopBackgroundMusic();
    }
}

// 顯示鼓勵語
function showEncouragement() {
    const randomIndex = Math.floor(Math.random() * encouragements.length);
    encouragementElement.textContent = encouragements[randomIndex];
    encouragementElement.classList.remove('show');
    
    // 強制重繪
    encouragementElement.offsetHeight;
    
    encouragementElement.classList.add('show');
    
    // 3秒後隱藏
    setTimeout(() => {
        encouragementElement.classList.remove('show');
    }, 3000);
}

// 生成粒子特效
function generateParticles() {
    const colors = ['#FFD700', '#FF6347', '#4169E1', '#32CD32', '#FF69B4', '#9370DB'];
    
    for (let i = 0; i < 30; i++) {
        particles.push({
            x: bird.x,
            y: bird.y,
            size: 3 + Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedX: (Math.random() - 0.5) * 8,
            speedY: (Math.random() - 0.5) * 8,
            life: 1
        });
    }
}

// 更新粒子
function updateParticles() {
    for (let i = 0; i < particles.length; i++) {
        particles[i].x += particles[i].speedX;
        particles[i].y += particles[i].speedY;
        particles[i].life -= 0.02;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
            i--;
        }
    }
}

// 繪製粒子
function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// 當頁面加載完成後初始化遊戲
window.addEventListener('load', init);