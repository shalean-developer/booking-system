#!/usr/bin/env node

/**
 * Password Hash Generator for Test Cleaners
 * 
 * This script generates bcrypt hashes for test cleaner passwords
 * Run with: node scripts/generate-password-hash.js
 */

const bcrypt = require('bcryptjs');

console.log('🔐 Generating password hashes for test cleaners...\n');

// Generate hashes for test passwords
const passwords = [
  { password: 'test123', cleaner: 'John Doe' },
  { password: 'test456', cleaner: 'Jane Smith' }
];

console.log('Generated bcrypt hashes (cost factor 10):\n');

passwords.forEach(({ password, cleaner }) => {
  const hash = bcrypt.hashSync(password, 10);
  console.log(`Cleaner: ${cleaner}`);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log(`SQL: '$2a$10$${hash.split('$')[3]}'`);
  console.log('---');
});

console.log('\n📋 SQL INSERT statements:');
console.log('Copy these hashes into your test-cleaner-setup.sql file:\n');

passwords.forEach(({ password, cleaner }) => {
  const hash = bcrypt.hashSync(password, 10);
  console.log(`-- ${cleaner} (Password: ${password})`);
  console.log(`'${hash}',`);
  console.log('');
});

// Verify the hashes work
console.log('✅ Verification:');
passwords.forEach(({ password, cleaner }) => {
  const hash = bcrypt.hashSync(password, 10);
  const isValid = bcrypt.compareSync(password, hash);
  console.log(`${cleaner}: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
});

console.log('\n🎯 Next steps:');
console.log('1. Copy the generated hashes into supabase/test-cleaner-setup.sql');
console.log('2. Run the SQL file in Supabase SQL Editor');
console.log('3. Test login with the credentials');
