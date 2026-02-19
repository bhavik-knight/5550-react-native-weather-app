# Weather App (React Native)

A robust weather application built with React Native and Expo, featuring real-time weather data, city search, and local persistence.

## 🚀 Features

- **Current Location Weather**: Automatically fetches weather data for your current geographic location.
- **City Search**: Search for any city worldwide using the integrated geocoding API.
- **Saved Locations**: Save up to 5 favorite locations for quick access.
- **Offline Reliability**: Uses SQLite for local storage of saved locations.
- **Polished UI**: Modern, clean interface with circular icon-based controls and platform-optimized styling.
- **Detailed Forecasts**: Provides temperature, "feels like" temperature, humidity, and wind speed.
- **Modern Tech Stack**: Uses **Axios** for efficient and robust HTTP requests.

## 🛠 Technical Stack

- **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Navigation**: Expo Router (File-based routing)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **APIs**:
  - [Open-Meteo](https://open-meteo.com/) (Weather data)
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) (Location search)
- **Icons**: [Ionicons](https://ionic.io/icons) (via `@expo/vector-icons`)

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone git@github.com:bhavik-knight/5550-react-native-weather-app.git
   cd 5550-react-native-weather-app
   ```

2. **Install dependencies**:
   ```bash
   npm install # or pnpm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start --android
   ```

## 📱 Development Notes

### Database Provider
A centralized `SQLiteProvider` is implemented in the root layout to ensure the database handle is globally available and correctly initialized before the UI renders.

---
Developed as part of the Mobile Development course at SMU.
