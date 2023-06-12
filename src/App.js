import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <Grid />
  );
}

let vals = [];
for (let i = 0; i < 225; i++) {
  vals.push("");
}

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
    <div className={"square" + (hidden === "true" ? " hidden" : "")}>{value}</div>
  )
}

export default App;
