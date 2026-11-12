const test = require('node:test');
const assert = require('node:assert/strict');
const tts = require('../assets/js/tts-personas');

test('default voice persona is Indian Male Mentor Arjun (Fenrir)', () => {
  assert.equal(tts.DEFAULT_PERSONA_ID, 'neural:male-arjun');
  const def = tts.getPersonaById(tts.DEFAULT_PERSONA_ID);
  assert.equal(def.personaId, 'male-arjun');
  assert.equal(def.voiceName, 'Fenrir');
  assert.equal(def.gender, 'male');
  assert.equal(def.shortName, 'Arjun');
});

test('all 5 Male and Female Indian voice personas are registered and resolvable', () => {
  const expected = [
    { id: 'neural:male-arjun', personaId: 'male-arjun', voiceName: 'Fenrir', gender: 'male' },
    { id: 'neural:male-rohan', personaId: 'male-rohan', voiceName: 'Puck', gender: 'male' },
    { id: 'neural:male-vikram', personaId: 'male-vikram', voiceName: 'Charon', gender: 'male' },
    { id: 'neural:female-ananya', personaId: 'female-ananya', voiceName: 'Kore', gender: 'female' },
    { id: 'neural:female-meera', personaId: 'female-meera', voiceName: 'Zephyr', gender: 'female' }
  ];
  assert.equal(tts.VOICE_PERSONAS.length, 5);
  for (const exp of expected) {
    const byId = tts.getPersonaById(exp.id);
    const byPersona = tts.getPersonaById(exp.personaId);
    const byVoice = tts.getPersonaById(exp.voiceName);
    assert.equal(byId.personaId, exp.personaId);
    assert.equal(byPersona.voiceName, exp.voiceName);
    assert.equal(byVoice.gender, exp.gender);
  }
});

test('all 3 speaking styles (mentor, professor, buddy) are supported', () => {
  assert.equal(tts.DEFAULT_STYLE_ID, 'mentor');
  const ids = tts.SPEAKING_STYLES.map((s) => s.id);
  assert.deepEqual(ids, ['mentor', 'professor', 'buddy']);

  const mentorPromptHl = tts.buildStylePrompt({
    personaId: 'male-arjun',
    style: 'mentor',
    isHinglish: true
  });
  assert.match(mentorPromptHl, /Arjun/);
  assert.match(mentorPromptHl, /CampusX \/ Krish Naik/);
  assert.match(mentorPromptHl, /Hinglish/);

  const profPromptEn = tts.buildStylePrompt({
    personaId: 'female-ananya',
    style: 'professor',
    isHinglish: false
  });
  assert.match(profPromptEn, /Ananya/);
  assert.match(profPromptEn, /NPTEL/);

  const buddyPromptHl = tts.buildStylePrompt({
    personaId: 'male-rohan',
    style: 'buddy',
    isHinglish: true
  });
  assert.match(buddyPromptHl, /Rohan/);
  assert.match(buddyPromptHl, /study buddy/);
});

test('normalizeVoicePref migrates legacy sessions to Male default and preserves v2 choices', () => {
  assert.equal(tts.normalizeVoicePref('neural:Kore', false), 'neural:male-arjun');
  assert.equal(tts.normalizeVoicePref('', false), 'neural:male-arjun');
  assert.equal(tts.normalizeVoicePref('neural:female-ananya', true), 'neural:female-ananya');
  assert.equal(tts.normalizeVoicePref('neural:male-vikram', true), 'neural:male-vikram');
});

test('toggleGenderPersona switches cleanly between Male and Female Indian personas', () => {
  const toFemale = tts.toggleGenderPersona('neural:male-arjun', 'neural:male-arjun', 'neural:female-meera');
  assert.equal(toFemale, 'neural:female-meera');
  const backToMale = tts.toggleGenderPersona(toFemale, 'neural:male-vikram', 'neural:female-meera');
  assert.equal(backToMale, 'neural:male-vikram');
});

test('injectNaturalBreaths inserts <breath> at natural transition points without duplicating', () => {
  const passage =
    'Gradient descent updates model weights step by step to minimize the loss function. For example, a smaller learning rate takes smaller steps downhill.';
  const withBreath = tts.injectNaturalBreaths(passage, 'mentor');
  assert.match(withBreath, /<breath>/);
  // Idempotent when called again
  assert.equal(tts.injectNaturalBreaths(withBreath, 'mentor'), withBreath);
});

test('buildTtsCacheKey distinguishes voice persona, speaking style, and language mode', () => {
  const k1 = tts.buildTtsCacheKey({ personaId: 'male-arjun', style: 'mentor', isHinglish: false, text: 'Hello' });
  const k2 = tts.buildTtsCacheKey({ personaId: 'female-ananya', style: 'mentor', isHinglish: false, text: 'Hello' });
  const k3 = tts.buildTtsCacheKey({ personaId: 'male-arjun', style: 'professor', isHinglish: false, text: 'Hello' });
  const k4 = tts.buildTtsCacheKey({ personaId: 'male-arjun', style: 'mentor', isHinglish: true, text: 'Hello' });
  assert.notEqual(k1, k2);
  assert.notEqual(k1, k3);
  assert.notEqual(k1, k4);
});

test('normalizeRate validates supported playback rates and falls back to 1x', () => {
  assert.deepEqual(tts.SUPPORTED_RATES, [0.75, 1, 1.25, 1.5, 1.75, 2]);
  for (const r of tts.SUPPORTED_RATES) {
    assert.equal(tts.normalizeRate(r), r);
    assert.equal(tts.normalizeRate(String(r)), r);
  }
  assert.equal(tts.normalizeRate(99), 1);
  assert.equal(tts.normalizeRate('invalid'), 1);
});
