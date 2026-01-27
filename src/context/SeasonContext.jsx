import React, { createContext, useState, useContext, useEffect } from 'react';

const SeasonContext = createContext();

export const useSeason = () => useContext(SeasonContext);

export const SeasonProvider = ({ children }) => {
  const [seasons, setSeasons] = useState(() => {
    try {
      const localData = localStorage.getItem('ayto-seasons');
      return localData ? JSON.parse(localData) : [];
    } catch (error) {
      console.error("Could not parse seasons from localStorage", error);
      return [];
    }
  });

  const [currentSeasonId, setCurrentSeasonId] = useState(() => {
    try {
      const localData = localStorage.getItem('ayto-currentSeasonId');
      return localData ? JSON.parse(localData) : null;
    } catch (error) {
      console.error("Could not parse currentSeasonId from localStorage", error);
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ayto-seasons', JSON.stringify(seasons));
    } catch (error) {
      console.error("Could not save seasons to localStorage", error);
    }
  }, [seasons]);

  useEffect(() => {
    try {
      localStorage.setItem('ayto-currentSeasonId', JSON.stringify(currentSeasonId));
    } catch (error) {
      console.error("Could not save currentSeasonId to localStorage", error);
    }
  }, [currentSeasonId]);

  const currentSeason = seasons.find(season => season.id === currentSeasonId);

  const addSeason = (name) => {
    const newSeason = {
      id: Date.now(),
      name,
      candidates: [],
      matchingNights: [],
      truthBooths: [],
      userPredictions: {},
    };
    setSeasons([...seasons, newSeason]);
    setCurrentSeasonId(newSeason.id);
  };

  const deleteSeason = (seasonId) => {
    setSeasons(seasons.filter(season => season.id !== seasonId));
    if (currentSeasonId === seasonId) {
      setCurrentSeasonId(null);
    }
  };

  const selectSeason = (id) => {
    setCurrentSeasonId(id);
  };

  const addCandidate = (seasonId, candidate) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, candidates: [...season.candidates, { id: Date.now(), instagram: '', ...candidate }] }
        : season
    ));
  };

  const deleteCandidate = (seasonId, candidateId) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, candidates: season.candidates.filter(c => c.id !== candidateId) }
        : season
    ));
  };

  const updateCandidate = (seasonId, candidateId, updatedCandidate) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, candidates: season.candidates.map(c => c.id === candidateId ? { ...c, ...updatedCandidate } : c) }
        : season
    ));
  };

  const addMatchingNight = (seasonId, matchingNight) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, matchingNights: [...season.matchingNights, { id: Date.now(), ...matchingNight }] }
        : season
    ));
  };

  const deleteMatchingNight = (seasonId, nightId) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, matchingNights: season.matchingNights.filter(night => night.id !== nightId) }
        : season
    ));
  };

  const updateMatchingNight = (seasonId, nightId, updatedNight) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, matchingNights: season.matchingNights.map(night => night.id === nightId ? { ...night, ...updatedNight } : night) }
        : season
    ));
  };

  const addTruthBooth = (seasonId, truthBooth) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, truthBooths: [...season.truthBooths, { id: Date.now(), ...truthBooth }] }
        : season
    ));
  };

  const deleteTruthBooth = (seasonId, boothId) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, truthBooths: season.truthBooths.filter(booth => booth.id !== boothId) }
        : season
    ));
  };

  const updateTruthBooth = (seasonId, boothId, updatedBooth) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, truthBooths: season.truthBooths.map(booth => booth.id === boothId ? { ...booth, ...updatedBooth } : booth) }
        : season
    ));
  };

  const updateUserPredictions = (seasonId, predictions) => {
    setSeasons(seasons.map(season =>
      season.id === seasonId
        ? { ...season, userPredictions: predictions }
        : season
    ));
  };

  return (
    <SeasonContext.Provider value={{
      seasons,
      currentSeason,
      addSeason,
      deleteSeason,
      selectSeason,
      addCandidate,
      deleteCandidate,
      updateCandidate,
      addMatchingNight,
      deleteMatchingNight,
      updateMatchingNight,
      addTruthBooth,
      deleteTruthBooth,
      updateTruthBooth,
      updateUserPredictions,
    }}>
      {children}
    </SeasonContext.Provider>
  );
};
