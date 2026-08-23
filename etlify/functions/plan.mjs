// netlify/functions/plan.mjs
// GET  /api/plan  -> returns the logged-in user's saved study-plan data
// POST /api/plan  -> saves the logged-in user's study-plan data (body = full state JSON)
//
// Auth: Netlify automatically verifies the Netlify Identity JWT sent in the
// "Authorization: Bearer <token>" header and populates context.clientContext.user
// for any request that hits a Netlify Function on this site (no manual JWT
// verification code needed here).
//
// Storage: Netlify Blobs — a zero-config key/value store tied to this site.
// Each user's entire plan is stored as one JSON blob, keyed by their user id.

import { getStore } from '@netlify/blobs';

export default async (req, context) => {
  const user = context.clientContext && context.clientContext.user;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized: please log in first' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const store = getStore('study-planner-data');
  const key = user.sub; // stable unique id for this Identity user

  if (req.method === 'GET') {
    const data = await store.get(key, { type: 'json' });
    return new Response(JSON.stringify({ data: data || null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (req.method === 'POST') {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    await store.setJSON(key, body);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('Method not allowed', { status: 405 });
};

export const config = {
  path: '/api/plan'
};
