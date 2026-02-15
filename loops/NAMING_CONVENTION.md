# Loop Files Naming Convention v2.0

This document defines the standardized naming convention for drum loop samples used in the loop player.

## Format Structure

```
{taal}_{time_signature}_{tempo}_{genre}_{TYPE}{number}.wav
```

### Components:

1. **taal** - Rhythmic cycle name (lowercase)
   - `keherwa` - 8 beat cycle
   - `dadra` - 6 beat cycle
   - `teental` - 16 beat cycle
   - `jhaptal` - 10 beat cycle
   - `ektaal` - 12 beat cycle
   - `rupak` - 7 beat cycle

2. **time_signature** - Musical time signature (using underscore for slash)
   - `4_4` - 4/4 time (most common)
   - `3_4` - 3/4 waltz time
   - `6_8` - 6/8 time
   - `7_8` - 7/8 time

3. **tempo** - Tempo category based on BPM
   - `slow` - < 80 BPM (ballads, slow devotional)
   - `medium` - 80-120 BPM (most popular songs)
   - `fast` - > 120 BPM (energetic, rock)

4. **genre** - Musical genre/style
   - `acoustic` - Unplugged, acoustic instruments
   - `rock` - Electric instruments, drums
   - `rd` - Rhythm & Drums (percussion-heavy)
   - `qawalli` - Sufi devotional style
   - `blues` - Blues/jazz influenced

5. **TYPE** - Loop or fill (UPPERCASE)
   - `LOOP` - Main rhythmic pattern (repeatable)
   - `FILL` - Transition/fill pattern

6. **number** - Variation number (1-based)
   - 1-3 for loops, 1-3 for fills

## Matching Logic

**Required Match**: Taal + Time Signature must match the song  
**Optional Match**: Tempo + Genre boost relevance (prioritized but not required)

## Examples

### Current Files (Keherwa 4/4)
```
keherwa_4_4_LOOP1.wav    # Main keherwa pattern variation 1
keherwa_4_4_LOOP2.wav    # Main keherwa pattern variation 2
keherwa_4_4_LOOP3.wav    # Main keherwa pattern variation 3
keherwa_4_4_FILL1.wav    # Fill pattern 1 (from loop1)
keherwa_4_4_FILL2.wav    # Fill pattern 2 (from loop2)
keherwa_4_4_FILL3.wav    # Fill pattern 3 (from loop3)
```

### Future Examples

#### Dadra (6 beat, 6/8 time)
```
dadra_6_8_LOOP1.wav
dadra_6_8_LOOP2.wav
dadra_6_8_LOOP3.wav
dadra_6_8_FILL1.wav
dadra_6_8_FILL2.wav
dadra_6_8_FILL3.wav
```

#### TeenTaal (16 beat, 4/4 time)
```
teentaal_4_4_LOOP1.wav
teentaal_4_4_LOOP2.wav
teentaal_4_4_LOOP3.wav
teentaal_4_4_FILL1.wav
teentaal_4_4_FILL2.wav
teentaal_4_4_FILL3.wav
```

#### Western Rock (4/4 time)
```
western_4_4_LOOP1.wav
western_4_4_LOOP2.wav
western_4_4_LOOP3.wav
western_4_4_FILL1.wav
western_4_4_FILL2.wav
western_4_4_FILL3.wav
```

#### Waltz (3/4 time)
```
western_3_4_LOOP1.wav
western_3_4_LOOP2.wav
western_3_4_LOOP3.wav
western_3_4_FILL1.wav
western_3_4_FILL2.wav
western_3_4_FILL3.wav
```

## File Requirements

### Technical Specs
- **Format**: WAV (uncompressed) or high-quality MP3
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Depth**: 16-bit or 24-bit
- **Channels**: Stereo (preferred) or Mono
- **Length**: 
  - Loops: 4-8 bars (depends on tempo/taal)
  - Fills: 1-2 bars typically

### Musical Requirements
- **Loop Start/End**: Must loop seamlessly (zero-crossing aligned)
- **Tempo**: BPM should match typical song range for that taal
- **Volume**: Normalized to -3dB peak to prevent clipping
- **Content**:
  - LOOP files: Main repeatable pattern
  - FILL files: Transition pattern from corresponding loop

## Fill Purpose

Each fill is designed to transition FROM its corresponding loop:
- **FILL1**: Transitions FROM Loop 1 (to any other loop)
- **FILL2**: Transitions FROM Loop 2 (to any other loop)  
- **FILL3**: Transitions FROM Loop 3 (to any other loop)

Example flow:
```
Loop1 → (user clicks Loop2) → Fill1 plays → Loop2 starts
Loop2 → (user clicks Loop3) → Fill2 plays → Loop3 starts
Loop3 → (user clicks Loop1) → Fill3 plays → Loop1 starts
```

## Backward Compatibility

### Legacy Files (Current)
The existing files without the new naming convention will be mapped:
```
LOOP01.wav → keherwa_4_4_LOOP1.wav
LOOP02.wav → keherwa_4_4_LOOP2.wav
LOOP03.wav → keherwa_4_4_LOOP3.wav
FILL1.wav  → keherwa_4_4_FILL1.wav
FILL2.wav  → keherwa_4_4_FILL2.wav
FILL3.wav  → keherwa_4_4_FILL3.wav
```

## Adding New Taals

When creating loops for a new taal:

1. Identify the taal name (lowercase)
2. Identify the time signature
3. Create 3 loop variations
4. Create 3 corresponding fills
5. Follow the naming convention exactly
6. Place in `/loops/` folder
7. Update `loop-player-pad.js` to load new files

## Directory Structure

```
loops/
├── NAMING_CONVENTION.md (this file)
├── keherwa_4_4_LOOP1.wav
├── keherwa_4_4_LOOP2.wav
├── keherwa_4_4_LOOP3.wav
├── keherwa_4_4_FILL1.wav
├── keherwa_4_4_FILL2.wav
├── keherwa_4_4_FILL3.wav
├── dadra_6_8_LOOP1.wav (future)
├── dadra_6_8_LOOP2.wav (future)
└── ... (more taals)
```

## Code Integration

The loop player will:
1. Read song's `taal` and `time` fields
2. Construct file paths: `{taal}_{time}_LOOP{1-3}.wav`
3. Load 6 files (3 loops + 3 fills)
4. Hide player if files don't exist

This ensures automatic matching without code changes when new taal files are added.
