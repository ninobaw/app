const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function clearTokensAndLogin() {
  try {
    console.log('=== Clear Tokens and Fresh Login ===\n');

    console.log('1. Clearing any existing tokens from localStorage simulation...');
    console.log('   (Frontend should clear localStorage.removeItem("token"))');

    console.log('\n2. Testing fresh login to get new valid token...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'abdallah.benkhalifa@tav.aero',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed');
      const errorText = await loginResponse.text();
      console.log('Error:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const newToken = loginData.token;
    console.log('✅ Fresh login successful');
    console.log('New token (first 50 chars):', newToken.substring(0, 50) + '...');

    console.log('\n3. Testing new token with documents API...');
    const documentsResponse = await fetch('http://localhost:5000/api/documents', {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });

    console.log(`Documents API Status: ${documentsResponse.status}`);
    
    if (documentsResponse.ok) {
      const documentsData = await documentsResponse.json();
      console.log('✅ Documents API working with new token');
      console.log(`Found ${documentsData.data?.length || 0} documents`);
    } else {
      console.log('❌ Documents API still failing');
      const errorText = await documentsResponse.text();
      console.log('Error:', errorText);
    }

    console.log('\n4. Testing new token with templates API...');
    const templatesResponse = await fetch('http://localhost:5000/api/documents?isTemplate=true', {
      headers: { 'Authorization': `Bearer ${newToken}` }
    });

    console.log(`Templates API Status: ${templatesResponse.status}`);
    
    if (templatesResponse.ok) {
      const templatesData = await templatesResponse.json();
      console.log('✅ Templates API working with new token');
      console.log(`Found ${templatesData.data?.length || 0} templates`);
    } else {
      console.log('❌ Templates API still failing');
      const errorText = await templatesResponse.text();
      console.log('Error:', errorText);
    }

    console.log('\n=== Instructions for Frontend ===');
    console.log('1. Clear localStorage: localStorage.removeItem("token")');
    console.log('2. Logout and login again to get fresh token');
    console.log('3. New valid token will be:', newToken.substring(0, 20) + '...');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

clearTokensAndLogin();
