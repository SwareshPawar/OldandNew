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

When a song is played, the system:
1. Filters loops that match **taal** AND **timeSignature**
2. Ranks remaining loops by how many optional conditions match
3. Shows best matching loop set (6 pads: 3 loops + 3 fills)

## Examples

### Keherwa 4/4 - Acoustic - Medium
```
keherwa_4_4_medium_acoustic_LOOP1.wav
keherwa_4_4_medium_acoustic_LOOP2.wav
keherwa_4_4_medium_acoustic_LOOP3.wav
keherwa_4_4_medium_acoustic_FILL1.wav
keherwa_4_4_medium_acoustic_FILL2.wav
keherwa_4_4_medium_acoustic_FILL3.wav
```

### Dadra 6/8 - Rock - Fast
```
dadra_6_8_fast_rock_LOOP1.wav
dadra_6_8_fast_rock_LOOP2.wav
dadra_6_8_fast_rock_LOOP3.wav
dadra_6_8_fast_rock_FILL1.wav
dadra_6_8_fast_rock_FILL2.wav
dadra_6_8_fast_rock_FILL3.wav
```

### Teental 4/4 - Qawalli - Slow
```
teental_4_4_slow_qawalli_LOOP1.wav
teental_4_4_slow_qawalli_LOOP2.wav
teental_4_4_slow_qawalli_LOOP3.wav
teental_4_4_slow_qawalli_FILL1.wav
teental_4_4_slow_qawalli_FILL2.wav
teental_4_4_slow_qawalli_FILL3.wav
```

### Rupak 7/8 - Blues - Medium
```
rupak_7_8_medium_blues_LOOP1.wav
rupak_7_8_medium_blues_LOOP2.wav
rupak_7_8_medium_blues_FILL1.wav
```

## How Matching Works - Example

**Song**: "Ae Watan" 
- Taal: Keherwa
- Time: 4/4
- Tempo: 95 BPM → `medium` category
- Genre: Acoustic

**Available Loops**:
1. `keherwa_4_4_medium_acoustic_*` ← ✅ **PERFECT MATCH** (all conditions)
2. `keherwa_4_4_fast_rock_*` ← ✅ Matches (taal + time, wrong tempo/genre)
3. `dadra_6_8_medium_acoustic_*` ← ❌ Rejected (wrong taal + time)

**Result**: System shows `keherwa_4_4_medium_acoustic_*` loops with highest priority

## Technical Requirements

- **Format**: WAV (uncompressed)
- **Sample Rate**: 44.1kHz or 48kHz recommended
- **Bit Depth**: 16-bit or 24-bit
- **Channels**: Stereo or Mono
- **Seamless Loop**: Start/end points should align perfectly
- **Duration**: 
  - Loops: 2-8 bars typically
  - Fills: 1-2 bars typically

## Migration from v1.0

**Old Format**: `{taal}_{time}_{TYPE}{num}.wav`  
**New Format**: `{taal}_{time}_{tempo}_{genre}_{TYPE}{num}.wav`

**Example**:
```
keherwa_4_4_LOOP1.wav → keherwa_4_4_medium_acoustic_LOOP1.wav
```

**Steps**:
1. Identify the tempo category (slow/medium/fast)
2. Identify the genre (acoustic/rock/rd/qawalli/blues)
3. Rename files following new convention
4. Update `loops-metadata.json` with new entries
