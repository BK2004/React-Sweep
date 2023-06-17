import { useState } from 'react';

const SQUARE_TYPES = {
  Empty: 0,
  Bomb: 1,
  Uninitialized: 2
}

const GRID_WIDTH = 7;
const GRID_HEIGHT = 7;

let squares = []

function App() {
  const [screen, setScreen] = useState(0);

  return (
    <>
      { screen === 0 ? <Menu toGridScreen={() => { setScreen(1); squares = Array(GRID_HEIGHT * GRID_WIDTH).fill(SQUARE_TYPES.Uninitialized); }} /> : <Grid backToMenu={() => { setScreen(0); }} bombCount={Math.floor(GRID_HEIGHT * GRID_WIDTH * 0.125)} /> }
      { screen === 1 && <Darken /> }
    </>
  );
}

function Darken() {
  return <div className="grey-out"></div>
}

function Menu({ toGridScreen }) {
  return (
    <>
      <button className="play-button" onClick={toGridScreen}>Play</button>
    </>
  )
}

function Grid({ backToMenu, bombCount }) {
  const [squareVals, setSquareVals] = useState(Array(GRID_WIDTH * GRID_HEIGHT).fill(""));
  const [hidden, setHidden] = useState(Array(GRID_HEIGHT * GRID_WIDTH).fill(true));
  const [gameActive, setGameActive] = useState(true);
  const [numRevealed, setNumRevealed] = useState(0);

  checkAllRevealed();

  // Check if all tiles have been revealed
  function checkAllRevealed() {
    if (gameActive && numRevealed === (GRID_WIDTH * GRID_HEIGHT) - bombCount) {
      // all has been revealed, end game
      setGameActive(false);
    }
  }

  // Left click interaction (Reveal tiles)
  function handleLeftClick(index) {
    // Send back to menu if game finished
    if (!gameActive) {
      backToMenu();
    }

    if (!hidden[index] || squareVals[index] === "F") { return; }

    // Initialize grid
    if (squares[index] === SQUARE_TYPES.Uninitialized) {
      GenerateGrid(GRID_WIDTH, GRID_HEIGHT, index, bombCount);
    }

    let count = 0;
    // Check if tile is a bomb
    if (squares[index] === SQUARE_TYPES.Bomb) {
      count = "B";
      setGameActive(false);
    } else {
      // Count adjacent bombs
      count = CountAdjacent(index);

      // Recursively reveal all empty elements and their adjacent tiles
      if (count === 0) {
        let valsC = squareVals.slice();
        let hiddenC = hidden.slice();
        let pos = GetCoords(index);
        let newReveals = RecursiveReveal(hiddenC, valsC, pos.x, pos.y);

        setNumRevealed(numRevealed + newReveals);
        setSquareVals(valsC);
        setHidden(hiddenC);

        return;
      }
    }

    let valCopy = squareVals.slice();
    let hiddenCopy = hidden.slice();
    valCopy[index] = (count > 0 || count === "B" ? count : "");
    hiddenCopy[index] = false;
    setSquareVals(valCopy);
    setHidden(hiddenCopy);
    setNumRevealed(numRevealed + 1);

    if (count === "B") {
      // Slowly reveal all bombs
      let bCount = 0;
      const g = document.querySelector('.grid');
      for (let i = 0; i < GRID_HEIGHT * GRID_WIDTH; i++) {
        if (squares[i] === SQUARE_TYPES.Bomb) {
          bCount++;

          setTimeout(() => {
            if (g.parentElement === null) { return; }
            const sqr = g.querySelector(`.square[data-index="${i}"]`);
            if (sqr === null) { return; }

            sqr.dataset.hidden = "false";
            sqr.dataset.value = "B";
            sqr.innerHTML = "";
          }, 40 * bCount)
        }
      }
    }
  }

  // Right click interaction (adds and removes flag)
  function handleRightClick(index) {
    if (!gameActive || !hidden[index]) { return; }

    let valCopy = squareVals.slice();
    valCopy[index] = valCopy[index] === "F" ? "" : "F";
    setSquareVals(valCopy);

    return null;
  }

  SetDisplayVariables();

  return (
    <div className="grid">
      {squareVals.map((val, i) => {
        return <Square key={i} squareIndex={i} value={val} hidden={hidden[i]} onclick={() => {return handleLeftClick(i)}} onrightclick={(e) => {e.preventDefault(); return handleRightClick(i)}} />;
      })}
    </div>
  )
}

