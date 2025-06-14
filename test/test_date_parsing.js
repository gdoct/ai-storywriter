// Test script to debug date parsing
const dateString = '2025-06-14T09:37:09.113653';
const currentTimeString = '2025-06-14T13:31:20.986233';

console.log('=== Testing Date Parsing ===');
console.log('Original date string:', dateString);
console.log('Current time string:', currentTimeString);

// Test current logic
const utcDateString = dateString + 'Z';
const date = new Date(utcDateString);
const currentTime = new Date(currentTimeString + 'Z');

console.log('\n=== Parsed Dates ===');
console.log('Parsed date:', date);
console.log('Current time:', currentTime);
console.log('Date UTC string:', date.toISOString());
console.log('Current UTC string:', currentTime.toISOString());

// Calculate difference
const diffInMs = currentTime.getTime() - date.getTime();
const diffInSeconds = Math.floor(diffInMs / 1000);
const diffInMinutes = Math.floor(diffInSeconds / 60);
const diffInHours = Math.floor(diffInMinutes / 60);

console.log('\n=== Time Difference ===');
console.log('Diff in ms:', diffInMs);
console.log('Diff in seconds:', diffInSeconds);
console.log('Diff in minutes:', diffInMinutes);
console.log('Diff in hours:', diffInHours);

// Test with current browser time
const now = new Date();
console.log('\n=== With Browser Time ===');
console.log('Browser current time:', now);
console.log('Browser UTC string:', now.toISOString());

const browserDiffInMs = now.getTime() - date.getTime();
const browserDiffInHours = Math.floor(browserDiffInMs / (1000 * 60 * 60));
console.log('Diff with browser time (hours):', browserDiffInHours);

// Check timezone offset
console.log('\n=== Timezone Info ===');
console.log('Browser timezone offset (minutes):', now.getTimezoneOffset());
console.log('Browser timezone offset (hours):', now.getTimezoneOffset() / 60);
