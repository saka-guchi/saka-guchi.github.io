const CACHE_NAME = 'lab-vocab-v1.7';
const ASSETS = [
    './',
    './index.html',
    './list.html',
    './priming.html',
    './quiz.html',
    './result.html',
    './records.html',
    './settings.html',
    './style.css',
    './app.js',
    './lottie.min.js',
    './assets/dog.json',
    './assets/icon.svg',
    './words/lists.csv',
    './words/NGSL.csv',
    './words/IELTS3500.csv'
];

self.addEventListener('install', event => {
    // Force new service worker to activate immediately
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', event => {
    // Take control of all clients immediately
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(keys => Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) return caches.delete(key);
                })
            ))
        ])
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
