import { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';
import { useAuth } from '../context/AuthContext';

export default function MatchingBox() {
  const { currentSeason, addTruthBooth, deleteTruthBooth, updateTruthBooth, loadingCurrentSeason, error } = useSeason();
  const { profile } = useAuth();

  const isAdmin = profile?.role === 'admin';
  const [manId, setManId] = useState('');
  const [womanId, setWomanId] = useState('');
  const [isMatch, setIsMatch] = useState(true);
  const [editingBoothId, setEditingBoothId] = useState(null);

  useEffect(() => {
    // Reset form when switching seasons
    setEditingBoothId(null);
    setManId('');
    setWomanId('');
    setIsMatch(true);
  }, [currentSeason]);

  if (!currentSeason) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Match Box</h1>
        <p>Bitte wähle zuerst eine Staffel aus.</p>
      </div>
    );
  }

  if (loadingCurrentSeason) {
    return <div className="p-8">Loading matching box data...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  const men = currentSeason.candidates.filter(c => c.gender === 'Mann');
  const women = currentSeason.candidates.filter(c => c.gender === 'Frau');

  if (men.length === 0 || women.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Match Box</h1>
        <p>Bitte füge zuerst Kandidaten hinzu (Männer und Frauen).</p>
      </div>
    );
  }

  const handleEditClick = (booth) => {
    setEditingBoothId(booth.id);
    setManId(booth.couple.man);
    setWomanId(booth.couple.woman);
    setIsMatch(booth.isPerfectMatch);
  };

  const handleCancelEdit = () => {
    setEditingBoothId(null);
    setManId('');
    setWomanId('');
    setIsMatch(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return; // Only admins can submit
    if (!manId || !womanId) {
      alert("Please select a couple.");
      return;
    }

    const boothData = { couple: { man: manId, woman: womanId }, isPerfectMatch: isMatch };

    if (editingBoothId) {
      updateTruthBooth(currentSeason.id, editingBoothId, boothData);
    } else {
      addTruthBooth(currentSeason.id, boothData);
    }

    handleCancelEdit(); // Reset form
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Match Box für {currentSeason.name}</h1>

      {isAdmin && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 border rounded-md">
          <h2 className="text-xl font-bold mb-2">{editingBoothId ? 'Match Box bearbeiten' : 'Paar in die Match Box schicken'}</h2>
          <div className="flex items-center gap-4 mb-4">
            <select value={manId} onChange={(e) => setManId(e.target.value)} className="border p-2 rounded-md w-full">
              <option value="">Mann wählen</option>
              {men.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <span>&</span>
            <select value={womanId} onChange={(e) => setWomanId(e.target.value)} className="border p-2 rounded-md w-full">
              <option value="">Frau wählen</option>
              {women.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <label className="font-bold">Ergebnis:</label>
            <label className="mr-4">
              <input type="radio" name="match" checked={isMatch} onChange={() => setIsMatch(true)} />
              Perfect Match
            </label>
            <label>
              <input type="radio" name="match" checked={!isMatch} onChange={() => setIsMatch(false)} />
              No Match
            </label>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded-md">
              {editingBoothId ? 'Änderungen speichern' : 'Speichern'}
            </button>
            {editingBoothId && (
              <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                Abbrechen
              </button>
            )}
          </div>
        </form>
      )}
      <div>
        <h2 className="text-xl font-bold mb-2">Bisherige Match Boxen</h2>
        <ul className="space-y-2">
          {currentSeason.truthBooths.map(booth => {
            const man = men.find(m => m.id === parseInt(booth.couple.man));
            const woman = women.find(w => w.id === parseInt(booth.couple.woman));
            return (
              <li key={booth.id} className={`p-2 rounded-md flex justify-between items-center ${booth.isPerfectMatch ? 'bg-green-100' : 'bg-red-100'}`}>
                <span>{man?.name} & {woman?.name} - {booth.isPerfectMatch ? 'Perfect Match' : 'No Match'}</span>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(booth)} className="bg-yellow-500 text-white px-3 py-1 rounded-md">Bearbeiten</button>
                    <button onClick={() => deleteTruthBooth(currentSeason.id, booth.id)} className="bg-red-500 text-white px-3 py-1 rounded-md">Löschen</button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
