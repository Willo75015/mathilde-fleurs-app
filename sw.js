// Service Worker simplifié pour Mathilde Fleurs PWA
const CACHE_NAME = 'mathilde-fleurs-v1.0'
const urlsToCache = [
  '/mathilde-fleurs-app/',
  '/mathilde-fleurs-app/index.html',
  '/mathilde-fleurs-app/manifest.json'
]

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🌸 Service Worker: Installation')
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache ouvert')
        return cache.addAll(urlsToCache).catch(err => {
          console.log('⚠️ Erreur cache (normal en dev):', err)
          return Promise.resolve()
        })
      })
  )
  self.skipWaiting()
})

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('🌸 Service Worker: Activation')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Suppression ancien cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Stratégie Cache First pour les assets statiques
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-HTTP
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Ignorer les requêtes vers des APIs externes
  if (event.request.url.includes('api') || event.request.url.includes('vercel')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si on a une version en cache, on la retourne
        if (cachedResponse) {
          console.log('📦 Cache hit:', event.request.url)
          return cachedResponse
        }

        // Sinon on fetch et on met en cache
        return fetch(event.request).then(
          (response) => {
            // Vérifier que c'est une réponse valide
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Cloner la réponse
            const responseToCache = response.clone()

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })

            return response
          }
        ).catch(() => {
          // En cas d'erreur réseau, retourner une page offline simple
          if (event.request.destination === 'document') {
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Mathilde Fleurs - Mode Hors Ligne</title>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: Arial; text-align: center; padding: 50px; background: #10B981; color: white;">
                  <h1>🌸 Mathilde Fleurs</h1>
                  <h2>Mode Hors Ligne</h2>
                  <p>Vous êtes déconnecté, mais l'app fonctionne toujours !</p>
                  <button onclick="window.location.reload()" style="padding: 10px 20px; background: white; color: #10B981; border: none; border-radius: 5px; font-size: 16px;">
                    Réessayer
                  </button>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            })
          }
        })
      })
  )
})

// Message de debug
console.log('🌸 Mathilde Fleurs Service Worker chargé')
