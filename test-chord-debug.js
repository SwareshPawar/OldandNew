// Test chord detection with updated chord types

// Copy the relevant parts from main.js for testing
const CHORD_TYPES = [
    // Complex compound chords (longest first) 
    "madd4", "madd7", "m7sus4", "m7sus2", "7sus4", "7sus2", "7b13", "7#13", "7b11", "7#11", "7b9", "7#9", "7b5", "7#5", // 7th chord variations (longest first)
    "add4", "add6", "add7", "add9", "add11", "add13", // Add chords
    "13sus4", "13sus2", "11sus4", "11sus2", "9sus4", "9sus2", // Suspended variations
    "maj13", "maj11", "maj9", "maj7", "m13", "m11", "m9", "m7", "7", // Major 7th and minor 7th chords
    "13", "11", "9", // 9th, 11th, 13th chords
    "sus4", "sus2", "aug", "dim", "dim7", "m", "maj" // Basic chord types
];

const CHORD_TYPE_REGEX = CHORD_TYPES.join('|');
const CHORD_REGEX = new RegExp(`^[A-G](?:#|b)?(?:${CHORD_TYPE_REGEX})?(?:\\/[A-G](?:#|b)?)?$`);
const CHORD_LINE_REGEX = new RegExp(`^(\\s*[A-G](?:#|b)?(?:${CHORD_TYPE_REGEX})?(?:\\/[A-G](?:#|b)?)?[\\s\\-\\/\\|]*)+$`);

function testChordDetection(text) {
    console.log(`Testing: "${text}"`);
    
    // Test individual chord recognition
    const chords = text.split(/[\s\-\|]+/).filter(c => c);
    console.log(`  Split into chords: ${JSON.stringify(chords)}`);
    
    for (const chord of chords) {
        const matches = CHORD_REGEX.test(chord);
        console.log(`    "${chord}" -> ${matches ? '✓' : '✗'}`);
        
        // Debug the matching
        const match = chord.match(new RegExp(`^([A-G](?:#|b)?)((?:${CHORD_TYPE_REGEX})?)(?:\\/([A-G](?:#|b)?))?$`));
        if (match) {
            console.log(`      Root: "${match[1]}", Type: "${match[2]}", Bass: "${match[3] || 'none'}"`);
        }
    }
    
    // Test full line
    const lineMatches = CHORD_LINE_REGEX.test(text);
    console.log(`  Full line matches: ${lineMatches ? '✓' : '✗'}`);
    console.log('');
}

// Test cases
testChordDetection("Am7sus4");
testChordDetection("G----------C");
testChordDetection("Am7----Dm----G");
testChordDetection("C | Am | F | G");
testChordDetection("Cmaj7 / / /");
testChordDetection("Am7sus4 Dm G C");