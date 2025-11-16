const gameContainer = document.getElementById('game-container');
const ball = document.getElementById('game-ball');
const paddle = document.getElementById('game-paddle');
const startButton = document.getElementById('game-start-button');
const scoreDisplay = document.getElementById('game-score-display');
const gameOverText = document.getElementById('game-over-text');

let pongScore = 0;
let pongGameRunning = false;
let ballX, ballY, velX, velY;
let paddleX;

const gameRect = gameContainer.getBoundingClientRect();

const PADDLE_HEIGHT = paddle.offsetHeight;
const PADDLE_WIDTH = paddle.offsetWidth;
const BALL_SIZE = ball.offsetWidth;
const INITIAL_SPEED = 2; 

startButton.addEventListener('click', startPongGame);
gameContainer.addEventListener('mousemove', movePaddle);
gameContainer.addEventListener('click', () => {
    if (!pongGameRunning && gameOverText.style.display === 'block') {
        startPongGame();
    }
});

function startPongGame(e) {
    if(e) e.stopPropagation(); 
    
    pongScore = 0;
    pongGameRunning = true;
    scoreDisplay.textContent = 'score: 0';
    startButton.style.display = 'none';
    gameOverText.style.display = 'none';

    ballX = gameRect.width / 2;
    ballY = gameRect.height / 3;

    let angle = (Math.random() * 90 + 45) * (Math.PI / 180); 
    if (Math.random() < 0.5) angle = -angle;
    velX = Math.cos(angle) * INITIAL_SPEED;
    velY = Math.sin(angle) * INITIAL_SPEED;
    
    pongGameLoop();
}

function movePaddle(e) {
    if (!pongGameRunning) return;
    paddleX = e.clientX - gameRect.left - (PADDLE_WIDTH / 2);
    
    if (paddleX < 0) paddleX = 0;
    if (paddleX > gameRect.width - PADDLE_WIDTH) paddleX = gameRect.width - PADDLE_WIDTH;
    
    paddle.style.left = paddleX + 'px';
}

function pongGameLoop() {
    if (!pongGameRunning) return;

    ballX += velX;
    ballY += velY;

    if (ballX <= 0 || ballX >= gameRect.width - BALL_SIZE) {
        velX = -velX; 
    }
    if (ballY <= 0) {
        velY = -velY; 
    }
    if (ballY >= gameRect.height - PADDLE_HEIGHT - BALL_SIZE - 10) { 
        if (ballX > paddleX && ballX < paddleX + PADDLE_WIDTH) {
            
            velY = -velY; 
            
            let hitPos = (ballX - (paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2); 
            
            velX = hitPos * 2; 
            if (hitPos === 0) { velX = 0.1; } 

            let currentSpeed = Math.sqrt(velX * velX + velY * velY);
            
            velX = (velX / currentSpeed) * INITIAL_SPEED;
            velY = (velY / currentSpeed) * INITIAL_SPEED;

            pongScore++; 
            scoreDisplay.textContent = 'score: ' + pongScore;
        }
    }
    if (ballY >= gameRect.height - BALL_SIZE) {
        endPongGame();
    }

    ball.style.left = ballX + 'px';
    ball.style.top = ballY + 'px';
    requestAnimationFrame(pongGameLoop);
}

function endPongGame() {
    pongGameRunning = false;
    gameOverText.style.display = 'block';
}

document.getElementById('destroy-button').addEventListener('click', () => {
    
    document.getElementById('destroy-button').style.display = 'none';
    document.getElementById('game-widget').style.display = 'none';
    document.querySelector('.container').style.display = 'none'; 
    document.body.style.overflow = 'hidden'; 
    
    const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Events } = Matter;
    
    const engine = Engine.create();
    const world = engine.world;
    engine.world.gravity.y = 1;

    const render = Render.create({
        element: document.body,
        engine: engine,
        options: {
            width: window.innerWidth,
            height: window.innerHeight,
            background: 'transparent',
            wireframes: false, 
            pixelRatio: window.devicePixelRatio
        }
    });

    Render.run(render);
    Engine.run(engine);

    render.canvas.style.position = 'fixed'; 
    render.canvas.style.top = '0';
    render.canvas.style.left = '0';
    render.canvas.style.zIndex = '100'; 
    render.canvas.style.pointerEvents = 'auto'; 
    render.canvas.style.opacity = 0; 

    const ground = Bodies.rectangle(window.innerWidth / 2, window.innerHeight + 50, window.innerWidth, 100, { isStatic: true });
    const wallLeft = Bodies.rectangle(-50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });
    const wallRight = Bodies.rectangle(window.innerWidth + 50, window.innerHeight / 2, 100, window.innerHeight, { isStatic: true });
    const ceiling = Bodies.rectangle(window.innerWidth / 2, -50, window.innerWidth, 100, { isStatic: true });
    World.add(world, [ground, wallLeft, wallRight, ceiling]);

    const elementBodies = [];

    document.querySelectorAll('.destroyable').forEach(el => {
        const bounds = el.getBoundingClientRect();
        
        const body = Bodies.rectangle(
            bounds.left + bounds.width / 2,
            bounds.top + bounds.height / 2,
            bounds.width,
            bounds.height,
            {
                restitution: 0.2, 
                friction: 0.5
            }
        );

        World.add(world, body);
        elementBodies.push({ el, body });
        
        el.style.position = 'fixed';
        el.style.top = `${bounds.top}px`;
        el.style.left = `${bounds.left}px`;
        el.style.zIndex = '101'; 
        el.style.margin = '0'; 
    });

    Events.on(engine, 'afterUpdate', () => {
        elementBodies.forEach(item => {
            const { el, body } = item;
            
            el.style.left = `${body.position.x - el.offsetWidth / 2}px`;
            el.style.top = `${body.position.y - el.offsetHeight / 2}px`;
            el.style.transform = `rotate(${body.angle}rad)`;
        });
    });

    const mouse = Mouse.create(render.canvas); 
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: {
                visible: false
            }
        }
    });

    World.add(world, mouseConstraint);
    
    const physicsBall = Bodies.circle(window.innerWidth / 2, 100, 30, {
        restitution: 0.7,
        friction: 0.1,
        render: { 
            fillStyle: '#222' 
        }
    });
    World.add(world, physicsBall);
});
