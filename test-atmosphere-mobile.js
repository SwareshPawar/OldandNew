/**
 * Mobile Atmosphere Pad Diagnostic Script
 * 
 * This script tests the atmosphere pad loading to identify
 * why it works on desktop but fails on mobile.
 * 
 * Usage: Paste this into browser console on mobile device
 */

(async function diagnoseAtmospherePad() {
    console.log('🔍 Starting Atmosphere Pad Diagnostics...\n');
    
    // Test 1: Check API_BASE_URL
    console.log('Test 1: API Base URL');
    console.log('  window.location.origin:', window.location.origin);
    console.log('  window.location.hostname:', window.location.hostname);
    console.log('  API_BASE_URL (if defined):', typeof API_BASE_URL !== 'undefined' ? API_BASE_URL : 'undefined');
    console.log('');
    
    // Test 2: Check if atmosphere files are accessible
    console.log('Test 2: File Accessibility');
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const baseUrl = window.location.origin;
    
    const testResults = {
        atmosphere: {},
        tanpura: {}
    };
    
    for (const key of keys) {
        // Test atmosphere
        const encodedKey = encodeURIComponent(key);
        const atmosphereUrl = `${baseUrl}/loops/melodies/atmosphere/atmosphere_${encodedKey}.wav`;
        
        try {
            const atmResponse = await fetch(atmosphereUrl, { method: 'HEAD' });
            testResults.atmosphere[key] = {
                url: atmosphereUrl,
                status: atmResponse.status,
                ok: atmResponse.ok,
                contentType: atmResponse.headers.get('Content-Type'),
                contentLength: atmResponse.headers.get('Content-Length')
            };
            console.log(`  ✅ Atmosphere ${key}: ${atmResponse.status} (${(parseInt(atmResponse.headers.get('Content-Length') || 0) / 1024).toFixed(0)}KB)`);
        } catch (error) {
            testResults.atmosphere[key] = {
                url: atmosphereUrl,
                error: error.message
            };
            console.log(`  ❌ Atmosphere ${key}: ${error.message}`);
        }
        
        // Test tanpura for comparison
        const tanpuraUrl = `${baseUrl}/loops/melodies/tanpura/tanpura_${encodedKey}.wav`;
        
        try {
            const tanResponse = await fetch(tanpuraUrl, { method: 'HEAD' });
            testResults.tanpura[key] = {
                url: tanpuraUrl,
                status: tanResponse.status,
                ok: tanResponse.ok,
                contentType: tanResponse.headers.get('Content-Type'),
                contentLength: tanResponse.headers.get('Content-Length')
            };
            console.log(`  ✅ Tanpura ${key}: ${tanResponse.status} (${(parseInt(tanResponse.headers.get('Content-Length') || 0) / 1024).toFixed(0)}KB)`);
        } catch (error) {
            testResults.tanpura[key] = {
                url: tanpuraUrl,
                error: error.message
            };
            console.log(`  ❌ Tanpura ${key}: ${error.message}`);
        }
    }
    
    console.log('');
    
    // Test 3: Check AudioContext
    console.log('Test 3: AudioContext');
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    console.log('  AudioContext available:', !!AudioContextClass);
    
    if (AudioContextClass) {
        const testContext = new AudioContextClass();
        console.log('  AudioContext state:', testContext.state);
        console.log('  Sample rate:', testContext.sampleRate);
        
        // Test 4: Try to decode a small sample
        console.log('');
        console.log('Test 4: Audio Decoding Test (G key)');
        
        const testKey = 'G';
        const encodedTestKey = encodeURIComponent(testKey);
        const testUrl = `${baseUrl}/loops/melodies/atmosphere/atmosphere_${encodedTestKey}.wav`;
        
        try {
            console.log('  Fetching:', testUrl);
            const response = await fetch(testUrl);
            console.log('  Fetch status:', response.status, response.ok ? '✅' : '❌');
            console.log('  Content-Type:', response.headers.get('Content-Type'));
            console.log('  Content-Length:', response.headers.get('Content-Length'), 'bytes');
            
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                console.log('  Downloaded:', arrayBuffer.byteLength, 'bytes');
                
                // Resume context if needed
                if (testContext.state === 'suspended') {
                    console.log('  Resuming AudioContext...');
                    await testContext.resume();
                }
                
                console.log('  Decoding audio data...');
                const audioBuffer = await testContext.decodeAudioData(arrayBuffer);
                console.log('  ✅ Decode SUCCESS!');
                console.log('  Duration:', audioBuffer.duration.toFixed(2), 'seconds');
                console.log('  Channels:', audioBuffer.numberOfChannels);
                console.log('  Sample Rate:', audioBuffer.sampleRate);
            } else {
                console.log('  ❌ Fetch failed:', response.status, response.statusText);
            }
        } catch (error) {
            console.log('  ❌ Error:', error.message);
            console.log('  Error details:', error);
        }
        
        await testContext.close();
    }
    
    console.log('');
    console.log('Test 5: Check LoopPlayerPad Instance');
    if (typeof loopPlayerInstance !== 'undefined') {
        console.log('  LoopPlayerPad instance exists: ✅');
        console.log('  AudioContext:', loopPlayerInstance.audioContext);
        console.log('  AudioContext state:', loopPlayerInstance.audioContext ? loopPlayerInstance.audioContext.state : 'N/A');
        console.log('  Melodic pads:', loopPlayerInstance.melodicPads);
        console.log('  Raw audio data size:', loopPlayerInstance.rawAudioData.size);
        console.log('  Audio buffers size:', loopPlayerInstance.audioBuffers.size);
        
        console.log('');
        console.log('  Atmosphere pad state:');
        console.log('    isPlaying:', loopPlayerInstance.melodicPads.atmosphere.isPlaying);
        console.log('    gainNode:', loopPlayerInstance.melodicPads.atmosphere.gainNode);
        console.log('    source:', loopPlayerInstance.melodicPads.atmosphere.source);
        
        console.log('');
        console.log('  Tanpura pad state:');
        console.log('    isPlaying:', loopPlayerInstance.melodicPads.tanpura.isPlaying);
        console.log('    gainNode:', loopPlayerInstance.melodicPads.tanpura.gainNode);
        console.log('    source:', loopPlayerInstance.melodicPads.tanpura.source);
    } else {
        console.log('  LoopPlayerPad instance NOT found: ❌');
    }
    
    console.log('');
    console.log('Test 6: Check Button State');
    const songId = window.currentSongId || document.querySelector('[data-melodic="atmosphere"]')?.id?.split('-').pop();
    if (songId) {
        const atmButton = document.getElementById(`pad-atmosphere-${songId}`);
        const tanButton = document.getElementById(`pad-tanpura-${songId}`);
        
        console.log('  Atmosphere button:');
        console.log('    Found:', !!atmButton);
        if (atmButton) {
            console.log('    Disabled:', atmButton.disabled);
            console.log('    Classes:', atmButton.className);
            console.log('    Title:', atmButton.title);
        }
        
        console.log('');
        console.log('  Tanpura button:');
        console.log('    Found:', !!tanButton);
        if (tanButton) {
            console.log('    Disabled:', tanButton.disabled);
            console.log('    Classes:', tanButton.className);
            console.log('    Title:', tanButton.title);
        }
    }
    
    console.log('');
    console.log('📊 Diagnostic Summary');
    console.log('='.repeat(50));
    
    const atmosphereCount = Object.values(testResults.atmosphere).filter(r => r.ok).length;
    const tanpuraCount = Object.values(testResults.tanpura).filter(r => r.ok).length;
    
    console.log(`Atmosphere files accessible: ${atmosphereCount}/12`);
    console.log(`Tanpura files accessible: ${tanpuraCount}/12`);
    
    if (atmosphereCount === 0) {
        console.log('');
        console.log('🚨 CRITICAL: No atmosphere files accessible!');
        console.log('   This indicates:');
        console.log('   - Files not deployed to production');
        console.log('   - Vercel routing issue (check vercel.json)');
        console.log('   - CORS or permissions problem');
    } else if (atmosphereCount < 12) {
        console.log('');
        console.log('⚠️  WARNING: Some atmosphere files missing!');
        const missing = keys.filter(k => !testResults.atmosphere[k]?.ok);
        console.log('   Missing keys:', missing.join(', '));
    } else {
        console.log('');
        console.log('✅ All atmosphere files accessible!');
        console.log('   Issue is likely in:');
        console.log('   - Audio decoding (check Test 4 results)');
        console.log('   - LoopPlayerPad state management');
        console.log('   - Button event handling');
    }
    
    console.log('');
    console.log('📋 Full Results Object:');
    console.log(JSON.stringify(testResults, null, 2));
    
    console.log('');
    console.log('✅ Diagnostics Complete!');
    
    return testResults;
})();
