import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface MusicRecommendation {
  title: string;
  artist: string;
  genre: string;
}

export const genlayerService = {
  generateMusicDescription: async (prompt: string): Promise<string> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/generate-description`, { prompt });
      return response.data.description;
    } catch (error) {
      console.error('Error generating music description:', error);
      throw error;
    }
  },

  getMusicRecommendations: async (preferences: any): Promise<MusicRecommendation[]> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/recommendations`, { preferences });
      return response.data.recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }
};
