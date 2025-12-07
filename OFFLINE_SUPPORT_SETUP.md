# Offline Support Setup Guide

## Overview

The customer dashboard now includes comprehensive offline support with service worker caching, background sync, and offline UI indicators.

## Features Implemented

### 1. Service Worker (`public/sw.js`)
- **Static Asset Caching**: Caches dashboard pages, login, and essential assets
- **API Response Caching**: Network-first strategy for dashboard API endpoints
- **Offline Fallback**: Serves cached data when offline
- **Background Sync**: Syncs queued actions when back online
- **Cache Management**: Automatic cache versioning and cleanup

### 2. Offline Detection (`lib/hooks/use-offline.ts`)
- Real-time online/offline status detection
- Callbacks for online/offline events
- Tracks offline state history

### 3. Offline Queue (`lib/utils/offline-queue.ts`)
- Queues failed API requests for retry
- Automatic sync when back online
- Retry logic with max attempts
- Persistent storage in localStorage

### 4. Cache Manager (`lib/utils/cache-manager.ts`)
- Cache size estimation
- Cache clearing utilities
- Service worker management
- Preload utilities

### 5. UI Components
- **OfflineIndicator**: Shows online/offline status banner
- **OfflinePage**: Dedicated offline page at `/offline`
- Visual feedback for connection status

## Cached Routes

### Static Pages
- `/` (Homepage)
- `/login`
- `/dashboard`
- `/dashboard/bookings`
- `/dashboard/settings`
- `/dashboard/profile`
- `/cleaner/login`
- `/cleaner/dashboard`
- `/offline`

### API Endpoints (Network-First Strategy)
- `/api/dashboard/bookings`
- `/api/dashboard/stats`
- `/api/dashboard/favorites`
- `/api/dashboard/templates`
- `/api/dashboard/reminders`
- `/api/cleaners/available`

## How It Works

### Online Behavior
1. Service worker intercepts requests
2. Tries network first for API calls
3. Caches successful responses
4. Serves fresh data to user

### Offline Behavior
1. Service worker detects offline status
2. Serves cached responses for API calls
3. Shows offline indicator
4. Queues failed POST/PUT/DELETE requests
5. Displays cached dashboard data

### Coming Back Online
1. Detects connection restored
2. Automatically syncs queued actions
3. Refreshes dashboard data
4. Shows "Connection restored" message

## Testing Offline Support

### Browser DevTools
1. Open Chrome DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers**
4. Check "Offline" checkbox
5. Refresh page - should show cached content

### Network Tab
1. Open DevTools → **Network** tab
2. Set throttling to **Offline**
3. Navigate dashboard - should use cached data

### Programmatic Testing
```javascript
// Force offline mode
window.dispatchEvent(new Event('offline'));

// Force online mode
window.dispatchEvent(new Event('online'));
```

## Cache Management

### Clear All Caches
```typescript
import { CacheManager } from '@/lib/utils/cache-manager';

// Clear all caches
await CacheManager.clearAll();
```

### Clear Specific Cache
```typescript
await CacheManager.clearCache('shalean-app-v2');
```

### Get Cache Size
```typescript
const size = await CacheManager.getCacheSize('shalean-data-v2');
console.log(`Cache size: ${(size / 1024 / 1024).toFixed(2)} MB`);
```

## Offline Queue Usage

### Queue an Action
```typescript
import { offlineQueue } from '@/lib/utils/offline-queue';

if (!navigator.onLine && offlineQueue) {
  offlineQueue.enqueue({
    type: 'UPDATE_BOOKING',
    url: '/api/dashboard/bookings',
    method: 'PUT',
    body: { bookingId: '123', status: 'cancelled' },
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
```

### Sync Queue Manually
```typescript
if (offlineQueue) {
  await offlineQueue.sync();
}
```

## Service Worker Updates

The service worker automatically updates when:
- New version is deployed
- User refreshes page (checks for updates)
- Hourly update check runs

Users will see a notification when a new version is available.

## Limitations

1. **Authentication**: Requires online for initial login
2. **Real-time Updates**: Supabase Realtime requires online connection
3. **File Uploads**: Cannot upload files offline
4. **Payment Processing**: Requires online connection
5. **Admin Routes**: Admin API routes are never cached

## Best Practices

1. **Cache Important Data**: Only cache frequently accessed data
2. **Set Cache Limits**: Use MAX_QUEUE_SIZE to prevent storage overflow
3. **Handle Errors Gracefully**: Show helpful messages when offline
4. **Sync Strategically**: Sync queued actions when back online
5. **Test Regularly**: Test offline functionality in different scenarios

## Troubleshooting

### Service Worker Not Registering
- Check browser console for errors
- Verify `/sw.js` file exists in `public/` directory
- Ensure HTTPS (or localhost) is used
- Check browser support (Chrome, Firefox, Edge, Safari)

### Cache Not Updating
- Clear browser cache
- Unregister service worker in DevTools
- Hard refresh (Ctrl+Shift+R)

### Offline Queue Not Syncing
- Check `navigator.onLine` status
- Verify queue items in localStorage
- Check browser console for sync errors

## Production Deployment

1. **Build the app**: `npm run build`
2. **Deploy**: Service worker will be included automatically
3. **Verify**: Check `/sw.js` is accessible
4. **Test**: Test offline functionality in production

## Future Enhancements

- [ ] IndexedDB for larger data storage
- [ ] Background sync API for queued actions
- [ ] Push notifications for offline events
- [ ] Cache size monitoring and alerts
- [ ] Selective cache clearing UI
