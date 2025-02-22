let currentState = 1; // Tracks the current state (1, 2, or 3)
let lastSentence = "";
let switchX; // X position of the switch
let switchY; // Y position of the switch (bottom)
const switchWidth = 300; // Total width of the switch
const switchHeight = 50; // Height of the switch
const numStates = 3; // Number of switch positions
let backgroundColor = 255;

let lastUpdateTime = 0; // Tracks last time the sentence was updated
let updateInterval = 3000; // 3 seconds
let osc1, osc2, osc3; // Sound oscillators
function setup() {
  const container = document.getElementById("canvas-container");
  const containerWidth = container.offsetWidth / 2;
  const containerHeight = container.offsetHeight;
  switchX = containerWidth / 2 - 150;
  switchY = containerHeight - 50;
  let cnv = createCanvas(containerWidth, containerHeight);
  cnv.parent("canvas-container");
  textAlign(CENTER, CENTER);
  textSize(30);
  getAudioContext().resume();

  osc1 = new p5.Oscillator();
  osc2 = new p5.Oscillator();
  osc3 = new p5.Oscillator();

  osc1.setType("sine");
  osc2.setType("sine");
  osc3.setType("sine");

  osc1.freq(440 / 6);
  osc2.freq(523.25 / 4);
  osc3.freq(587.33 / 4);

  osc1.amp(0);
  osc2.amp(0);
  osc3.amp(0);

  osc1.start();
  osc2.start();
  osc3.start();

  generateSentence();
}

function draw() {
  if (millis() - lastUpdateTime > updateInterval) {
    generateSentence();
    lastUpdateTime = millis();
  }
  drawSwitch();
}

function mousePressed() {
  if (mouseY >= switchY && mouseY <= switchY + switchHeight) {
    let sectionWidth = switchWidth / numStates;

    if (mouseX >= switchX && mouseX < switchX + sectionWidth) {
      currentState = 1;
      updateInterval = 3000;
      backgroundColor = 250;
      lastUpdateTime = millis();
    } else if (
      mouseX >= switchX + sectionWidth &&
      mouseX < switchX + 2 * sectionWidth
    ) {
      currentState = 2;
      updateInterval = 1000;
      backgroundColor = 150;
      lastUpdateTime = millis();
    } else if (
      mouseX >= switchX + 2 * sectionWidth &&
      mouseX <= switchX + switchWidth
    ) {
      currentState = 3;
      updateInterval = 300;
      backgroundColor = 50;
      lastUpdateTime = millis();
    }

    background(backgroundColor);
    generateSentence();
  }
}

function drawSwitch() {
  const numerals = ["I", "II", "III"];
  let sectionWidth = switchWidth / numStates;
  textSize(30);

  for (let i = 0; i < numStates; i++) {
    let sectionX = switchX + i * sectionWidth;

    fill(220);
    rect(sectionX, switchY, sectionWidth, switchHeight);

    fill(i + 1 === currentState ? "green" : "black");
    text(numerals[i], sectionX + sectionWidth / 2, switchY + switchHeight / 2);
  }
}

function generateSentence() {
  var grammar = tracery.createGrammar(grammarSource);
  grammar.addModifiers(tracery.baseEngModifiers);

  let validEmotions;
  if (currentState === 1) {
    validEmotions = ["happy", "sad", "angry"];
  } else {
    validEmotions = [
      "happy",
      "sad",
      "angry",
      "ecstatic",
      "miserable",
      "furious",
    ];
  }

  let emotion, action, actionCategory;
  let newSentence = "";

  do {
    emotion = grammar.flatten("#emotion#");
    while (!validEmotions.includes(emotion)) {
      emotion = grammar.flatten("#emotion#");
    }

    if (currentState === 3) {
      let actionCategories = Object.keys(grammarSource).filter((key) =>
        key.endsWith("_action")
      );
      actionCategory = random(actionCategories);
      action = grammar.flatten(`#${actionCategory}#`);
    } else {
      actionCategory = `${emotion}_action`;
      action = grammar.flatten(`#${actionCategory}#`);
    }

    let actionEmotion = actionCategory.replace("_action", "");

    newSentence = `I am ${emotion}, so I ${action}.`;
  } while (newSentence === lastSentence); // Uniqueness Check!

  lastSentence = newSentence;

  background(backgroundColor);

  let x = width / 2;
  let y = height / 2.5;

  // Define colors for different emotions
  let colors = {
    happy: [255, 204, 0], // Yellow
    sad: [0, 0, 255], // Blue
    angry: [255, 0, 0], // Red
    ecstatic: [255, 165, 0], // Orange
    miserable: [128, 0, 128], // Purple
    furious: [139, 0, 0], // Dark Red
  };

  let emotionColor = colors[emotion] || [0]; // Default black
  let actionColor = colors[actionCategory.replace("_action", "")] || [0]; // Default black

  // Set base text color
  fill(0);
  textAlign(CENTER, CENTER);
  text("I am", x, y);

  // Set color for emotion
  fill(emotionColor);
  text(emotion + ",", x, y + 50);

  // Reset color for rest of sentence
  fill(0);
  text("so I", x, y + 100);

  // Highlight action with its own color
  fill(actionColor);
  text(action + ".", x, y + 150);

  generateTone();
}

function generateTone() {
  let duration = 0.5;

  if (currentState !== 3) {
    osc3.amp(0, 0.5);
  }

  if (currentState === 1) {
    // State 1: Single beep
    osc1.amp(0.1);
    setTimeout(() => osc1.amp(0, 0.2), duration * 1000);
  } else if (currentState === 2) {
    // State 2: Two beeps
    osc1.amp(0.02);
    osc2.amp(0.02);
    setTimeout(() => {
      osc1.amp(0, 0.4);
      osc2.amp(0, 0.4);
    }, duration * 1000);
  } else if (currentState === 3) {
    // State 3: Two beeps + continuous quiet tone
    osc1.amp(0.1);
    osc2.amp(0.02);
    osc3.amp(0.02);

    setTimeout(() => {
      osc1.amp(0, 0.2);
      osc2.amp(0, 0.2);
    }, duration * 1000);
  }
}

var grammarSource = {
  emotion: ["happy", "sad", "angry", "ecstatic", "miserable", "furious"],

  happy_action: [
    "played with my cat",
    "danced around",
    "sang a song",
    "went for a walk",
    "smiled at strangers",
  ],

  sad_action: [
    "laid in bed",
    "stared out the window",
    "wrote in my journal",
    "listened to sad music",
    "hugged a pillow",
  ],

  angry_action: [
    "punched a pillow",
    "shouted into the void",
    "went for a run",
    "scribbled furiously in my notebook",
    "took deep breaths to calm down",
  ],

  ecstatic_action: [
    "climbed onto my roof and screamed with joy",
    "danced until I collapsed from exhaustion",
    "laughed until my stomach hurt",
    "sent 'I love you' texts to every single person in my contacts",
    "ran outside in the pouring rain, arms outstretched",
  ],

  miserable_action: [
    "buried myself under a mountain of blankets",
    "stared at the ceiling for hours",
    "listened to the same heartbreak song on repeat",
    "walked aimlessly through the city at night",
    "deleted every contact from my phone",
  ],

  furious_action: [
    "punched a hole through my wall",
    "sprinted nonstop, ignoring the pain of fatigue",
    "threw my phone at the wall, shattering it",
    "screamed into a jar and sealed it",
    "poured my anger into a 2,000-word manifesto",
  ],
};
