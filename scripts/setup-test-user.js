import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read env file directly
const envPath = '/vercel/share/.env.project';
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)='?([^']*)'?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = envVars['SUPABASE_SECRET_KEY'];

if (!url || !serviceKey) {
  console.error('❌ Missing env vars:', { url: !!url, serviceKey: !!serviceKey });
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function setupTestUser() {
  try {
    console.log('🔧 Setting up test user account...\n');
    
    const email = 'johnnytestone@yopmail.com';
    const password = 'TestPass123!';
    
    // Try to create user, handling existing user case
    let userId;
    console.log('📝 Setting up user...');
    
    let result = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    
    if (result.error) {
      if (result.error.message?.includes('already registered')) {
        console.log('👤 User already exists...');
        const { data: { users: allUsers = [] } } = await supabase.auth.admin.listUsers();
        const existingUser = allUsers.find(u => u.email === email);
        if (existingUser) {
          userId = existingUser.id;
          console.log('✅ Using existing user:', userId);
        } else {
          throw new Error('User registered but not found in list');
        }
      } else {
        throw result.error;
      }
    } else {
      userId = result.data.user.id;
      console.log('✅ User created:', userId);
    }
    
    // Clear any existing data
    console.log('\n🧹 Clearing existing user data...');
    await Promise.all([
      supabase.from('evidence_library').delete().eq('user_id', userId),
      supabase.from('jobs').delete().eq('user_id', userId),
      supabase.from('documents').delete().eq('user_id', userId),
      supabase.from('interview_prep').delete().eq('user_id', userId),
      supabase.from('applications').delete().eq('user_id', userId),
      supabase.from('job_analyses').delete().eq('user_id', userId),
      supabase.from('job_scores').delete().eq('user_id', userId),
      supabase.from('generated_documents').delete().eq('user_id', userId),
    ]);
    console.log('✅ All data cleared');
    
    // Create fresh profile
    console.log('\n👤 Setting up profile...');
    await supabase.from('user_profile').upsert({
      user_id: userId,
      email,
      full_name: 'Test User',
      title: 'QA Tester',
      headline: 'Ready to test HireWire',
      location: 'Test City',
      summary: 'Test account for HireWire E2E testing',
      onboarding_complete: false,
      voice_locked: false,
      default_voice_mode: 'balanced',
      skills: [],
      experience: {},
      education: [],
      certifications: [],
      links: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('✅ Profile created');
    
    // Create users entry
    console.log('📊 Setting up users table...');
    await supabase.from('users').upsert({
      id: userId,
      email,
      onboarding_complete: false,
      plan_type: 'free',
      subscription_status: 'active',
      jobs_this_month: 0,
      generations_this_month: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    console.log('✅ Users table configured');
    
    console.log('\n' + '='.repeat(55));
    console.log('✅ TEST ACCOUNT READY FOR LOGIN');
    console.log('='.repeat(55));
    console.log(`\n  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log(`  User ID:  ${userId}`);
    console.log('\n  ✨ Account is verified and fresh!');
    console.log('  📱 Ready for full application testing.\n');
    console.log('='.repeat(55) + '\n');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupTestUser();
