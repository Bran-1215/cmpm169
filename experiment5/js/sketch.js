let cols, rows;
let scl = 40;  // Scale of each grid cell
let w = 800;  // Width of terrain
let h = 1300;   // Depth of terrain
let speed = 0.6; // Speed of forward motion
let noiseOffset = 0; // Controls Perlin noise scrolling
let heightInfluencer = -207; // Starts at the lowest value
let isMouseHeld = false; // Flag to track if mouse is held
let handImage; // Variable to hold the image

function preload() {
  handImage = loadImage('assets/hand.png'); 
}

function setup() {
  const container = document.getElementById("canvas-container");
  const containerWidth = container.offsetWidth/2;
  const containerHeight = container.offsetHeight;
  let cnv = createCanvas(containerWidth, containerHeight, WEBGL);
  cnv.parent("canvas-container");
  cols = w / scl;
  rows = h / scl;
}

function draw() {
  background(0);

  // Map adjustedZ to influence terrain colors
  let zFactor = map(heightInfluencer, -207, -125, 0, 1);
  
  setGradient();

  rotateX(PI / 2.1);
  translate(-w / 2, 0, 250);

  // Draw terrain
  for (let y = 0; y < rows - 1; y++) {
    beginShape(TRIANGLE_STRIP);
    for (let x = 0; x < cols; x++) {
      let h1 = generateTerrainHeight(x, y);
      let h2 = generateTerrainHeight(x, y + 1);

      // Depth factor (0 = close, 1 = far)
      let depthFactor = map(y, 0, rows - 1, 0, 1);

    
      let r1 = map(depthFactor, 0, 1, 50, 255);
      let g1 = map(depthFactor, 0, 1, 0, 50);
      let b1 = map(depthFactor, 0, 1, 150, 255);

      
      let r2 = map(depthFactor, 0, 1, 150, 255);
      let g2 = map(depthFactor, 0, 1, 0, 50);
      let b2 = map(depthFactor, 0, 1, 50, 255);
      
      // Alpha transition (more opaque as adjustedZ increases)
let alpha1 = map(depthFactor, 0, 1, 180, 80);   
let alpha2 = map(depthFactor, 0, 1, 180, 100);  

      // Interpolated terrain color
      let r = lerp(r1, r2, zFactor);
      let g = lerp(g1, g2, zFactor);
      let b = lerp(b1, b2, zFactor);
      //let alpha = map(depthFactor, 0, 1, 180, 80);
      let alpha = lerp(alpha1, alpha2, zFactor);

      fill(r, g, b, alpha);

      let wireframeColor = color(250,250,250,25);

      // Determine if this point is inside the valley
      let distanceFromCenter = abs((x - cols / 2) / (cols / 2));
      let isValley = distanceFromCenter < 0.15;

      // Apply transparent wireframe in valley
      if (isValley) {
        stroke(0, 0); // Transparent stroke (no wireframe in valley)
      } else {
        stroke(wireframeColor); // Dynamically changing wireframe color
      }

      vertex(x * scl, y * scl, h1);
      vertex(x * scl, (y + 1) * scl, h2);
    }
    endShape();
  }

  // Move noiseOffset forward to create the correct scrolling effect
  noiseOffset -= speed * 0.02;

  // Draw the hand that follows the mouse
  drawMovingHand();
}


// Generate Perlin noise-based terrain heights dynamically
function generateTerrainHeight(x, y) {
  let distanceFromCenter = abs((x - cols / 2) / (cols / 2)); 
  let valleyWidth = 0.15;
  let valleyHeight = -250; 

  // Dynamically calculate factorA and factorB based on hand position (finalZ)
  let factorA = map(heightInfluencer, -207, -125, 500, 1000);
  let factorB = map(heightInfluencer, -207, -125, 300, 250); // Reverse mapping

  // Use a **fixed X-seed** to make mountains static while scrolling along Y
  let fixedXSeed = x * 0.2;
  let movingY = (y * 0.1) + noiseOffset; 

  let heightValue = pow(map(noise(fixedXSeed, movingY), 0, 1, 0, 1), 2) * factorA - factorB;

  if (distanceFromCenter < valleyWidth) {
    return valleyHeight + map(noise(fixedXSeed, movingY), 0, 1, -10, 10); // Add slight valley roughness
  }

  let blendFactor = map(distanceFromCenter, valleyWidth, 1, 0, 1);
  blendFactor = constrain(blendFactor, 0, 1);

  return lerp(valleyHeight, heightValue, blendFactor);
}


function drawMovingHand() {
  push(); // Save the transformation matrix

  // Map the mouse movement into a limited area in front of the POV
  let mappedX = map(mouseX, 0, width, -100, 100);
  let mappedY = map(mouseY, 0, height, -75, 75);
  
  finalZ = constrain(-mappedY - 200, -207, -125); // Update finalZ dynamically

  let finalX = mappedX + 400;
  let finalY = 650;
  
  if (isMouseHeld) {
    heightInfluencer = finalZ; 
    filter(BLUR, 1);
    tint(100);
  }

  translate(finalX, finalY, finalZ); // Move image relative to camera
  rotateX(-PI / 2); // Rotate upright (so it stands vertically)
  imageMode(CENTER);
  image(handImage, 0, 0, 50, 55); // Draw the hand image at the correct position
  
  //console.log(`Hand Position - X: ${finalX}, Y: ${finalY}, Z: ${finalZ}`);
  

  pop(); // Restore the previous transformation matrix
}

function setGradient() {
  noStroke();
  for (let i = 0; i < height; i++) {
    let t = map(i, 0, height, 0, 1);
    
    // Interpolation factor based on adjustedZ
    let zFactor = map(heightInfluencer, -207, -125, 0, 1);
    
    
    let topColor1 = color(0, 0, 50);
    let midColor1 = color(100, 0, 100);
    let bottomColor1 = color(200, 50, 100);

    
    let topColor2 = color(0, 0, 50);
    let midColor2 = color(100, 100, 100);
    let bottomColor2 = color(200, 50, 100);

    // Interpolated gradient colors
    let topColor = lerpColor(topColor1, topColor2, zFactor);
    let midColor = lerpColor(midColor1, midColor2, zFactor);
    let bottomColor = lerpColor(bottomColor1, bottomColor2, zFactor);

    let c;
    if (t < 0.5) {
      c = lerpColor(topColor, midColor, t * 2);
    } else {
      c = lerpColor(midColor, bottomColor, (t - 0.5) * 2);
    }

    fill(c);
    rect(-width / 2, i - height / 2, width, 1);
  }
}


function mousePressed() {
  isMouseHeld = true; 
}

function mouseReleased() {
  isMouseHeld = false;
}

