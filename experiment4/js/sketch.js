let canvasText = 'Drag image files onto the canvas.';
let dropArea;
let balls = []; // Array to hold bouncing image balls
let osc; // Oscillator for beep sounds
let soundEnabled = false; // Track if sound is enabled

function setup() {
  
  const container = document.getElementById("canvas-container");
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;
  dropArea = createCanvas(containerWidth, containerHeight);
  dropArea.parent("canvas-container");
  dropArea.drop(gotFile);
  noLoop();
  
  // dropArea = createCanvas(710, 400);
  // dropArea.drop(gotFile);
  // noLoop();

  // Setup sound oscillator
  osc = new p5.Oscillator('sine');
  osc.amp(0);
  osc.start();

window.addEventListener('click', enableSound);
window.addEventListener('keydown', enableSound);
window.addEventListener('mousedown', enableSound);
window.addEventListener('touchstart', enableSound);

}

function enableSound() {
  if (!soundEnabled) {
      getAudioContext().resume().then(() => {
          console.log('✅ Audio context resumed.');
          soundEnabled = true;

          // Remove event listeners after enabling sound (prevents unnecessary calls)
          window.removeEventListener('click', enableSound);
          window.removeEventListener('keydown', enableSound);
          window.removeEventListener('mousedown', enableSound);
          window.removeEventListener('touchstart', enableSound);
      }).catch(err => {
          console.warn('⚠️ Audio resume failed:', err);
      });
  }
}


function draw() {
  background(100);

  if (balls.length > 0) {
    for (let i = 0; i < balls.length; i++) {
      let ball = balls[i];

      // Move ball
      ball.x += ball.xSpeed;
      ball.y += ball.ySpeed;

      let hitWall = false;

      // Bounce off walls (and prevent sticking)
      if (ball.x <= 0) {
        ball.x = 1; // Nudge inside
        ball.xSpeed = abs(ball.xSpeed); // Ensure positive speed
        hitWall = true;
      }
      if (ball.x + ball.size >= width) {
        ball.x = width - ball.size - 1; // Nudge inside
        ball.xSpeed = -abs(ball.xSpeed); // Ensure negative speed
        hitWall = true;
      }
      if (ball.y <= 0) {
        ball.y = 1; // Nudge inside
        ball.ySpeed = abs(ball.ySpeed); // Ensure positive speed
        hitWall = true;
      }
      if (ball.y + ball.size >= height) {
        ball.y = height - ball.size - 1; // Nudge inside
        ball.ySpeed = -abs(ball.ySpeed); // Ensure negative speed
        hitWall = true;
      }

      // Play beep sound on wall bounce
      if (hitWall) {
        playBeep();
      }

      // Collision detection between balls
      for (let j = i + 1; j < balls.length; j++) {
        let other = balls[j];
        let dx = ball.x - other.x;
        let dy = ball.y - other.y;
        let distance = sqrt(dx * dx + dy * dy);

        if (distance < (ball.size / 2 + other.size / 2)) {
          resolveCollision(ball, other);
          playBeep(); // Beep on collision
        }
      }

      // Draw ball (masked image)
      image(ball.imgMask, ball.x, ball.y, ball.size, ball.size);
    }
  } else {
    // Show instructions before image is loaded
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text(canvasText, width / 2, height / 2);
    describe(`Grey canvas with the text "${canvasText}" in the center.`);
  }
}


// Function to handle file drop
function gotFile(file) {
  
  if (file.type === 'image') {
    // Load the image
    loadImage(file.data, (img) => {
      let ballSize = min(width, height) * 0.3;

      // Create a circular mask
      let imgMask = createGraphics(ballSize, ballSize);
      imgMask.ellipse(ballSize / 2, ballSize / 2, ballSize, ballSize);

      // Resize and mask the image
      let tempImg = createImage(ballSize, ballSize);
      tempImg.copy(img, 0, 0, img.width, img.height, 0, 0, ballSize, ballSize);
      tempImg.mask(imgMask);

      // Create a new bouncing ball
      let newBall = {
        x: random(0, width - ballSize),
        y: random(0, height - ballSize),
        xSpeed: random(2, 4) * (random() > 0.5 ? 1 : -1),
        ySpeed: random(2, 4) * (random() > 0.5 ? 1 : -1),
        size: ballSize,
        imgMask: tempImg
      };

      balls.push(newBall);

      // Start animation if not running
      loop();
    });
  } else {
    canvasText = 'Not an image file!';
    redraw();
  }
}

// Function to resolve ball-to-ball collisions
function resolveCollision(ball1, ball2) {
  let dx = ball2.x - ball1.x;
  let dy = ball2.y - ball1.y;
  let distance = sqrt(dx * dx + dy * dy);

  if (distance === 0) return; // Prevent division by zero

  let normalX = dx / distance;
  let normalY = dy / distance;

  // Compute relative velocity
  let relVelX = ball2.xSpeed - ball1.xSpeed;
  let relVelY = ball2.ySpeed - ball1.ySpeed;

  // Compute velocity along the normal direction
  let dotProduct = relVelX * normalX + relVelY * normalY;

  // If balls are moving apart, don't process collision
  if (dotProduct > 0) return;

  // Elastic collision response
  let impulse = 2 * dotProduct / 2; // 2D elastic collision formula for equal masses
  let impulseX = impulse * normalX;
  let impulseY = impulse * normalY;

  ball1.xSpeed += impulseX;
  ball1.ySpeed += impulseY;
  ball2.xSpeed -= impulseX;
  ball2.ySpeed -= impulseY;

  // Prevent overlap by moving the balls apart
  let overlap = (ball1.size / 2 + ball2.size / 2) - distance;
  let separationFactor = 0.5; // Each ball moves half the overlap distance away
  ball1.x -= normalX * overlap * separationFactor;
  ball1.y -= normalY * overlap * separationFactor;
  ball2.x += normalX * overlap * separationFactor;
  ball2.y += normalY * overlap * separationFactor;
}


// Function to play a random-pitched beep
function playBeep() {
  let freq = random(200, 800); // Random frequency between 200Hz and 800Hz
  osc.freq(freq);
  osc.amp(0.5, 0.05); // Fade in quickly
  setTimeout(() => {
    osc.amp(0, 0.2); // Fade out smoothly
  }, 100);
}