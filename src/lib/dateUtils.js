/**
 * Calculates a user-friendly relative time string (e.g. "Today", "1 day ago", "3 weeks ago")
 * based on a database date compared to the current date.
 * 
 * @param {string | Date} dateValue - The ISO date string or Date object from the database
 * @returns {string} The relative time string
 */
export function getRelativeTimeString(dateValue) {
  if (!dateValue) return 'Unknown';

  const date = new Date(dateValue);
  const now = new Date();

  // If invalid date, return fallback
  if (isNaN(date.getTime())) return 'Unknown';

  // Normalize times to midnight for calendar day calculation
  const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return 'Today'; // Future date fallback
  }

  if (diffDays === 0) {
    return 'Today';
  }
  
  if (diffDays === 1) {
    return '1 day ago';
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) {
    return '1 week ago';
  }
  if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) {
    return '1 month ago';
  }
  return `${diffMonths} months ago`;
}
