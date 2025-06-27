// Test the actual formatRelativeTime function
export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  
  // Parse the UTC date string properly
  // Backend stores dates in UTC using Python's isoformat() which doesn't include 'Z'
  // We need to ensure we're treating these as UTC dates
  let utcDateString = dateString;
  
  // If the string doesn't have timezone info, treat it as UTC
  if (!dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
    utcDateString = `${dateString}Z`;
  }
  
  const date = new Date(utcDateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return 'Invalid date';
  }
  
  const now = new Date();
  
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;
  } else {
    // Format the date in the user's local timezone
    return date.toLocaleDateString();
  }
};

// Test with the actual scenario data
const testDateString = '2025-06-14T09:37:09.113653';
const result = formatRelativeTime(testDateString);
console.log('Result:', result);
