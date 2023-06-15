import { useState } from 'react';

const SQUARE_TYPES = {
  Empty: 0,
  Bomb: 1
}

const GRID_WIDTH = 15;
const GRID_HEIGHT = 15;

let squares = []

function App() {
  GenerateGrid(GRID_WIDTH, GRID_HEIGHT);

  return (
    <>
      <Grid />
      <Darken />
    </>
  );
}

function Darken() {
  return <div className="grey-out">s</div>
}

function Grid() {
  const [squareVals, setSquareVals] = useState(Array(GRID_WIDTH * GRID_HEIGHT).fill(""));
  const [hidden, setHidden] = useState(Array(GRID_HEIGHT * GRID_WIDTH).fill(true));
  const [flagged, setFlagged] = useState(Array(GRID_HEIGHT * GRID_WIDTH).fill(false));

  function handleLeftClick(index) {
    if (!hidden[index] || flagged[index]) { return; }

    // Count adjacent bombs
    let count = 0;
    let pos = GetCoords(index);
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        let sqIndex = GetSquareIndex(pos.x + x, pos.y + y);
        if (!(x == 0 && y == 0) && sqIndex !== null && squares[sqIndex] == SQUARE_TYPES.Bomb) { count += 1; }
      }
    }

    let valCopy = squareVals.slice();
    let hiddenCopy = hidden.slice();
    valCopy[index] = (count > 0 ? count : "");
    hiddenCopy[index] = false;
    setSquareVals(valCopy);
    setHidden(hiddenCopy);
  }

  return (
    <div className="grid">
      {squareVals.map((val, i) => {
        return <Square key={i} value={val} hidden={hidden[i]} onclick={() => {return handleLeftClick(i)}} st={squares[i]} />;
      })}
    </div>
  )
}

function Square({ value, hidden, onclick, st }) {
  return (
    <button className="square" data-value={value} data-hidden={hidden} onClick={onclick} data-st={st}>{value}</button>
  )
}

function GenerateGrid(width, height) {
  squares = Array(width * height).fill(SQUARE_TYPES.Empty);
  for (let i = 0; i <= Math.floor(width * height * 0.2); i++) {
    let r;
    do {
      r = Math.floor(Math.random() * width * height);
    } while (squares[r] === SQUARE_TYPES.Bomb)

    squares[r] = SQUARE_TYPES.Bomb;
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

export default App;
