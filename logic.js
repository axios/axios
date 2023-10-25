// Create a canvas element and set its width and height to match the window size
var w = c.width = window.innerWidth,
    h = c.height = window.innerHeight,
    ctx = c.getContext('2d');

// Configuration options for the visualization
var opts = {
    range: 180, // Range for various parameters
    baseConnections: 3, // Base number of connections for a node
    addedConnections: 5, // Additional connections for a node
    baseSize: 5, // Base size of a node
    minSize: 1, // Minimum size for a node
    dataToConnectionSize: 0.4, // Data size relative to connection size
    sizeMultiplier: 0.7, // Multiplier for node size
    allowedDist: 40, // Maximum allowed distance for connections
    baseDist: 40, // Base distance for connections
    addedDist: 30, // Additional distance for connections
    connectionAttempts: 100, // Maximum attempts to create a connection

    dataToConnections: 1, // Data points per connection
    baseSpeed: 0.04, // Base speed of data points
    addedSpeed: 0.05, // Additional speed of data points
    baseGlowSpeed: 0.4, // Base glow speed for connections
    addedGlowSpeed: 0.4, // Additional glow speed for connections

    rotVelX: 0.003, // Rotation velocity on the X-axis
    rotVelY: 0.002, // Rotation velocity on the Y-axis

    repaintColor: '#111', // Color for canvas repaint
    connectionColor: 'hsla(200,60%,light%,alp)', // Color for connections
    rootColor: 'hsla(0,60%,light%,alp)', // Color for the root connection
    endColor: 'hsla(160,20%,light%,alp)', // Color for end connections
    dataColor: 'hsla(40,80%,light%,alp)', // Color for data points

    wireframeWidth: 0.1, // Width of the wireframe
    wireframeColor: '#88f', // Color for wireframes

    depth: 250, // Depth of the 3D visualization
    focalLength: 250, // Focal length for perspective
    vanishPoint: {
        x: w / 2, // Vanishing point's X-coordinate
        y: h / 2  // Vanishing point's Y-coordinate
    }
};

// Calculate some square-related values
var squareRange = opts.range * opts.range,
    squareAllowed = opts.allowedDist * opts.allowedDist,
    mostDistant = opts.depth + opts.range,
    sinX = sinY = 0, // Initialize sine values
    cosX = cosY = 0; // Initialize cosine values

// Arrays to store connections, data points, and all elements
var connections = [],
    toDevelop = [],
    data = [],
    all = [];

var tick = 0; // Counter for animation frames
var totalProb = 0; // Total probability counter

var animating = false; // Flag to control animation

var Tau = Math.PI * 2; // Constant for a full circle in radians

// Set the initial fill color for the canvas
ctx.fillStyle = '#222';

// Fill the entire canvas with the initial color
ctx.fillRect(0, 0, w, h);

// Set the fill color for text
ctx.fillStyle = '#ccc';

// Set the font for text rendering
ctx.font = '50px Verdana';

// Display a loading message at the center of the canvas
ctx.fillText('Calculating Nodes', w / 2 - ctx.measureText('Calculating Nodes').width / 2, h / 2 - 15);

// Initialize the visualization after a short delay
window.setTimeout(init, 4);

// Initialization function
function init() {
    // Clear arrays to prepare for initialization
    connections.length = 0;
    data.length = 0;
    all.length = 0;
    toDevelop.length = 0;

    // Create the root connection
    var connection = new Connection(0, 0, 0, opts.baseSize);
    connection.step = Connection.rootStep;
    connections.push(connection);
    all.push(connection);
    connection.link();

    // Continue developing connections
    while (toDevelop.length > 0) {
        toDevelop[0].link();
        toDevelop.shift();
    }

    // Start the animation if not already animating
    if (!animating) {
        animating = true;
        anim();
    }
}

// Define a constructor for Connection objects
function Connection(x, y, z, size) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.size = size;

    this.screen = {};

    this.links = [];
    this.probabilities = [];
    this.isEnd = false;

    this.glowSpeed = opts.baseGlowSpeed + opts.addedGlowSpeed * Math.random();
}

