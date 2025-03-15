/**
 * Utility functions for calendar integrations
 */

/**
 * Generate a Google Calendar event URL with the contest details
 * 
 * @param title - The title of the event (contest name)
 * @param description - The description of the event
 * @param location - The URL of the contest
 * @param startTime - The start time of the contest (ISO string)
 * @param endTime - The end time of the contest (ISO string)
 * @param reminderMinutes - Number of minutes before the event to set a reminder (default: 30)
 * @returns Google Calendar URL to create an event
 */
export function generateGoogleCalendarUrl(
  title: string,
  description: string,
  location: string,
  startTime: string,
  endTime: string,
  reminderMinutes: number = 30
): string {
  // Format dates for Google Calendar
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  
  // Format dates in the required format: YYYYMMDDTHHmmssZ
  const formatDateForGoogleCal = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  // Encode parameters properly for the URL
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedLocation = encodeURIComponent(location);
  const dates = `${formatDateForGoogleCal(startDate)}/${formatDateForGoogleCal(endDate)}`;
  
  // Create the Google Calendar URL directly
  // - Use action=TEMPLATE to create an event
  // - Set gm=false to explicitly disable Google Meet creation
  // - Set reminder with popup notification
  return `https://calendar.google.com/calendar/r/eventedit?action=TEMPLATE&text=${encodedTitle}&details=${encodedDescription}&location=${encodedLocation}&dates=${dates}&gm=false&reminders=VALUE=popup:${reminderMinutes}`;
}

/**
 * Create a description for the calendar event
 * 
 * @param contestName - Name of the contest
 * @param platform - Platform hosting the contest
 * @param url - Contest URL
 * @returns Formatted description
 */
export function createCalendarEventDescription(
  contestName: string,
  platform: string,
  url: string
): string {
  return `${contestName} on ${platform.charAt(0).toUpperCase() + platform.slice(1)}\n\nContest Link: ${url}\n\nDon't forget to participate!`;
} 