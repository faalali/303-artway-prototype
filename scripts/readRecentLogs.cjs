const admin = require('firebase-admin');

process.env.GCLOUD_PROJECT = 'ila-gallery-database';

admin.initializeApp();

const db = admin.firestore();

async function getRecentLogs() {
  try {
    console.log('Fetching recent debug logs...');
    const snapshot = await db.collection('debug_logs')
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();
      
    if (snapshot.empty) {
      console.log('No debug logs found.');
      return;
    }
    
    snapshot.forEach(doc => {
      console.log(`Log ID: ${doc.id}`);
      console.log(JSON.stringify(doc.data(), null, 2));
      console.log('------------------------------------');
    });
  } catch (err) {
    console.error('Error fetching logs:', err);
  }
}

getRecentLogs();
