# Realistic Male & Female Indian Voice Personas Plan

## Overview
We will upgrade the AI Marg read-aloud audio system to use **`gemini-3.8-flash-tts`** (Gemini's flagship expressive voice-design model) with an **Indian Male Teacher** as the default voice, selectable **Male and Female Indian voice personas**, and a **Speaking Style selector** supporting all three requested styles (**Friendly YouTube Mentor**, **Calm University Professor**, and **Energetic Study Buddy**).

## 1. Voice Personas (Male Default + Selectable Male & Female Voices)
- **Default Male Voice (`male-arjun` — `Fenrir`)**: Warm, authoritative, approachable Indian male mentor voice set as the default for new and existing sessions.
- **Additional Male Voices**:
  - **`male-rohan` (`Puck`)**: Upbeat, clear, conversational Indian male voice.
  - **`male-vikram` (`Charon`)**: Deep, calm, steady Indian male professor voice.
- **Selectable Female Voices**:
  - **`female-ananya` (`Kore`)**: Warm, clear, expressive Indian female teacher voice.
  - **`female-meera` (`Zephyr`)**: Calm, articulate Indian female voice.
- **Quick Gender & Voice Switcher**:
  - Add a quick **Male / Female** voice toggle pill (`♂ Male` / `♀ Female`) directly in the player bar alongside full persona selection in **Pace & Voice**.

## 2. Three Realistic Human Speaking Styles (Selectable in Player)
Learners can switch between all three speaking styles at any time in the audio player:
1. **Friendly YouTube Mentor (Default — CampusX / Krish Naik style)**:
   - Warm, relatable Indian mentor tone with natural `<breath>` pauses, conversational emphasis on key ideas, and natural Hinglish/Indian-English flow.
2. **Calm University Professor (NPTEL / IIT lecture style)**:
   - Composed, structured, articulate lecture delivery with measured pauses before definitions, formulas, and examples.
3. **Energetic Study Buddy (Peer coaching style)**:
   - Enthusiastic, encouraging peer-to-peer tone with lively inflection and natural vocal cues.

## 3. Natural Prosody & Expressive TTS Direction (`/api/tts` in `server.js`)
- Upgrade `/api/tts` to use **`gemini-3.8-flash-tts`** with rich `speechMetadata.style` persona direction combining the chosen **Voice Persona (Male/Female)**, **Speaking Style (Mentor / Professor / Study Buddy)**, and **Language Mode (Hinglish vs. Indian English)**.
- Inject subtle natural breath cues (`<breath>`) at long clause transitions and conversational connectors so sentences sound like a real human teacher speaking rather than a flat screen reader.
- Cache generated audio by `voice + style + language + text` for instant replay and prefetch the next sentence automatically.
