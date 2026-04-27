async function test() {
  // login first
  const authRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'reception@nammahealth.com', password: 'Reception@123' })
  });
  const authData = await authRes.json();
  const token = authData.data?.accessToken;
  console.log('Token:', token ? 'OK' : 'MISSING');

  // Test search by card number
  const r1 = await fetch('http://localhost:5000/api/cards/NHC-2026-01000', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const d1 = await r1.json();
  console.log('\n-- Search by card number --');
  console.log('Status:', r1.status);
  console.log('success:', d1.success);
  console.log('full_name:', d1.data?.full_name);
  console.log('address:', d1.data?.address);
  console.log('phone:', d1.data?.phone);

  // Test search by phone number
  const r2 = await fetch('http://localhost:5000/api/cards/9500012345', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const d2 = await r2.json();
  console.log('\n-- Search by phone --');
  console.log('Status:', r2.status);
  console.log('success:', d2.success);
  console.log('full_name:', d2.data?.full_name);

  // Test OTP 
  const r3 = await fetch('http://localhost:5000/api/auth/patient-login/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '9500012345', cardNumber: 'NHC-2026-01000' })
  });
  const d3 = await r3.json();
  console.log('\n-- OTP Request --');
  console.log('Status:', r3.status);
  console.log('Response:', JSON.stringify(d3));
}
test().catch(console.error);
