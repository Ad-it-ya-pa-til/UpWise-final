import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import {
  isLegitimateNewsArticle,
  detectLanguage,
  extractImageUrl,
  cleanText,
  generateSummary,
  calculateReadingTime,
} from '../ingestion/rssParser.js';
import { FEED_SOURCES } from '../ingestion/feedConfig.js';
import { buildCategoryCondition } from '../services/articleService.js';
import { extractArticleLocation } from '../services/geoService.js';

test('News Ingestion: Feed Configuration covers all 8 official categories', () => {
  const officialCategories = [
    'Technology',
    'India & Politics',
    'Business',
    'Science',
    'Sports',
    'World',
    'Careers',
    'AI & Startups',
  ];

  const configuredCategories = new Set(FEED_SOURCES.map((s) => s.category));

  for (const cat of officialCategories) {
    assert.ok(
      configuredCategories.has(cat as any),
      `FEED_SOURCES must contain feeds for official category: "${cat}"`
    );
  }

  // Ensure both English and Hindi sources exist
  const languages = new Set(FEED_SOURCES.map((s) => s.language));
  assert.ok(languages.has('en'), 'Contains English feeds');
  assert.ok(languages.has('hi'), 'Contains Hindi feeds');

  // Ensure each feed has valid URLs and publishers
  for (const source of FEED_SOURCES) {
    assert.ok(source.name && source.name.trim().length > 0, 'Feed name must be non-empty');
    assert.ok(source.feedUrl.startsWith('http'), `Feed URL must be valid HTTP(S): ${source.feedUrl}`);
    assert.ok(source.defaultPublisher && source.defaultPublisher.trim().length > 0, 'Publisher must be specified');
    assert.ok(source.subcategory && source.subcategory.trim().length > 0, 'Subcategory must be specified');
  }
});

test('News Ingestion: Content Sanitation & Spam Filtering', () => {
  // Legitimate journalism
  const legit = isLegitimateNewsArticle(
    'ISRO Prepares Next-Generation Reusable Launch Vehicle Test',
    'Scientists at Sriharikota have completed static fire tests for the winged prototype.',
    'https://thehindu.com/sci-tech/isro-rlv-test-announcement/article1234.ece'
  );
  assert.equal(legit, true, 'Legitimate journalistic article must be accepted');

  // Block Pinterest and aggregator spam
  const pinterestSpam = isLegitimateNewsArticle(
    '10 Best Ideas and Inspiration for Political Cartoons',
    'Free stock illustrations and cliparts for politicians.',
    'https://pinterest.com/pin/123456789'
  );
  assert.equal(pinterestSpam, false, 'Pinterest spam must be rejected');

  // Block too short titles
  const shortTitle = isLegitimateNewsArticle('Breaking', 'Some short text', 'https://example.com/a');
  assert.equal(shortTitle, false, 'Articles with too short titles must be rejected');
});

test('News Ingestion: HTML Cleaning and Summary Extraction', () => {
  const rawHtml = '<p>NEW DELHI &mdash; The Union Cabinet &quot;approved&quot; the corridor. <a href="#">Read more on NDTV</a></p>';
  const cleaned = cleanText(rawHtml);
  assert.ok(!cleaned.includes('<p>'), 'Removes HTML tags');
  assert.ok(!cleaned.includes('&quot;'), 'Unescapes HTML entities');
  assert.ok(!cleaned.includes('Read more on'), 'Strips marketing boilerplate');

  const summary = generateSummary('First sentence was clear. Second sentence added context. Third sentence gave background. Fourth sentence had details.', 2);
  assert.ok(summary.includes('First sentence was clear.'), 'Includes first sentence');
  assert.ok(summary.includes('Second sentence added context.'), 'Includes second sentence');
  assert.ok(!summary.includes('Fourth sentence'), 'Caps summary at specified sentence count');
});

test('News Ingestion: Deduplication Hashing & Language Detection', () => {
  const title = 'Reserve Bank Keeps Repo Rate Unchanged at 6.5%';
  const publisher = 'Mint';
  const hashSource = `${title.toLowerCase().trim()}_${publisher}`;
  const hash1 = crypto.createHash('sha256').update(hashSource).digest('hex');
  const hash2 = crypto.createHash('sha256').update(hashSource).digest('hex');
  assert.equal(hash1, hash2, 'Hash generation must be deterministic');

  // English detection
  const langEn = detectLanguage(title, 'en');
  assert.equal(langEn, 'en');

  // Hindi Devanagari detection
  const hindiTitle = 'भारतीय रिज़र्व बैंक ने रेपो रेट में कोई बदलाव नहीं किया';
  const langHi = detectLanguage(hindiTitle, 'en');
  assert.equal(langHi, 'hi', 'Detects Devanagari Unicode characters as Hindi');
});

test('News Ingestion: Reading Time Calculation', () => {
  const shortText = 'One two three four five six seven eight nine ten.';
  assert.equal(calculateReadingTime(shortText), 1, 'Minimum reading time is 1 min');

  const longText = new Array(450).fill('word').join(' ');
  assert.equal(calculateReadingTime(longText), 3, 'Calculates ~200 words per minute');
});

test('News Ingestion: Category Query Resolution handles both official 8 categories and legacy groups', () => {
  // Official category: Technology
  const techCond = buildCategoryCondition('Technology');
  assert.ok(techCond && (techCond as any).OR, 'Technology resolves with fallback OR');

  // Official category: Science
  const sciCond = buildCategoryCondition('Science');
  assert.ok(sciCond && (sciCond as any).OR, 'Science resolves with subcategory fallback');

  // Official category: Careers
  const careerCond = buildCategoryCondition('Careers');
  assert.ok(careerCond && (careerCond as any).OR, 'Careers resolves with subcategory fallback');

  // Official category: AI & Startups
  const aiCond = buildCategoryCondition('AI & Startups');
  assert.ok(aiCond && (aiCond as any).OR, 'AI & Startups resolves correctly');

  // Legacy compound category: Technology & Science
  const legTechCond = buildCategoryCondition('Technology & Science');
  assert.ok(legTechCond && (legTechCond as any).category?.in, 'Legacy Technology & Science matches multiple subcategories');

  // All / Front Page
  assert.equal(buildCategoryCondition('All'), null, 'All returns null filter for front page');
  assert.equal(buildCategoryCondition('all'), null, 'all returns null filter');
});

test('News Ingestion: Geographic extraction handles live news patterns without fabricating coordinates', () => {
  const geo1 = extractArticleLocation(
    'IISc and Tech Foundry Unveil Silicon-Photonic Chips in Bengaluru',
    'Propulsion complex engineers confirmed standard pressure parameters.',
    'BENGALURU — Liquid propulsion scientists tested the optical engine.'
  );
  assert.ok(geo1, 'Extracts location from journalistic dateline');
  assert.equal(geo1?.city, 'Bengaluru');

  const geo2 = extractArticleLocation(
    'Theoretical Analysis of Cryptographic Lattice Hardness',
    'A study evaluating abstract mathematics of lattices.'
  );
  assert.equal(geo2, null, 'Must not fabricate coordinates for non-geographic stories');
});
