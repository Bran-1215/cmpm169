let canvasText = 'Drag an image file onto the canvas.';
let dropArea;
let img, imgMask; // Image and circular mask
let x, y; // Position
let xSpeed, ySpeed; // Speed in x and y directions
let ballSize; // Diameter of the ball

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

  // Default bouncing properties
  x = width / 2;
  y = height / 2;
  xSpeed = random(2, 4) * (random() > 0.5 ? 1 : -1);
  ySpeed = random(2, 4) * (random() > 0.5 ? 1 : -1);
}

function draw() {
  background(100);

  if (imgMask) {
    // Move ball
    x += xSpeed;
    y += ySpeed;

    // Bounce off walls
    if (x <= 0 || x + ballSize >= width) {
      xSpeed *= -1;
    }
    if (y <= 0 || y + ballSize >= height) {
      ySpeed *= -1;
    }

    // Draw the masked (circular) image
    image(imgMask, x, y, ballSize, ballSize);
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

function gotFile(file) {
  if (file.type === 'image') {
    // Load the image
    img = loadImage(file.data, () => {
      // Determine the ball size (30% of canvas height, capped)
      ballSize = min(width, height) * 0.3;

      // Create a circular mask
      imgMask = createGraphics(ballSize, ballSize);
      imgMask.ellipse(ballSize / 2, ballSize / 2, ballSize, ballSize);

      // Resize and mask the image
      let tempImg = createImage(ballSize, ballSize);
      tempImg.copy(img, 0, 0, img.width, img.height, 0, 0, ballSize, ballSize);
      tempImg.mask(imgMask);

      imgMask = tempImg;

      // Set initial random position
      x = random(0, width - ballSize);
      y = random(0, height - ballSize);

      // Start animation
      loop();
    });
  } else {
    canvasText = 'Not an image file!';
    redraw();
  }
}
