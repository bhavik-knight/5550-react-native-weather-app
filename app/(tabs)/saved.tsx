import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
        setRefreshing(true);
        try {
            const saved = await getLocations();
            const citiesWithWeather: CityWeather[] = saved.map(city => ({
                ...city,
                loading: true
            }));
            setCities(citiesWithWeather);

            const updatedCities = await Promise.all(citiesWithWeather.map(async (city) => {
                try {
                    const geoRes = await axios.get(`https://geocoding-api.open-meteo.com/v1/search?name=${city.city_name}&count=1&language=en&format=json`);
                    const geoData = geoRes.data;

                    if (geoData.results && geoData.results.length > 0) {
                        const { latitude, longitude } = geoData.results[0];
                        const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
                        return { ...city, temp: weatherRes.data.current.temperature_2m, loading: false };
                    }
                    return { ...city, loading: false };
                } catch (error) {
                    return { ...city, loading: false };
                }
            }));

            setCities(updatedCities);
        } catch (error) {
            console.error("Error loading saved cities:", error);
        } finally {
            setRefreshing(false);
        }
    }, [getLocations]);

    useFocusEffect(
        useCallback(() => {
            loadSavedCities();
        }, [loadSavedCities])
    );

    const handleDelete = async (id: number, name: string) => {
        const performDelete = async () => {
            try {
                const success = await removeLocation(id);
                if (success) {
                    setCities(prev => prev.filter(c => c.id !== id));
                } else {
                    Alert.alert("Error", "Could not remove location. Please try again.");
                }
            } catch (error) {
                console.error("Delete error:", error);
                Alert.alert("Error", "An unexpected error occurred.");
            }
        };

        Alert.alert(
            "Delete Location",
            `Are you sure you want to remove ${name}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: performDelete }
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
                            activeOpacity={0.7}
                        >
                            <Ionicons name="trash-outline" size={20} color="#fff" />
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
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
            }
        }),
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
