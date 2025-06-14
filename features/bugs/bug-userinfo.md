# Bug: User info not shown
## Bug Description:
User information shown in the header and dashboard components is not displayed correctly. It should show the user's name and/or email, but it currently shows an empty string.
## Steps to Reproduce:

1. Log in to the application
2. Navigate to the dashboard
3. Observe the header and dashboard components

## Expected Result:
User's name and email should be displayed in the header.
Dashboard should display "Welcome back, [username]!"

## Actual Result:
Header shows a badge with a question mark instead of the first letter of username. the first item in the dropdown should display the mail address but it shows an empty.
Dashboard displays "Welcome back, !"

## Affected Components:
- Header component
- Dashboard component

## Notes: