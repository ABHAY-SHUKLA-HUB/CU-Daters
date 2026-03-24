/**
 * PRICING CONFIG - Admin Controlled Feature Flag System
 * This is the single source of truth for all pricing, features, and limits.
 * Used by: Frontend (feature gating), Backend (validation), Admin (controls)
 * 
 * STRATEGY:
 * - All pricing and limits are stored here (NO hardcoding in components)
 * - Admin updates these values through control panel
 * - Frontend reads from backend API (/api/config/pricing)
 * - Backend validates against these flags
 * 
 * This allows instant changes without code deployment.
 */

export default {
  // ================================================================
  // PRICING TIERS - Can be controlled from admin panel
  // ================================================================
  plans: {
    free: {
      id: 'free',
      name: 'Free',
      price: 0,
      currency: '₹',
      period: '/month',
      description: 'Perfect to get started',
      enabled: true,
      tag: null,  // No tag for free plan
      featured: false,
      buttonText: 'Continue Free',
      mostPopular: false
    },
    premium: {
      id: 'premium',
      name: 'Premium',
      price: 99,
      currency: '₹',
      period: '/month',
      description: 'Unlock everything',
      enabled: true,
      tag: 'Most Popular',  // Highlight for premium
      featured: true,
      buttonText: 'Upgrade Now',
      mostPopular: true,
      highlight: 'linear-gradient(135deg, #ff6ba6 0%, #e85b9f 100%)',
      glowColor: 'rgba(255, 107, 166, 0.3)'
    }
  },

  // ================================================================
  // FEATURE FLAGS - What each plan includes
  // ================================================================
  features: {
    // Core Messaging Features
    messaging: {
      name: 'Messaging',
      free: {
        enabled: true,
        maxMessagesPerDay: 50,  // Free users: 50 messages per match per day
        maxActiveMatches: 1,    // Free users: only 1 active match
        label: '50 messages/day • 1 active match'
      },
      premium: {
        enabled: true,
        maxMessagesPerDay: Infinity,  // Premium: unlimited
        maxActiveMatches: Infinity,   // Premium: unlimited matches
        label: 'Unlimited • Unlimited matches',
        extra: 'Read receipts'
      }
    },

    // Profile & Gallery Features
    profileView: {
      name: 'Profile Visibility',
      free: {
        enabled: true,
        canViewFullProfile: false,  // Show basic only
        canViewFullGallery: false,  // Limited photos
        label: 'Basic profile view'
      },
      premium: {
        enabled: true,
        canViewFullProfile: true,   // See everything
        canViewFullGallery: true,   // All photos
        label: 'Full profiles + galleries'
      }
    },

    // Visibility & Discovery
    discovery: {
      name: 'Discovery Features',
      free: {
        enabled: true,
        canSeeWhoLiked: false,          // Can't see who liked them
        canUseAdvancedFilters: false,   // Basic filters only
        priorityInDiscover: false,      // Normal priority
        label: 'Basic discover'
      },
      premium: {
        enabled: true,
        canSeeWhoLiked: true,           // See all who liked
        canUseAdvancedFilters: true,    // Age, distance, interests, etc.
        priorityInDiscover: true,       // Shown first to others
        label: 'See who liked + Advanced filters'
      }
    },

    // Request Features
    requests: {
      name: 'Connection Requests',
      free: {
        enabled: true,
        maxRequestsPerDay: 5,           // Limited requests
        canPrioritizeRequest: false,
        label: 'Send 5 requests/day'
      },
      premium: {
        enabled: true,
        maxRequestsPerDay: Infinity,    // Unlimited
        canPrioritizeRequest: true,     // Mark as priority
        label: 'Unlimited + Prioritize'
      }
    },

    // Incognito & Privacy
    incognito: {
      name: 'Incognito Mode',
      free: {
        enabled: false,
        label: 'Locked'
      },
      premium: {
        enabled: true,
        label: 'Browse invisibly'
      }
    },

    // Message Before Match
    messageBeforeMatch: {
      name: 'Message Before Match',
      free: {
        enabled: false,
        label: 'Locked'
      },
      premium: {
        enabled: true,
        label: 'Send first message'
      }
    },

    // Boosts & Visibility
    boosts: {
      name: 'Profile Boosts',
      free: {
        enabled: false,
        boostsPerMonth: 0,
        label: 'Locked'
      },
      premium: {
        enabled: true,
        boostsPerMonth: 3,
        label: '3 boosts/month'
      }
    },

    // Ad-Free Experience
    noAds: {
      name: 'Ad-Free',
      free: {
        enabled: false,
        label: 'See ads'
      },
      premium: {
        enabled: true,
        label: 'Ad-free experience'
      }
    }
  },

  // ================================================================
  // PAYMENT CONFIGURATION
  // ================================================================
  payment: {
    enabled: true,
    manualApproval: true,  // Admin approves payments
    methods: {
      upi: {
        enabled: true,
        id: 'krishna@hsbank',  // UPI ID - can be changed by admin
        name: 'Krishna Kumar'
      },
      qr: {
        enabled: true,
        imageUrl: null  // Admin can upload QR code image
      }
    },
    offerBanner: {
      enabled: false,
      text: 'Limited time: 50% off',
      backgroundColor: '#FFE6E6'
    }
  },

  // ================================================================
  // PLATFORM-WIDE OVERRIDE - For testing or special cases
  // ================================================================
  globalOverride: {
    // If premiumFree is true: EVERYONE gets premium features regardless of subscription
    premiumFree: false,
    
    // If disableFreeMode is true: Free plan is hidden, forced to premium
    disableFreeMode: false,
    
    // If debugMode is true: Show feature flag info in console
    debugMode: false
  },

  // ================================================================
  // FEATURE LOCK CONFIGURATION
  // ================================================================
  featureLocks: {
    // When user hits free tier limit, show this message
    messageLimit: {
      title: 'Unlock Premium',
      message: 'You\'ve used all your daily messages. Upgrade to Premium for unlimited messaging! ❤️',
      icon: '🔒'
    },
    
    profileLock: {
      title: 'Premium Feature',
      message: 'View full profiles and galleries with Premium. Upgrade to unlock! 👑',
      icon: '🔒'
    },
    
    filterLock: {
      title: 'Premium Filters',
      message: 'Advanced filters are a Premium feature. Upgrade to find exactly what you\'re looking for! 🔍',
      icon: '🔒'
    },
    
    incognitoLock: {
      title: 'Go Incognito',
      message: 'Browse invisibly with Premium. No one will know you\'re looking! 👤',
      icon: '🔒'
    },
    
    requestLock: {
      title: 'Send Unlimited Requests',
      message: 'You\'ve reached your daily request limit. Upgrade to send unlimited requests! 📨',
      icon: '🔒'
    }
  },

  // ================================================================
  // FUTURE-READY: Coupons & Promotions
  // ================================================================
  coupons: {
    enabled: false,
    // Example structure:
    // [
    //   { code: 'WELCOME50', discount: 50, validity: '2026-12-31', active: true },
    //   { code: 'FESTIVAL30', discount: 30, validity: '2026-04-30', active: false }
    // ]
    list: []
  },

  discounts: {
    // Quarterly discount config
    enabled: false,
    percentage: 0,
    validFrom: null,
    validUntil: null
  },

  referral: {
    enabled: false,
    // When user refers friend and they subscribe:
    bonusCredit: null  // Can be: free_month, days: 30, etc.
  },

  trial: {
    enabled: false,
    daysAccess: 7,  // 7-day free trial
    autoConvertToPaid: true
  }
};
