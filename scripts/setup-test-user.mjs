import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(url, serviceKey);

async function setupTestUser() {
  try {
    console.log('🔧 Setting up test user account...\n');
    
    const email = 'johnnytestone@yopmail.com';
    const password = 'TestPass123!';
    
    // Try to create user (will fail if exists, and that's OK)
    const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    }).catch(err => ({ data: { user: null }, error: err }));
    
    let userId;
    
    if (newUser) {
      userId = newUser.id;
      console.log('✅ New auth user created:', userId);
    } else if (createError && createError.message?.includes('already exists')) {
      // User exists, get the ID
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      const existingUser = users?.find(u => u.email === email);
      if (existingUser) {
        userId = existingUser.id;
        console.log('✅ Using existing user:', userId);
        
        // Update email confirmation if not confirmed
        if (!existingUser.email_confirmed_at) {
          await supabase.auth.admin.updateUserById(userId, {
            email_confirm: true,
          });
          console.log('✅ Email confirmed');
        }
      } else {
        throw new Error('Could not find user');
      }
    } else {
      throw createError;
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
    const { error: profileError } = await supabase
      .from('user_profile')
      .upsert({
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
    
    if (profileError && !profileError.message.includes('duplicate')) {
      console.error('⚠️ Profile warning:', profileError.message);
    } else {
      console.log('✅ Profile created');
    }
    
    // Create users entry
    console.log('📊 Setting up users table...');
    const { error: userError } = await supabase
      .from('users')
      .upsert({
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
    
    if (userError && !userError.message.includes('duplicate')) {
      console.error('⚠️ Users warning:', userError.message);
    } else {
      console.log('✅ Users table configured');
    }
    
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
    console.error(error);
    process.exit(1);
  }
}

setupTestUser();
