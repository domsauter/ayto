// AYTO Solver Algorithm

/**
 * Generates all combinations of k elements from an array.
 * @param {Array} array - The array to select from.
 * @param {number} k - The number of elements to select.
 * @returns {Array<Array>} - An array of all combinations.
 */
function generateCombinations(array, k) {
  if (k === 0) return [[]]
  if (array.length === 0) return [];
  if (k === array.length) return [array];

  const first = array[0];
  const rest = array.slice(1);

  const withFirst = generateCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = generateCombinations(rest, k);

  return [...withFirst, ...withoutFirst];
}

/**
 * The main solver function - analyzes each matching night independently.
 * @param {object} season - The season object with candidates, matching nights, and truthBooths.
 * @returns {Array<object>} - Array of possible couple combinations from all matching nights.
 */
export function solve(season) {
  try {
    console.log('Solver starting...');

    if (!season.matchingNights || !Array.isArray(season.matchingNights) || season.matchingNights.length === 0) {
      console.log('No matching nights found');
      return [];
    }

    // --- Derive constraints from Match Box ---
    const truthBooths = season.truthBooths || [];

    // Perfect matches: always in every solution
    const perfectMatchKeys = new Set();
    truthBooths.forEach(b => {
      if (b.is_perfect_match) {
        perfectMatchKeys.add(`${Number(b.couple.man)}-${Number(b.couple.woman)}`);
      }
    });

    // No-match pairs: never in any solution
    const noMatchKeys = new Set();
    truthBooths.forEach(b => {
      if (!b.is_perfect_match) {
        noMatchKeys.add(`${Number(b.couple.man)}-${Number(b.couple.woman)}`);
      }
    });

    console.log(`Perfect matches: ${[...perfectMatchKeys]}`);
    console.log(`No-match pairs: ${[...noMatchKeys]}`);

    // --- Collect all unique couples across all matching nights ---
    const allCouples = new Set();
    season.matchingNights.forEach(night => {
      if (night.couples && Array.isArray(night.couples)) {
        night.couples.forEach(couple => {
          const key = `${Number(couple.mann)}-${Number(couple.frau)}`;
          // Only include couples that are not confirmed no-matches
          if (!noMatchKeys.has(key)) {
            allCouples.add(key);
          }
        });
      }
    });

    // Start with perfect matches already seeded into every combination
    let validCombinations = [[...perfectMatchKeys]];

    season.matchingNights.forEach((night, nightIdx) => {
      if (!night.couples || !Array.isArray(night.couples)) {
        console.warn(`Night ${nightIdx} has no couples`);
        return;
      }

      console.log(`Processing night ${nightIdx}: ${night.couples.length} couples, ${night.lights} lights expected`);

      // Get all couple keys for this night, excluding no-match pairs
      const nightCoupleKeys = night.couples
        .map(c => `${Number(c.mann)}-${Number(c.frau)}`)
        .filter(key => !noMatchKeys.has(key));

      // Count how many of this night's lights are already satisfied by confirmed perfect matches
      const confirmedLightsThisNight = nightCoupleKeys.filter(k => perfectMatchKeys.has(k)).length;
      const remainingLightsNeeded = night.lights - confirmedLightsThisNight;

      // Only consider non-confirmed couples for the remaining lights
      const openCoupleKeys = nightCoupleKeys.filter(k => !perfectMatchKeys.has(k));

      if (remainingLightsNeeded < 0) {
        // More confirmed matches than lights — contradiction, skip this night
        console.warn(`Night ${nightIdx}: more confirmed matches (${confirmedLightsThisNight}) than lights (${night.lights}), skipping`);
        return;
      }

      const validNightCombos = generateCombinations(openCoupleKeys, remainingLightsNeeded);

      console.log(`Night ${nightIdx}: ${validNightCombos.length} valid combinations of ${remainingLightsNeeded} open couples`);

      // Update valid combinations: merge each previous combo with each valid night combo
      const newValidCombinations = [];
      validCombinations.forEach(prevCombo => {
        validNightCombos.forEach(nightCombo => {
          const mergedCombo = [...new Set([...prevCombo, ...nightCombo])];
          newValidCombinations.push(mergedCombo);
        });
      });

      validCombinations = newValidCombinations;
      console.log(`After night ${nightIdx}: ${validCombinations.length} valid combinations`);
    });

    console.log(`Solver complete: ${validCombinations.length} valid combinations`);

    // Convert combinations back to solution format
    const solutions = validCombinations.map(combo => {
      const solution = {};
      combo.forEach(coupleKey => {
        const [manId, womanId] = coupleKey.split('-').map(Number);
        solution[manId] = womanId;
      });
      return solution;
    });

    return solutions;
  } catch (error) {
    console.error('Error in solve function:', error);
    throw error;
  }
}

