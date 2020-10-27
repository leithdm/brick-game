let ballX = 75;
let ballY = 75;
let ballSpeedX = 5;
let ballSpeedY = 3;

const BRICK_W = 80;
const BRICK_H = 20;
const BRICK_GAP = 2;
const BRICK_COLS = 10;
const BRICK_ROWS = 8;
let brickGrid = new Array(BRICK_COLS * BRICK_ROWS);
let bricksLeft = 0;

const PADDLE_WIDTH = 100;
const PADDLE_THICKNESS = 10;
const PADDLE_DIST_FROM_EDGE = 60; //10% of height of canvas
let paddleX = 400;

let canvas, context;

let mouseX = 6;
let mouseY = 4;

function calculateMousePos(evt) {
  let rect = canvas.getBoundingClientRect();
  let root = document.documentElement;

  mouseX = evt.clientX - rect.left - root.scrollLeft;
  mouseY = evt.clientY - rect.top - root.scrollTop;
  paddleX = mouseX - PADDLE_WIDTH / 2;

  //test to check ball in any position
  // ballX = mouseX;
  // ballY = mouseY;
  // ballSpeedX = -1;
  // ballSpeedY = -1;
}

function brickReset() {
  bricksLeft = 0;
  let i;
  //create x3 blanks rows to begin with
  for (i = 0; i < 3 * BRICK_COLS; i++) {
    brickGrid[i] = false;
  }
  for (; i < BRICK_COLS * BRICK_ROWS; i++) {
    brickGrid[i] = true;
    bricksLeft++;
  }
}

window.onload = () => {
  canvas = document.getElementById("gameCanvas");
  context = canvas.getContext("2d");
  let framesPerSecond = 60;

  setInterval(() => {
    moveAll();
    drawAll();
  }, 1000 / framesPerSecond);

  canvas.addEventListener("mousemove", calculateMousePos);

  brickReset();
  ballReset();
};

function ballReset() {
  ballX = canvas.width / 2;
  ballY = canvas.height / 2;
}

function ballMove() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  if (ballX < 0 && ballSpeedX < 0.0) {
    //left, and remove ball-stuck-edge bug
    ballSpeedX = -ballSpeedX;
  }

  if (ballX > canvas.width && ballSpeedX > 0.0) {
    //right, and remove ball-stuck-edge bug
    ballSpeedX = -ballSpeedX;
  }

  if (ballY < 0 && ballSpeedY < 0.0) {
    //top
    ballSpeedY = -ballSpeedY;
  }

  if (ballY > canvas.height) {
    //bottom
    ballReset();
    brickReset(); //instead of lives, reset bricks
  }
}

function ballBrickHandling() {
  var ballBrickCol = Math.floor(ballX / BRICK_W);
  var ballBrickRow = Math.floor(ballY / BRICK_H);
  var brickIndexUnderBall = rowColToArrayIndex(ballBrickCol, ballBrickRow);

  if (
    ballBrickCol >= 0 &&
    ballBrickCol < BRICK_COLS &&
    ballBrickRow >= 0 &&
    ballBrickRow < BRICK_ROWS
  ) {
    if (brickGrid[brickIndexUnderBall]) {
      //remove the brick
      brickGrid[brickIndexUnderBall] = false;
      bricksLeft--;

      //determine how to handle ball trajectory
      var prevBallX = ballX - ballSpeedX;
      var prevBallY = ballY - ballSpeedY;
      var prevBrickCol = Math.floor(prevBallX / BRICK_W);
      var prevBrickRow = Math.floor(prevBallY / BRICK_H);
      // console.log("previous column :" + prevBrickCol);
      // console.log("previous row: " + prevBrickRow);

      var bothTestsFailed = true;

      //coming from other column to the left or right of hit-block, but same row,
      //Therefore: hitting edge-side of hit-brick
      if (prevBrickCol != ballBrickCol) {
        //check if there is an adjacent brick to the left (or right) of hit-brick
        //if no adjacent left or right brick, ball bounces off hit-brick
        var adjBrickSide = rowColToArrayIndex(prevBrickCol, ballBrickRow);
        if (brickGrid[adjBrickSide] == false) {
          console.log("adjacent side-brick: " + adjBrickSide);
          ballSpeedX *= -1;
          bothTestsFailed = false;
        }
      }
      //coming from row below or above the hit-block, but the same column
      //Therfore: hitting top or bottom long-side of hit-brick
      if (prevBrickRow != ballBrickRow) {
        var adjBrickTopBot = rowColToArrayIndex(ballBrickCol, prevBrickRow);
        //check if there is a brick on top (or bottom) of the hit-brick
        if (brickGrid[adjBrickTopBot] == false) {
          console.log("top-bottom brick: " + adjBrickTopBot);
          //if no top or bottom brick, ball bounces off the hit-brick
          ballSpeedY *= -1;
          bothTestsFailed = false;
        }
      }
      //arm-pit bug and bug for first-row
      if (bothTestsFailed) {
        ballSpeedY *= -1;
      }
    } // end of brick found
  } // end of valid col and row
} // end of ballBrickHandling func

