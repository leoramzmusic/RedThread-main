import apiClient from "./api";

interface PhotoMetricPayload {
  media_id: string;
  target_user_id?: string;
  views?: number;
  clicks?: number;
  matches?: number;
  view_time?: number;
  conversions?: number;
}

export interface SmartPhotosEvaluateResult {
  changed: boolean;
  primary_media_id?: string | null;
}

class SmartPhotosTracker {
  private pendingMetrics: Map<string, PhotoMetricPayload> = new Map();
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 3000; // 3 seconds
  private viewStartTimes: Map<string, number> = new Map();
  private viewedMedia: Set<string> = new Set();
  private currentUserId: string | null = null;

  setCurrentUser(userId: string | null) {
    this.currentUserId = userId;
  }

  /**
   * Track a photo view - only counts once per session per media item
   */
  trackView(mediaId: string, targetUserId: string) {
    if (!this.currentUserId || this.currentUserId === targetUserId) return;
    if (this.viewedMedia.has(mediaId)) return;

    this.viewedMedia.add(mediaId);
    this.viewStartTimes.set(mediaId, Date.now());

    this.queueMetric(mediaId, targetUserId, { views: 1 });
  }

  /**
   * Track a photo click/tap
   */
  trackClick(mediaId: string, targetUserId: string) {
    if (!this.currentUserId || this.currentUserId === targetUserId) return;

    this.queueMetric(mediaId, targetUserId, { clicks: 1 });
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
      this.queueMetric(mediaId, targetUserId, { view_time: viewTime });
    }

    this.viewStartTimes.delete(mediaId);
  }

  /**
   * Track when a match occurs from this photo (called from swipe handler)
   */
  trackMatch(mediaId: string, targetUserId: string) {
    if (!this.currentUserId || this.currentUserId === targetUserId) return;

    this.queueMetric(mediaId, targetUserId, { matches: 1 });
    // Matches are high-signal: flush immediately so the owner's next
    // evaluation sees them. The backend auto-evaluates on track.
    void this.flush();
  }

  /**
   * Queue metric for batched sending
   */
  private queueMetric(mediaId: string, targetUserId: string, metric: Partial<PhotoMetricPayload>) {
    const existing = this.pendingMetrics.get(mediaId) || { media_id: mediaId };
    this.pendingMetrics.set(mediaId, {
      ...existing,
      target_user_id: targetUserId,
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
  reset() {
    this.viewedMedia.clear();
    this.viewStartTimes.clear();
  }

  /**
   * Trigger Smart Photos evaluation for current user.
   * Returns whether the primary photo changed.
   */
  async evaluateSmartPhotos(): Promise<SmartPhotosEvaluateResult> {
    try {
      const res = await apiClient.post("/media/smart-photos/evaluate");
      return {
        changed: Boolean(res.data?.changed),
        primary_media_id: res.data?.primary_media_id ?? null,
      };
    } catch (err) {
      console.error("Failed to evaluate Smart Photos:", err);
      return { changed: false, primary_media_id: null };
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