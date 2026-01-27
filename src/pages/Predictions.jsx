import { useState } from 'react';
import { useSeason } from '../context/SeasonContext';
import { solve } from '../solver/solver';

export default function Predictions() {
  const { currentSeason } = useSeason();
  const [probabilities, setProbabilities] = useState(null);
  const [solutionCount, setSolutionCount] = useState(null);

  if (!currentSeason) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Predictions</h1>
        <p>Bitte wähle zuerst eine Staffel aus.</p>
      </div>
    );
  }

  const handleSolve = () => {
    const solutions = solve(currentSeason);
    setSolutionCount(solutions.length);

    if (solutions.length > 0) {
      const coupleCounts = {};
      const totalSolutions = solutions.length;

      solutions.forEach(solution => {
        for (const manId in solution) {
          const womanId = solution[manId];
          const key = `${manId}-${womanId}`;
          coupleCounts[key] = (coupleCounts[key] || 0) + 1;
        }
      });

      const newProbabilities = Object.entries(coupleCounts).map(([key, count]) => {
        const [manId, womanId] = key.split('-');
        return {
          manId: parseInt(manId),
          womanId: parseInt(womanId),
          probability: (count / totalSolutions) * 100,
        };
      });

      newProbabilities.sort((a, b) => b.probability - a.probability);
      setProbabilities(newProbabilities);
    } else {
      setProbabilities([]);
    }
  };

  const men = currentSeason.candidates.filter(c => c.gender === 'Mann');
  const women = currentSeason.candidates.filter(c => c.gender === 'Frau');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Predictions for {currentSeason.name}</h1>

      <button onClick={handleSolve} className="bg-indigo-600 text-white px-4 py-2 rounded-md mb-8">
        Mögliche Matches berechnen
      </button>

      {solutionCount !== null && (
        <h2 className="text-xl font-bold mb-2">
          {solutionCount} mögliche Lösung(en) gefunden
        </h2>
      )}

      {probabilities && (
        <div>
          <h3 className="text-lg font-bold mb-2">Match Wahrscheinlichkeiten</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {probabilities.map(({ manId, womanId, probability }) => {
              const man = men.find(m => m.id === manId);
              const woman = women.find(w => w.id === womanId);
              return (
                <div key={`${manId}-${womanId}`} className="p-4 bg-gray-100 rounded-md">
                  <p className="font-bold">{man?.name} & {woman?.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
                    <div 
                      className={`h-4 rounded-full ${probability === 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                      style={{ width: `${probability}%` }}
                    ></div>
                  </div>
                  <p className="text-right">{probability.toFixed(2)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
