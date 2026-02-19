import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDatabase } from '../../hooks/useDatabase';
import { GeocodingResponse, GeocodingResult } from '../../types/weather';

export default function SearchScreen() {
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<GeocodingResult[]>([]);
    const [selectedCity, setSelectedCity] = useState<GeocodingResult | null>(null);
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saveDisabled, setSaveDisabled] = useState(false);
    const { addLocation, getCount } = useDatabase();

    useEffect(() => {
        checkSaveLimit();
    }, []);

    const checkSaveLimit = async () => {
        const count = await getCount();
        setSaveDisabled(count >= 5);
    };

    const handleSearch = async () => {
        if (!search.trim()) return;
        setLoading(true);
        try {
            const response = await axios.get<GeocodingResponse>(`https://geocoding-api.open-meteo.com/v1/search?name=${search}&count=5&language=en&format=json`);
            setResults(response.data.results || []);
            setSelectedCity(null);
            setWeather(null);
        } catch (error) {
            Alert.alert("Error", "Geocoding failed");
        } finally {
            setLoading(false);
        }
    };

    const fetchCityWeather = async (city: GeocodingResult) => {
        setLoading(true);
        setSelectedCity(city);
        try {
            const response = await axios.get(
                `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature`
            );
            setWeather(response.data);
        } catch (error) {
            Alert.alert("Error", "Weather fetch failed");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedCity) return;

        const count = await getCount();
        if (count >= 5) {
            Alert.alert("Limit Reached", "You can only save up to 5 cities.");
            setSaveDisabled(true);
            return;
        }

        const success = await addLocation(selectedCity.name);
        if (success) {
            Alert.alert("Success", `${selectedCity.name} saved!`);
            checkSaveLimit();
        } else {
            Alert.alert("Error", "Could not save city (maybe it's already saved).");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Search City</Text>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter city name..."
                    value={search}
                    onChangeText={setSearch}
                />
                <TouchableOpacity style={styles.button} onPress={handleSearch}>
                    <Text style={styles.buttonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />}

            {results.length > 0 && !selectedCity && (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.resultItem} onPress={() => fetchCityWeather(item)}>
                            <Text style={styles.resultText}>{item.name}, {item.admin1 || item.country}</Text>
                        </TouchableOpacity>
                    )}
                    style={styles.list}
                />
            )}

            {selectedCity && weather && (
                <View style={styles.previewCard}>
                    <Text style={styles.cityName}>{selectedCity.name}</Text>
                    <Text style={styles.temp}>{weather.current.temperature_2m}°C</Text>
                    <Text style={styles.feelsLike}>Feels like: {weather.current.apparent_temperature}°C</Text>
                    <TouchableOpacity
                        style={[styles.saveButton, saveDisabled && styles.disabledButton]}
                        onPress={handleSave}
                        disabled={saveDisabled}
                    >
                        <Text style={styles.saveButtonText}>{saveDisabled ? "Limit Reached" : "Save Location"}</Text>
                    </TouchableOpacity>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 8,
        marginRight: 10,
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
    list: {
        maxHeight: 200,
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    resultText: {
        fontSize: 16,
    },
    previewCard: {
        marginTop: 20,
        padding: 20,
        backgroundColor: '#f9f9f9',
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
    },
    cityName: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    temp: {
        fontSize: 48,
        color: '#007AFF',
        marginTop: 10,
    },
    feelsLike: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    saveButton: {
        backgroundColor: '#34C759',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
        marginTop: 10,
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
