import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDatabase } from '../../hooks/useDatabase';
import { LocationData } from '../../types/weather';

interface CityWeather extends LocationData {
    temp?: number;
    loading: boolean;
}

export default function SavedScreen() {
    const [cities, setCities] = useState<CityWeather[]>([]);
    const { getLocations, removeLocation } = useDatabase();
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const loadSavedCities = useCallback(async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const saved = await getLocations();
            const citiesWithWeather: CityWeather[] = saved.map(city => ({
                ...city,
                loading: true
            }));
            setCities(citiesWithWeather);

            const weatherPromises = citiesWithWeather.map(async (city) => {
                try {
                    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city.city_name}&count=1&language=en&format=json`);
                    const geoData = geoRes.data;

                    if (geoData.results && geoData.results.length > 0) {
                        const { latitude, longitude } = geoData.results[0];
                        const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
                        const weatherData = weatherRes.data;

                        setCities(prev => prev.map(c =>
                            c.id === city.id
                                ? { ...c, temp: weatherData.current.temperature_2m, loading: false }
                                : c
                        ));
                    } else {
                        setCities(prev => prev.map(c => c.id === city.id ? { ...c, loading: false } : c));
                    }
                } catch (error) {
                    setCities(prev => prev.map(c => c.id === city.id ? { ...c, loading: false } : c));
                }
            });

            await Promise.all(weatherPromises);
        } catch (error) {
            console.error("Error loading saved cities:", error);
        } finally {
            setRefreshing(false);
        }
    }, [getLocations, refreshing]);

    useFocusEffect(
        useCallback(() => {
            loadSavedCities();
        }, [loadSavedCities])
    );

    const handleDelete = async (id: number, name: string) => {
        Alert.alert(
            "Delete Location",
            `Are you sure you want to remove ${name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const success = await removeLocation(id);
                        if (success) {
                            setCities(prev => prev.filter(c => c.id !== id));
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Saved Locations</Text>
            {cities.length === 0 && !refreshing && (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No saved cities yet.</Text>
                    <Text style={styles.emptySubText}>Add up to 5 cities in the Search tab.</Text>
                </View>
            )}
            <FlatList
                data={cities}
                keyExtractor={(item) => item.id.toString()}
                onRefresh={loadSavedCities}
                refreshing={refreshing}
                renderItem={({ item }) => (
                    <View style={styles.cityCard}>
                        <TouchableOpacity
                            style={styles.cityInfo}
                            onPress={() => router.push({ pathname: '/weather-detail', params: { city: item.city_name } })}
                        >
                            <Text style={styles.cityName}>{item.city_name}</Text>
                            {item.loading ? (
                                <ActivityIndicator size="small" color="#007AFF" />
                            ) : (
                                <Text style={styles.tempText}>{item.temp !== undefined ? `${item.temp}°C` : 'N/A'}</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDelete(item.id, item.city_name)}
                        >
                            <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    cityCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#eee',
    },
    cityName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    cityInfo: {
        flex: 1,
    },
    tempText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginTop: 5,
    },
    deleteButton: {
        backgroundColor: '#FF3B30',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    deleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '600',
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
});
