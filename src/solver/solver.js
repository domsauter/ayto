// AYTO Solver Algorithm

/**
 * Generates all permutations of an array.
 * @param {Array} array - The array to permute.
 * @returns {Array<Array>} - An array of all permutations.
 */
function generatePermutations(array) {
  if (array.length === 0) return [[]];
  const firstEl = array[0];
  const rest = array.slice(1);
  const permsWithoutFirst = generatePermutations(rest);
  const allPermutations = [];
  permsWithoutFirst.forEach((perm) => {
    for (let i = 0; i <= perm.length; i++) {
      const permWithFirst = [...perm.slice(0, i), firstEl, ...perm.slice(i)];
      allPermutations.push(permWithFirst);
    }
  });
  return allPermutations;
}

/**
 * The main solver function.
 * @param {object} season - The season object with candidates, matching nights, and truth booths.
 * @returns {Array<object>} - An array of possible solution objects, where each object maps a man's ID to a woman's ID.
 */
export function solve(season) {
  let men = season.candidates.filter(c => c.gender === 'Mann');
  let women = season.candidates.filter(c => c.gender === 'Frau');

  if (men.length === 0 || women.length === 0) {
    return [];
  }

  // Handle uneven candidates
  if (men.length !== women.length) {
    // For now, we will just return no solutions for uneven numbers.
    // The logic for this is complex and will be added later.
    // This is a placeholder to prevent crashes.
    console.error("Solver does not yet support uneven numbers of candidates.");
    return [];
  }

  const womenIds = women.map(w => w.id);
  const menIds = men.map(m => m.id);

  // Generate all possible combinations of perfect matches.
  let possibleSolutions = generatePermutations(womenIds).map(perm => {
    const solution = {};
    menIds.forEach((manId, index) => {
      solution[manId] = perm[index];
    });
    return solution;
  });

  // 1. Filter by Truth Booths
  season.truthBooths.forEach(booth => {
    const manId = parseInt(booth.couple.man);
    const womanId = parseInt(booth.couple.woman);

    possibleSolutions = possibleSolutions.filter(solution => {
      if (booth.is_perfect_match) {
        return solution[manId] === womanId;
      } else {
        return solution[manId] !== womanId;
      }
    });
  });

  // 2. Filter by Matching Nights
  season.matchingNights.forEach(night => {
    possibleSolutions = possibleSolutions.filter(solution => {
      let correctMatches = 0;
      night.couples.forEach(couple => {
        const manId = parseInt(couple.mann);
        const womanId = parseInt(couple.frau);
        if (solution[manId] === womanId) {
          correctMatches++;
        }
      });
      return correctMatches === night.lights;
    });
  });

  return possibleSolutions;
}
