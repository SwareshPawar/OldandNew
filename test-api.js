async function testAPI() {
    try {
        console.log('Testing API endpoint...');
        const response = await fetch('http://localhost:3001/api/global-setlists');
        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);
    } catch (err) {
        console.error('API test error:', err);
    }
}

testAPI();