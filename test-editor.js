// Test script to verify editor initialization
// Run this in browser console after navigating to /dashboard/pages/new

// Check if there are any errors in the console
const checkForErrors = () => {
  const errorMessages = [];
  
  // Override console.error to capture errors
  const originalError = console.error;
  console.error = function(...args) {
    errorMessages.push(args.join(' '));
    originalError.apply(console, args);
  };
  
  // Wait for editor to load
  setTimeout(() => {
    if (errorMessages.length === 0) {
      console.log('✅ No errors detected during editor initialization');
    } else {
      console.log('❌ Errors found:', errorMessages);
    }
    // Restore original console.error
    console.error = originalError;
  }, 3000);
};

checkForErrors();
console.log('Monitoring editor initialization...');