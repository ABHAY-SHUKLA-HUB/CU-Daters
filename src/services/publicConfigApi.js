import api from './api';
import { defaultSupportContact } from '../utils/supportContactDefaults';

const publicConfigApi = {
  getSupportContactConfig: async () => {
    try {
      const response = await api.get('/api/config/support-contact');
      return {
        ...defaultSupportContact,
        ...(response?.data?.data || {})
      };
    } catch {
      return { ...defaultSupportContact };
    }
  }
};

export default publicConfigApi;
