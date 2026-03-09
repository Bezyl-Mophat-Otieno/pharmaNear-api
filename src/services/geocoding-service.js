const axios = require('axios');

class GeocodingService {
  constructor() {
    this.apiKey = process.env.OPEN_WEATHER_API_KEY;
    this.geocodeUrl = 'http://api.openweathermap.org/geo/1.0/direct';
    this.reverseGeocodeUrl = 'http://api.openweathermap.org/geo/1.0/reverse';
  }

  normalizeInput(input) {
    return input.trim().toLowerCase();
  }

  async geocode(searchParam, limit = 5) {
    try {
      const normalizedInput = this.normalizeInput(searchParam);
      
      const response = await axios.get(this.geocodeUrl, {
        params: {
          q: normalizedInput,
          limit,
          appid: this.apiKey
        }
      });

      const subset = response.data.map((g) => ({
        name: g.name,
        country: g.country,
        state: g.state,
        lat: g.lat,
        lon: g.lon,
      }));

      return {
        success: true,
        message: `We successfully found locations matching "${searchParam}".`,
        data: subset,
      };
    } catch (error) {
      let userMessage = 'An unexpected error occurred while searching for locations. Please try again later.';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          userMessage = `No locations found for "${searchParam}".`;
        } else if (error.response?.status === 401) {
          userMessage = 'Invalid API key. Please check your configuration.';
        } else {
          userMessage = `Unable to fetch location information for "${searchParam}" at this time.`;
        }
      }

      return { success: false, message: userMessage, data: [] };
    }
  }

  async reverseGeocode(lat, lon, limit = 1) {
    try {
      const response = await axios.get(this.reverseGeocodeUrl, {
        params: {
          lat,
          lon,
          limit,
          appid: this.apiKey
        }
      });

      return {
        success: true,
        message: 'Successfully retrieved location information.',
        data: response.data,
      };
    } catch (error) {
      let userMessage = 'An unexpected error occurred while retrieving location information.';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          userMessage = 'No location found for the provided coordinates.';
        } else if (error.response?.status === 401) {
          userMessage = 'Invalid API key. Please check your configuration.';
        }
      }

      return { success: false, message: userMessage, data: [] };
    }
  }
}

module.exports = new GeocodingService();
