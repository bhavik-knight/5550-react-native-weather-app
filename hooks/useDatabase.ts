import { useSQLiteContext } from 'expo-sqlite';
import { useCallback } from 'react';
import { LocationData } from '../types/weather';

export const useDatabase = () => {
    const db = useSQLiteContext();

    const getLocations = useCallback(async (): Promise<LocationData[]> => {
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
        try {
            const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM locations');
            return result?.count ?? 0;
        } catch (error) {
            console.error("Error getting count:", error);
            return 0;
        }
    }, [db]);

    const addLocation = useCallback(async (cityName: string): Promise<boolean> => {
        try {
            const count = await getCount();
            if (count >= 5) {
                return false;
            }

            await db.runAsync('INSERT INTO locations (city_name) VALUES (?)', cityName);
            return true;
        } catch (error) {
            console.error("Error adding location:", error);
            return false;
        }
    }, [db, getCount]);

    const removeLocation = useCallback(async (id: number): Promise<boolean> => {
        try {
            await db.runAsync('DELETE FROM locations WHERE id = ?', id);
            return true;
        } catch (error) {
            console.error("Error removing location:", error);
            return false;
        }
    }, [db]);

    return { db, getLocations, addLocation, removeLocation, getCount };
};