function ballPaddleHandling() {
  //the four edges of the paddle
  let paddleTopEdgeY = canvas.height - PADDLE_DIST_FROM_EDGE;
  let paddleBottomEdgeY = paddleTopEdgeY + PADDLE_THICKNESS;
  let paddleLeftEdgeX = paddleX;
  let paddleRightEdgeX = paddleLeftEdgeX + PADDLE_WIDTH;

  //logic to see if ball hits the paddle
  if (
    ballY > paddleTopEdgeY && // ball is below the top of paddle
    ballY < paddleBottomEdgeY && //ball is above bottom of paddle
    ballX > paddleLeftEdgeX && //ball is to the right of the paddle left-edge
    ballX < paddleRightEdgeX
  ) {
    //ball is to the left of the paddle right edge

    ballSpeedY = -ballSpeedY;

    let centerOfPaddleX = paddleX + PADDLE_WIDTH / 2;
    let ballDistFromPaddleCenterX = ballX - centerOfPaddleX;
    ballSpeedX = ballDistFromPaddleCenterX * 0.35;
  }

  //if we are out of bricks and the ball touches the paddle, reset the bricks.
  if (bricksLeft == 0) {
    brickReset();
  }
}

function moveAll() {
  ballMove();
  ballBrickHandling();
  ballPaddleHandling();
}

function rowColToArrayIndex(col, row) {
  return col + BRICK_COLS * row;
}

function drawBricks() {
  for (let i = 0; i < BRICK_ROWS; i++) {
    for (let j = 0; j < BRICK_COLS; j++) {
      // context.fillStyle = 'rgb(' + Math.floor(255 - 22.5 * i) + ', ' +
      //     Math.floor(255 - 22.5 * j) + ', 0)';
      //pretty neat. To find the exact brick we check the array by using logic below
      let arrayIndex = rowColToArrayIndex(j, i); //an entire row has 8 breaks. so the
      //10th brick will be (8 * 1) + 2
      if (brickGrid[arrayIndex]) {
        colorRect(
          BRICK_W * j,
          BRICK_H * i,
          BRICK_W - BRICK_GAP,
          BRICK_H - BRICK_GAP,
          "blue"
        );
      }
    }
  }
}

function drawAll() {
  //clear screen
  context.fillStyle = "rgb(0, 0, 0)";
  context.fillRect(0, 0, canvas.width, canvas.height);
  // colorRect(0, 0, canvas.width, canvas.height, "black");

  //draw ball
  colorCircle(ballX, ballY, 10, "white");

  //draw paddle
  colorRect(
    paddleX,
    canvas.height - PADDLE_DIST_FROM_EDGE,
    PADDLE_WIDTH,
    PADDLE_THICKNESS,
    "white"
  );

  drawBricks();
}

function colorRect(topLeftX, topLeftY, boxWidth, boxHeight, boxColor) {
  context.fillStyle = boxColor;
  context.fillRect(topLeftX, topLeftY, boxWidth, boxHeight);
}

function colorCircle(centerX, centerY, radius, fillColor) {
  context.fillStyle = fillColor;
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
  context.fill();
}

function colorText(showWords, textX, textY, fillColor) {
  context.fillStyle = fillColor;
  context.fillText(showWords, textX, textY);
}
