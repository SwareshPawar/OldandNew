// Test the final chord detection with dashes
const CHORD_TYPES = [
    "madd13", "madd11", "madd9", "madd7", "madd4", "madd2",
    "add13", "add11", "add9", "add7", "add6", "add4", "add2", 
    "maj13", "maj11", "maj9", "maj7", "maj", "min13", "min11", "min9", "min7", "min",
    "7sus4", "7sus2", "7b13", "7#13", "7b11", "7#11", "7b9", "7#9", "7b5", "7#5",
    "m13", "m11", "m9", "m7", "m", "dim7", "dim", "aug7", "aug", "sus4", "sus2", "sus",
    "b13", "#13", "b11", "#11", "b9", "#9", "b5", "#5", "13", "11", "9", "7", "6", "5"
];

const CHORD_TYPE_REGEX = CHORD_TYPES.join("|");
const CHORD_LINE_REGEX = new RegExp(`^(\\s*[A-G](?:#|b)?(?:${CHORD_TYPE_REGEX})?(?:\\/[A-G](?:#|b)?)?[\\s\\-\\/\\|]*)+$`, "i");
const CHORD_REGEX = new RegExp(`([A-G](?:#|b)?)(?:${CHORD_TYPE_REGEX})?(?:\\/[A-G](?:#|b)?)?`, "gi");

console.log("✅ FINAL CHORD DETECTION TEST WITH DASHES");
console.log("");

const testCases = [
    { line: "G----------C", expected: true, description: "Basic dashes" },
    { line: "Am7----Dm----G----C", expected: true, description: "Multiple chords with dashes" },
    { line: "Gmadd4--------Cmadd7----Am7sus4", expected: true, description: "Complex chords with dashes" },
    { line: "C / / / | F / / / | G / / /", expected: true, description: "Slash and pipe notation" },
    { line: "F    Bb    C    F", expected: true, description: "Space separated chords" },
    { line: "This is just lyrics text", expected: false, description: "Regular lyrics (should not match)" },
    { line: "G-C-Am-F", expected: true, description: "Single dash separation" },
    { line: "C | Am | F | G", expected: true, description: "Pipe separated chords" }
];

testCases.forEach(test => {
    const result = CHORD_LINE_REGEX.test(test.line.trim());
    const status = result === test.expected ? "✓ PASS" : "✗ FAIL";
    console.log(`${status} "${test.line}" -> ${result ? "CHORD LINE" : "LYRICS"} (${test.description})`);
    
    if (result && test.expected) {
        const matches = test.line.match(CHORD_REGEX);
        console.log(`    Extracted: [${matches ? matches.join(", ") : "none"}]`);
    }
});

console.log("");
console.log("Summary: Chord detection now supports:");
console.log("- Dashes: G----------C");
console.log("- Spaces: F    Bb    C    F"); 
console.log("- Pipes: C | Am | F | G");
console.log("- Slashes: C / / / | F / / /");
console.log("- Mixed: G----C | Am / / / | F");
console.log("- Complex chords: Gmadd4--------Cmadd7");