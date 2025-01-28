let cellSize = 5;
let columnCount;
let rowCount;
let slimeDensity = [];
let branchTimer = []; // Tracks how long each cell remains a branching cell
let maxBranchLifetime = 10; // Maximum iterations a cell can remain a branching cell
let foodConcentration = [];
let chemicalSignal = [];
let nextChemicalSignal = [];
let maxDensity = 1.5; // Maximum allowable density in any cell
let growthAmount = 0.2; // Amount of slime density added per growth step
let decayRate = 0.98; // General decay rate for slime density
let branchDecayRate = 0.9; // Faster decay for non-branching cells
let overcrowdingDecayRate = 0.8; // Decay rate for overcrowded cells
let signalDecay = 0.95; // Decay factor for chemical signals
let diffusionRate = 0.25; // Speed of signal diffusion
let foodSignalStrength = 10; // Strength of chemical signals emitted by food
let explorationFactor = 0.3; // Noise factor for exploratory growth
let overcrowdingThreshold = 6; // Maximum neighbors before forced decay
let speedFactor = 1; // Controls the simulation speed. Increase for faster growth/decay.

function setup() {
  frameRate(10 * speedFactor); // Scale frame rate dynamically
  
  // Get the container div
  const container = document.getElementById("canvas-container");

  // Get the width and height of the container
  const containerWidth = container.offsetWidth;
  const containerHeight = container.offsetHeight;

  // Create the canvas with the size of the container
  const canvas = createCanvas(containerWidth, containerHeight);

  // Attach the canvas to the container
  canvas.parent("canvas-container");

  // Calculate columns and rows
  columnCount = floor(containerWidth / cellSize);
  rowCount = floor(containerHeight / cellSize);

  // Initialize arrays
  slimeDensity = createGrid(0); // Represents the slime mold
  branchTimer = createGrid(0); // Tracks lifetime of branching cells
  foodConcentration = createGrid(0); // Represents food sources
  chemicalSignal = createGrid(0); // Represents chemical signals
  nextChemicalSignal = createGrid(0);

  // Add initial slime mold and food sources
  addSlimeMold(floor(columnCount / 2), floor(rowCount / 2)); // Start in the center
  for (let i = 0; i < 5; i++) {
    addFood(floor(random(columnCount)), floor(random(rowCount))); // Add random food sources
  }
}

function draw() {
  // Diffuse signals
  diffuseSignals();

  // Simulate slime mold growth
  growSlimeMold();

  // Decay slime mold with overcrowding and branch decay considerations
  decaySlimeMold();

  // Display the grid
  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      // Display slime mold
      if (slimeDensity[column][row] > 0) {
        if (branchTimer[column][row] > 0) {
          fill(0, 255, 0, slimeDensity[column][row] * 255); // Green for branching cells
        } else {
          fill(255, 255, 0, slimeDensity[column][row] * 255); // Yellow for regular slime
        }
      } else if (foodConcentration[column][row] > 0) {
        fill(255, 50, 50); // Red for food
      } else if (chemicalSignal[column][row] > 0) {
        fill(50, 50, 255, chemicalSignal[column][row] * 255); // Blue for signal
      } else {
        fill(0); // Black for empty space
      }
      noStroke();
      rect(column * cellSize, row * cellSize, cellSize, cellSize);
    }
  }
}

function createGrid(defaultValue) {
  let grid = [];
  for (let column = 0; column < columnCount; column++) {
    grid[column] = [];
    for (let row = 0; row < rowCount; row++) {
      grid[column][row] = defaultValue;
    }
  }
  return grid;
}

function addSlimeMold(x, y) {
  slimeDensity[x][y] = 1; // Start with full slime density
  branchTimer[x][y] = maxBranchLifetime; // Make the starting cell a branching cell
}

function addFood(x, y) {
  foodConcentration[x][y] = 1; // Add a food source
}

