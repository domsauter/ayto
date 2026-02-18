import { useState, useMemo, useCallback } from 'react';
import { useSeason } from '../context/SeasonContext';
import { solve, analyzePartnerPossibilities } from '../solver/solver';

export default function Predictions() {
  const { currentSeason } = useSeason();
  const [probabilities, setProbabilities] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [solutionCount, setSolutionCount] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Memoize candidate filtering to avoid recalculation
  const { men, women } = useMemo(() => {
    if (!currentSeason) return { men: [], women: [] };
    return {
      men: currentSeason.candidates.filter(c => c.gender === 'Mann'),
      women: currentSeason.candidates.filter(c => c.gender === 'Frau')
    };
  }, [currentSeason]);

  // Use useCallback to avoid recreating function unnecessarily
  const handleSolve = useCallback(() => {
    if (!currentSeason) return;

    setIsCalculating(true);

    // Simulate async calculation to prevent blocking UI
    setTimeout(() => {
      try {
        console.log('Starting solver with season:', currentSeason);
        const solutions = solve(currentSeason);
        console.log('Solver completed. Found', solutions.length, 'solutions');
        setSolutionCount(solutions.length);

        // Analyze partner possibilities for each candidate
        const partnerAnalysis = analyzePartnerPossibilities(currentSeason, solutions);
        setAnalysis(partnerAnalysis);
        console.log('Partner analysis completed:', partnerAnalysis);

        // Derive matchbox constraints
        const truthBooths = currentSeason.truthBooths || [];
        const perfectMatches = truthBooths.filter(b => b.is_perfect_match);
        const noMatchKeys = new Set(
          truthBooths
            .filter(b => !b.is_perfect_match)
            .map(b => `${Number(b.couple.man)}-${Number(b.couple.woman)}`)
        );

        if (solutions.length > 0) {
          const coupleCounts = {};
          const totalSolutions = solutions.length;

          // Collect all couples that appear in matching nights and matching boxes
          const allCouples = new Set();

          // Add couples from matching nights (excluding no-match pairs)
          currentSeason.matchingNights.forEach(night => {
            night.couples.forEach(couple => {
              const key = `${Number(couple.mann)}-${Number(couple.frau)}`;
              if (!noMatchKeys.has(key)) allCouples.add(key);
            });
          });

          // Add couples from matching boxes (excluding no-match pairs)
          currentSeason.truthBooths.forEach(booth => {
            const manId = Number(booth.couple.man);
            const womanId = Number(booth.couple.woman);
            const key = `${manId}-${womanId}`;
            if (!noMatchKeys.has(key)) allCouples.add(key);
          });

          // Count how many solutions contain each couple
          allCouples.forEach(coupleKey => {
            coupleCounts[coupleKey] = 0;
          });

          solutions.forEach(solution => {
            allCouples.forEach(coupleKey => {
              const [manId, womanId] = coupleKey.split('-').map(Number);
              if (solution[manId] === womanId) {
                coupleCounts[coupleKey]++;
              }
            });
          });

          const newProbabilities = Object.entries(coupleCounts).map(([key, count]) => {
            const [manId, womanId] = key.split('-').map(Number);
            return {
              manId,
              womanId,
              probability: (count / totalSolutions) * 100,
            };
          });

          // Overlay confirmed perfect matches at 100%
          perfectMatches.forEach(b => {
            const manId = Number(b.couple.man);
            const womanId = Number(b.couple.woman);
            const key = `${manId}-${womanId}`;
            const existing = newProbabilities.find(p => p.manId === manId && p.womanId === womanId);
            if (existing) {
              existing.probability = 100;
            } else {
              newProbabilities.push({ manId, womanId, probability: 100 });
            }
          });

          newProbabilities.sort((a, b) => b.probability - a.probability);
          setProbabilities(newProbabilities);
        } else {
          // Even with no matching nights, show perfect matches at 100%
          const pmProbabilities = perfectMatches.map(b => ({
            manId: Number(b.couple.man),
            womanId: Number(b.couple.woman),
            probability: 100,
          }));
          setProbabilities(pmProbabilities);
        }
        setIsCalculating(false);
      } catch (error) {
        console.error('Error during solve:', error);
        alert('Fehler beim Berechnen: ' + error.message);
        setSolutionCount(null);
        setAnalysis(null);
        setProbabilities(null);
        setIsCalculating(false);
      }
    }, 0);
  }, [currentSeason]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Predictions for {currentSeason.name}</h1>

      <button
        onClick={handleSolve}
        disabled={isCalculating}
        className={`px-4 py-2 rounded-md mb-8 ${isCalculating ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
      >
        {isCalculating ? 'Berechne...' : 'Mögliche Matches berechnen'}
      </button>

      {solutionCount !== null && (
        <h2 className="text-xl font-bold mb-2">
          {solutionCount} mögliche Lösung(en) gefunden
        </h2>
      )}

      {analysis && analysis.contradictions.length > 0 && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 rounded">
          <h3 className="text-lg font-bold text-red-800 mb-3">⚠️ Widersprüche gefunden!</h3>
          {analysis.contradictions.map((contradiction, idx) => (
            <div key={idx} className="text-red-700 mb-2">
              {contradiction.message}
            </div>
          ))}
        </div>
      )}

      {analysis && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-bold mb-6 text-blue-900">Perfect Match Kandidaten</h3>

          {/* Men's possible partners with probabilities */}
          <div className="mb-8">
            <h4 className="font-bold mb-4 text-blue-800">Männer</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {men.map(man => {
                const manAnalysis = analysis.men[man.id];
                const manPartners = probabilities
                  ? probabilities.filter(p => p.manId === man.id).sort((a, b) => b.probability - a.probability)
                  : [];

                return (
                  <div key={man.id} className={`p-4 rounded-lg ${manAnalysis.possiblePartners.length === 0 ? 'bg-red-100 border-l-4 border-red-500' : manAnalysis.certainPartner ? 'bg-green-100 border-l-4 border-green-500' : 'bg-white border border-blue-200'}`}>
                    <p className="font-bold text-lg mb-3">{man.name}</p>
                    {manAnalysis.possiblePartners.length === 0 ? (
                      <p className="text-red-700">❌ Kein Partner möglich</p>
                    ) : manPartners.length > 0 ? (
                      <div className="space-y-2">
                        {manPartners.map(({ womanId, probability }, idx) => {
                          const woman = women.find(w => w.id === womanId);
                          return (
                            <div key={`${man.id}-${womanId}`} className="flex items-center justify-between">
                              <span className="text-sm">
                                <span className="font-semibold">{idx + 1}.</span> {woman?.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${probability === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${probability}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold w-10 text-right">{probability.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Keine Daten</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Women's possible partners with probabilities */}
          <div>
            <h4 className="font-bold mb-4 text-pink-800">Frauen</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {women.map(woman => {
                const womanAnalysis = analysis.women[woman.id];
                const womanPartners = probabilities
                  ? probabilities.filter(p => p.womanId === woman.id).sort((a, b) => b.probability - a.probability)
                  : [];

                return (
                  <div key={woman.id} className={`p-4 rounded-lg ${womanAnalysis.possiblePartners.length === 0 ? 'bg-red-100 border-l-4 border-red-500' : womanAnalysis.certainPartner ? 'bg-green-100 border-l-4 border-green-500' : 'bg-white border border-pink-200'}`}>
                    <p className="font-bold text-lg mb-3">{woman.name}</p>
                    {womanAnalysis.possiblePartners.length === 0 ? (
                      <p className="text-red-700">❌ Kein Partner möglich</p>
                    ) : womanPartners.length > 0 ? (
                      <div className="space-y-2">
                        {womanPartners.map(({ manId, probability }, idx) => {
                          const man = men.find(m => m.id === manId);
                          return (
                            <div key={`${manId}-${woman.id}`} className="flex items-center justify-between">
                              <span className="text-sm">
                                <span className="font-semibold">{idx + 1}.</span> {man?.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${probability === 100 ? 'bg-green-500' : 'bg-pink-500'}`}
                                    style={{ width: `${probability}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-semibold w-10 text-right">{probability.toFixed(1)}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Keine Daten</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
