# Visual Guide: Atmosphere Pad Crossfade Looping

## Audio Graph Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Melodic Pad System                        │
└─────────────────────────────────────────────────────────────┘

Main Gain Node (pad.gainNode)
     │
     │  Controls overall pad volume (atmosphere: 0.5, tanpura: 0.22)
     │  Used for start fade-in and stop fade-out
     │
     ├─────────────────────┬─────────────────────┐
     │                     │                     │
Source Gain A      Source Gain B       Source Gain C ...
(iteration 1)      (iteration 2)       (iteration 3)
     │                    │                     │
     │                    │                     │
BufferSource A    BufferSource B      BufferSource C
  (loop audio)      (loop audio)        (loop audio)
```

## Timeline Visualization

### 10-second loop example with 1.5s crossfade:

```
Time: 0s   2s   4s   6s   8.5s  10s  12s  14s  16s  18.5s  20s
      │    │    │    │     │    │    │    │    │     │     │
      
Src A │████████████████████████│
      │    ┌fade-in┐         ┌─crossfade─┐
      │    │ 2.0s  │         │   1.5s    │
      │    │ 0→1.0 │         │  1.0→0    │
      │                      │           │
      
Src B                        │████████████████████████│
                             │           │         ┌─crossfade─┐
                             │  0→1.0    │         │  1.0→0    │
                             │   1.5s    │         │   1.5s    │
                             
Src C                                              │████████████...
                                                   │  0→1.0
                                                   │   1.5s

Legend:
████ = Playing at full volume (1.0)
┌──┐ = Fading (volume changing)
│    = Scheduled but not yet started
```

## Crossfade Detail (8.5s - 10s)

```
Volume
 1.0 │  Source A ──────────╲
     │                      ╲
 0.8 │                       ╲
     │                        ╲
 0.6 │                         ╲       Source B
     │                          ╲     ╱
 0.4 │                           ╲   ╱
     │                            ╲ ╱
 0.2 │                             ╳
     │                            ╱ ╲
 0.0 │                          ╱     ╲
     └──────────────────────────┴──────┴──────> Time
                              8.5s   10.0s

     ├─────── 1.5 seconds ──────┤
```

## State Transitions

### Start Sequence:
```
1. User clicks "Atmosphere" button
2. _toggleMelodicPad('atmosphere') called
3. _startMelodicPad('atmosphere') called
4. Load/decode audio buffer
5. _startCrossfadeLoop() creates first source
   ├─ Create sourceGain node
   ├─ Connect: BufferSource → sourceGain → pad.gainNode → destination
   ├─ Fade in pad.gainNode: 0 → 0.5 over 2s
   └─ Schedule first crossfade
6. Loop plays, user hears gradual fade-in
```

### Loop Continuation Sequence:
```
1. setTimeout fires 1.5s before loop ends
2. _scheduleCrossfadeLoop() executes
3. Create new source + new gain
   ├─ newSource = new BufferSource
   ├─ newSourceGain = new GainNode
   ├─ newSource → newSourceGain → pad.gainNode
   └─ newSourceGain.gain: 0 → 1.0 over 1.5s
4. Fade out old source
   └─ oldSourceGain.gain: 1.0 → 0 over 1.5s
5. Both play simultaneously during crossfade
6. After crossfade:
   ├─ Stop old source
   ├─ Disconnect old nodes
   └─ Schedule next crossfade
7. Repeat from step 1
```

### Stop Sequence:
```
1. User clicks "Atmosphere" button again
2. _stopMelodicPad('atmosphere') called
3. Set pad.isPlaying = false
   └─ Prevents new crossfades from scheduling
4. Fade out pad.gainNode: current → 0 over 2s
5. After 2s:
   ├─ Stop current source
   ├─ Disconnect nodes
   └─ Clean up
```

## Memory Management Flow

```
┌─────────────────────┐
│  Create New Source  │
│   + Gain Node       │
└──────────┬──────────┘
           │
           ↓
    ┌──────────────┐
    │ Start Source │
    │  Schedule    │
    │  Crossfade   │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │  Crossfade   │
    │   Executes   │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │ Stop Old Src │
    │ Disconnect   │
    └──────┬───────┘
           │
           ↓
    ┌──────────────┐
    │   Garbage    │
    │  Collection  │
    └──────────────┘
```

## Code Flow Diagram

```
_startMelodicPad(padType)
    ↓
Load & validate buffer
    ↓
_startCrossfadeLoop(padType, buffer)
    ↓
Create source A + gainA
Set gainA = 1.0
Fade in pad.gainNode: 0→0.5
Start source A
    ↓
Schedule: _scheduleCrossfadeLoop(..., gainA)
    │
    └─→ setTimeout(bufferDuration - 1.5s)
            ↓
        Create source B + gainB
        Set gainB: 0→1.0 (fade in)
        Set gainA: 1.0→0 (fade out)
        Start source B
            ↓
        Schedule cleanup of A
            ↓
        Schedule: _scheduleCrossfadeLoop(..., gainB)
            │
            └─→ setTimeout(bufferDuration - 1.5s)
                    ↓
                Create source C + gainC
                ... (continues indefinitely)
```

## Problem vs Solution

### ❌ BEFORE (Broken):
```
Source plays → Ends → Silence → Nothing happens
```

### ✅ AFTER (Fixed):
```
Source A plays → Crossfade → Source B plays → Crossfade → Source C plays → ...
                 (A+B both)              (B+C both)
```

## Key Insights

1. **Independent Gain Control**: Each source needs its own gain node to fade independently
2. **Gain Reference Chain**: Old gain must be passed to know what to fade out
3. **Scheduled Timing**: Uses Web Audio API scheduling, not setInterval
4. **Cleanup**: Old nodes are disconnected to prevent memory leaks
5. **Recursive Scheduling**: Each iteration schedules the next one

## Performance Characteristics

```
Active Nodes During Normal Playback:
├─ pad.gainNode (1) - persistent
├─ sourceGain (1) - current iteration
└─ BufferSource (1) - current iteration

Active Nodes During Crossfade:
├─ pad.gainNode (1) - persistent
├─ oldSourceGain (1) - fading out
├─ oldBufferSource (1) - finishing
├─ newSourceGain (1) - fading in
└─ newBufferSource (1) - starting

Memory per loop: ~2-4 audio nodes
CPU: Minimal (scheduled events only)
```
