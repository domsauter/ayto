import { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { solve } from '../solver/solver';

export default function MyPredictions() {
  const { currentSeason, loadingCurrentSeason, error: seasonError } = useSeason();
  const { user } = useAuth();
  const [predictions, setPredictions] = useState({});
  const [score, setScore] = useState(null);
  const [loadingPredictions, setLoadingPredictions] = useState(true);
  const [error, setError] = useState(null); // Local error state for predictions

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!user || !currentSeason) {
        setLoadingPredictions(false);
        return;
      }

      setLoadingPredictions(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('predictions')
        .select('prediction_data')
        .eq('user_id', user.id)
        .eq('season_id', currentSeason.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching predictions:', fetchError);
        setError(fetchError.message);
        setPredictions({});
      } else if (data) {
        setPredictions(data.prediction_data);
      } else {
        setPredictions({});
      }
      setLoadingPredictions(false);
    };

    fetchPredictions();
  }, [user, currentSeason]);

  if (!currentSeason) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Meine Predictions</h1>
        <p>Bitte wähle zuerst eine Staffel aus.</p>
      </div>
    );
  }

  if (loadingCurrentSeason || loadingPredictions) {
    return <div className="p-8">Loading your predictions...</div>;
  }

  if (seasonError || error) {
    return <div className="p-8 text-red-500">Error: {seasonError || error}</div>;
  }

  const men = currentSeason.candidates.filter(c => c.gender === 'Mann');
  const women = currentSeason.candidates.filter(c => c.gender === 'Frau');
  const numPairs = Math.min(men.length, women.length);

  const handlePredictionChange = (manId, womanId) => {
    setPredictions(prev => ({ ...prev, [manId]: womanId }));
  };

  const handleSave = async () => {
    if (!user) {
      alert('You must be logged in to save predictions.');
      return;
    }
    try {
      const { error: saveError } = await supabase
        .from('predictions')
        .upsert({
          user_id: user.id,
          season_id: currentSeason.id,
          prediction_data: predictions
        }, { onConflict: 'user_id,season_id' });

      if (saveError) {
        console.error('Save error:', saveError);
        if (saveError.code === '42501' || saveError.code === '5') {
          alert('Fehler beim Speichern: Du hast keine Berechtigung. Bitte kontaktiere den Administrator.');
        } else {
          alert('Error saving predictions: ' + saveError.message);
        }
      } else {
        alert('Predictions saved!');
      }
    } catch (err) {
      console.error('Exception during save:', err);
      alert('Unexpected error: ' + err.message);
    }
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
