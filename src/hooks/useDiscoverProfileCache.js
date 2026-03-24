import { useCallback, useRef, useState, useEffect } from 'react';
import { chatApi } from '../services/chatApi';

const CACHE_KEY = 'discover_profiles_cache';
const CACHE_METADATA_KEY = 'discover_profiles_metadata';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Premium discover profile cache with prefetching
 * Optimizes profile loading by:
 * - Caching fetched profiles per gender filter
 * - Prefetching next batch while user is viewing current
 * - Avoiding duplicate requests
 * - Managing memory efficiently
 */
export const useDiscoverProfileCache = () => {
  const cacheRef = useRef({});
  const prefetchTimeoutRef = useRef(null);
  const [prefetchStatus, setPrefetchStatus] = useState({}); // Track prefetch progress

  // Get cache key for gender filter
  const getCacheKey = useCallback((genderFilter = 'both') => {
    return `${CACHE_KEY}_${genderFilter}`;
  }, []);

  // Get cached profiles for a gender filter
  const getCachedProfiles = useCallback((genderFilter = 'both') => {
    const key = getCacheKey(genderFilter);
    const cached = cacheRef.current[key];
    
    if (!cached) return null;
    
    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      delete cacheRef.current[key];
      return null;
    }
    
    return cached;
  }, [getCacheKey]);

  // Save profiles to cache
  const setCachedProfiles = useCallback((profiles, genderFilter = 'both', metadata = {}) => {
    if (!cacheRef.current) cacheRef.current = {};
    
    const key = getCacheKey(genderFilter);
    cacheRef.current[key] = {
      profiles,
      metadata,
      timestamp: Date.now(),
      size: JSON.stringify(profiles).length // Track cache size
    };
  }, [getCacheKey]);

  // Merge new profiles with cached ones (avoid duplicates)
  const mergeProfilesUnique = useCallback((existing = [], fresh = []) => {
    const existingIds = new Set(existing.map(p => String(p._id)));
    const uniqueFresh = fresh.filter(p => !existingIds.has(String(p._id)));
    return [...existing, ...uniqueFresh];
  }, []);

  // Fetch profiles with cache awareness
  const fetchProfilesWithCache = useCallback(async (
    page = 1,
    limit = 20,
    genderFilter = 'both',
    options = {}
  ) => {
    try {
      // Check cache first (only for page 1 to keep fresh data)
      if (page === 1 && !options.skipCache) {
        const cached = getCachedProfiles(genderFilter);
        if (cached && cached.profiles.length > 0) {
          return {
            profiles: cached.profiles,
            pagination: cached.metadata.pagination || {},
            currentGenderFilter: genderFilter,
            userGender: cached.metadata.userGender,
            defaultPreference: cached.metadata.defaultPreference,
            fromCache: true
          };
        }
      }

      // Fetch from API
      const response = await chatApi.discoverProfiles(page, limit, {
        lite: true,
        genderFilter
      });

      // Cache the results (only for page 1, to avoid cache bloat)
      if (page === 1) {
        setCachedProfiles(response.profiles, genderFilter, {
          pagination: response.pagination,
          userGender: response.userGender,
          defaultPreference: response.defaultPreference
        });
      }

      return {
        ...response,
        fromCache: false
      };
    } catch (error) {
      console.error('Error fetching discover profiles:', error);
      throw error;
    }
  }, [getCachedProfiles, setCachedProfiles]);

  // Prefetch next batch of profiles in background
  const prefetchNextProfiles = useCallback((
    page = 2,
    genderFilter = 'both'
  ) => {
    // Clear any pending prefetch
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }

    // Delay prefetch slightly to not block current interaction
    prefetchTimeoutRef.current = setTimeout(() => {
      chatApi.discoverProfiles(page, 20, {
        lite: true,
        genderFilter
      })
        .then(() => {
          setPrefetchStatus(prev => ({
            ...prev,
            [`page_${page}_${genderFilter}`]: 'complete'
          }));
        })
        .catch(err => {
          console.warn('Prefetch failed silently:', err);
          // Silently fail - don't disrupt user experience
        });
    }, 1000); // 1 second delay for prefetch
  }, []);

  // Invalidate cache for a gender filter
  const invalidateCache = useCallback((genderFilter = 'both') => {
    const key = getCacheKey(genderFilter);
    delete cacheRef.current[key];
  }, [getCacheKey]);

  // Invalidate all caches
  const invalidateAllCache = useCallback(() => {
    cacheRef.current = {};
  }, []);

  // Get cache stats (for debugging)
  const getCacheStats = useCallback(() => {
    const stats = {};
    Object.entries(cacheRef.current).forEach(([key, value]) => {
      stats[key] = {
        profileCount: value.profiles?.length || 0,
        ageSec: Math.round((Date.now() - value.timestamp) / 1000),
        sizeBytes: value.size
      };
    });
    return stats;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    fetchProfilesWithCache,
    prefetchNextProfiles,
    invalidateCache,
    invalidateAllCache,
    getCacheStats,
    getCachedProfiles,
    mergeProfilesUnique,
    prefetchStatus
  };
};

export default useDiscoverProfileCache;
