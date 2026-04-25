import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_BASE = getApiBaseUrl();
const CMS_API = `${API_BASE}/api/cms`;

export const cmsApi = {
  // Pages
  getPages: async (token) => {
    const response = await fetch(`${CMS_API}/pages`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  getPage: async (pageName, token) => {
    const response = await fetch(`${CMS_API}/pages/${pageName}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  updatePage: async (pageName, data, token) => {
    const response = await fetch(`${CMS_API}/pages/${pageName}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Ambassador Positions
  getAmbassadorPositions: async (token) => {
    const response = await fetch(`${CMS_API}/ambassador-positions`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
    });
    return response.json();
  },

  createAmbassadorPosition: async (data, token) => {
    const response = await fetch(`${CMS_API}/ambassador-positions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  updateAmbassadorPosition: async (id, data, token) => {
    const response = await fetch(`${CMS_API}/ambassador-positions/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteAmbassadorPosition: async (id, token) => {
    const response = await fetch(`${CMS_API}/ambassador-positions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // Announcements
  getAnnouncement: async () => {
    const response = await fetch(`${CMS_API}/announcement`);
    return response.json();
  },

  createAnnouncement: async (data, token) => {
    const response = await fetch(`${CMS_API}/announcement`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  deleteAnnouncement: async (token) => {
    const response = await fetch(`${CMS_API}/announcement`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.json();
  },

  // Flexible Sections
  getSections: async (token) => {
    const response = await fetch(`${CMS_API}/sections`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
    });
    return response.json();
  },

  getSection: async (sectionKey, token) => {
    const response = await fetch(`${CMS_API}/sections/${sectionKey}`, {
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
    });
    return response.json();
  },

  updateSection: async (sectionKey, data, token) => {
    const response = await fetch(`${CMS_API}/sections/${sectionKey}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};

export default cmsApi;
