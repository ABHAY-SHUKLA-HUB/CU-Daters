import express from 'express';
import { verifyAdmin } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/validation.js';
import AppSetting from '../models/AppSetting.js';

const router = express.Router();

// ===== HELPERS =====

// Get CMS content from MongoDB
const getCMSContent = async (key, defaultValue = null) => {
  try {
    let setting = await AppSetting.findOne({ key: `cms_${key}` });
    if (!setting && defaultValue) {
      setting = await AppSetting.create({
        key: `cms_${key}`,
        value: defaultValue,
        description: `CMS content: ${key}`
      });
    }
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error(`❌ Error fetching CMS content "${key}":`, error.message);
    return defaultValue;
  }
};

// Update CMS content in MongoDB
const updateCMSContent = async (key, value, userId) => {
  try {
    return await AppSetting.findOneAndUpdate(
      { key: `cms_${key}` },
      { value, updated_by: userId },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error(`❌ Error updating CMS content "${key}":`, error.message);
    throw error;
  }
};

// Delete CMS content from MongoDB
const deleteCMSContent = async (key) => {
  try {
    return await AppSetting.findOneAndDelete({ key: `cms_${key}` });
  } catch (error) {
    console.error(`❌ Error deleting CMS content "${key}":`, error.message);
    throw error;
  }
};

const DEFAULT_PAGES = {
  'home': { title: 'Home', subtitle: 'Welcome to CU Collective', hero: '', stats: [] },
  'features': { title: 'Features', description: '', sections: [] },
  'pricing': { title: 'Pricing', description: '', plans: [] },
  'about': { title: 'About', description: '', team: [] },
  'careers': { title: 'Careers', description: '' },
  'contact': { title: 'Contact', email: 'contact@cudaters.tech', phone: '' },
  'privacy': { title: 'Privacy Policy', content: '' },
  'terms': { title: 'Terms & Conditions', content: '' }
};

// ===== PAGE CONTENT =====

// Get all pages
router.get('/pages', async (req, res) => {
  try {
    const pages = await getCMSContent('pages', DEFAULT_PAGES);
    res.json(successResponse('Pages retrieved', { pages }));
  } catch (error) {
    console.error('❌ Error fetching pages:', error.message);
    res.json(successResponse('Pages retrieved (fallback)', { pages: DEFAULT_PAGES }));
  }
});

// Get single page
router.get('/pages/:pageName', async (req, res) => {
  try {
    const { pageName } = req.params;
    const pages = await getCMSContent('pages', DEFAULT_PAGES);
    const page = pages[pageName];

    if (!page) {
      return res.status(404).json(errorResponse('Page not found'));
    }

    res.json(successResponse('Page retrieved', { page }));
  } catch (error) {
    console.error('❌ Error fetching page:', error.message);
    res.status(500).json(errorResponse('Failed to fetch page: ' + error.message));
  }
});

// Update page
router.put('/pages/:pageName', verifyAdmin, async (req, res) => {
  try {
    const { pageName } = req.params;
    const updates = req.body;

    if (!pageName || !updates) {
      return res.status(400).json(errorResponse('Page name and updates required'));
    }

    let pages = await getCMSContent('pages', DEFAULT_PAGES);
    pages[pageName] = {
      ...pages[pageName],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user._id
    };

    await updateCMSContent('pages', pages, req.user._id);
    res.json(successResponse('Page updated successfully', { page: pages[pageName] }));
  } catch (error) {
    console.error('❌ Error updating page:', error.message);
    res.status(500).json(errorResponse('Failed to update page: ' + error.message));
  }
});

// ===== AMBASSADOR POSITIONS =====

// Get all ambassador positions
router.get('/ambassador-positions', async (req, res) => {
  try {
    const data = await getCMSContent('ambassador_positions', { positions: [] });
    res.json(successResponse('Positions retrieved', { positions: data.positions || [] }));
  } catch (error) {
    console.error('❌ Error fetching positions:', error.message);
    res.json(successResponse('Positions retrieved', { positions: [] }));
  }
});

// Create ambassador position (admin only)
router.post('/ambassador-positions', verifyAdmin, async (req, res) => {
  try {
    const { title, description, targetReach, timeCommitment, rewards } = req.body;

    if (!title || !description) {
      return res.status(400).json(errorResponse('Title and description required'));
    }

    let data = await getCMSContent('ambassador_positions', { positions: [] });
    
    const newPosition = {
      id: Date.now().toString(),
      title,
      description,
      targetReach: targetReach || '200-300 students',
      timeCommitment: timeCommitment || '3-5 hours/week',
      rewards: rewards || [],
      createdAt: new Date().toISOString(),
      createdBy: req.user._id,
      active: true
    };

    data.positions = data.positions || [];
    data.positions.push(newPosition);
    data.updatedAt = new Date().toISOString();

    await updateCMSContent('ambassador_positions', data, req.user._id);
    res.json(successResponse('Position created', { position: newPosition }));
  } catch (error) {
    console.error('❌ Error creating position:', error.message);
    res.status(500).json(errorResponse('Failed to create position: ' + error.message));
  }
});

// Update ambassador position (admin only)
router.put('/ambassador-positions/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let data = await getCMSContent('ambassador_positions', { positions: [] });
    const positionIndex = data.positions.findIndex(p => p.id === id);

    if (positionIndex === -1) {
      return res.status(404).json(errorResponse('Position not found'));
    }

    data.positions[positionIndex] = {
      ...data.positions[positionIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user._id
    };

    data.updatedAt = new Date().toISOString();
    await updateCMSContent('ambassador_positions', data, req.user._id);

    res.json(successResponse('Position updated', { position: data.positions[positionIndex] }));
  } catch (error) {
    console.error('❌ Error updating position:', error.message);
    res.status(500).json(errorResponse('Failed to update position: ' + error.message));
  }
});

