import apiClient from "./api";

interface PhotoMetricPayload {
  media_id: string;
  views?: number;
  clicks?: number;
  matches?: number;
  view_time?: number;
  conversions?: number;
}

class SmartPhotosTracker {
  private pendingMetrics: Map<string, PhotoMetricPayload> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 3000; // 3 seconds
  private viewStartTimes: Map<string, number> = new Map();
  private viewedMedia: Set<string> = new Set();
  private currentUserId: string | null = null;
  
  // Auto-evaluation tracking
  private evaluationTimer: NodeJS.Timeout | null = null;
  private readonly EVALUATION_INTERVAL = 60000; // 1 minute
  private viewCounts: Map<string, number> = new Map();
  private matchCounts: Map<string, number> = new Map();

  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
    if (userId) {
      this.startPeriodicEvaluation();
    } else {
      this.stopPeriodicEvaluation();
    }
  }

  /**
   * Track a photo view - only counts once per session per media item
   */
  trackView(mediaId: string, targetUserId: string) {
    if (!this.currentUserId || this.currentUserId === targetUserId) return;
    if (this.viewedMedia.has(mediaId)) return;

    this.viewedMedia.add(mediaId);
    this.viewStartTimes.set(mediaId, Date.now());

    this.queueMetric(mediaId, { views: 1 });
    
    // Track local view count for auto-evaluation trigger
    const currentViews = (this.viewCounts.get(mediaId) || 0) + 1;
    this.viewCounts.set(mediaId, currentViews);
    
    // Trigger evaluation every 10 views on any photo
    if (currentViews % 10 === 0) {
      this.maybeTriggerEvaluation();
    }
  }

  /**
   * Track a photo click/tap
   */
  trackClick(mediaId: string, targetUserId: string) {
    if (!this.currentUserId || this.currentUserId === targetUserId) return;

    this.queueMetric(mediaId, { clicks: 1 });
  }

  /**
   * Track view time when photo leaves viewport or component unmounts
   */
  trackViewTime(mediaId: string, targetUserId: string) {
    if (!this.currentUserId || this.currentUserId === targetUserId) return;

    const startTime = this.viewStartTimes.get(mediaId);
    if (!startTime) return;

    const viewTime = (Date.now() - startTime) / 1000; // seconds
    if (viewTime > 0.5) { // Only track meaningful views (>500ms)
      this.queueMetric(mediaId, { view_time: viewTime });
    }

    this.viewStartTimes.delete(mediaId);
  }

  /**
   * Track when a match occurs from this photo (called from swipe handler)
   */
  trackMatch(mediaId: string, targetUserId: string) {
    if (!this.currentUserId || this.currentUserId === targetUserId) return;

    this.queueMetric(mediaId, { matches: 1 });
    
    // Track local match count for auto-evaluation trigger
    const currentMatches = (this.matchCounts.get(mediaId) || 0) + 1;
    this.matchCounts.set(mediaId, currentMatches);
    
    // Trigger evaluation on every match (high signal)
    this.maybeTriggerEvaluation();
  }

  /**
   * Check if we should trigger evaluation and do so
   */
  private maybeTriggerEvaluation() {
    // Only trigger if user has smart photos enabled (we'll check on backend)
    // Debounce: only trigger once per 30 seconds
    if (this.evaluationTimer) return;
    
    this.evaluationTimer = setTimeout(() => {
      this.evaluationTimer = null;
      this.evaluateSmartPhotos();
    }, 30000);
  }

  /**
   * Start periodic evaluation check
   */
  private startPeriodicEvaluation() {
    if (this.evaluationTimer) return;
    
    this.evaluationTimer = setInterval(() => {
      // Only evaluate if we have meaningful data
      const totalViews = Array.from(this.viewCounts.values()).reduce((a, b) => a + b, 0);
      if (totalViews >= 5) { // At least 5 total views across all photos
        this.evaluateSmartPhotos();
      }
    }, this.EVALUATION_INTERVAL);
  }

  /**
   * Stop periodic evaluation
   */
  private stopPeriodicEvaluation() {
    if (this.evaluationTimer) {
      clearInterval(this.evaluationTimer);
      this.evaluationTimer = null;
    }
  }

  /**
   * Queue metric for batched sending
   */
  private queueMetric(mediaId: string, metric: Partial<PhotoMetricPayload>) {
    const existing = this.pendingMetrics.get(mediaId) || { media_id: mediaId };
    this.pendingMetrics.set(mediaId, {
      ...existing,
      ...metric,
      views: (existing.views || 0) + (metric.views || 0),
      clicks: (existing.clicks || 0) + (metric.clicks || 0),
      matches: (existing.matches || 0) + (metric.matches || 0),
      view_time: (existing.view_time || 0) + (metric.view_time || 0),
      conversions: (existing.conversions || 0) + (metric.conversions || 0),
    });

    this.scheduleFlush();
  }

  /**
   * Schedule a flush of pending metrics
   */
  private scheduleFlush() {
    if (this.flushTimer) return;

    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  /**
   * Send all pending metrics to backend
   */
  private async flush() {
    if (this.pendingMetrics.size === 0) return;

    const metrics = Array.from(this.pendingMetrics.values());
    this.pendingMetrics.clear();

    try {
      await Promise.all(
        metrics.map((metric) =>
          apiClient.post("/media/metrics/track", metric).catch((err) => {
            console.error("Failed to track photo metric:", err);
          })
        )
      );
    } catch (err) {
      console.error("Error flushing photo metrics:", err);
    }
  }

  /**
   * Force flush all pending metrics (e.g., on page unload)
   */
  async forceFlush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }

  /**
   * Reset tracker for new session/profile
   */
  reset(targetUserId?: string) {
    if (targetUserId) {
      // Clear only metrics for a specific target user
      // Since we don't track targetUserId in pendingMetrics, we clear all
      // This is fine as we typically only view one profile at a time
    }
    this.viewedMedia.clear();
    this.viewStartTimes.clear();
    this.viewCounts.clear();
    this.matchCounts.clear();
  }

  /**
   * Trigger Smart Photos evaluation for current user
   */
  async evaluateSmartPhotos() {
    try {
      await apiClient.post("/media/smart-photos/evaluate");
    } catch (err) {
      console.error("Failed to evaluate Smart Photos:", err);
    }
  }
}

