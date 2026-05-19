import SupportCategory from '../models/SupportCategory.js';

/**
 * Initialize default support categories
 * Run this once to populate the database with standard support categories
 */
export const initializeSupportCategories = async () => {
  try {
    const existingCount = await SupportCategory.countDocuments();
    
    if (existingCount > 0) {
      console.log('✓ Support categories already initialized');
      return;
    }

    const defaultCategories = [
      {
        name: 'Account Issues',
        description: 'Problems with your account, login, or profile',
        icon: '👤',
        order: 1,
        active: true
      },
      {
        name: 'Verification',
        description: 'Issues with profile verification or identity verification',
        icon: '✓',
        order: 2,
        active: true
      },
      {
        name: 'Billing & Payments',
        description: 'Questions about subscriptions, payments, or refunds',
        icon: '💳',
        order: 3,
        active: true
      },
      {
        name: 'Technical Support',
        description: 'App crashes, bugs, or technical problems',
        icon: '🔧',
        order: 4,
        active: true
      },
      {
        name: 'Report a User',
        description: 'Report inappropriate behavior or suspicious accounts',
        icon: '🚩',
        order: 5,
        active: true
      },
      {
        name: 'Safety & Moderation',
        description: 'Concerns about safety or community guidelines',
        icon: '🛡️',
        order: 6,
        active: true
      },
      {
        name: 'Feature Request',
        description: 'Suggest new features or improvements',
        icon: '💡',
        order: 7,
        active: true
      },
      {
        name: 'Other',
        description: 'Other inquiries or general support',
        icon: '❓',
        order: 8,
        active: true
      }
    ];

    const created = await SupportCategory.insertMany(defaultCategories);
    console.log(`✓ Initialized ${created.length} support categories`);
    
    return created;
  } catch (error) {
    console.error('❌ Error initializing support categories:', error);
  }
};
