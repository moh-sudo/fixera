/* Fixera — Firebase Cloud Messaging service worker
 * Handles background push notifications when the app is not in focus.
 */
/* eslint-disable no-undef */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyDGRbcsrZcuoOqD_7D7_3Z_119ZGZVmD9c',
  projectId:         'fixera-5df68',
  messagingSenderId: '551843668148',
  appId:             '1:551843668148:web:83185d74b8c00d68b237e1',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || 'Fixera', {
    body:  body  || '',
    icon:  icon  || '/fixera-icon.svg',
    badge: '/fixera-icon.svg',
  });
});
