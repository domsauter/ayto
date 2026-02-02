import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../supabaseClient';

const SeasonContext = createContext();

export const useSeason = () => useContext(SeasonContext);

export const SeasonProvider = ({ children }) => {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [seasons, setSeasons] = useState([]);
  const [currentSeasonId, setCurrentSeasonId] = useState(null);
  const [currentSeason, setCurrentSeason] = useState(null);
  const [loadingSeasons, setLoadingSeasons] = useState(true);
  const [loadingCurrentSeason, setLoadingCurrentSeason] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all seasons
  useEffect(() => {
    let isMounted = true;
    const fetchSeasons = async () => {
      setLoadingSeasons(true);

      try {
        const { data, error } = await supabase
          .from('seasons')
          .select('*')
          .order('created_at', { ascending: true });

        if (isMounted) {
          if (error) {
            console.error('Error fetching seasons:', error);
            setError(error.message);
            setSeasons([]);
          } else {
            setSeasons(data);
            // Try to set currentSeasonId from local storage if it exists and is valid
            const storedCurrentSeasonId = localStorage.getItem('ayto-currentSeasonId');
            if (storedCurrentSeasonId && data.some(s => s.id === parseInt(storedCurrentSeasonId))) {
              setCurrentSeasonId(parseInt(storedCurrentSeasonId));
            } else if (data.length > 0) {
              setCurrentSeasonId(data[0].id); // Select the first season if none stored or invalid
            } else {
              setCurrentSeasonId(null);
            }
          }
          setLoadingSeasons(false);
        }
      } catch (e) {
        if (isMounted) {
          console.error("fetchSeasons exception:", e);
          setLoadingSeasons(false);
        }
      }
    };

    fetchSeasons();

    return () => { isMounted = false; };
  }, []);

  // Fetch current season details (candidates, matching nights, matching boxes)
  useEffect(() => {
    let isMounted = true;
    const fetchCurrentSeasonDetails = async () => {
      setLoadingCurrentSeason(true);
      setError(null);

      if (!currentSeasonId) {
        if (isMounted) {
          setCurrentSeason(null);
          setLoadingCurrentSeason(false); // Ensure loading is turned off if no season is selected
        }
        return;
      }

      try {
        const [
          { data: seasonData, error: seasonError },
          { data: candidatesData, error: candidatesError },
          { data: matchingNightsData, error: matchingNightsError },
          { data: matchingBoxesData, error: matchingBoxesError }
        ] = await Promise.all([
          supabase
            .from('seasons')
            .select('*')
            .eq('id', currentSeasonId)
            .single(),
          supabase
            .from('candidates')
            .select('*')
            .eq('season_id', currentSeasonId)
            .order('name', { ascending: true }),
          supabase
            .from('matching_nights')
            .select('*')
            .eq('season_id', currentSeasonId)
            .order('created_at', { ascending: true }),
          supabase
            .from('matching_boxes')
            .select('*')
            .eq('season_id', currentSeasonId)
            .order('created_at', { ascending: true })
        ]);

        if (isMounted) {
          if (seasonError) throw new Error(seasonError.message);
          if (candidatesError) throw new Error(candidatesError.message);
          if (matchingNightsError) throw new Error(matchingNightsError.message);
          if (matchingBoxesError) throw new Error(matchingBoxesError.message);

          setCurrentSeason({
            ...seasonData,
            candidates: candidatesData,
            matchingNights: matchingNightsData,
            truthBooths: matchingBoxesData,
          });
          setLoadingCurrentSeason(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching season details:', err);
          setError(err.message);
          setCurrentSeason(null);
          setLoadingCurrentSeason(false);
        }
      }
    };

    fetchCurrentSeasonDetails();

    return () => { isMounted = false; };
  }, [currentSeasonId]);

  // Store currentSeasonId in local storage
  useEffect(() => {
    if (currentSeasonId !== null) {
      localStorage.setItem('ayto-currentSeasonId', currentSeasonId.toString());
    } else {
      localStorage.removeItem('ayto-currentSeasonId');
    }
  }, [currentSeasonId]);


  const addSeason = useCallback(async (name) => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('seasons')
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      console.error('Error adding season:', error);
      setError(error.message);
    } else {
      setSeasons(prev => [...prev, data]);
      setCurrentSeasonId(data.id);
    }
  }, [isAdmin]);

  const deleteSeason = useCallback(async (seasonId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this season? This action cannot be undone.')) return;

    const { error } = await supabase
      .from('seasons')
      .delete()
      .eq('id', seasonId);

    if (error) {
      console.error('Error deleting season:', error);
      setError(error.message);
    } else {
      setSeasons(prev => prev.filter(season => season.id !== seasonId));
      if (currentSeasonId === seasonId) {
        setCurrentSeasonId(null);
      }
    }
  }, [isAdmin, currentSeasonId]);

  const selectSeason = useCallback((id) => {
    setCurrentSeasonId(id);
  }, []);

  // Candidate Management
  const addCandidate = useCallback(async (seasonId, candidate) => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('candidates')
      .insert([{ ...candidate, season_id: seasonId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding candidate:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        candidates: [...prev.candidates, data]
      }));
    }
  }, [isAdmin]);

  const deleteCandidate = useCallback(async (seasonId, candidateId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this candidate?')) return;

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', candidateId);

    if (error) {
      console.error('Error deleting candidate:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        candidates: prev.candidates.filter(c => c.id !== candidateId)
      }));
    }
  }, [isAdmin]);

  const updateCandidate = useCallback(async (seasonId, candidateId, updatedCandidate) => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('candidates')
      .update(updatedCandidate)
      .eq('id', candidateId)
      .select()
      .single();

    if (error) {
      console.error('Error updating candidate:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        candidates: prev.candidates.map(c => c.id === candidateId ? data : c)
      }));
    }
  }, [isAdmin]);

  // Matching Night Management
  const addMatchingNight = useCallback(async (seasonId, matchingNight) => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('matching_nights')
      .insert([{ ...matchingNight, season_id: seasonId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding matching night:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        matchingNights: [...prev.matchingNights, data]
      }));
    }
  }, [isAdmin]);

  const deleteMatchingNight = useCallback(async (seasonId, nightId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this matching night?')) return;

    const { error } = await supabase
      .from('matching_nights')
      .delete()
      .eq('id', nightId);

    if (error) {
      console.error('Error deleting matching night:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        matchingNights: prev.matchingNights.filter(night => night.id !== nightId)
      }));
    }
  }, [isAdmin]);

  const updateMatchingNight = useCallback(async (seasonId, nightId, updatedNight) => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('matching_nights')
      .update(updatedNight)
      .eq('id', nightId)
      .select()
      .single();

    if (error) {
      console.error('Error updating matching night:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        matchingNights: prev.matchingNights.map(night => night.id === nightId ? data : night)
      }));
    }
  }, [isAdmin]);

  // Matching Box Management (formerly Truth Booth)
  const addTruthBooth = useCallback(async (seasonId, truthBooth) => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('matching_boxes')
      .insert([{ ...truthBooth, season_id: seasonId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding matching box:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        truthBooths: [...prev.truthBooths, data]
      }));
    }
  }, [isAdmin]);

  const deleteTruthBooth = useCallback(async (seasonId, boothId) => {
    if (!isAdmin) return;
    if (!window.confirm('Are you sure you want to delete this matching box entry?')) return;

    const { error } = await supabase
      .from('matching_boxes')
      .delete()
      .eq('id', boothId);

    if (error) {
      console.error('Error deleting matching box:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        truthBooths: prev.truthBooths.filter(booth => booth.id !== boothId)
      }));
    }
  }, [isAdmin]);

  const updateTruthBooth = useCallback(async (seasonId, boothId, updatedBooth) => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('matching_boxes')
      .update(updatedBooth)
      .eq('id', boothId)
      .select()
      .single();

    if (error) {
      console.error('Error updating matching box:', error);
      setError(error.message);
    } else {
      setCurrentSeason(prev => ({
        ...prev,
        truthBooths: prev.truthBooths.map(booth => booth.id === boothId ? data : booth)
      }));
    }
  }, [isAdmin]);

  // User Predictions (already uses Supabase)
  const updateUserPredictions = useCallback(async (seasonId, predictions) => {
    // This function is called from MyPredictions.jsx which already handles Supabase interaction
    // This context function might become redundant or need to be refactored to just trigger a re-fetch
    // For now, it remains as is, but its direct usage might change.
    console.warn("updateUserPredictions in SeasonContext might be redundant after full Supabase migration.");
  }, []);


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
      addTruthBooth, // Renamed from addTruthBooth to addMatchingBox conceptually
      deleteTruthBooth, // Renamed from deleteTruthBooth to deleteMatchingBox conceptually
      updateTruthBooth, // Renamed from updateTruthBooth to updateMatchingBox conceptually
      updateUserPredictions,
      loadingSeasons,
      loadingCurrentSeason,
      error,
      isAdmin, // Expose isAdmin for convenience
    }}>
      {children}
    </SeasonContext.Provider>
  );
};
