const https = require('https');

const login = async () => {
  const postData = JSON.stringify({
    email: 'admin@posalpro.com',
    password: 'PosalPro2024!',
  });

  const options = {
    hostname: 'posalpro-mvp2.windsurf.build',
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      console.log(`Status Code: ${res.statusCode}`);
      
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        // Find the auth token cookie
        const authTokenCookie = cookies.find(cookie => cookie.startsWith('next-auth.session-token') || cookie.startsWith('__Secure-next-auth.session-token'));
        if (authTokenCookie) {
          console.log('Authentication successful!');
          const cookieValue = authTokenCookie.split(';')[0];
          console.log(`\nFound Cookie: ${cookieValue}`);
          require('fs').writeFileSync('auth-cookie.txt', cookieValue);
          console.log('✅ Auth cookie saved to auth-cookie.txt');
        }
      } else {
        console.log('❌ No auth cookie received.');
      }

      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        console.log('\nResponse Body:');
        try {
          console.log(JSON.parse(data));
        } catch (e) {
          console.log(data);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      reject(e);
    });

    req.write(postData);
    req.end();
  });
};

login();
