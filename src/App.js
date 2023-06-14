import logo from './logo.svg';
import './App.css';

const GRID_SIZE = 15;

function App() {
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

let vals = Array(GRID_SIZE**2).fill("");

function Grid() {
  return (
    <div className="grid">
      {vals.map(val => {
        return <Square value={val} hidden="true" />;
      })}
    </div>
  )
}

function Square({ value, hidden }) {
  return (
    <div className={"square" + (hidden === "true" ? " hidden" : "")} data-value={value}>{value}</div>
  )
}

export default App;