// Define the link method for Connection objects
Connection.prototype.link = function () {

if (this.size < opts.minSize)
  return this.isEnd = true;

var links = [],
  connectionsNum = opts.baseConnections + Math.random() * opts.addedConnections | 0,
  attempt = opts.connectionAttempts,

  alpha, beta, len,
  cosA, sinA, cosB, sinB,
  pos = {},
  passedExisting, passedBuffered;

while (links.length < connectionsNum && --attempt > 0) {

  alpha = Math.random() * Math.PI;
  beta = Math.random() * Tau;
  len = opts.baseDist + opts.addedDist * Math.random();

  cosA = Math.cos(alpha);
  sinA = Math.sin(alpha);
  cosB = Math.cos(beta);
  sinB = Math.sin(beta);

  pos.x = this.x + len * cosA * sinB;
  pos.y = this.y + len * sinA * sinB;
  pos.z = this.z + len * cosB;

  if (pos.x * pos.x + pos.y * pos.y + pos.z * pos.z < squareRange) {

    passedExisting = true;
    passedBuffered = true;
    for (var i = 0; i < connections.length; ++i)
      if (squareDist(pos, connections[i]) < squareAllowed)
        passedExisting = false;

    if (passedExisting)
      for (var i = 0; i < links.length; ++i)
        if (squareDist(pos, links[i]) < squareAllowed)
          passedBuffered = false;

    if (passedExisting && passedBuffered)
      links.push({ x: pos.x, y: pos.y, z: pos.z });

  }

}

if (links.length === 0)
  this.isEnd = true;
else {
  for (var i = 0; i < links.length; ++i) {

    var pos = links[i],
      connection = new Connection(pos.x, pos.y, pos.z, this.size * opts.sizeMultiplier);

    this.links[i] = connection;
    all.push(connection);
    connections.push(connection);
  }
  for (var i = 0; i < this.links.length; ++i)
    toDevelop.push(this.links[i]);
}
}
Connection.prototype.step = function () {

this.setScreen();
this.screen.color = (this.isEnd ? opts.endColor : opts.connectionColor).replace('light', 30 + ((tick * this.glowSpeed) % 30)).replace('alp', .2 + (1 - this.screen.z / mostDistant) * .8);

for (var i = 0; i < this.links.length; ++i) {
  ctx.moveTo(this.screen.x, this.screen.y);
  ctx.lineTo(this.links[i].screen.x, this.links[i].screen.y);
}
}
Connection.rootStep = function () {
this.setScreen();
this.screen.color = opts.rootColor.replace('light', 30 + ((tick * this.glowSpeed) % 30)).replace('alp', (1 - this.screen.z / mostDistant) * .8);

for (var i = 0; i < this.links.length; ++i) {
  ctx.moveTo(this.screen.x, this.screen.y);
  ctx.lineTo(this.links[i].screen.x, this.links[i].screen.y);
}
}
Connection.prototype.draw = function () {
ctx.fillStyle = this.screen.color;
ctx.beginPath();
ctx.arc(this.screen.x, this.screen.y, this.screen.scale * this.size, 0, Tau);
ctx.fill();
}
function Data(connection) {

this.glowSpeed = opts.baseGlowSpeed + opts.addedGlowSpeed * Math.random();
this.speed = opts.baseSpeed + opts.addedSpeed * Math.random();

this.screen = {};

this.setConnection(connection);
}
Data.prototype.reset = function () {

this.setConnection(connections[0]);
this.ended = 2;
}
Data.prototype.step = function () {

this.proportion += this.speed;

if (this.proportion < 1) {
  this.x = this.ox + this.dx * this.proportion;
  this.y = this.oy + this.dy * this.proportion;
  this.z = this.oz + this.dz * this.proportion;
  this.size = (this.os + this.ds * this.proportion) * opts.dataToConnectionSize;
} else
  this.setConnection(this.nextConnection);

this.screen.lastX = this.screen.x;
this.screen.lastY = this.screen.y;
this.setScreen();
this.screen.color = opts.dataColor.replace('light', 40 + ((tick * this.glowSpeed) % 50)).replace('alp', .2 + (1 - this.screen.z / mostDistant) * .6);

}
Data.prototype.draw = function () {

if (this.ended)
  return --this.ended; // not sre why the thing lasts 2 frames, but it does

ctx.beginPath();
ctx.strokeStyle = this.screen.color;
ctx.lineWidth = this.size * this.screen.scale;
ctx.moveTo(this.screen.lastX, this.screen.lastY);
ctx.lineTo(this.screen.x, this.screen.y);
ctx.stroke();
}
Data.prototype.setConnection = function (connection) {

if (connection.isEnd)
  this.reset();

else {

  this.connection = connection;
  this.nextConnection = connection.links[connection.links.length * Math.random() | 0];

  this.ox = connection.x; // original coordinates
  this.oy = connection.y;
  this.oz = connection.z;
  this.os = connection.size; // base size

  this.nx = this.nextConnection.x; // new
  this.ny = this.nextConnection.y;
  this.nz = this.nextConnection.z;
  this.ns = this.nextConnection.size;

  this.dx = this.nx - this.ox; // delta
  this.dy = this.ny - this.oy;
  this.dz = this.nz - this.oz;
  this.ds = this.ns - this.os;

  this.proportion = 0;
}
}
Connection.prototype.setScreen = Data.prototype.setScreen = function () {

var x = this.x,
  y = this.y,
  z = this.z;

// apply rotation on X axis
var Y = y;
y = y * cosX - z * sinX;
z = z * cosX + Y * sinX;

// rot on Y
var Z = z;
z = z * cosY - x * sinY;
x = x * cosY + Z * sinY;

this.screen.z = z;

// translate on Z
z += opts.depth;

this.screen.scale = opts.focalLength / z;
this.screen.x = opts.vanishPoint.x + x * this.screen.scale;
this.screen.y = opts.vanishPoint.y + y * this.screen.scale;

}
function squareDist(a, b) {

var x = b.x - a.x,
  y = b.y - a.y,
  z = b.z - a.z;

return x * x + y * y + z * z;
}

function anim() {

window.requestAnimationFrame(anim);

ctx.globalCompositeOperation = 'source-over';
ctx.fillStyle = opts.repaintColor;
ctx.fillRect(0, 0, w, h);

++tick;

var rotX = tick * opts.rotVelX,
  rotY = tick * opts.rotVelY;

cosX = Math.cos(rotX);
sinX = Math.sin(rotX);
cosY = Math.cos(rotY);
sinY = Math.sin(rotY);

if (data.length < connections.length * opts.dataToConnections) {
  var datum = new Data(connections[0]);
  data.push(datum);
  all.push(datum);
}

ctx.globalCompositeOperation = 'lighter';
ctx.beginPath();
ctx.lineWidth = opts.wireframeWidth;
ctx.strokeStyle = opts.wireframeColor;
all.map(function (item) { item.step(); });
ctx.stroke();
ctx.globalCompositeOperation = 'source-over';
all.sort(function (a, b) { return b.screen.z - a.screen.z });
all.map(function (item) { item.draw(); });


}

window.addEventListener('resize', function () {

opts.vanishPoint.x = (w = c.width = window.innerWidth) / 2;
opts.vanishPoint.y = (h = c.height = window.innerHeight) / 2;
ctx.fillRect(0, 0, w, h);
});
window.addEventListener('click', init);

