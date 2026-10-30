import test from 'node:test'
import assert from 'node:assert/strict'
import { SUPPORTED_LANGUAGES, isRTL, LanguageMetadata } from '../i18n/languages.js'

test('Multilingual Architecture: All 13 mandatory languages defined with native scripts', () => {
  const expectedCodes = ['en', 'hi', 'pa', 'bn', 'mr', 'ta', 'te', 'gu', 'kn', 'ml', 'or', 'as', 'ur']
  const codes = SUPPORTED_LANGUAGES.map((l: LanguageMetadata) => l.code)

  assert.equal(codes.length, 13, 'Must have exactly 13 languages')
  for (const exp of expectedCodes) {
    assert.ok(codes.includes(exp as any), `Language ${exp} must be present in SUPPORTED_LANGUAGES`)
  }

  // Urdu must have dir: 'rtl'
  const urdu = SUPPORTED_LANGUAGES.find((l: LanguageMetadata) => l.code === 'ur')
  assert.ok(urdu)
  assert.equal(urdu.dir, 'rtl')
  assert.equal(isRTL('ur'), true)
  assert.equal(isRTL('en'), false)
  assert.equal(isRTL('hi'), false)
})

test('Multilingual Architecture: Native scripts and labels are populated', () => {
  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(lang.name.length > 0, `Language ${lang.code} must have an English name`)
    assert.ok(lang.nativeName.length > 0, `Language ${lang.code} must have a nativeName`)
    assert.ok(lang.script.length > 0, `Language ${lang.code} must specify a script`)
  }
})

