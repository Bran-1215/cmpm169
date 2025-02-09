// M_6_1_01
//
// Generative Gestaltung – Creative Coding im Web
// ISBN: 978-3-87439-902-9, First Edition, Hermann Schmidt, Mainz, 2018
// Benedikt Groß, Hartmut Bohnacker, Julia Laub, Claudius Lazzeroni
// with contributions by Joey Lee and Niels Poldervaart
// Copyright 2018
//
// http://www.generative-gestaltung.de
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * distribute nodes on the display by letting them repel each other
 *
 * KEYS
 * r             : reset positions
 * s             : save png
 */

"use strict";

var sketch = function (p) {
  // An array with nodes
  var nodes = [];

  var nodeCount = 100;

  p.setup = function () {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent("canvas-container");
    p.noStroke();

    // Create nodes
    createNodes();
  };

  let attractToMouse = false; // Track attraction state

  p.mousePressed = function () {
    attractToMouse = true; // Enable attraction when mouse is pressed
  };

  p.mouseReleased = function () {
    attractToMouse = false; // Disable attraction when mouse is released
  };

  p.draw = function () {
    p.fill(255, 20);
    p.rect(0, 0, p.width, p.height);

    p.fill(0);
    for (var i = 0; i < nodes.length; i++) {
      // Apply mouse repelling force to nodes
      nodes[i].repelFromMouse(p.mouseX, p.mouseY, attractToMouse);

      // Let all nodes repel each other
      nodes[i].attractNodes(nodes);
      // Apply velocity vector and update position
      nodes[i].update();
      // Draw node
      p.push();
      p.translate(nodes[i].x, nodes[i].y);
      p.rotate(nodes[i].angle);
      p.fill(nodes[i].color);
      p.ellipse(0, 0, 30, 10);
      p.pop();
    }
  };

  p.keyPressed = function () {
    if (p.key == "s" || p.key == "S") p.saveCanvas(gd.timestamp(), "png");
    if (p.key == "r" || p.key == "R") {
      p.background(255);
      createNodes();
    }
  };

  function createNodes() {
    nodes = [];
    for (var i = 0; i < nodeCount; i++) {
      nodes.push(
        new Node(
          p.width / 2 + p.random(-1, 1),
          p.height / 2 + p.random(-1, 1),
          5,
          p.width - 5,
          5,
          p.height - 5
        )
      );
    }
  }
};

if (typeof window.myp5 === "undefined") {
  window.myp5 = new p5(sketch, "canvas-container");
}
