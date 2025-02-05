let canvasText = 'Drag whatever image files you\'ve\nbeen thinking about onto the canvas.\nLet them roam free!\n\n\n Click on them to remove them.';
let dropArea;
let balls = []; // Array to hold bouncing image balls
let osc; // Single oscillator for background harmonic tone
let soundEnabled = false; // Track if sound is enabled
let currentVolume = 0; // Volume level that dynamically changes
let blurStrength = 0; // Blur effect tied to volume

// 🛠 Configurable settings
const DECAY_RATE = 0.005; // Volume decay per frame (higher = faster decay)
const VOLUME_BOOST = 0.05; // Volume increase per collision
const BLUR_STRENGTH = 10; // Maximum blur intensity
const SHRINK_AMOUNT = 2.5;  // Amount the ball shrinks per collision
const MIN_BALL_SIZE = 75;   // Smallest possible ball size


function setup() {

  //Switch between VS Code & p5.js web editor

  const container = document.getElementById("canvas-container");
  const containerWidth = container.offsetWidth/2;
  const containerHeight = container.offsetHeight;
  dropArea = createCanvas(containerWidth, containerHeight);
  dropArea.parent("canvas-container");
  dropArea.drop(gotFile);
  noLoop();
  
  // dropArea = createCanvas(710, 400);
  // dropArea.drop(gotFile);
  // noLoop();

  //Setup a single continuous oscillator
  osc = new p5.Oscillator('sine');
  osc.freq(440); // A4 (harmonic tone)
  osc.amp(0); // Start silent
  osc.start();

  // Enable sound on user interaction
  window.addEventListener('click', enableSound);
  window.addEventListener('keydown', enableSound);
  window.addEventListener('mousedown', enableSound);
  window.addEventListener('touchstart', enableSound);
}

function enableSound() {
  if (!soundEnabled) {
    getAudioContext().resume().then(() => {
      console.log('Audio context resumed.');
      soundEnabled = true;

      // Remove event listeners after enabling sound
      window.removeEventListener('click', enableSound);
      window.removeEventListener('keydown', enableSound);
      window.removeEventListener('mousedown', enableSound);
      window.removeEventListener('touchstart', enableSound);
    }).catch(err => {
      console.warn('Audio resume failed:', err);
    });
  }
}

function draw() {
  // Map volume (0 - 2.0) to background color (gray to red)
  let bgRed = map(currentVolume, 0, 2.0, 100, 255); // 100 (gray) → 255 (red)
  let bgGreen = map(currentVolume, 0, 2.0, 100, 0); // 100 → 0 (removes green)
  let bgBlue = map(currentVolume, 0, 2.0, 100, 0);  // 100 → 0 (removes blue)
  
  background(bgRed, bgGreen, bgBlue, 50); // Apply motion blur effect

  let totalCollisions = 0; // Track number of collisions this frame

  if (balls.length > 0) {
    // Apply blur effect based on volume
    let blurLevel = map(currentVolume, 0, 1, 0, BLUR_STRENGTH);
    drawingContext.filter = `blur(${blurLevel}px)`;

    for (let i = 0; i < balls.length; i++) {
      let ball = balls[i];

      // Move ball
      ball.x += ball.xSpeed;
      ball.y += ball.ySpeed;

      let hitWall = false;

      // Bounce off walls (and prevent sticking)
      if (ball.x <= 0) {
        ball.x = 1;
        ball.xSpeed = abs(ball.xSpeed);
        hitWall = true;
      }
      if (ball.x + ball.size >= width) {
        ball.x = width - ball.size - 1;
        ball.xSpeed = -abs(ball.xSpeed);
        hitWall = true;
      }
      if (ball.y <= 0) {
        ball.y = 1;
        ball.ySpeed = abs(ball.ySpeed);
        hitWall = true;
      }
      if (ball.y + ball.size >= height) {
        ball.y = height - ball.size - 1;
        ball.ySpeed = -abs(ball.ySpeed);
        hitWall = true;
      }

      // Collision detection between balls
      for (let j = i + 1; j < balls.length; j++) {
        let other = balls[j];
        let dx = ball.x - other.x;
        let dy = ball.y - other.y;
        let distance = sqrt(dx * dx + dy * dy);

        if (distance < (ball.size / 2 + other.size / 2)) {
          resolveCollision(ball, other);
          totalCollisions++; // Count the collision
        }
      }

      // Draw ball (masked image)
      image(ball.imgMask, ball.x, ball.y, ball.size, ball.size);
    }

    // Reset blur effect for next frame
    drawingContext.filter = "none";
  } else {
    // Show instructions before image is loaded
    fill(255);
    noStroke();
    textSize(24);
    textAlign(CENTER);
    text(canvasText, width / 2, height / 2);
    describe(`Grey canvas with the text "${canvasText}" in the center.`);
  }

  //Adjust sound volume based on collisions
  adjustSoundVolume(totalCollisions);
}

