import fetch from 'node-fetch';

const logout = async () => {
  try {
    console.log('🔓 Logging out test user...\n');
    
    const response = await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const data = await response.json();
    console.log('✅ Logout response:', data.message);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
};

logout();
