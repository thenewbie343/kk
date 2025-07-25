// Service Worker for Artisan Bakery & Café PWA
const CACHE_NAME = 'artisan-bakery-v1';
const API_CACHE_NAME = 'artisan-bakery-api-v1';

// Files to cache for offline usage
const STATIC_CACHE_FILES = [
  '/',
  '/cafe',
  '/bakery',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// API endpoints to cache
const API_URLS = [
  '/api/menu',
  '/api/menu/cafe', 
  '/api/menu/bakery'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('Service Worker: Caching static files');
          return cache.addAll(STATIC_CACHE_FILES);
        }),
      // Cache API responses
      caches.open(API_CACHE_NAME)
        .then(cache => {
          console.log('Service Worker: Pre-caching API endpoints');
          return Promise.all(
            API_URLS.map(url => {
              return fetch(url)
                .then(response => response.ok ? cache.put(url, response) : null)
                .catch(() => console.log(`Failed to cache ${url}`));
            })
          );
        })
    ])
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== API_CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      // Try network first for API calls
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          console.log('Service Worker: Network failed, serving from cache');
          return caches.match(request);
        })
    );
    return;
  }
  
  // Handle static files
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Cache the response for future use
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
            
            return response;
          });
      })
  );
});

// Background sync for orders when back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'order-sync') {
    console.log('Service Worker: Syncing pending orders');
    event.waitUntil(syncPendingOrders());
  }
});

// Push notifications for order updates
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Your order is ready for pickup!',
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      },
      actions: [
        {
          action: 'view',
          title: 'View Order',
          icon: '/pwa-icon-192.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Artisan Bakery & Café',
        options
      )
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Sync pending orders when connection is restored
async function syncPendingOrders() {
  try {
    // Get pending orders from IndexedDB or localStorage
    const pendingOrders = await getPendingOrders();
    
    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(order.data)
        });
        
        if (response.ok) {
          // Remove from pending orders
          await removePendingOrder(order.id);
          console.log('Service Worker: Order synced successfully');
        }
      } catch (error) {
        console.log('Service Worker: Failed to sync order', error);
      }
    }
  } catch (error) {
    console.log('Service Worker: Background sync failed', error);
  }
}

// Helper functions for pending orders
async function getPendingOrders() {
  // Implementation would use IndexedDB
  return JSON.parse(localStorage.getItem('pendingOrders') || '[]');
}

async function removePendingOrder(orderId) {
  // Implementation would use IndexedDB
  const pending = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
  const filtered = pending.filter(order => order.id !== orderId);
  localStorage.setItem('pendingOrders', JSON.stringify(filtered));
}