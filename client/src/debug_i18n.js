// Debug script to test i18n functionality
// Add this to your browser console to debug language switching

console.log('🔍 i18n Debug Information:');
console.log('Current language:', window.i18n?.language);
console.log('Available languages:', window.i18n?.languages);
console.log('Resources loaded:', Object.keys(window.i18n?.store?.data || {}));

// Test translation
console.log('Test translation (welcome):', window.i18n?.t('welcome'));
console.log('Test translation (login):', window.i18n?.t('login'));

// Test language change
console.log('\n🔄 Testing language change to French...');
if (window.i18n) {
  window.i18n.changeLanguage('fr').then(() => {
    console.log('✅ Language changed to:', window.i18n.language);
    console.log('Test translation after change (welcome):', window.i18n.t('welcome'));
    console.log('Test translation after change (login):', window.i18n.t('login'));
  }).catch(err => {
    console.error('❌ Error changing language:', err);
  });
} else {
  console.error('❌ i18n not available on window object');
}

// Check if i18n is properly initialized
console.log('\n📋 i18n initialization check:');
console.log('i18n instance:', !!window.i18n);
console.log('i18n initialized:', window.i18n?.isInitialized);
console.log('i18n ready:', window.i18n?.isReady);