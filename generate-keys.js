// generate-keys.js
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();

console.log('Copie ces clés dans ton fichier .env :');
console.log('');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);