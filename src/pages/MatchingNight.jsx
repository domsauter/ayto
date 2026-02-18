import { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';
import { useAuth } from '../context/AuthContext';

export default function MatchingNight() {
  const { currentSeason, addMatchingNight, deleteMatchingNight, updateMatchingNight, loadingCurrentSeason, error } = useSeason();
  const { profile } = useAuth();
  const [pairs, setPairs] = useState([]);
  const [lights, setLights] = useState(0);
  const [editingNightId, setEditingNightId] = useState(null);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    // Reset form when switching seasons
    setEditingNightId(null);
    setPairs([]);
    setLights(0);
  }, [currentSeason]);

  if (!currentSeason) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Matching Night</h1>
        <p>Bitte wähle zuerst eine Staffel aus.</p>
      </div>
    );
  }

  if (loadingCurrentSeason) {
    return <div className="p-8">Loading matching night data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  const allMen = currentSeason.candidates.filter(c => c.gender === 'Mann');
  const allWomen = currentSeason.candidates.filter(c => c.gender === 'Frau');

  if (allMen.length === 0 || allWomen.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Matching Night</h1>
        <p>Bitte füge zuerst Kandidaten hinzu (Männer und Frauen).</p>
      </div>
    );
  }

  // Derive confirmed perfect matches from the Match Box
  const confirmedPerfectMatches = (currentSeason.truthBooths || []).filter(b => b.is_perfect_match);
  const confirmedManIds = new Set(confirmedPerfectMatches.map(b => String(b.couple.man)));
  const confirmedWomanIds = new Set(confirmedPerfectMatches.map(b => String(b.couple.woman)));

  // Exclude confirmed candidates from the dropdowns
  const men = allMen.filter(m => !confirmedManIds.has(String(m.id)));
  const women = allWomen.filter(w => !confirmedWomanIds.has(String(w.id)));

  const numPairs = Math.min(men.length, women.length);

  const handlePairChange = (index, gender, candidateId) => {
    const newPairs = [...pairs];
    if (!newPairs[index]) {
      newPairs[index] = {};
    }
    newPairs[index][gender] = candidateId;
    setPairs(newPairs);
  };

  const handleEditClick = (night) => {
    setEditingNightId(night.id);
    setPairs(night.couples);
    setLights(night.lights);
  };

  const handleCancelEdit = () => {
    setEditingNightId(null);
    setPairs([]);
    setLights(0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return; // Only admins can submit
    if (pairs.length < numPairs || pairs.some(p => !p || !p.mann || !p.frau)) {
      alert("Please form all pairs.");
      return;
    }

    const nightData = { couples: pairs, lights };

    if (editingNightId) {
      updateMatchingNight(currentSeason.id, editingNightId, nightData);
    } else {
      addMatchingNight(currentSeason.id, nightData);
    }

    handleCancelEdit(); // Reset form
  };

  const selectedMen = pairs.map(p => p?.mann).filter(Boolean);
  const selectedWomen = pairs.map(p => p?.frau).filter(Boolean);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Matching Night für {currentSeason.name}</h1>

      {confirmedPerfectMatches.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded-md">
          <p className="font-bold text-green-800 mb-1">✅ Bestätigte Perfect Matches (nicht auswählbar):</p>
          <ul className="text-green-700 text-sm">
            {confirmedPerfectMatches.map(b => {
              const man = allMen.find(m => String(m.id) === String(b.couple.man));
              const woman = allWomen.find(w => String(w.id) === String(b.couple.woman));
              return <li key={b.id}>{man?.name || 'Unbekannt'} & {woman?.name || 'Unbekannt'}</li>;
            })}
          </ul>
        </div>
      )}

      {isAdmin && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-md">
          <h2 className="text-xl font-bold mb-2">{editingNightId ? 'Matching Night bearbeiten' : 'Paare bilden'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {Array.from({ length: numPairs }).map((_, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
                <select
                  value={pairs[index]?.mann || ''}
                  onChange={(e) => handlePairChange(index, 'mann', e.target.value)}
                  className="border p-2 rounded-md w-full"
                >
                  <option value="">Mann wählen</option>
                  {men.map(m => (
                    <option
                      key={m.id}
                      value={m.id}
                      disabled={selectedMen.includes(String(m.id)) && pairs[index]?.mann !== String(m.id)}
                    >
                      {m.name}
                    </option>
                  ))}
                </select>
                <span>+</span>
                <select
                  value={pairs[index]?.frau || ''}
                  onChange={(e) => handlePairChange(index, 'frau', e.target.value)}
                  className="border p-2 rounded-md w-full"
                >
                  <option value="">Frau wählen</option>
                  {women.map(w => (
                    <option
                      key={w.id}
                      value={w.id}
                      disabled={selectedWomen.includes(String(w.id)) && pairs[index]?.frau !== String(w.id)}
                    >
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label htmlFor="lights" className="font-bold">Anzahl Lichter:</label>
            <input
              type="number"
              id="lights"
              value={lights}
              onChange={(e) => setLights(parseInt(e.target.value, 10))}
              min="0"
              max={numPairs}
              className="border p-2 rounded-md w-24"
            />
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">
              {editingNightId ? 'Änderungen speichern' : 'Matching Night speichern'}
            </button>
            {editingNightId && (
              <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                Abbrechen
              </button>
            )}
          </div>
        </form>
      )}

      <div>
        <h2 className="text-xl font-bold mb-2">Bisherige Matching Nights</h2>
        <ul className="space-y-4">
          {currentSeason.matchingNights.map(night => (
            <li key={night.id} className="p-4 bg-gray-100 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold">Lichter: {night.lights}</p>
                  <ul className="mt-2">
                    {night.couples.map((couple, index) => {
                      const man = allMen.find(m => String(m.id) === String(couple.mann));
                      const woman = allWomen.find(w => String(w.id) === String(couple.frau));
                      return (
                        <li key={index}>{man?.name || 'Unknown'} & {woman?.name || 'Unknown'}</li>
                      )
                    })}
                  </ul>
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(night)} className="bg-yellow-500 text-white px-3 py-1 rounded-md">Bearbeiten</button>
                    <button onClick={() => deleteMatchingNight(currentSeason.id, night.id)} className="bg-red-500 text-white px-3 py-1 rounded-md">Löschen</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}