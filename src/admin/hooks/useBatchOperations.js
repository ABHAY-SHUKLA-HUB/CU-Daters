// ============================================================================
// useBatchOperations.js - Bulk Approval/Rejection with Audit Trail
// ============================================================================
// Allows admins to perform actions on multiple items with proper confirmation

import React from 'react';

export function useBatchOperations() {
  // State for batch operation
  const [batchState, setBatchState] = React.useState({
    selectedIds: new Set(),
    action: null,        // 'approve', 'reject', 'ban', 'suspend'
    reason: null,
    progress: 0,
    total: 0,
    results: {
      succeeded: [],
      failed: []
    }
  });

  // Toggle selection of single item
  const toggleSelection = React.useCallback((id) => {
    setBatchState(prev => {
      const newSet = new Set(prev.selectedIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { ...prev, selectedIds: newSet };
    });
  }, []);

  // Select all items in current filtered list
  const selectAll = React.useCallback((items = []) => {
    setBatchState(prev => ({
      ...prev,
      selectedIds: new Set(items.map(item => item._id || item.id))
    }));
  }, []);

  // Clear all selections
  const clearSelection = React.useCallback(() => {
    setBatchState(prev => ({
      ...prev,
      selectedIds: new Set(),
      results: { succeeded: [], failed: [] }
    }));
  }, []);

  // Prepare batch operation (requires confirmation)
  const prepareBatchAction = React.useCallback((action, reason = '') => {
    if (batchState.selectedIds.size === 0) {
      return { error: 'No items selected' };
    }

    setBatchState(prev => ({
      ...prev,
      action,
      reason,
      total: prev.selectedIds.size,
      progress: 0
    }));

    return { success: true, count: batchState.selectedIds.size };
  }, [batchState.selectedIds]);

  // Execute batch operation (call API for each item)
  const executeBatchOperation = React.useCallback(async (
    actionFn,  // async (id, action, reason) => response
    onProgress = null
  ) => {
    const ids = Array.from(batchState.selectedIds);
    const results = { succeeded: [], failed: [] };

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        const response = await actionFn(id, batchState.action, batchState.reason);
        results.succeeded.push({ id, response });
        
        // Update progress
        setBatchState(prev => ({
          ...prev,
          progress: i + 1,
          results
        }));

        if (onProgress) onProgress(i + 1, ids.length);
      } catch (error) {
        results.failed.push({ id, error: error.message });
        
        // Still update progress even on failure
        setBatchState(prev => ({
          ...prev,
          progress: i + 1,
          results
        }));
      }
    }

    return results;
  }, [batchState]);

  // Cancel batch operation
  const cancelBatchOperation = React.useCallback(() => {
    setBatchState(prev => ({
      ...prev,
      action: null,
      reason: null,
      progress: 0,
      total: 0
    }));
  }, []);

  // Get summary of batch results
  const getBatchSummary = React.useCallback(() => {
    return {
      totalSelected: batchState.selectedIds.size,
      action: batchState.action,
      reason: batchState.reason,
      progress: batchState.progress,
      total: batchState.total,
      succeeded: batchState.results.succeeded.length,
      failed: batchState.results.failed.length,
      successRate: batchState.total > 0 
        ? Math.round((batchState.results.succeeded.length / batchState.total) * 100)
        : 0
    };
  }, [batchState]);

  return {
    batchState,
    toggleSelection,
    selectAll,
    clearSelection,
    prepareBatchAction,
    executeBatchOperation,
    cancelBatchOperation,
    getBatchSummary
  };
}

export default useBatchOperations;
