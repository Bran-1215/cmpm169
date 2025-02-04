let canvasText = 'Drag an image file onto the canvas.';
let dropArea;
let img; // Variable for the image
let x, y; // Position
let xSpeed, ySpeed; // Speed in x and y directions
let imgWidth, imgHeight; // Image dimensions

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

  if (img) {
    // Move image
    x += xSpeed;
    y += ySpeed;

    // Bounce off walls
    if (x <= 0 || x + imgWidth >= width) {
      xSpeed *= -1;
    }
    if (y <= 0 || y + imgHeight >= height) {
      ySpeed *= -1;
    }

    // Draw image
    image(img, x, y, imgWidth, imgHeight);
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
    // Load and resize image
    img = loadImage(file.data, () => {
      // Maintain aspect ratio while resizing
      let scale = min(width / img.width, height / img.height) * 0.3;
      imgWidth = img.width * scale;
      imgHeight = img.height * scale;

      // Set initial random position
      x = random(0, width - imgWidth);
      y = random(0, height - imgHeight);

      // Start animation
      loop();
    });
  } else {
    canvasText = 'Not an image file!';
    redraw();
  }
}
