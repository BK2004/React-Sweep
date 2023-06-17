import { useState } from 'react';

const SQUARE_TYPES = {
  Empty: 0,
  Bomb: 1,
  Uninitialized: 2
}

const GRID_WIDTH = 15;
const GRID_HEIGHT = 15;

let squares = []

function App() {
  const [screen, setScreen] = useState(0);

  return (
    <>
      { screen === 0 ? <Menu toGridScreen={() => { setScreen(1); squares = Array(GRID_HEIGHT * GRID_WIDTH).fill(SQUARE_TYPES.Uninitialized); }} /> : <Grid backToMenu={() => { setScreen(0); }} /> }
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

function Grid({ backToMenu }) {
  const [squareVals, setSquareVals] = useState(Array(GRID_WIDTH * GRID_HEIGHT).fill(""));
  const [hidden, setHidden] = useState(Array(GRID_HEIGHT * GRID_WIDTH).fill(true));
  const [flagged, setFlagged] = useState(Array(GRID_HEIGHT * GRID_WIDTH).fill(false));
  const [gameActive, setGameActive] = useState(true);

  // Left click interaction (Reveal tiles)
  function handleLeftClick(index) {
    // Send back to menu if game finished
    if (!gameActive) {
      backToMenu();
    }

    if (!hidden[index] || flagged[index]) { return; }

    // Initialize grid
    if (squares[index] === SQUARE_TYPES.Uninitialized) {
      GenerateGrid(GRID_WIDTH, GRID_HEIGHT, index);
    }

    let count = 0;
    // Check if tile is a bomb
    if (squares[index] === SQUARE_TYPES.Bomb) {
      count = "B";
      setGameActive(false);
    } else {
      // Count adjacent bombs
      let pos = GetCoords(index);
      for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
          let sqIndex = GetSquareIndex(pos.x + x, pos.y + y);
          if (!(x === 0 && y === 0) && sqIndex !== null && squares[sqIndex] === SQUARE_TYPES.Bomb) { count += 1; }
        }
      }
    }

    let valCopy = squareVals.slice();
    let hiddenCopy = hidden.slice();
    valCopy[index] = (count > 0 || count === "B" ? count : "");
    hiddenCopy[index] = false;
    setSquareVals(valCopy);
    setHidden(hiddenCopy);

    if (count === "B") {
      // Slowly reveal all bombs
      let bCount = 0;
      for (let i = 0; i < GRID_HEIGHT * GRID_WIDTH; i++) {
        if (squares[i] === SQUARE_TYPES.Bomb) {
          bCount++;

          setTimeout(() => {
            const sqr = document.querySelector(`.square[data-index="${i}"]`);
            if (sqr === null) { return; }

            sqr.dataset.hidden="false";
            sqr.dataset.value="B";
          }, 40 * bCount)
        }
      }
    }
  }

  // Right click interaction (adds and removes flag)
  function handleRightClick(index) {
    if (!gameActive || !hidden[index]) { return; }

    let flagCopy = flagged.slice();
    flagCopy[index] = !flagCopy[index];
    setFlagged(flagCopy);

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

function GenerateGrid(width, height, startingSquareIndex) {
  squares[startingSquareIndex] = SQUARE_TYPES.Empty;
  for (let i = 0; i <= Math.floor(width * height * 0.2); i++) {
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

function GetSquareIndex(x, y) {
  if (x < 0 || y < 0 || x >= GRID_WIDTH || y >= GRID_HEIGHT) { return null }
  return y * GRID_WIDTH + x;
}

function GetCoords(index) {
  return {
    y: Math.floor(index/GRID_WIDTH),
    x: index % GRID_WIDTH
  }
}

function SetDisplayVariables() {
  const root = document.querySelector(":root");

  root.style.setProperty("--grid-width", GRID_WIDTH);
  root.style.setProperty("--grid-height", GRID_HEIGHT);
}

export default App;