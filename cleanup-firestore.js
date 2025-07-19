// Firestore 세션 데이터 정리 스크립트
const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
  projectId: 'full-kids-tracker',
  keyFilename: './full-kids-tracker-d8b9c211d27a.json',
  ignoreUndefinedProperties: true,
});

async function cleanupWrongUserInfo() {
  try {
    console.log('🧹 Starting Firestore cleanup...');
    
    const sessionsRef = firestore.collection('play-sessions');
    const snapshot = await sessionsRef.get();
    
    console.log(`📊 Found ${snapshot.size} sessions to check`);
    
    const batch = firestore.batch();
    let cleanupCount = 0;
    
    for (const doc of snapshot.docs) {
      const session = doc.data();
      
      // 최근 업로드된 세션이 아닌 경우 userInfo 제거
      if (session.userInfo && session.sessionId !== 'session_1752890309553_63svl73wu') {
        console.log(`🗑️ Removing wrong userInfo from session: ${session.sessionId}`);
        
        // userInfo 필드 제거
        batch.update(doc.ref, {
          userInfo: Firestore.FieldValue.delete()
        });
        
        cleanupCount++;
      }
    }
    
    if (cleanupCount > 0) {
      await batch.commit();
      console.log(`✅ Cleaned up ${cleanupCount} sessions`);
    } else {
      console.log('✅ No cleanup needed');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// 실행
cleanupWrongUserInfo(); 