//Handle mouse clicks to delete balls
function mousePressed() {
  for (let i = balls.length - 1; i >= 0; i--) { // Iterate in reverse to remove topmost ball first
    let ball = balls[i];
    let d = dist(mouseX, mouseY, ball.x + ball.size / 2, ball.y + ball.size / 2);
    if (d < ball.size / 2) {
      balls.splice(i, 1); // Remove ball from array
      break; // Only remove one ball per click
    }
  }
}

// Function to handle file drop
function gotFile(file) {
  if (!soundEnabled) {
    getAudioContext().resume().then(() => {
      console.log('Audio context resumed.');
      soundEnabled = true;
    });
  }

  if (file.type === 'image') {
    loadImage(file.data, (img) => {
      let ballSize = min(width, height) * 0.3;

      // Create a circular mask
      let imgMask = createGraphics(ballSize, ballSize);
      imgMask.ellipse(ballSize / 2, ballSize / 2, ballSize, ballSize);

      // Resize and mask the image
      let tempImg = createImage(ballSize, ballSize);
      tempImg.copy(img, 0, 0, img.width, img.height, 0, 0, ballSize, ballSize);
      tempImg.mask(imgMask);

      let newBall = {
        x: random(0, width - ballSize),
        y: random(0, height - ballSize),
        xSpeed: random(2, 4) * (random() > 0.5 ? 1 : -1),
        ySpeed: random(2, 4) * (random() > 0.5 ? 1 : -1),
        size: ballSize,
        imgMask: tempImg
      };

      balls.push(newBall);
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

  if (distance === 0) return;

  let normalX = dx / distance;
  let normalY = dy / distance;
  let relVelX = ball2.xSpeed - ball1.xSpeed;
  let relVelY = ball2.ySpeed - ball1.ySpeed;
  let dotProduct = relVelX * normalX + relVelY * normalY;

  if (dotProduct > 0) return;

  let impulse = 2 * dotProduct / 2;
  let impulseX = impulse * normalX;
  let impulseY = impulse * normalY;

  ball1.xSpeed += impulseX;
  ball1.ySpeed += impulseY;
  ball2.xSpeed -= impulseX;
  ball2.ySpeed -= impulseY;

  let overlap = (ball1.size / 2 + ball2.size / 2) - distance;
  let separationFactor = 0.5;
  ball1.x -= normalX * overlap * separationFactor;
  ball1.y -= normalY * overlap * separationFactor;
  ball2.x += normalX * overlap * separationFactor;
  ball2.y += normalY * overlap * separationFactor;

  ball1.size = max(MIN_BALL_SIZE, ball1.size - SHRINK_AMOUNT);
  ball2.size = max(MIN_BALL_SIZE, ball2.size - SHRINK_AMOUNT);

  if (ball1.size <= MIN_BALL_SIZE) {
    playPopSound();
    balls.splice(balls.indexOf(ball1), 1);
  }
  if (ball2.size <= MIN_BALL_SIZE) {
    playPopSound();
    balls.splice(balls.indexOf(ball2), 1);
  }
}

//Function to adjust sound volume and frequency based on collisions and number of balls
function adjustSoundVolume(totalCollisions) {
  if (totalCollisions > 0) {
    currentVolume += totalCollisions * VOLUME_BOOST;
  }
  
  // Clamp volume to a max of 2.0
  currentVolume = min(2.0, max(0, currentVolume - DECAY_RATE)); 
  
  // Set frequency based on the number of balls (each ball adds 100 Hz)
  let newFrequency = 350 + balls.length * 10;
  osc.freq(newFrequency);

  osc.amp(currentVolume, 0.1); // Smooth transition
}

function playPopSound() {
  let popOsc = new p5.Oscillator('square');  // Use square wave for a "pop" effect
  popOsc.freq(random(300, 600));  // Randomized pop pitch
  popOsc.amp(0.001, 0.02);  // Quick attack (start)
  popOsc.start();

  setTimeout(() => {
    popOsc.amp(0, 0.1);  // Quick fade-out
    setTimeout(() => popOsc.stop(), 50); // Stop oscillator completely
  }, 50);
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