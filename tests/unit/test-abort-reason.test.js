/**
 * Test to verify that abort reason is preserved in CanceledError
 * This tests the fix for GitHub issue: axios breaks with AbortController abort reasons
 */

'use strict';

import axios from '../../index.js';

// Test 1: Node.js environment with http adapter
async function testNodeHttpAdapter() {
  console.log('\n=== Test 1: Node.js HTTP Adapter ===');
  const controller = new AbortController();
  
  // Simulate a request (without actually making it)
  const timeout = setTimeout(() => {
    console.log('Aborting with TimeoutError reason...');
    controller.abort('TimeoutError');
  }, 100);

  try {
    await axios.get('http://httpbin.org/delay/10', {
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    console.log('Error caught:');
    console.log(`  - message: "${error.message}"`);
    console.log(`  - code: ${error.code}`);
    console.log(`  - isCancel: ${error.__CANCEL__}`);
    
    if (error.message === 'TimeoutError') {
      console.log('✓ Success: Abort reason "TimeoutError" was preserved!');
    } else {
      console.log('✗ Failed: Abort reason was not preserved. Got:', error.message);
    }
  }
}

// Test 2: Custom reason scenarios
async function testCustomReasons() {
  console.log('\n=== Test 2: Custom Abort Reasons ===');
  
  const testCases = [
    { reason: 'UserCanceled', description: 'User clicked cancel' },
    { reason: 'NavigationAbort', description: 'User navigated away' },
    { reason: 'RequestTimeout', description: 'Custom timeout' },
  ];

  for (const testCase of testCases) {
    const controller = new AbortController();
    
    const timeout = setTimeout(() => {
      controller.abort(testCase.reason);
    }, 50);

    try {
      await axios.get('http://httpbin.org/delay/10', {
        signal: controller.signal
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error.message === testCase.reason) {
        console.log(`✓ ${testCase.description}: "${testCase.reason}" preserved`);
      } else {
        console.log(`✗ ${testCase.description}: Expected "${testCase.reason}", got "${error.message}"`);
      }
    }
  }
}

// Run tests
async function runTests() {
  console.log('Testing AbortController abort reason preservation...');
  
  try {
    await testNodeHttpAdapter();
    await testCustomReasons();
  } catch (error) {
    console.error('Test suite error:', error);
  }
  
  console.log('\n=== Tests Complete ===');
}

runTests();
