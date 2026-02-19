export interface WeatherData {
    current: {
        temp: number;
        weather_code: number;
        wind_speed: number;
        humidity: number;
    };
}

export interface LocationData {
    id: number;
    city_name: string;
}

export interface GeocodingResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
}

export interface GeocodingResponse {
    results?: GeocodingResult[];
}
