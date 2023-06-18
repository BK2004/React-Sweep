import { useState } from 'react';

const SQUARE_TYPES = {
  Empty: 0,
  Bomb: 1,
  Uninitialized: 2
}

const EASY_PRESET = 9;
const MEDIUM_PRESET = 15;
const HARD_PRESET = 23;

let squares = []

function App() {
  const [screen, setScreen] = useState(0);
  const [tileCount, setTileCount] = useState(MEDIUM_PRESET);

  return (
    <>
      { screen === 0 ? <Menu tileCount={tileCount} setTileCount={setTileCount} toGridScreen={() => { setScreen(1); squares = Array(tileCount ** 2).fill(SQUARE_TYPES.Uninitialized); }} /> : <Grid backToMenu={() => { setScreen(0); }} bombCount={Math.floor(tileCount ** 2 * (tileCount/HARD_PRESET*0.2)) - 1} tileCount={tileCount ** 2} /> }
      { screen === 1 && <Darken /> }
    </>
  );
}

function Darken() {
  return <div className="grey-out"></div>
}

function Menu({ toGridScreen, tileCount, setTileCount }) {
  return (
    <>
      <button className="play-button" onClick={toGridScreen}>Play</button>
      <div className="tile-setter">
        <div className="preset-container">
          <button className="slider-preset" onClick={() => setTileCount(EASY_PRESET)}>Easy</button>
          <button className="slider-preset" onClick={() => setTileCount(MEDIUM_PRESET)}>Medium</button>
          <button className="slider-preset" onClick={() => setTileCount(HARD_PRESET)}>Hard</button>
        </div>
        <div className="slider-wrap">
          <input className="tile-slider" type="range" min="7" max="27" step="2" value={tileCount} onChange={(e) => {
            setTileCount(e.target.value);
          }}></input>
          <p className="slider-label">{"Grid Size: " + tileCount**2 + ` (${tileCount}x${tileCount})`}</p>
        </div>
      </div>
    </>
  )
}

function Grid({ backToMenu, bombCount, tileCount }) {
  const [squareVals, setSquareVals] = useState(Array(tileCount).fill(""));
  const [hidden, setHidden] = useState(Array(tileCount).fill(true));
  const [gameActive, setGameActive] = useState(true);
  const [numRevealed, setNumRevealed] = useState(0);

  checkAllRevealed();

  // Check if all tiles have been revealed
  function checkAllRevealed() {
    if (gameActive && numRevealed === (tileCount) - bombCount) {
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
      GenerateGrid(Math.sqrt(tileCount), Math.sqrt(tileCount), index, bombCount);
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
      for (let i = 0; i < tileCount; i++) {
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
  if (x < 0 || y < 0 || x >= Math.sqrt(hiddenArr.length) || y >= Math.sqrt(hiddenArr.length)) {
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

  // Fill adjacent squares with 'Empty'
  for (let i = pos.x - 1; i <= pos.x + 1; i++) {
    for (let j = pos.y - 1; j <= pos.y + 1; j++) {
      const ind = GetSquareIndex(i, j);
      if (ind !== null) {
        squares[ind] = SQUARE_TYPES.Empty;
      }
    }
  }

  // Populate with bombs
  for (let i = 0; i < bombCount; i++) {
    let r;
    do {
      r = Math.floor(Math.random() * width * height);
    } while (squares[r] === SQUARE_TYPES.Bomb || squares[r] === SQUARE_TYPES.Empty)

    squares[r] = SQUARE_TYPES.Bomb;
  }

  // Set all unchanged tiles to SQUARE_TYPES.Empty
  for (let i = 0; i < squares.length; i++) {
    if (squares[i] === SQUARE_TYPES.Uninitialized) { squares[i] = SQUARE_TYPES.Empty; }
  }

}

// Get index from coordinate points
function GetSquareIndex(x, y) {
  if (x < 0 || y < 0 || x >= Math.sqrt(squares.length) || y >= Math.sqrt(squares.length)) { return null }
  return y * Math.sqrt(squares.length) + x;
}

// Get coordinate points from index
function GetCoords(index) {
  return {
    y: Math.floor(index/Math.sqrt(squares.length)),
    x: index % Math.sqrt(squares.length)
  }
}

// Calculate new CSS display variables based on device and GRID presets
function SetDisplayVariables() {
  const root = document.querySelector(":root");

  root.style.setProperty("--grid-width", Math.sqrt(squares.length));
  root.style.setProperty("--grid-height", Math.sqrt(squares.length));
}

export default App;