function diffuseSignals() {
  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      if (isOnBorder(column, row)) {
        // Ensure no signals propagate into or beyond borders
        nextChemicalSignal[column][row] = 0;
        continue;
      }

      let neighbors = getValidNeighbors(column, row);

      // Average signal of valid neighbors with decay
      let totalSignal = 0;
      for (let neighbor of neighbors) {
        totalSignal += chemicalSignal[neighbor.x][neighbor.y];
      }

      nextChemicalSignal[column][row] = (totalSignal / neighbors.length) * diffusionRate * speedFactor; // Scale diffusion

      // Add contribution from food with decay
      nextChemicalSignal[column][row] += foodConcentration[column][row] * foodSignalStrength;

      // Apply signal decay
      nextChemicalSignal[column][row] *= signalDecay;

      // Add noise to simulate randomness
      nextChemicalSignal[column][row] += random(-0.05, 0.05);
    }
  }

  // Swap chemicalSignal arrays
  let temp = chemicalSignal;
  chemicalSignal = nextChemicalSignal;
  nextChemicalSignal = temp;
}

function growSlimeMold() {
  let newSlimeDensity = createGrid(0);
  let newBranchTimer = createGrid(0);

  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      if (slimeDensity[column][row] > 0) {
        let neighbors = getValidNeighbors(column, row);

        // Count yellow neighbors (non-branching cells)
        let yellowNeighbors = neighbors.filter(
          (neighbor) => branchTimer[neighbor.x][neighbor.y] === 0 && slimeDensity[neighbor.x][neighbor.y] > 0
        ).length;

        // Rule: Convert green slime (branching) to yellow slime if it has 3 or more yellow neighbors
        if (branchTimer[column][row] > 0 && yellowNeighbors >= 3) {
          branchTimer[column][row] = 0; // Transition to yellow mold
        }

        // Growth competition
        let growthDirection = neighbors.filter((neighbor) => {
          return (
            chemicalSignal[neighbor.x][neighbor.y] > random(0.2) &&
            slimeDensity[neighbor.x][neighbor.y] < maxDensity &&
            random() < explorationFactor
          );
        });

        // Grow toward selected directions
        for (let neighbor of growthDirection) {
          let { x, y } = neighbor;
          newSlimeDensity[x][y] += growthAmount * speedFactor; // Growth rate influenced by speedFactor
          newBranchTimer[x][y] = maxBranchLifetime; // Make new growth branching
        }

        // Maintain existing slime density with decay
        newSlimeDensity[column][row] += slimeDensity[column][row];
        newBranchTimer[column][row] = Math.max(0, branchTimer[column][row] - 1); // Reduce branch lifetime
      }
    }
  }

  slimeDensity = newSlimeDensity;
  branchTimer = newBranchTimer; // Update branch states
}

function decaySlimeMold() {
  for (let column = 0; column < columnCount; column++) {
    for (let row = 0; row < rowCount; row++) {
      if (slimeDensity[column][row] > 0) {
        let left = (column - 1 + columnCount) % columnCount;
        let right = (column + 1) % columnCount;
        let above = (row - 1 + rowCount) % rowCount;
        let below = (row + 1) % rowCount;

        // Count neighbors
        let neighbors =
          (slimeDensity[left][row] > 0) +
          (slimeDensity[right][row] > 0) +
          (slimeDensity[column][above] > 0) +
          (slimeDensity[column][below] > 0);

        // Overcrowded cells decay faster
        if (neighbors > overcrowdingThreshold) {
          slimeDensity[column][row] *= overcrowdingDecayRate * speedFactor; // Faster decay with speedFactor
        } else if (branchTimer[column][row] === 0) {
          // Non-branching cells decay faster
          slimeDensity[column][row] *= branchDecayRate * speedFactor;
        } else {
          // Standard decay
          slimeDensity[column][row] *= decayRate * speedFactor;
        }

        // Kill cells below a minimum density
        if (slimeDensity[column][row] < 0.01) {
          slimeDensity[column][row] = 0; // Cell completely dies
        }
      }
    }
  }
}

function getValidNeighbors(column, row) {
  // Get neighbors while preventing out-of-bounds access
  let neighbors = [];
  if (column > 0) neighbors.push({ x: column - 1, y: row }); // Left
  if (column < columnCount - 1) neighbors.push({ x: column + 1, y: row }); // Right
  if (row > 0) neighbors.push({ x: column, y: row - 1 }); // Above
  if (row < rowCount - 1) neighbors.push({ x: column, y: row + 1 }); // Below
  return neighbors;
}

function isOnBorder(column, row) {
  // Check if the cell is on the border of the canvas
  return column === 0 || column === columnCount - 1 || row === 0 || row === rowCount - 1;
}