// Delete ambassador position (admin only)
router.delete('/ambassador-positions/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    let data = await getCMSContent('ambassador_positions', { positions: [] });
    data.positions = data.positions.filter(p => p.id !== id);
    data.updatedAt = new Date().toISOString();

    await updateCMSContent('ambassador_positions', data, req.user._id);
    res.json(successResponse('Position deleted'));
  } catch (error) {
    console.error('❌ Error deleting position:', error.message);
    res.status(500).json(errorResponse('Failed to delete position: ' + error.message));
  }
});

// ===== ANNOUNCEMENTS / BANNER =====

// Get current announcement
router.get('/announcement', async (req, res) => {
  try {
    const announcement = await getCMSContent('announcement', null);
    
    // Check if announcement has expired
    if (announcement && announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
      return res.json(successResponse('Announcement retrieved', { announcement: null }));
    }

    res.json(successResponse('Announcement retrieved', { announcement }));
  } catch (error) {
    console.error('❌ Error fetching announcement:', error.message);
    res.json(successResponse('Announcement retrieved', { announcement: null }));
  }
});

// Create/update announcement (admin only)
router.post('/announcement', verifyAdmin, async (req, res) => {
  try {
    const { text, link, expiresAt, enabled } = req.body;

    if (!text) {
      return res.status(400).json(errorResponse('Announcement text required'));
    }

    const announcement = {
      text,
      link: link || null,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      enabled: enabled !== false,
      createdAt: new Date().toISOString(),
      createdBy: req.user._id,
      updatedAt: new Date().toISOString()
    };

    await updateCMSContent('announcement', announcement, req.user._id);
    res.json(successResponse('Announcement saved', { announcement }));
  } catch (error) {
    console.error('❌ Error saving announcement:', error.message);
    res.status(500).json(errorResponse('Failed to save announcement: ' + error.message));
  }
});

// Delete announcement (admin only)
router.delete('/announcement', verifyAdmin, async (req, res) => {
  try {
    await deleteCMSContent('announcement');
    res.json(successResponse('Announcement deleted'));
  } catch (error) {
    console.error('❌ Error deleting announcement:', error.message);
    res.status(500).json(errorResponse('Failed to delete announcement: ' + error.message));
  }
});

// ===== FLEXIBLE CONTENT SECTIONS =====

// Get all flexible sections
router.get('/sections', async (req, res) => {
  try {
    const sections = await getCMSContent('sections', {});
    res.json(successResponse('Sections retrieved', { sections }));
  } catch (error) {
    console.error('❌ Error fetching sections:', error.message);
    res.json(successResponse('Sections retrieved', { sections: {} }));
  }
});

// Get specific section
router.get('/sections/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const sections = await getCMSContent('sections', {});
    const section = sections[sectionKey];

    if (!section) {
      return res.status(404).json(errorResponse('Section not found'));
    }

    res.json(successResponse('Section retrieved', { section }));
  } catch (error) {
    console.error('❌ Error fetching section:', error.message);
    res.status(500).json(errorResponse('Failed to fetch section: ' + error.message));
  }
});

// Update section (admin only)
router.put('/sections/:sectionKey', verifyAdmin, async (req, res) => {
  try {
    const { sectionKey } = req.params;
    const updates = req.body;

    if (!sectionKey || !updates) {
      return res.status(400).json(errorResponse('Section key and updates required'));
    }

    let sections = await getCMSContent('sections', {});
    
    sections[sectionKey] = {
      ...sections[sectionKey],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user._id
    };

    await updateCMSContent('sections', sections, req.user._id);
    res.json(successResponse('Section updated', { section: sections[sectionKey] }));
  } catch (error) {
    console.error('❌ Error updating section:', error.message);
    res.status(500).json(errorResponse('Failed to update section: ' + error.message));
  }
});

export default router;
