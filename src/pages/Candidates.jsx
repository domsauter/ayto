import { useState, useEffect } from 'react';
import { useSeason } from '../context/SeasonContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient'; // Import supabase client

export default function Candidates() {
  const { currentSeason, addCandidate, deleteCandidate, updateCandidate, loadingCurrentSeason, error } = useSeason();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState(''); // New state for age
  const [gender, setGender] = useState('Mann');
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [editingCandidateId, setEditingCandidateId] = useState(null);
  const [currentPictureUrl, setCurrentPictureUrl] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    // Reset form when switching seasons
    setEditingCandidateId(null);
    setName('');
    setAge('');
    setGender('Mann');
    setProfilePictureFile(null);
    setCurrentPictureUrl('');
  }, [currentSeason]);

  const handleEditClick = (candidate) => {
    setEditingCandidateId(candidate.id);
    setName(candidate.name);
    setAge(candidate.age || ''); // Populate age
    setGender(candidate.gender);
    setCurrentPictureUrl(candidate.profile_picture_url || '');
  };

  const handleCancelEdit = () => {
    setEditingCandidateId(null);
    setName('');
    setAge('');
    setGender('Mann');
    setProfilePictureFile(null);
    setCurrentPictureUrl('');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfilePictureFile(e.target.files[0]);
    } else {
      setProfilePictureFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !currentSeason) return;
    if (!isAdmin) return;

    let profilePictureUrl = currentPictureUrl;

    if (profilePictureFile) {
      // Upload new file to Supabase Storage
      const fileExt = profilePictureFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentSeason.id}/${fileName}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('candidate_pictures')
        .upload(filePath, profilePictureFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        alert('Error uploading profile picture: ' + uploadError.message);
        return;
      }
      const { data: { publicUrl } } = supabase.storage.from('candidate_pictures').getPublicUrl(filePath);
      profilePictureUrl = publicUrl;
    }

    const candidateData = {
      name,
      age: age ? parseInt(age) : null, // Include age
      gender,
      profile_picture_url: profilePictureUrl
    };

    if (editingCandidateId) {
      updateCandidate(currentSeason.id, editingCandidateId, candidateData);
    } else {
      addCandidate(currentSeason.id, candidateData);
    }

    handleCancelEdit();
  };

  if (!currentSeason) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">Kandidaten</h1>
        <p>Bitte wähle zuerst eine Staffel aus.</p>
      </div>
    );
  }

  if (loadingCurrentSeason) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  const confirmedMatches = currentSeason.truthBooths.filter(tb => tb.isPerfectMatch);
  const lockedCandidateIds = confirmedMatches.flatMap(m => [parseInt(m.couple.man), parseInt(m.couple.woman)]);

  const men = currentSeason.candidates.filter(c => c.gender === 'Mann');
  const women = currentSeason.candidates.filter(c => c.gender === 'Frau');

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-extrabold mb-8 bg-gradient-to-r from-pink-600 to-indigo-600 bg-clip-text text-transparent">
        Kandidaten für {currentSeason.name}
      </h1>

      {isAdmin && (
        <div className="mb-10 p-6 bg-white rounded-xl shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
            {editingCandidateId ? 'Kandidat bearbeiten' : 'Neuen Kandidat hinzufügen'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z.B. Max"
                  className="match-input w-full"
                  required
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Alter</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="24"
                  className="match-input w-full"
                />
              </div>
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Geschlecht</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="match-input w-full"
                >
                  <option value="Mann">Mann</option>
                  <option value="Frau">Frau</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profilbild</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-pink-400 transition-colors">
                <div className="space-y-1 text-center">
                  {currentPictureUrl && !profilePictureFile ? (
                    <div className="mb-2">
                      <img src={currentPictureUrl} alt="Current" className="mx-auto h-24 w-24 rounded-full object-cover" />
                      <p className="text-xs text-gray-500 mt-1">Aktuelles Bild</p>
                    </div>
                  ) : (
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500">
                      <span>Bild hochladen</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">oder hierhin ziehen</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG bis zu 5MB</p>
                  {profilePictureFile && <p className="text-sm text-green-600 font-semibold mt-2">Ausgewählt: {profilePictureFile.name}</p>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="save-button flex-1 md:flex-none md:w-40 justify-center">
                {editingCandidateId ? 'Speichern' : 'Hinzufügen'}
              </button>
              {editingCandidateId && (
                <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500">
                  Abbrechen
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { title: 'Männer', data: men, emptyMsg: 'Noch keine Männer hinzugefügt.' },
          { title: 'Frauen', data: women, emptyMsg: 'Noch keine Frauen hinzugefügt.' }
        ].map((group) => (
          <div key={group.title} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 flex flex-col h-full">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{group.title}</h2>
              <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-bold">{group.data.length}</span>
            </div>

            {group.data.length === 0 ? (
              <div className="p-8 text-center text-gray-400 italic">{group.emptyMsg}</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {group.data.map(c => {
                  const isLocked = lockedCandidateIds.includes(c.id);
                  return (
                    <li key={c.id} className={`p-4 hover:bg-gray-50 transition-colors flex justify-between items-center group ${isLocked ? 'opacity-60 bg-gray-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img
                            src={c.profile_picture_url || `https://ui-avatars.com/api/?name=${c.name.replace(/\s/g, '+')}&background=random`}
                            alt={c.name}
                            className={`w-12 h-12 rounded-full object-cover border-2 shadow-sm ${isLocked ? 'border-gray-300 grayscale' : 'border-white'}`}
                          />
                          {isLocked && (
                            <div className="absolute -top-1 -right-1 bg-gray-200 rounded-full p-1 border border-white">
                              <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
                            {c.name} {c.age && <span className="text-sm font-normal text-gray-500 ml-1">({c.age})</span>}
                          </p>
                          {isLocked && <span className="text-xs text-gray-400 font-medium">Perfect Match gefunden</span>}
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEditClick(c)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full" title="Bearbeiten">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => deleteCandidate(currentSeason.id, c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full" title="Löschen">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
