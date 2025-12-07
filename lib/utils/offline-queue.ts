/**
 * Offline Queue Manager
 * Queues actions to be synced when back online
 */

const QUEUE_KEY = 'offline_action_queue';
const MAX_QUEUE_SIZE = 50;

export interface QueuedAction {
  id: string;
  type: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

class OfflineQueue {
  private queue: QueuedAction[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadQueue();
    }
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[OfflineQueue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineQueue] Failed to save queue:', error);
    }
  }

  /**
   * Add an action to the queue
   */
  enqueue(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>): string {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    // Prevent queue overflow
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest items
      this.queue = this.queue.slice(-MAX_QUEUE_SIZE + 1);
    }

    this.queue.push(queuedAction);
    this.saveQueue();

    // Try to sync if online
    if (navigator.onLine) {
      this.sync();
    }

    return queuedAction.id;
  }

  /**
   * Remove an action from the queue
   */
  dequeue(actionId: string): boolean {
    const index = this.queue.findIndex(a => a.id === actionId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
      return true;
    }
    return false;
  }

  /**
   * Get all queued actions
   */
  getAll(): QueuedAction[] {
    return [...this.queue];
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Sync queued actions when back online
   */
  async sync(): Promise<void> {
    if (!navigator.onLine || this.queue.length === 0) {
      return;
    }

    const actionsToSync = [...this.queue];
    
    for (const action of actionsToSync) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: {
            'Content-Type': 'application/json',
            ...action.headers,
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        if (response.ok) {
          // Success - remove from queue
          this.dequeue(action.id);
        } else {
          // Failed - increment retries
          action.retries++;
          if (action.retries >= 3) {
            // Max retries reached - remove from queue
            this.dequeue(action.id);
          } else {
            this.saveQueue();
          }
        }
      } catch (error) {
        // Network error - keep in queue
        action.retries++;
        if (action.retries >= 3) {
          this.dequeue(action.id);
        } else {
          this.saveQueue();
        }
      }
    }
  }
}

// Singleton instance
export const offlineQueue = typeof window !== 'undefined' ? new OfflineQueue() : null;
