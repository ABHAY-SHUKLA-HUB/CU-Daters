import express from 'express';
import admin from 'firebase-admin';
import { isFirebaseReady } from '../utils/firebaseAdmin.js';
import { verifyAdmin } from '../utils/auth.js';
import { errorResponse, successResponse } from '../utils/validation.js';

const router = express.Router();

// Get Firestore instance with error handling
const getDb = () => {
  if (!isFirebaseReady()) {
    throw new Error('Firebase not initialized');
  }
  return admin.firestore();
};

// Default fallback data
const DEFAULT_PAGES = {
  'home': { title: 'Home', subtitle: 'Welcome to CU Collective', hero: '', stats: [] },
  'features': { title: 'Features', description: '', sections: [] },
  'pricing': { title: 'Pricing', description: '', plans: [] },
  'about': { title: 'About', description: '', team: [] },
  'careers': { title: 'Careers', description: '' },
  'contact': { title: 'Contact', email: 'contact@seeu-daters.tech', phone: '' },
  'privacy': { title: 'Privacy Policy', content: '' },
  'terms': { title: 'Terms & Conditions', content: '' }
};

// ===== PAGE CONTENT =====

// Get all pages
router.get('/pages', async (req, res) => {
  try {
    if (!isFirebaseReady()) {
      console.warn('⚠️ Firebase not ready, returning defaults');
      return res.json(successResponse('Pages retrieved (cached)', { pages: DEFAULT_PAGES }));
    }

    const db = getDb();
    const snapshot = await db.collection('site_content').doc('pages').get();
    
    if (!snapshot.exists) {
      return res.json(successResponse('Pages retrieved', { pages: DEFAULT_PAGES }));
    }

    res.json(successResponse('Pages retrieved', { pages: snapshot.data() }));
  } catch (error) {
    console.error('❌ Error fetching pages:', error.message);
    res.json(successResponse('Pages retrieved (fallback)', { pages: DEFAULT_PAGES }));
  }
});

// Get single page
router.get('/pages/:pageName', async (req, res) => {
  try {
    const { pageName } = req.params;

    if (!isFirebaseReady()) {
      const page = DEFAULT_PAGES[pageName];
      if (!page) return res.status(404).json(errorResponse('Page not found'));
      return res.json(successResponse('Page retrieved', { page }));
    }

    const db = getDb();
    const snapshot = await db.collection('site_content').doc('pages').get();
    
    const pages = snapshot.exists ? snapshot.data() : DEFAULT_PAGES;
    const page = pages[pageName];

    if (!page) {
      return res.status(404).json(errorResponse('Page not found'));
    }

    res.json(successResponse('Page retrieved', { page }));
  } catch (error) {
    console.error('❌ Error fetching page:', error.message);
    const page = DEFAULT_PAGES[req.params.pageName] || {};
    res.json(successResponse('Page retrieved', { page }));
  }
});

// Update page content (admin only)
router.put('/pages/:pageName', verifyAdmin, async (req, res) => {
  try {
    const { pageName } = req.params;
    const updates = req.body;

    if (!pageName || !updates) {
      return res.status(400).json(errorResponse('Page name and updates required'));
    }

    if (!isFirebaseReady()) {
      return res.status(503).json(errorResponse('Firebase not available'));
    }

    const db = getDb();
    const pagesRef = db.collection('site_content').doc('pages');
    const snapshot = await pagesRef.get();
    
    let pages = snapshot.exists ? snapshot.data() : { ...DEFAULT_PAGES };
    
    pages[pageName] = {
      ...pages[pageName],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user?._id || 'unknown'
    };

    await pagesRef.set(pages);
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
    if (!isFirebaseReady()) {
      return res.json(successResponse('Positions retrieved', { positions: [] }));
    }

    const db = getDb();
    const snapshot = await db.collection('site_content').doc('ambassadorPositions').get();
    
    if (!snapshot.exists) {
      return res.json(successResponse('Positions retrieved', { positions: [] }));
    }

    const data = snapshot.data();
    res.json(successResponse('Positions retrieved', { positions: data.positions || [] }));
  } catch (error) {
    console.error('❌ Error fetching positions:', error.message);
    res.status(500).json(errorResponse('Failed to fetch positions: ' + error.message));
  }
});

// Create ambassador position (admin only)
router.post('/ambassador-positions', verifyAdmin, async (req, res) => {
  try {
    const { title, description, targetReach, timeCommitment, rewards } = req.body;

    if (!title || !description) {
      return res.status(400).json(errorResponse('Title and description required'));
    }

    if (!isFirebaseReady()) {
      return res.status(503).json(errorResponse('Firebase not available'));
    }

    const db = getDb();
    const docRef = db.collection('site_content').doc('ambassadorPositions');
    const snapshot = await docRef.get();
    
    let data = snapshot.exists ? snapshot.data() : { positions: [] };
    
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

    await docRef.set(data);
    res.json(successResponse('Position created', { position: newPosition }));
  } catch (error) {
    console.error('❌ Error creating position:', error.message);
    res.status(500).json(errorResponse('Failed to create position'));
  }
});

