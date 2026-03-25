import api from './api';
import { defaultLegalContent } from '../utils/legalContentDefaults';

const publicLegalApi = {
  getLegalContentConfig: async () => {
    try {
      const response = await api.get('/api/config/legal-content');
      return {
        ...defaultLegalContent,
        ...(response?.data?.data || {})
      };
    } catch {
      return { ...defaultLegalContent };
    }
  }
};

export default publicLegalApi;
