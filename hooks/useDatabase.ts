import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { LocationData } from '../types/weather';

export const useDatabase = () => {
    const db = useSQLiteContext();

    const getLocations = useCallback(async (): Promise<LocationData[]> => {
        if (Platform.OS === 'web') {
            const stored = localStorage.getItem('weather_locations');
            console.log("Web - getLocations", stored);
            return stored ? JSON.parse(stored) : [];
        }

        if (!db) return [];

        const performQuery = async () => {
            return await db.getAllAsync<LocationData>('SELECT * FROM locations');
        };

        try {
            return await performQuery();
        } catch (error) {
            // Primitive retry: wait 500ms and try once more
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                return await performQuery();
            } catch (retryError) {
                console.error("Error fetching locations after retry:", retryError);
                return [];
            }
        }
    }, [db]);

    const getCount = useCallback(async (): Promise<number> => {
        if (Platform.OS === 'web') {
            const locations = await getLocations();
            return locations.length;
        }

        try {
            const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM locations');
            return result?.count ?? 0;
        } catch (error) {
            console.error("Error getting count:", error);
            return 0;
        }
    }, [db, getLocations]);

    const addLocation = useCallback(async (cityName: string): Promise<boolean> => {
        try {
            const count = await getCount();
            if (count >= 5) {
                return false;
            }

            if (Platform.OS === 'web') {
                const locations = await getLocations();
                const newId = locations.length > 0 ? Math.max(...locations.map(l => l.id)) + 1 : 1;
                const newLocation = { id: newId, city_name: cityName };
                const updated = [...locations, newLocation];
                localStorage.setItem('weather_locations', JSON.stringify(updated));
                console.log("Web - addLocation", updated);
                return true;
            }

            await db.runAsync('INSERT INTO locations (city_name) VALUES (?)', cityName);
            return true;
        } catch (error) {
            console.error("Error adding location:", error);
            return false;
        }
    }, [db, getCount, getLocations]);

    const removeLocation = useCallback(async (id: number): Promise<boolean> => {
        try {
            if (Platform.OS === 'web') {
                const locations = await getLocations();
                console.log("Web - removeLocation start", id, locations);
                const updatedLocations = locations.filter(l => l.id !== id);
                console.log("Web - removeLocation end", updatedLocations);
                localStorage.setItem('weather_locations', JSON.stringify(updatedLocations));
                return true;
            }

            await db.runAsync('DELETE FROM locations WHERE id = ?', id);
            return true;
        } catch (error) {
            console.error("Error removing location:", error);
            return false;
        }
    }, [db, getLocations]);

    return { db, getLocations, addLocation, removeLocation, getCount };
};
