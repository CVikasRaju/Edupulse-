// create-auth-users.js
// Run this ONCE to create the Supabase Auth users that match the seed data profiles
// Usage: node create-auth-users.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Use service role client (admin) to create users
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  {
    id: 'admin-001',
    email: 'admin@sahyadri.edu.in',
    password: 'Admin@123456',
    name: 'Dr. Manjunath Kotari',
  },
  {
    id: 'mentor-001',
    email: 'priya.shetty@sahyadri.edu.in',
    password: 'Mentor@123456',
    name: 'Dr. Priya Shetty',
  },
  {
    id: 'student-001',
    email: 'aditya.s@sahyadri.edu.in',
    password: 'Student@123456',
    name: 'Aditya Sharma',
  },
];

async function createUsers() {
  console.log('Creating Supabase Auth users...\n');

  for (const user of users) {
    console.log(`Creating ${user.name} (${user.email})...`);

    // Create auth user with specific ID to match the Profile table
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Skip email confirmation
      user_metadata: { full_name: user.name },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log(`  ⚠️  Already exists — skipping.`);
      } else {
        console.error(`  ❌ Error: ${error.message}`);
      }
      continue;
    }

    console.log(`  ✅ Created with auth ID: ${data.user.id}`);
    console.log(`     NOTE: Update the Profile table row to use auth ID: ${data.user.id}`);
    console.log(`     Run in Supabase SQL Editor:`);
    console.log(`     UPDATE "Profile" SET id = '${data.user.id}' WHERE email = '${user.email}';`);
    console.log('');
  }

  console.log('\n=== DONE ===');
  console.log('IMPORTANT: After running this, update each Profile ID to match the auth user IDs above.');
  console.log('Run the UPDATE statements in the Supabase SQL Editor.\n');
}

createUsers().catch(console.error);