/**
 * Analyzes possible partners for each candidate based on current solutions.
 * @param {object} season - The season object with candidates.
 * @param {Array<object>} solutions - Array of possible solutions from solve().
 * @returns {object} - Object with men and women keys containing partner possibilities.
 */
export function analyzePartnerPossibilities(season, solutions) {
  const men = season.candidates.filter(c => c.gender === 'Mann');
  const women = season.candidates.filter(c => c.gender === 'Frau');

  // Build no-match lookup from matchbox
  const noMatchKeys = new Set();
  const perfectMatchMap = {}; // manId -> womanId for confirmed perfect matches
  const perfectMatchReverseMap = {}; // womanId -> manId for confirmed perfect matches
  (season.truthBooths || []).forEach(b => {
    if (!b.is_perfect_match) {
      noMatchKeys.add(`${Number(b.couple.man)}-${Number(b.couple.woman)}`);
    } else {
      perfectMatchMap[Number(b.couple.man)] = Number(b.couple.woman);
      perfectMatchReverseMap[Number(b.couple.woman)] = Number(b.couple.man);
    }
  });

  const analysis = {
    men: {},
    women: {},
    contradictions: []
  };

  // Initialize
  men.forEach(man => {
    analysis.men[man.id] = {
      id: man.id,
      name: man.name,
      possiblePartners: new Set(),
      certainPartner: null
    };
  });

  women.forEach(woman => {
    analysis.women[woman.id] = {
      id: woman.id,
      name: woman.name,
      possiblePartners: new Set(),
      certainPartner: null
    };
  });

  // Collect all possible partners from solutions
  solutions.forEach(solution => {
    Object.entries(solution).forEach(([manId, womanId]) => {
      const key = `${manId}-${womanId}`;
      if (noMatchKeys.has(key)) return; // Skip confirmed no-match pairs
      if (analysis.men[manId]) {
        analysis.men[manId].possiblePartners.add(womanId);
      }
      if (analysis.women[womanId]) {
        analysis.women[womanId].possiblePartners.add(manId);
      }
    });
  });

  // Override confirmed perfect match candidates: lock them to their confirmed partner only
  Object.entries(perfectMatchMap).forEach(([manId, womanId]) => {
    manId = Number(manId);
    if (analysis.men[manId]) {
      analysis.men[manId].possiblePartners = new Set([womanId]);
      analysis.men[manId].certainPartner = womanId;
    }
    if (analysis.women[womanId]) {
      analysis.women[womanId].possiblePartners = new Set([manId]);
      analysis.women[womanId].certainPartner = manId;
    }
  });

  // If only one solution, everyone has a certain partner
  if (solutions.length === 1) {
    const solution = solutions[0];
    Object.entries(solution).forEach(([manId, womanId]) => {
      if (analysis.men[manId]) {
        analysis.men[manId].certainPartner = womanId;
      }
      if (analysis.women[womanId]) {
        analysis.women[womanId].certainPartner = manId;
      }
    });
  }


  // Convert Sets to Arrays and find contradictions
  men.forEach(man => {
    const partners = Array.from(analysis.men[man.id].possiblePartners);
    analysis.men[man.id].possiblePartners = partners;

    if (partners.length === 0) {
      analysis.contradictions.push({
        type: 'no_partner',
        person: man,
        gender: 'Mann',
        message: `${man.name} hat keinen möglichen Partner - es gibt einen Widerspruch in den Daten!`
      });
    }
  });

  women.forEach(woman => {
    const partners = Array.from(analysis.women[woman.id].possiblePartners);
    analysis.women[woman.id].possiblePartners = partners;

    if (partners.length === 0) {
      analysis.contradictions.push({
        type: 'no_partner',
        person: woman,
        gender: 'Frau',
        message: `${woman.name} hat keinen möglichen Partner - es gibt einen Widerspruch in den Daten!`
      });
    }
  });

  return analysis;
}
