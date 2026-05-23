async function test() {
  try {
    const res = await fetch('http://localhost:8000/analyze-cv', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization'
      }
    });
    console.log(`STATUS: ${res.status}`);
    console.log('HEADERS:');
    for (const [key, value] of res.headers.entries()) {
      console.log(`${key}: ${value}`);
    }
    const text = await res.text();
    console.log(`BODY: ${text}`);
  } catch(e) {
    console.error(e);
  }
}
test();
