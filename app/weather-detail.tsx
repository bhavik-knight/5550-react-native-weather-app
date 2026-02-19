import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function WeatherDetailScreen() {
    const { city } = useLocalSearchParams<{ city: string }>();
    const router = useRouter();
    const [weather, setWeather] = useState<any>(null);
    const [coords, setCoords] = useState<{ lat: number, lon: number } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (city) {
            fetchCityWeather(city);
        }
    }, [city]);

    const fetchCityWeather = async (cityName: string) => {
        setLoading(true);
        try {
            const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1&language=en&format=json`);
            const geoData = geoRes.data;

            if (geoData.results && geoData.results.length > 0) {
                const { latitude, longitude } = geoData.results[0];
                setCoords({ lat: latitude, lon: longitude });
                const weatherRes = await axios.get(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m`
                );
                setWeather(weatherRes.data);
            } else {
                Alert.alert("Error", "City not found");
                router.back();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to fetch weather data");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Fetching details for {city}...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <FontAwesome name="chevron-left" size={20} color="#007AFF" />
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{city}</Text>

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

                    {coords && (
                        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                            <FontAwesome name="globe" size={24} color="#007AFF" />
                            <Text style={styles.detailLabel}>Coordinates</Text>
                            <Text style={styles.detailValue}>{coords.lat.toFixed(2)}, {coords.lon.toFixed(2)}</Text>
                        </View>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        paddingTop: 60,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    backText: {
        marginLeft: 8,
        fontSize: 18,
        color: '#007AFF',
        fontWeight: '600',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
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
});
