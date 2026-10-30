import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import { Readable } from 'stream';

process.env.NODE_ENV = 'test';

import {
  extractArticleLocation,
  parseCombinedQuery,
  VERIFIED_LOCATIONS,
} from '../services/geoService.js';
import { getMapArticles } from '../services/articleService.js';
import { app } from '../index.js';

function makeRequest(
  expressApp: any,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
  }
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    try {
      const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : '';
      const socket = new Readable({ read() {} });
      const req = new http.IncomingMessage(socket as any);
      req.method = options.method || 'GET';
      req.url = options.path;
      req.headers = {
        'content-type': 'application/json',
        ...(options.headers
          ? Object.fromEntries(
              Object.entries(options.headers).map(([k, v]) => [k.toLowerCase(), v])
            )
          : {}),
      };
      if (bodyStr) {
        req.headers['content-length'] = String(Buffer.byteLength(bodyStr));
      }

      const res = new http.ServerResponse(req);
      let responseBody = '';

      res.write = function (chunk: any) {
        responseBody += chunk.toString();
        return true;
      };

      res.end = function (chunk?: any) {
        if (chunk) responseBody += chunk.toString();
        let parsed = responseBody;
        try {
          parsed = JSON.parse(responseBody);
        } catch {
          // Non-JSON response
        }
        resolve({ status: res.statusCode, body: parsed });
        return res;
      };

      expressApp(req, res);

      if (bodyStr) {
        socket.push(bodyStr);
      }
      socket.push(null);
    } catch (err) {
      reject(err);
    }
  });
}

test('Geocoding & Location Extraction: Extracts real-world coordinates from journalistic text', () => {
  // Dateline recognition
  const delhiArticle = extractArticleLocation(
    'Infrastructure Blueprint Approved',
    'Logistics corridors approved across regions',
    'NEW DELHI — The Union Cabinet today approved national freight corridors.'
  );
  assert.ok(delhiArticle, 'Extracts location from NEW DELHI dateline');
  assert.equal(delhiArticle?.city, 'New Delhi');
  assert.equal(delhiArticle?.state, 'Delhi');
  assert.equal(delhiArticle?.country, 'India');
  assert.ok(Math.abs(delhiArticle!.latitude - 28.6139) < 0.01);
  assert.ok(Math.abs(delhiArticle!.longitude - 77.2090) < 0.01);

  // Title keyword recognition
  const bangaloreArticle = extractArticleLocation(
    'IISc and Tech Foundry Unveil Silicon-Photonic Chips in Bengaluru',
    'Breakthrough optical waveguide operates stably'
  );
  assert.ok(bangaloreArticle, 'Extracts Bengaluru from title');
  assert.equal(bangaloreArticle?.city, 'Bengaluru');
  assert.equal(bangaloreArticle?.state, 'Karnataka');

  // Punjab desk
  const punjabArticle = extractArticleLocation(
    'Punjab Agricultural Telemetry Network Deployed for Winter Crops',
    'Farmers in Ludhiana and Jalandhar receive automated soil moisture updates'
  );
  assert.ok(punjabArticle, 'Extracts Punjab from title');
  assert.equal(punjabArticle?.state, 'Punjab');

  // Chandigarh desk
  const chdArticle = extractArticleLocation(
    'PGIMER Chandigarh Launches AI-Assisted Tele-Diagnostic Hub',
    'Advanced patient triage system serves northern states'
  );
  assert.ok(chdArticle, 'Extracts Chandigarh from title');
  assert.equal(chdArticle?.city, 'Chandigarh');

  // Safe null handling when no geographic signal exists (never fabricate)
  const abstractArticle = extractArticleLocation(
    'Quantum Algorithms Optimize Abstract Distributed Graph Networks',
    'A novel theoretical proof demonstrates lower bound reductions in time complexity.'
  );
  assert.equal(abstractArticle, null, 'Must return null rather than fabricating coordinates');
});

test('Combined Search Parser: Accurately decomposes queries into topic and location', () => {
  // Combined topic + location with "in"
  const q1 = parseCombinedQuery('AI news in Bengaluru');
  assert.equal(q1.topicQuery, 'AI news');
  assert.equal(q1.locationQuery, 'Bengaluru');
  assert.ok(q1.matchedLocation);
  assert.equal(q1.matchedLocation?.city, 'Bengaluru');

  // Combined topic + location with "in" for state
  const q2 = parseCombinedQuery('Elections in Punjab');
  assert.equal(q2.topicQuery, 'Elections');
  assert.equal(q2.locationQuery, 'Punjab');
  assert.ok(q2.matchedLocation);
  assert.equal(q2.matchedLocation?.state, 'Punjab');

  // Combined cricket in Mumbai
  const q3 = parseCombinedQuery('Cricket news in Mumbai');
  assert.equal(q3.topicQuery, 'Cricket news');
  assert.equal(q3.locationQuery, 'Mumbai');

  // Combined climate change in India
  const q4 = parseCombinedQuery('Climate change in India');
  assert.equal(q4.topicQuery, 'Climate change');
  assert.equal(q4.locationQuery, 'India');

  // Pure location query
  const q5 = parseCombinedQuery('Chandigarh');
  assert.equal(q5.topicQuery, undefined);
  assert.equal(q5.locationQuery, 'Chandigarh');

  // Pure topic query without location
  const q6 = parseCombinedQuery('Semiconductor manufacturing');
  assert.equal(q6.topicQuery, 'Semiconductor manufacturing');
  assert.equal(q6.matchedLocation, undefined);
});

test('HTTP API: GET /api/articles/map endpoint functions correctly', async () => {
  const res = await makeRequest(app, {
    method: 'GET',
    path: '/api/articles/map?limit=10',
  });

  assert.equal(res.status, 200, 'Endpoint returns HTTP 200');
  assert.equal(res.body.success, true, 'Returns success: true');
  assert.ok(Array.isArray(res.body.data), 'Returns data array');
  assert.ok(typeof res.body.total === 'number', 'Returns total count');
});

