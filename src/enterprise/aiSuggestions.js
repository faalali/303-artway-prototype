/**
 * aiSuggestions.js
 *
 * Client-side assistant helper providing creative suggestions during intake.
 * Validates statement lengths and portfolios to optimize curation profiles.
 */

/**
 * Generate constructive suggestions for submission enhancements.
 * @param {object} submission — Form values
 * @returns {string[]} Array of suggestions
 */
export function generateSubmissionSuggestions(submission = {}) {
  const suggestions = [];

  // Artist statement length checking
  if (!submission.artistStatement || submission.artistStatement.trim().length < 150) {
    suggestions.push(
      'Your artist statement may be too short. Consider expanding your creative vision to help commissioners understand your unique style.'
    );
  }

  // Portfolio URL checking
  if (!submission.portfolioUrl && !submission.website) {
    suggestions.push(
      'Adding a portfolio link or personal website may improve visibility for statewide matchmaking opportunities.'
    );
  }

  // Primary Medium checking
  if (!submission.primaryMedium) {
    suggestions.push(
      'Specifying a primary creative medium ensures you populate accurately in targeted geospatial searches.'
    );
  }

  return suggestions;
}
