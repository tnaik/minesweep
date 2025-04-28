// pages/index.js
import Minesweeper from '../components/Minesweeper';

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        CPSC 481 Project: Minesweeper
      </h1>
      <Minesweeper />
    </div>
  );
}