// Export singleton instance
export const smartPhotosTracker = new SmartPhotosTracker();

// React hook for easy integration
import { useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";

export function useSmartPhotosTracking(targetUserId: string, mediaItems: { _id: string; type: string }[]) {
  const { user } = useSelector((state: RootState) => state.auth);
  const trackerRef = useRef(smartPhotosTracker);
  const observedMediaRef = useRef<Set<string>>(new Set());

  // Update current user
  useEffect(() => {
    trackerRef.current.setCurrentUser(user?.user_id || null);
  }, [user?.user_id]);

  // Track views using IntersectionObserver
  useEffect(() => {
    if (!user?.user_id || user.user_id === targetUserId) return;
    if (mediaItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const mediaId = entry.target.getAttribute("data-media-id");
            if (mediaId && !observedMediaRef.current.has(mediaId)) {
              observedMediaRef.current.add(mediaId);
              trackerRef.current.trackView(mediaId, targetUserId);
            }
          } else {
            const mediaId = entry.target.getAttribute("data-media-id");
            if (mediaId) {
              trackerRef.current.trackViewTime(mediaId, targetUserId);
            }
          }
        });
      },
      { threshold: 0.5, rootMargin: "0px" }
    );

    // Observe all photo elements
    const elements = document.querySelectorAll(`[data-media-id]`);
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      // Track view time for all currently observed items
      observedMediaRef.current.forEach((mediaId) => {
        trackerRef.current.trackViewTime(mediaId, targetUserId);
      });
      observedMediaRef.current.clear();
    };
  }, [mediaItems, targetUserId, user?.user_id]);

  // Track click on photo
  const handlePhotoClick = useCallback(
    (mediaId: string) => {
      trackerRef.current.trackClick(mediaId, targetUserId);
    },
    [targetUserId]
  );

  // Track match from this photo
  const handleMatch = useCallback(
    (mediaId: string) => {
      trackerRef.current.trackMatch(mediaId, targetUserId);
    },
    [targetUserId]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      trackerRef.current.forceFlush();
    };
  }, []);

  return { handlePhotoClick, handleMatch };
}