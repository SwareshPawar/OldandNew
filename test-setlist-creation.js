// Test creating a setlist via API
async function testCreateSetlist() {
    try {
        // First, let's check if there are any existing setlists
        console.log('Checking existing setlists...');
        const getResponse = await fetch('http://localhost:3001/api/global-setlists');
        const existingSetlists = await getResponse.json();
        console.log('Existing setlists:', existingSetlists);
        
        // Try to create a new setlist (this requires admin auth, so it might fail)
        console.log('Attempting to create a test setlist...');
        const createResponse = await fetch('http://localhost:3001/api/global-setlists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Note: This will fail without proper auth token
            },
            body: JSON.stringify({
                name: 'Test Setlist',
                description: 'A test setlist for debugging',
                songs: []
            })
        });
        
        console.log('Create response status:', createResponse.status);
        const createResult = await createResponse.text();
        console.log('Create response:', createResult);
        
    } catch (err) {
        console.error('Test error:', err);
    }
}

// We can't run this in Node.js directly due to fetch, but we can see the structure
console.log('Test setlist creation script ready');
console.log('Run this in browser console:');
console.log(`
// Check existing setlists
fetch('/api/global-setlists').then(r => r.json()).then(console.log);

// Check debug endpoint  
fetch('/api/debug/setlists').then(r => r.json()).then(console.log);
`);