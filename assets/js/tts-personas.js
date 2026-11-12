/* AI Marg: Shared Indian Voice Personas, Speaking Styles, and Prosody Direction
   Works in both browser (window.AIM_TTS_PERSONAS) and Node.js (module.exports). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AIM_TTS_PERSONAS = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DEFAULT_PERSONA_ID = 'neural:male-arjun';
  var DEFAULT_STYLE_ID = 'mentor';

  var VOICE_PERSONAS = [
    {
      id: 'neural:male-arjun',
      personaId: 'male-arjun',
      voiceName: 'Fenrir',
      gender: 'male',
      shortName: 'Arjun',
      badge: '♂ Male · Arjun',
      label: 'Arjun — Indian Male Mentor (Warm & Authoritative · Default)',
      personaPrompt: 'Arjun, a warm, authoritative, approachable Indian male AI and Machine Learning teacher with authentic Indian cadence'
    },
    {
      id: 'neural:male-rohan',
      personaId: 'male-rohan',
      voiceName: 'Puck',
      gender: 'male',
      shortName: 'Rohan',
      badge: '♂ Male · Rohan',
      label: 'Rohan — Indian Male Instructor (Upbeat & Conversational)',
      personaPrompt: 'Rohan, an upbeat, clear, conversational Indian male AI and Machine Learning instructor with natural Indian intonation'
    },
    {
      id: 'neural:male-vikram',
      personaId: 'male-vikram',
      voiceName: 'Charon',
      gender: 'male',
      shortName: 'Vikram',
      badge: '♂ Male · Vikram',
      label: 'Vikram — Indian Male Professor (Deep, Calm & Steady)',
      personaPrompt: 'Professor Vikram, a deep, calm, steady Indian university professor with measured articulation'
    },
    {
      id: 'neural:female-ananya',
      personaId: 'female-ananya',
      voiceName: 'Kore',
      gender: 'female',
      shortName: 'Ananya',
      badge: '♀ Female · Ananya',
      label: 'Ananya — Indian Female Teacher (Warm, Clear & Expressive)',
      personaPrompt: 'Ananya, a warm, clear, expressive Indian female AI and Machine Learning teacher with natural Indian cadence'
    },
    {
      id: 'neural:female-meera',
      personaId: 'female-meera',
      voiceName: 'Zephyr',
      gender: 'female',
      shortName: 'Meera',
      badge: '♀ Female · Meera',
      label: 'Meera — Indian Female Educator (Calm & Articulate)',
      personaPrompt: 'Meera, a calm, composed, articulate Indian female educator with smooth pacing'
    }
  ];

  var SPEAKING_STYLES = [
    {
      id: 'mentor',
      shortLabel: 'Friendly Mentor',
      label: 'Friendly YouTube Mentor (CampusX / Krish Naik style — Default)',
      enDirection:
        'speaking like a friendly, relatable Indian YouTube mentor (CampusX / Krish Naik style) with warm conversational flow, natural pauses, genuine enthusiasm, and clear emphasis on key ideas',
      hlDirection:
        'speaking natural, fluid conversational Hinglish (Roman Hindi mixed seamlessly with English AI/ML terms) like a friendly Indian YouTube mentor (CampusX / Krish Naik style), with warm inflection, natural pauses, and authentic Indian pronunciation'
    },
    {
      id: 'professor',
      shortLabel: 'Calm Professor',
      label: 'Calm University Professor (NPTEL / IIT lecture style)',
      enDirection:
        'speaking like a composed, structured IIT / NPTEL university professor delivering an articulate lecture, with measured pauses before definitions, formulas, and examples',
      hlDirection:
        'speaking like a composed, structured Indian university professor explaining concepts in clear Hinglish (Roman Hindi with English technical terms), with measured classroom pacing and thoughtful pauses before definitions and examples'
    },
    {
      id: 'buddy',
      shortLabel: 'Study Buddy',
      label: 'Energetic Study Buddy (Peer coaching style)',
      enDirection:
        'speaking like an enthusiastic, encouraging Indian college senior and study buddy coaching a peer through AI and ML, with lively inflection and warm encouragement',
      hlDirection:
        'speaking like an enthusiastic, encouraging Indian college senior and study buddy explaining AI and ML to a friend in natural Hinglish, with lively inflection and relatable peer-to-peer energy'
    }
  ];

  var ALLOWED_GEMINI_VOICES = ['Fenrir', 'Puck', 'Charon', 'Kore', 'Zephyr'];

  function getPersonaById(idOrVoice) {
    var key = String(idOrVoice || '').trim();
    for (var i = 0; i < VOICE_PERSONAS.length; i++) {
      var p = VOICE_PERSONAS[i];
      if (p.id === key || p.personaId === key) return p;
    }
    for (var j = 0; j < VOICE_PERSONAS.length; j++) {
      if (VOICE_PERSONAS[j].voiceName.toLowerCase() === key.toLowerCase()) {
        return VOICE_PERSONAS[j];
      }
    }
    return VOICE_PERSONAS[0];
  }

  function getStyleById(styleId) {
    var key = String(styleId || '').trim().toLowerCase();
    for (var i = 0; i < SPEAKING_STYLES.length; i++) {
      if (SPEAKING_STYLES[i].id === key) return SPEAKING_STYLES[i];
    }
    return SPEAKING_STYLES[0];
  }

  function normalizeVoicePref(savedVoice, migratedV2) {
    if (!savedVoice || typeof savedVoice !== 'string') return DEFAULT_PERSONA_ID;
    // Migrate legacy v1 default ('neural:Kore') to new Male default ('neural:male-arjun')
    if (!migratedV2) {
      if (savedVoice === 'neural:Kore' || savedVoice === 'neural:Fenrir') return 'neural:male-arjun';
      if (savedVoice === 'neural:Puck') return 'neural:male-rohan';
      if (savedVoice === 'neural:Charon') return 'neural:male-vikram';
      if (savedVoice === 'neural:Zephyr') return 'neural:female-meera';
    }
    if (savedVoice.indexOf('neural:') === 0) {
      var sub = savedVoice.slice(7);
      var match = getPersonaById(sub);
      return match ? match.id : DEFAULT_PERSONA_ID;
    }
    return savedVoice;
  }

  function toggleGenderPersona(currentVoiceId, lastMaleId, lastFemaleId) {
    var cur = getPersonaById(currentVoiceId);
    if (cur && cur.gender === 'male') {
      var fem = lastFemaleId ? getPersonaById(lastFemaleId) : null;
      return fem && fem.gender === 'female' ? fem.id : 'neural:female-ananya';
    }
    var mal = lastMaleId ? getPersonaById(lastMaleId) : null;
    return mal && mal.gender === 'male' ? mal.id : DEFAULT_PERSONA_ID;
  }

  function injectNaturalBreaths(rawText, styleId) {
    var s = String(rawText || '').trim();
    if (!s || s.length < 75 || s.indexOf('<breath>') >= 0) return s;

    var count = 0;
    var maxBreaths = styleId === 'professor' ? 2 : 2;

    // 1. Add a subtle breath before key explanatory transitions / connectors
    var transitionRe = /(\.\s+)(For example,|In other words,|Notice that|However,|Specifically,|That means|Ab\s|Jaise ki|Matlab\s|Dhyan rahe|Isliye\s|udaharan ke liye)/g;
    s = s.replace(transitionRe, function (full, dotSpace, connector) {
      if (count >= maxBreaths) return full;
      count++;
      return dotSpace + '<breath> ' + connector;
    });

    // 2. If no transition breath was injected yet and the passage has multiple sentences, place one natural breath after the first sentence
    if (count === 0 && s.length >= 95) {
      var firstBreak = s.match(/^([^.!?।]{35,180}[.!?।])\s+(?=[A-Zऀ-ॿ])/);
      if (firstBreak) {
        var idx = firstBreak[1].length;
        s = s.slice(0, idx) + ' <breath>' + s.slice(idx);
      }
    }

    return s;
  }

  function buildStylePrompt(opts) {
    opts = opts || {};
    var persona = getPersonaById(opts.personaId || opts.voice || DEFAULT_PERSONA_ID);
    var style = getStyleById(opts.style);
    var isHinglish = Boolean(opts.isHinglish);
    var dir = isHinglish ? style.hlDirection : style.enDirection;
    return persona.personaPrompt + ', ' + dir;
  }

  var SUPPORTED_RATES = [0.75, 1, 1.25, 1.5, 1.75, 2];

  function normalizeRate(val) {
    var num = Number(val);
    if (SUPPORTED_RATES.indexOf(num) >= 0) return num;
    return 1;
  }

  function buildTtsCacheKey(opts) {
    opts = opts || {};
    var persona = getPersonaById(opts.personaId || opts.voice || DEFAULT_PERSONA_ID);
    var style = getStyleById(opts.style);
    var lang = opts.isHinglish ? 'hl' : 'en';
    var text = String(opts.text || '').trim();
    return persona.personaId + '|' + persona.voiceName + '|' + style.id + '|' + lang + '|' + text;
  }

  return {
    DEFAULT_PERSONA_ID: DEFAULT_PERSONA_ID,
    DEFAULT_STYLE_ID: DEFAULT_STYLE_ID,
    SUPPORTED_RATES: SUPPORTED_RATES,
    VOICE_PERSONAS: VOICE_PERSONAS,
    SPEAKING_STYLES: SPEAKING_STYLES,
    ALLOWED_GEMINI_VOICES: ALLOWED_GEMINI_VOICES,
    getPersonaById: getPersonaById,
    getStyleById: getStyleById,
    normalizeVoicePref: normalizeVoicePref,
    normalizeRate: normalizeRate,
    toggleGenderPersona: toggleGenderPersona,
    injectNaturalBreaths: injectNaturalBreaths,
    buildStylePrompt: buildStylePrompt,
    buildTtsCacheKey: buildTtsCacheKey
  };
});