function Square({ squareIndex, value, hidden, onclick, onrightclick }) {
  return (
    <button className="square" data-index={squareIndex} data-value={value} data-hidden={hidden} onClick={onclick} onContextMenu={onrightclick}>{value !== "B" ? value : ""}</button>
  )
}

// Recursively reveals adjacent tiles to an empty space and all adjacent empty spaces
function RecursiveReveal(hiddenArr, valArr, x, y) {
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) {
    return 0;
  }

  const index = GetSquareIndex(x, y);

  if (hiddenArr[index] === false || valArr[index] === "F") { return 0; }
  const c = CountAdjacent(index);
  if (c !== 0) {
    hiddenArr[index] = false;
    valArr[index] = c;

    return 1;
  }

  hiddenArr[index] = false;
  valArr[index] = "";
  let revealed = 1;

  for (let i = x - 1; i <= x + 1; i++) {
    for (let j = y - 1; j <= y + 1; j++) {
      if (!(i === x & j === y)) {
        revealed += RecursiveReveal(hiddenArr, valArr, i, j);
      }
    }
  }

  return revealed;
}

// Counts bombs nearby
function CountAdjacent(index) {
  let count = 0;
  let pos = GetCoords(index);
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      let sqIndex = GetSquareIndex(pos.x + x, pos.y + y);
      if (!(x === 0 && y === 0) && sqIndex !== null && squares[sqIndex] === SQUARE_TYPES.Bomb) { count += 1; }
    }
  }

  return count;
}

// Generates the grid for each game, filling in specified bombCount and empties.
function GenerateGrid(width, height, startingSquareIndex, bombCount) {
  const pos = GetCoords(startingSquareIndex);
  squares[startingSquareIndex] = SQUARE_TYPES.Empty;

  // Fill adjacent squares with 'Empty'
  const i1 = GetSquareIndex(pos.x + 1, pos.y);
  if (i1 !== null) {
    squares[i1] = SQUARE_TYPES.Empty;
  }

  const i2 = GetSquareIndex(pos.x - 1, pos.y);
  if (i2 !== null) {
    squares[i2] = SQUARE_TYPES.Empty;
  }

  const i3 = GetSquareIndex(pos.x, pos.y + 1);
  if (i3 !== null) {
    squares[i3] = SQUARE_TYPES.Empty;
  }

  const i4 = GetSquareIndex(pos.x, pos.y - 1);
  if (i4 !== null) {
    squares[i4] = SQUARE_TYPES.Empty;
  }
  
  for (let i = 0; i < bombCount; i++) {
    let r;
    do {
      r = Math.floor(Math.random() * width * height);
    } while (squares[r] === SQUARE_TYPES.Bomb || squares[r] === SQUARE_TYPES.Empty)

    squares[r] = SQUARE_TYPES.Bomb;
  }

  for (let i = 0; i < GRID_WIDTH * GRID_HEIGHT; i++) {
    if (squares[i] === SQUARE_TYPES.Uninitialized) { squares[i] = SQUARE_TYPES.Empty; }
  }

}

// Get index from coordinate points
function GetSquareIndex(x, y) {
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) { return null }
  return y * GRID_WIDTH + x;
}

// Get coordinate points from index
function GetCoords(index) {
  return {
    y: Math.floor(index/GRID_WIDTH),
    x: index % GRID_WIDTH
  }
}

// Calculate new CSS display variables based on device and GRID presets
function SetDisplayVariables() {
  const root = document.querySelector(":root");

  root.style.setProperty("--grid-width", GRID_WIDTH);
  root.style.setProperty("--grid-height", GRID_HEIGHT);
}

export default App;