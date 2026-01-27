import { useState } from 'react';
import { useSeason } from '../context/SeasonContext';

export default function Season() {
  const { seasons, currentSeason, addSeason, selectSeason, deleteSeason } = useSeason();
  const [seasonName, setSeasonName] = useState('');

  const handleAddSeason = (e) => {
    e.preventDefault();
    if (seasonName.trim()) {
      addSeason(seasonName);
      setSeasonName('');
    }
  };

  const handleDeleteSeason = (e, seasonId) => {
    e.stopPropagation(); // Prevent season selection when clicking delete
    if (window.confirm('Are you sure you want to delete this season? This action cannot be undone.')) {
      deleteSeason(seasonId);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Staffel Setup</h1>

      <div className="mb-8">
        <form onSubmit={handleAddSeason} className="flex items-center gap-4">
          <input
            type="text"
            value={seasonName}
            onChange={(e) => setSeasonName(e.target.value)}
            placeholder="Neue Staffel erstellen"
            className="border p-2 rounded-md w-full"
          />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">
            Erstellen
          </button>
        </form>
      </div>

      {seasons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Bestehende Staffeln</h2>
          <ul className="space-y-2">
            {seasons.map((season) => (
              <li
                key={season.id}
                onClick={() => selectSeason(season.id)}
                className={`cursor-pointer p-2 rounded-md flex justify-between items-center ${
                  currentSeason?.id === season.id ? 'bg-indigo-100' : 'hover:bg-gray-100'
                }`}
              >
                <span>{season.name}</span>
                <button 
                  onClick={(e) => handleDeleteSeason(e, season.id)} 
                  className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
                >
                  Löschen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentSeason && (
        <div>
          <h2 className="text-xl font-bold">Aktuelle Staffel: {currentSeason.name}</h2>
        </div>
      )}
    </div>
  );
}
