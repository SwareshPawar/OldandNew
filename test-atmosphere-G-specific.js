/**
 * Test atmosphere_G.wav specifically on production
 * 
 * Run this in mobile browser console to diagnose G key issue
 */

(async function testAtmosphereG() {
    console.log('🔍 Testing Atmosphere G Key Specifically\n');
    
    const baseUrl = window.location.origin;
    const gUrl = `${baseUrl}/loops/melodies/atmosphere/atmosphere_G.wav`;
    
    console.log('1. Testing HEAD request for G:');
    console.log('   URL:', gUrl);
    
    try {
        const headResponse = await fetch(gUrl, { method: 'HEAD' });
        console.log('   Status:', headResponse.status, headResponse.statusText);
        console.log('   OK:', headResponse.ok ? '✅' : '❌');
        console.log('   Content-Type:', headResponse.headers.get('Content-Type'));
        console.log('   Content-Length:', headResponse.headers.get('Content-Length'), 'bytes');
        console.log('   Cache-Control:', headResponse.headers.get('Cache-Control'));
        console.log('   ETag:', headResponse.headers.get('ETag'));
        
        if (headResponse.ok) {
            console.log('\n2. Testing GET request for G:');
            const getResponse = await fetch(gUrl);
            console.log('   Status:', getResponse.status, getResponse.statusText);
            console.log('   OK:', getResponse.ok ? '✅' : '❌');
            
            if (getResponse.ok) {
                const arrayBuffer = await getResponse.arrayBuffer();
                console.log('   Downloaded:', arrayBuffer.byteLength, 'bytes');
                console.log('   Size match:', arrayBuffer.byteLength === parseInt(headResponse.headers.get('Content-Length')) ? '✅' : '❌');
                
                console.log('\n3. Testing Audio Decoding:');
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                const testContext = new AudioContextClass();
                
                console.log('   AudioContext state:', testContext.state);
                
                if (testContext.state === 'suspended') {
                    console.log('   Resuming AudioContext...');
                    await testContext.resume();
                    console.log('   AudioContext state after resume:', testContext.state);
                }
                
                try {
                    console.log('   Decoding audio data...');
                    const audioBuffer = await testContext.decodeAudioData(arrayBuffer);
                    console.log('   ✅ DECODE SUCCESS!');
                    console.log('   Duration:', audioBuffer.duration.toFixed(2), 'seconds');
                    console.log('   Channels:', audioBuffer.numberOfChannels);
                    console.log('   Sample Rate:', audioBuffer.sampleRate);
                    console.log('   Length:', audioBuffer.length, 'samples');
                    
                    console.log('\n4. Testing Playback:');
                    const source = testContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(testContext.destination);
                    
                    console.log('   Starting playback for 2 seconds...');
                    source.start();
                    
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    source.stop();
                    console.log('   ✅ Playback test completed');
                    
                } catch (decodeError) {
                    console.log('   ❌ DECODE FAILED:', decodeError.message);
                    console.log('   Error details:', decodeError);
                }
                
                await testContext.close();
                
            } else {
                console.log('   ❌ GET request failed');
            }
        } else {
            console.log('   ❌ HEAD request failed - file not accessible');
        }
        
    } catch (error) {
        console.log('❌ Network Error:', error.message);
        console.log('   Error details:', error);
    }
    
    console.log('\n5. Comparing with other working keys:');
    const workingKeys = ['C', 'A', 'D'];
    
    for (const key of workingKeys) {
        const url = `${baseUrl}/loops/melodies/atmosphere/atmosphere_${key}.wav`;
        try {
            const response = await fetch(url, { method: 'HEAD' });
            console.log(`   ${key}:`, response.ok ? '✅' : '❌', response.status);
        } catch (err) {
            console.log(`   ${key}: ❌ Error -`, err.message);
        }
    }
    
    console.log('\n6. Check if loopPlayerInstance has G loaded:');
    if (typeof loopPlayerInstance !== 'undefined') {
        const effectiveKey = loopPlayerInstance._getEffectiveKey();
        console.log('   Current effective key:', effectiveKey);
        
        const atmosphereKey = `atmosphere_${effectiveKey}`;
        console.log('   Looking for sample:', atmosphereKey);
        console.log('   In rawAudioData:', loopPlayerInstance.rawAudioData.has(atmosphereKey) ? '✅' : '❌');
        console.log('   In audioBuffers:', loopPlayerInstance.audioBuffers.has(atmosphereKey) ? '✅' : '❌');
        
        if (loopPlayerInstance.audioBuffers.has(atmosphereKey)) {
            const buffer = loopPlayerInstance.audioBuffers.get(atmosphereKey);
            console.log('   Buffer duration:', buffer.duration.toFixed(2), 'seconds');
        }
        
        console.log('\n   Atmosphere pad state:');
        console.log('   isPlaying:', loopPlayerInstance.melodicPads.atmosphere.isPlaying);
        console.log('   gainNode exists:', !!loopPlayerInstance.melodicPads.atmosphere.gainNode);
        console.log('   source exists:', !!loopPlayerInstance.melodicPads.atmosphere.source);
    }
    
    console.log('\n✅ Atmosphere G Test Complete!');
    console.log('\nIf HEAD request fails on production but works locally:');
    console.log('  → File not deployed or Vercel routing issue');
    console.log('\nIf GET succeeds but decode fails:');
    console.log('  → WAV format incompatible with mobile browser');
    console.log('\nIf decode succeeds but playback fails:');
    console.log('  → Check loopPlayerInstance state and button event listeners');
})();
