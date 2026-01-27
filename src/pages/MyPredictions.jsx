import { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';
import { solve } from '../solver/solver';

export default function MyPredictions() {
  const { currentSeason, updateUserPredictions } = useSeason();
  const [predictions, setPredictions] = useState({});
  const [score, setScore] = useState(null);

  useEffect(() => {
    if (currentSeason?.userPredictions) {
      setPredictions(currentSeason.userPredictions);
    }
  }, [currentSeason]);

  if (!currentSeason) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Meine Predictions</h1>
        <p>Bitte wähle zuerst eine Staffel aus.</p>
      </div>
    );
  }

  const men = currentSeason.candidates.filter(c => c.gender === 'Mann');
  const women = currentSeason.candidates.filter(c => c.gender === 'Frau');
  const numPairs = Math.min(men.length, women.length);

  const handlePredictionChange = (manId, womanId) => {
    setPredictions(prev => ({ ...prev, [manId]: womanId }));
  };

  const handleSave = () => {
    updateUserPredictions(currentSeason.id, predictions);
    alert('Predictions saved!');
  };

  const handleCheck = () => {
    const solutions = solve(currentSeason);
    if (solutions.length === 1) {
      const finalSolution = solutions[0];
      let correctCount = 0;
      for (const manId in predictions) {
        if (parseInt(predictions[manId]) === finalSolution[manId]) {
          correctCount++;
        }
      }
      setScore(correctCount);
    } else {
      alert(`The solver has ${solutions.length} possible solutions. A final check is not yet possible.`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Meine Predictions für {currentSeason.name}</h1>

      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-xl font-bold mb-2">Meine Perfect Matches</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {men.map(man => (
            <div key={man.id} className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
              <span className="font-bold w-1/3">{man.name}</span>
              <select
                value={predictions[man.id] || ''}
                onChange={(e) => handlePredictionChange(man.id, e.target.value)}
                className="border p-2 rounded-md w-2/3"
              >
                <option value="">Frau wählen</option>
                {women.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={handleSave} className="bg-indigo-600 text-white px-4 py-2 rounded-md">
          Predictions speichern
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-2">Resume</h2>
        <button onClick={handleCheck} className="bg-green-600 text-white px-4 py-2 rounded-md">
          Predictions überprüfen
        </button>
        {score !== null && (
          <div className="mt-4">
            <h3 className="text-lg font-bold">Dein Ergebnis:</h3>
            <p>Du hast {score} von {numPairs} Perfect Matches richtig vorhergesagt!</p>
          </div>
        )}
      </div>
    </div>
  );
}