// Update ambassador position (admin only)
router.put('/ambassador-positions/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!isFirebaseReady()) {
      return res.status(503).json(errorResponse('Firebase not available'));
    }

    const db = getDb();
    const docRef = db.collection('site_content').doc('ambassadorPositions');
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json(errorResponse('Positions not found'));
    }

    let data = snapshot.data();
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
    await docRef.set(data);

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

    if (!isFirebaseReady()) {
      return res.status(503).json(errorResponse('Firebase not available'));
    }

    const db = getDb();
    const docRef = db.collection('site_content').doc('ambassadorPositions');
    const snapshot = await docRef.get();
    
    if (!snapshot.exists) {
      return res.status(404).json(errorResponse('Positions not found'));
    }

    let data = snapshot.data();
    data.positions = data.positions.filter(p => p.id !== id);
    data.updatedAt = new Date().toISOString();

    await docRef.set(data);
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
    if (!isFirebaseReady()) {
      return res.json(successResponse('Announcement retrieved', { announcement: null }));
    }

    const db = getDb();
    const snapshot = await db.collection('site_content').doc('announcement').get();
    
    if (!snapshot.exists) {
      return res.json(successResponse('Announcement retrieved', { announcement: null }));
    }

    const announcement = snapshot.data();
    
    // Check if announcement has expired
    if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
      return res.json(successResponse('Announcement retrieved', { announcement: null }));
    }

    res.json(successResponse('Announcement retrieved', { announcement }));
  } catch (error) {
    console.error('❌ Error fetching announcement:', error.message);
    res.status(500).json(errorResponse('Failed to fetch announcement: ' + error.message));
  }
});

// Create/update announcement (admin only)
router.post('/announcement', verifyAdmin, async (req, res) => {
  try {
    const { text, link, expiresAt, enabled } = req.body;

    if (!text) {
      return res.status(400).json(errorResponse('Announcement text required'));
    }

    if (!isFirebaseReady()) {
      return res.status(503).json(errorResponse('Firebase not available'));
    }

    const db = getDb();
    const announcement = {
      text,
      link: link || null,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      enabled: enabled !== false,
      createdAt: new Date().toISOString(),
      createdBy: req.user._id,
      updatedAt: new Date().toISOString()
    };

    await db.collection('site_content').doc('announcement').set(announcement);
    res.json(successResponse('Announcement saved', { announcement }));
  } catch (error) {
    console.error('❌ Error saving announcement:', error.message);
    res.status(500).json(errorResponse('Failed to save announcement: ' + error.message));
  }
});

// Delete announcement (admin only)
router.delete('/announcement', verifyAdmin, async (req, res) => {
  try {
    if (!isFirebaseReady()) {
      return res.status(503).json(errorResponse('Firebase not available'));
    }

    const db = getDb();
    await db.collection('site_content').doc('announcement').delete();
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
    if (!isFirebaseReady()) {
      return res.json(successResponse('Sections retrieved', { sections: {} }));
    }

    const db = getDb();
    const snapshot = await db.collection('site_content').doc('sections').get();
    
    if (!snapshot.exists) {
      return res.json(successResponse('Sections retrieved', { sections: {} }));
    }

    res.json(successResponse('Sections retrieved', { sections: snapshot.data() }));
  } catch (error) {
    console.error('❌ Error fetching sections:', error.message);
    res.status(500).json(errorResponse('Failed to fetch sections: ' + error.message));
  }
});

// Get specific section
router.get('/sections/:sectionKey', async (req, res) => {
  try {
    const { sectionKey } = req.params;

    if (!isFirebaseReady()) {
      return res.status(404).json(errorResponse('Sections not found'));
    }

    const db = getDb();
    const snapshot = await db.collection('site_content').doc('sections').get();
    
    if (!snapshot.exists) {
      return res.status(404).json(errorResponse('Sections not found'));
    }

    const sections = snapshot.data();
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

    if (!isFirebaseReady()) {
      return res.status(503).json(errorResponse('Firebase not available'));
    }

    const db = getDb();
    const sectionsRef = db.collection('site_content').doc('sections');
    const snapshot = await sectionsRef.get();
    
    let sections = snapshot.exists ? snapshot.data() : {};
    
    sections[sectionKey] = {
      ...sections[sectionKey],
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user._id
    };

    await sectionsRef.set(sections);
    res.json(successResponse('Section updated', { section: sections[sectionKey] }));
  } catch (error) {
    console.error('❌ Error updating section:', error.message);
    res.status(500).json(errorResponse('Failed to update section: ' + error.message));
  }
});

export default router;
