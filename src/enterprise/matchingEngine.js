/**
 * matchingEngine.js
 *
 * Client-side matchmaking engine linking local creative practitioners
 * with relevant municipal grant listings or community postings.
 */

/**
 * Filter opportunities based on location or categories matching.
 *
 * @param {object} user           — User information (category, location, discipline)
 * @param {object[]} opportunities — All active postings
 * @returns {object[]} Filtered matches
 */
export function matchOpportunities(user = {}, opportunities = []) {
  if (!user.category && !user.location && !user.discipline && !user.primaryMedium) {
    return opportunities;
  }

  return opportunities.filter((item) => {
    // Matching categories/mediums
    const matchesCategory =
      !user.category ||
      item.category === user.category ||
      (item.mediums && item.mediums.includes(user.category)) ||
      (user.primaryMedium && item.mediums && item.mediums.includes(user.primaryMedium)) ||
      item.type === user.category;

    // Matching location details
    const matchesLocation =
      !user.location ||
      item.location === user.location ||
      (item.provider && item.provider.toLowerCase().includes(user.location.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(user.location.toLowerCase()));

    return matchesCategory || matchesLocation;
  });
}
