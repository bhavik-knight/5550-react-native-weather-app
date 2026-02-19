import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CurrentWeatherScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      getLocation();
    } else {
      setLoading(false);
    }
  }, []);

  const getLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      setLoading(false);
      return;
    }

    try {
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      fetchWeather(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      setErrorMsg('Could not fetch current location');
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number) => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m`
      );
      setWeather(response.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.center}>
        <FontAwesome name="exclamation-triangle" size={50} color="#FF3B30" />
        <Text style={styles.error}>{errorMsg}</Text>
        {Platform.OS === 'web' && (
          <TouchableOpacity style={styles.button} onPress={getLocation}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (Platform.OS === 'web' && !location && !weather) {
    return (
      <View style={styles.center}>
        <FontAwesome name="map-marker" size={50} color="#007AFF" />
        <Text style={styles.loadingText}>Location access required on Web</Text>
        <TouchableOpacity style={styles.button} onPress={getLocation}>
          <Text style={styles.buttonText}>Get Current Weather</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Current Location</Text>

      {weather && (
        <View style={styles.weatherCard}>
          <Text style={styles.temp}>{weather.current.temperature_2m}°C</Text>
          <Text style={styles.feelsLike}>Feels like: {weather.current.apparent_temperature}°C</Text>
          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <FontAwesome name="tint" size={24} color="#007AFF" />
            <Text style={styles.detailLabel}>Humidity</Text>
            <Text style={styles.detailValue}>{weather.current.relative_humidity_2m}%</Text>
          </View>

          <View style={styles.detailRow}>
            <FontAwesome name="leaf" size={24} color="#007AFF" />
            <Text style={styles.detailLabel}>Wind Speed</Text>
            <Text style={styles.detailValue}>{weather.current.wind_speed_10m} km/h</Text>
          </View>

          {location && (
            <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
              <FontAwesome name="globe" size={24} color="#007AFF" />
              <Text style={styles.detailLabel}>Coordinates</Text>
              <Text style={styles.detailValue}>
                {location.coords.latitude.toFixed(2)}, {location.coords.longitude.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    paddingTop: 60,
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
    textAlign: 'center',
  },
  weatherCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
      }
    }),
  },
  temp: {
    fontSize: 72,
    fontWeight: '200',
    color: '#007AFF',
  },
  feelsLike: {
    fontSize: 18,
    color: '#666',
    marginTop: -5,
    marginBottom: 10,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  detailLabel: {
    flex: 1,
    marginLeft: 15,
    fontSize: 18,
    color: '#666',
  },
  detailValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  error: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
