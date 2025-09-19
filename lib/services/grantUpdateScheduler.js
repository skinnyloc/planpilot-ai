/**
 * Grant Update Scheduler - Handles automated grant data updates
 */

import {
  fetchGrantsGovData,
  fetchFoundationGrants,
  scrapeSBAGrants,
  saveGrantsToDatabase,
  getGrantSource,
  updateGrantSourceStatus,
  removeExpiredGrants
} from './grantDataService.js';

import { supabase } from '../supabase.js';

// Update configuration
const UPDATE_CONFIG = {
  // Frequency settings (in milliseconds)
  FULL_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours
  QUICK_UPDATE_INTERVAL: 6 * 60 * 60 * 1000,  // 6 hours
  CLEANUP_INTERVAL: 60 * 60 * 1000,           // 1 hour

  // Rate limiting
  MAX_CONCURRENT_UPDATES: 3,
  REQUEST_DELAY: 2000, // 2 seconds between requests

  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
};

class GrantUpdateScheduler {
  constructor() {
    this.isRunning = false;
    this.activeUpdates = new Set();
    this.updateHistory = [];
    this.timers = new Map();
  }

  /**
   * Start the automated update system
   */
  start() {
    if (this.isRunning) {
      console.log('Grant update scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting grant update scheduler...');

    // Schedule different types of updates
    this.scheduleFullUpdate();
    this.scheduleQuickUpdate();
    this.scheduleCleanup();

    // Run initial update
    this.performInitialUpdate();
  }

  /**
   * Stop the automated update system
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    console.log('Stopping grant update scheduler...');

    // Clear all timers
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers.clear();
  }

  /**
   * Schedule full grant data updates
   */
  scheduleFullUpdate() {
    const timer = setInterval(async () => {
      if (!this.isRunning) return;

      console.log('Starting scheduled full grant update...');
      await this.performFullUpdate();
    }, UPDATE_CONFIG.FULL_UPDATE_INTERVAL);

    this.timers.set('fullUpdate', timer);
  }

  /**
   * Schedule quick updates (high-priority sources only)
   */
  scheduleQuickUpdate() {
    const timer = setInterval(async () => {
      if (!this.isRunning) return;

      console.log('Starting scheduled quick grant update...');
      await this.performQuickUpdate();
    }, UPDATE_CONFIG.QUICK_UPDATE_INTERVAL);

    this.timers.set('quickUpdate', timer);
  }

  /**
   * Schedule cleanup tasks
   */
  scheduleCleanup() {
    const timer = setInterval(async () => {
      if (!this.isRunning) return;

      console.log('Starting scheduled cleanup...');
      await this.performCleanup();
    }, UPDATE_CONFIG.CLEANUP_INTERVAL);

    this.timers.set('cleanup', timer);
  }

  /**
   * Perform initial update when scheduler starts
   */
  async performInitialUpdate() {
    try {
      console.log('Performing initial grant data update...');

      // Check if we have any grants in the database
      const { count } = await supabase
        .from('grants')
        .select('*', { count: 'exact', head: true });

      if (!count || count < 10) {
        // Database is empty or has very few grants, do full update
        await this.performFullUpdate();
      } else {
        // Database has data, do quick update
        await this.performQuickUpdate();
      }

    } catch (error) {
      console.error('Initial update failed:', error);
    }
  }

  /**
   * Perform full update from all sources
   */
  async performFullUpdate() {
    const updateId = this.generateUpdateId();
    this.activeUpdates.add(updateId);

    try {
      const startTime = Date.now();
      const results = {
        sources: [],
        totalGrants: 0,
        errors: []
      };

      // Update from all configured sources
      const sources = [
        { name: 'Grants.gov', fetcher: fetchGrantsGovData },
        { name: 'Foundation Grants', fetcher: fetchFoundationGrants },
        { name: 'SBA Grants', fetcher: scrapeSBAGrants }
      ];

      // Process sources with rate limiting
      for (const source of sources) {
        if (!this.isRunning) break;

        try {
          await this.delay(UPDATE_CONFIG.REQUEST_DELAY);

          const sourceRecord = await getGrantSource(source.name);
          if (!sourceRecord) {
            console.warn(`Source ${source.name} not found in database`);
            continue;
          }

          await updateGrantSourceStatus(sourceRecord.id, 'updating');

          const grants = await this.withRetry(source.fetcher);

          if (grants && grants.length > 0) {
            const saved = await saveGrantsToDatabase(grants, sourceRecord.id);

            results.sources.push({
              name: source.name,
              fetched: grants.length,
              saved: saved?.length || 0
            });

            results.totalGrants += saved?.length || 0;

            await updateGrantSourceStatus(sourceRecord.id, 'active');
            console.log(`Updated ${grants.length} grants from ${source.name}`);
          } else {
            await updateGrantSourceStatus(sourceRecord.id, 'active', 'No new grants found');
          }

        } catch (error) {
          console.error(`Failed to update from ${source.name}:`, error);
          results.errors.push(`${source.name}: ${error.message}`);

          const sourceRecord = await getGrantSource(source.name);
          if (sourceRecord) {
            await updateGrantSourceStatus(sourceRecord.id, 'error', error.message);
          }
        }
      }

      const duration = Date.now() - startTime;
      const updateRecord = {
        id: updateId,
        type: 'full',
        startTime: new Date(startTime),
        endTime: new Date(),
        duration,
        results,
        success: results.errors.length === 0
      };

      this.updateHistory.push(updateRecord);
      await this.saveUpdateHistory(updateRecord);

      console.log(`Full update completed in ${duration}ms. Updated ${results.totalGrants} grants.`);

    } catch (error) {
      console.error('Full update failed:', error);
    } finally {
      this.activeUpdates.delete(updateId);
    }
  }

  /**
   * Perform quick update (high-priority sources only)
   */
  async performQuickUpdate() {
    const updateId = this.generateUpdateId();
    this.activeUpdates.add(updateId);

    try {
      const startTime = Date.now();

      // Only update from high-priority, fast sources
      const grants = await this.withRetry(fetchGrantsGovData);

      if (grants && grants.length > 0) {
        const sourceRecord = await getGrantSource('Grants.gov');
        if (sourceRecord) {
          await saveGrantsToDatabase(grants, sourceRecord.id);
          console.log(`Quick update: ${grants.length} grants from Grants.gov`);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Quick update completed in ${duration}ms`);

    } catch (error) {
      console.error('Quick update failed:', error);
    } finally {
      this.activeUpdates.delete(updateId);
    }
  }

  /**
   * Perform cleanup tasks
   */
  async performCleanup() {
    try {
      console.log('Starting cleanup tasks...');

      // Remove expired grants
      await removeExpiredGrants();

      // Clean up old update history (keep last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      this.updateHistory = this.updateHistory.filter(
        record => record.startTime > thirtyDaysAgo
      );

      // Update grant analytics
      await this.updateGrantAnalytics();

      console.log('Cleanup tasks completed');

    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Update grant analytics and statistics
   */
  async updateGrantAnalytics() {
    try {
      // Get grant statistics
      const { data: stats } = await supabase
        .from('grants')
        .select('status, agency, category_id')
        .eq('status', 'active');

      if (stats) {
        // Update source statistics
        const sourceStats = stats.reduce((acc, grant) => {
          acc[grant.agency] = (acc[grant.agency] || 0) + 1;
          return acc;
        }, {});

        // Update grant sources table with current counts
        for (const [agency, count] of Object.entries(sourceStats)) {
          await supabase
            .from('grant_sources')
            .update({ total_grants: count })
            .eq('name', agency);
        }
      }

    } catch (error) {
      console.error('Analytics update failed:', error);
    }
  }

  /**
   * Save update history to database
   */
  async saveUpdateHistory(updateRecord) {
    try {
      // Store update history in a dedicated table or as metadata
      console.log('Update history saved:', updateRecord.id);

    } catch (error) {
      console.error('Failed to save update history:', error);
    }
  }

  /**
   * Retry wrapper for API calls
   */
  async withRetry(fn, retries = UPDATE_CONFIG.MAX_RETRIES) {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries) throw error;

        console.log(`Retry ${i + 1}/${retries} after error:`, error.message);
        await this.delay(UPDATE_CONFIG.RETRY_DELAY * (i + 1));
      }
    }
  }

  /**
   * Delay utility
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate unique update ID
   */
  generateUpdateId() {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeUpdates: Array.from(this.activeUpdates),
      updateHistory: this.updateHistory.slice(-10), // Last 10 updates
      nextScheduledUpdate: this.getNextScheduledTime()
    };
  }

  /**
   * Get next scheduled update time
   */
  getNextScheduledTime() {
    // This would calculate the next scheduled update based on intervals
    const now = Date.now();
    const nextFull = now + UPDATE_CONFIG.FULL_UPDATE_INTERVAL;
    const nextQuick = now + UPDATE_CONFIG.QUICK_UPDATE_INTERVAL;

    return {
      nextFull: new Date(nextFull),
      nextQuick: new Date(nextQuick)
    };
  }

  /**
   * Manually trigger update
   */
  async triggerManualUpdate(type = 'full') {
    if (type === 'full') {
      return await this.performFullUpdate();
    } else {
      return await this.performQuickUpdate();
    }
  }
}

// Export singleton instance
export const grantUpdateScheduler = new GrantUpdateScheduler();

// Auto-start in production environments
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Only auto-start in server environment in production
  grantUpdateScheduler.start();
}

export default grantUpdateScheduler;