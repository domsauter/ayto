import { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';

export default function Candidates() {
  const { currentSeason, addCandidate, deleteCandidate, updateCandidate } = useSeason();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Mann');
  const [instagram, setInstagram] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [editingCandidateId, setEditingCandidateId] = useState(null);

  useEffect(() => {
    // Reset form when switching seasons
    setEditingCandidateId(null);
    setName('');
    setGender('Mann');
    setInstagram('');
    setProfilePictureUrl('');
  }, [currentSeason]);

  const handleEditClick = (candidate) => {
    setEditingCandidateId(candidate.id);
    setName(candidate.name);
    setGender(candidate.gender);
    setInstagram(candidate.instagram || '');
    setProfilePictureUrl(candidate.profilePictureUrl || '');
  };

  const handleCancelEdit = () => {
    setEditingCandidateId(null);
    setName('');
    setGender('Mann');
    setInstagram('');
    setProfilePictureUrl('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !currentSeason) return;

    const candidateData = { name, gender, instagram, profilePictureUrl };

    if (editingCandidateId) {
      updateCandidate(currentSeason.id, editingCandidateId, candidateData);
    } else {
      addCandidate(currentSeason.id, candidateData);
    }

    handleCancelEdit(); // Reset form
  };

  if (!currentSeason) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Kandidaten</h1>
        <p>Bitte wähle zuerst eine Staffel aus.</p>
      </div>
    );
  }

  const confirmedMatches = currentSeason.truthBooths.filter(tb => tb.isPerfectMatch);
  const lockedCandidateIds = confirmedMatches.flatMap(m => [parseInt(m.couple.man), parseInt(m.couple.woman)]);

  const men = currentSeason.candidates.filter(c => c.gender === 'Mann');
  const women = currentSeason.candidates.filter(c => c.gender === 'Frau');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Kandidaten für {currentSeason.name}</h1>

      <div className="mb-8 p-4 border rounded-md">
        <h2 className="text-xl font-bold mb-2">{editingCandidateId ? 'Kandidat bearbeiten' : 'Neuen Kandidat hinzufügen'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="border p-2 rounded-md w-full"
            />
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="Instagram Handle (ohne @)"
              className="border p-2 rounded-md w-full"
            />
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="border p-2 rounded-md">
              <option value="Mann">Mann</option>
              <option value="Frau">Frau</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={profilePictureUrl}
              onChange={(e) => setProfilePictureUrl(e.target.value)}
              placeholder="Profilbild URL (optional)"
              className="border p-2 rounded-md w-full"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md">
              {editingCandidateId ? 'Speichern' : 'Hinzufügen'}
            </button>
            {editingCandidateId && (
              <button type="button" onClick={handleCancelEdit} className="bg-gray-500 text-white px-4 py-2 rounded-md">
                Abbrechen
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-2">Männer ({men.length})</h2>
          <ul className="space-y-2">
            {men.map(c => {
              const isLocked = lockedCandidateIds.includes(c.id);
              return (
                <li key={c.id} className={`p-2 bg-gray-100 rounded-md flex justify-between items-center ${isLocked ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <img 
                      src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${c.name.replace(/\s/g, '+')}&background=random`} 
                      alt={c.name} 
                      className="w-10 h-10 rounded-full" 
                    />
                    <div>
                      <p className="font-bold">{c.name}</p>
                      {c.instagram && <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">@{c.instagram}</a>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(c)} className="bg-yellow-500 text-white px-2 py-1 rounded-md text-sm">Bearbeiten</button>
                    <button onClick={() => deleteCandidate(currentSeason.id, c.id)} className="bg-red-500 text-white px-2 py-1 rounded-md text-sm">Löschen</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Frauen ({women.length})</h2>
          <ul className="space-y-2">
            {women.map(c => {
              const isLocked = lockedCandidateIds.includes(c.id);
              return (
                <li key={c.id} className={`p-2 bg-gray-100 rounded-md flex justify-between items-center ${isLocked ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <img 
                      src={c.profilePictureUrl || `https://ui-avatars.com/api/?name=${c.name.replace(/\s/g, '+')}&background=random`} 
                      alt={c.name} 
                      className="w-10 h-10 rounded-full" 
                    />
                    <div>
                      <p className="font-bold">{c.name}</p>
                      {c.instagram && <a href={`https://instagram.com/${c.instagram}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500">@{c.instagram}</a>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditClick(c)} className="bg-yellow-500 text-white px-2 py-1 rounded-md text-sm">Bearbeiten</button>
                    <button onClick={() => deleteCandidate(currentSeason.id, c.id)} className="bg-red-500 text-white px-2 py-1 rounded-md text-sm">Löschen</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
