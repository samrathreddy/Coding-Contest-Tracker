# Coding Contest Tracker

A sophisticated web application that aggregates and tracks programming contest schedules from major competitive programming platforms in one place as well as provides a platform specific tutorial videos.

## 📋 Overview

Contest Tracker is a comprehensive solution designed to help competitive programmers stay on top of upcoming contests across multiple platforms. The application fetches real-time contest data, and offers a unified dashboard to manage participation in competitive programming events and watch tutorial videos for the same.

## 🔗 Links & Resources

- **Demo Video**: [Watch the project demo](https://drive.google.com/file/d/1oItFL2gzH8TJu2gmbbQxDhGzSV2JGnl4/view?usp=sharing)
- **Repository**: [Checkout the code](https://github.com/samrathreddy/Coding-Contest-Tracker)
- **Developer**: [Samrath Reddy](https://www.linkedin.com/in/samrath-reddy/)

## ✨ Features

- **Multi-Platform Integration**: Aggregates contests from LeetCode, Codeforces, Codechef.
- **Real-time Updates**: Leverages platform APIs to provide the most current contest schedules.
- **Contest Filtering**: Sort and filter contests by platform, date, duration, and type.
- **Smart Match**: Automatically matched with the correct tutorial video for the contest from the respective platform playlist.
- **Reminder**: Integrates with Google Calendar to remind you of the upcoming contests.
- **Theme Support**: Elegant light and dark mode for comfortable viewing in any environment.
- **Video Integration**: Watch contest-related tutorials and explanations directly within the app.
- **Responsive Design**: Full functionality across desktop and mobile devices.

## 🛠️ Technical Architecture

### Frontend

- **Framework**: React.js with TypeScript for type safety
- **State Management**: React Context API for global state
- **Styling**: CSS Modules/Tailwind CSS for component-based styling with theme support
- **Routing**: React Router for navigation

### Backend Integration

- **API Layer**: Custom API service modules for each platform
- **Data Handling**: Type-safe contest object models
- **Error Management**: Robust error handling with fallback mechanisms

## 🔌 APIs Used in the Project

The application integrates with the following APIs:

- **LeetCode**: `https://leetcode.com/graphql?operationName=upcomingContests&query=query upcomingContests { upcomingContests{ title titleSlug startTime duration __typename }}`
- **Codeforces**: `https://codeforces.com/api/contest.list`
- **Codechef**: `https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all`
- **YouTube**: `https://www.googleapis.com/youtube/v3/search` (For contest tutorials and video content)
- **Google Calendar**: `https://calendar.google.com/calendar/r/eventedit?action=TEMPLATE&text=${encodedTitle}&details=${encodedDescription}&location=${encodedLocation}&dates=${dates}&gm=false&reminders=VALUE=popup:${reminderMinutes}` (For reminders)
- **CORS Proxy**: `https://api.allorigins.win/raw` (Used to bypass CORS restrictions)

Note: For LeetCode past contests, custom date calculation is used as no direct API is available.

### Time Zone Handling

The application carefully manages time zones to ensure contest times are displayed correctly:

- All internal time storage uses ISO strings
- Conversion to local time zone for display
- Proper calculation of contest duration and status

### Theme Management

The application implements a comprehensive theming system:

- **Persistent Settings**: Remembers user's theme preference across sessions
- **Smooth Transitions**: Elegant transitions between themes for better user experience and used lazy loading for performance

### Video Content Integration

Leveraging the YouTube API v3, the application provides:

- **Relevant Tutorials**: Fetches contest-specific tutorial videos from the coding platform spcific playlist
- **Custom Playlists**: Save videos attaching to the contest for future reference

## 🚀 Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/track-my-contests.git
   cd track-my-contests
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open `http://localhost:8080` in your browser.

## 🧪 Testing

Run the test suite with:

```bash
npm test
# or
yarn test
```

## 🤔 Challenges and Solutions

### CORS Restrictions

**Challenge**: Many competitive programming platforms don't provide CORS headers, preventing direct API access from browsers.

**Solution**: Implemented a proxy-based fetching strategy using `api.allorigins.win` to securely access platform data without compromising user experience.

### Date Calculation Complexity

**Challenge**: Handling recurring contest patterns (weekly, biweekly) with different time zones.

**Solution**: Developed a sophisticated date calculation system that correctly determines the next contest dates based on historical patterns, even when API data is unavailable.

## 🔮 Future Enhancements
- User authentication for personalized experiences
- Contest performance tracking and statistics
- Community features like discussion boards for each contest

## 🙋‍♂️ Assignment Information

This project was developed as part of a programming assignment FOR TLE Eliminators within 24 hours to demonstrate hands-on skills in:

- Frontend development with React and TypeScript
- API integration techniques
- Handling complex asynchronous operations
- Clean code practices and comprehensive documentation

Feel free to contribute to the project by opening issues and pull requests.
