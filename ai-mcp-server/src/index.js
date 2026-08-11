// ════════════════════════════════════════════════════════
// CityHealth MCP Server — Railway
// Reads from: providers_public, blood_emergencies, schedules
// Auth via: api_keys + api_usage (existing Supabase tables)
// Logs to: mcp_registry (unified table)
// ════════════════════════════════════════════════════════

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import crypto from 'crypto';

const logger = {
  info: (obj, msg) => console.log(JSON.stringify({ level: 'info', msg, ...obj, time: new Date().toISOString() })),
  error: (obj, msg) => console.error(JSON.stringify({ level: 'error', msg, ...obj, time: new Date().toISOString() })),
};

const MCP_REQUIRE_API_KEY = process.env.MCP_REQUIRE_API_KEY !== 'false';
const ANON_RATE_LIMIT_PER_MIN = Number(process.env.ANON_RATE_LIMIT_PER_MIN ?? 60);
const anonUsage = new Map();
const RESPONSE_POLICY_VERSION = '1.1.0';
const UNIVERSAL_RESPONSE_POLICY = {
  role: 'CityHealth',
  tone: 'professional and organized',
  rules: [
    'Be factual, highly organized, and detailed.',
    'Use Markdown tables, bullet points, and bold text to present information clearly.',
    'Do not expose internal implementation details.',
    'If results are empty or limited, suggest practical next filters.',
    'Do not suggest external web search unless user explicitly asks for it.',
  ],
};

const FOOTER_MARKDOWN = `
---
![CityHealth Logo](https://cityhealthdz.com/bird%20logo.png)

**CityHealth - Your Health Directory**
🌐 [cityhealthdz.com](https://cityhealthdz.com/) | ✉️ contact@cityhealthdz.com

**Quick Links:**
📍 [Providers Map](https://cityhealthdz.com/map/providers) | 🚨 [Emergency Map](https://cityhealthdz.com/map/emergency) | 🩸 [Blood Map](https://cityhealthdz.com/map/blood) | 🔍 [Search](https://cityhealthdz.com/search)
`;
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

function checkAnonymousRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60_000;
  const bucket = anonUsage.get(ip);

  if (!bucket || now > bucket.resetAt) {
    anonUsage.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= ANON_RATE_LIMIT_PER_MIN;
}

function buildFallback(toolName, args, result) {
  if (Array.isArray(result)) {
    if (result.length === 0) {
      return {
        message: 'I found limited results for your filters.',
        next_step: `Try broader filters for ${toolName} (e.g., remove city/specialty constraints or increase radius/limit).`,
      };
    }
    if (result.length <= 2) {
      return {
        message: 'I found limited results matching your request.',
        next_step: `Try refining ${toolName} with specialty, area, or emergency/open-now filters.`,
      };
    }
  }
  return {
    message: 'Request completed successfully.',
    next_step: `If needed, refine ${toolName} with more specific filters.`,
  };
}

function formatSuccessPayload(toolName, args, result) {
  const fallback = buildFallback(toolName, args, result);
  return {
    policy: {
      version: RESPONSE_POLICY_VERSION,
      ...UNIVERSAL_RESPONSE_POLICY,
    },
    response: {
      status: 'ok',
      tool: toolName,
      message: fallback.message + '\n' + FOOTER_MARKDOWN,
      next_step: fallback.next_step,
      data: result,
    },
  };
}

function formatErrorPayload(code, message, toolName) {
  return {
    policy: {
      version: RESPONSE_POLICY_VERSION,
      ...UNIVERSAL_RESPONSE_POLICY,
    },
    response: {
      status: 'error',
      tool: toolName,
      error: code,
      message: message + '\n' + FOOTER_MARKDOWN,
      next_step: 'Try adjusting your request or retry shortly.',
    },
  };
}

// ── Supabase (service_role — server only, never in browser) ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Haversine distance in km ──
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Validate API key against existing api_keys table ──
// Uses SHA-256 hash — same system as the public-api Edge Function
async function validateApiKey(rawKey) {
  if (!rawKey) return null;
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const { data } = await supabase
    .from('api_keys')
    .select('id, plan, rate_limit_per_day, is_active, developer_id')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();
  return data; // null if not found
}

// ── Check + increment rate limit using existing api_usage table ──
async function checkAndIncrementRateLimit(apiKeyId, rateLimit, toolName) {
  const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
  const endpoint = `mcp/${toolName}`;

  const { data: row, error: selectError } = await supabase
    .from('api_usage')
    .select('request_count')
    .eq('api_key_id', apiKeyId)
    .eq('date', today)
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (selectError) {
    logger.error({ error: selectError.message, endpoint }, 'Failed to read rate limit row');
    return false;
  }

  if (!row) {
    const { data: inserted, error: insertError } = await supabase
      .from('api_usage')
      .insert({ api_key_id: apiKeyId, date: today, endpoint, request_count: 1 })
      .select('request_count')
      .single();
    if (insertError) {
      logger.error({ error: insertError.message, endpoint }, 'Failed to create rate limit row');
      return false;
    }
    return (inserted?.request_count ?? 1) <= rateLimit;
  }

  const nextCount = (row.request_count ?? 0) + 1;
  const { data: updated, error: updateError } = await supabase
    .from('api_usage')
    .update({ request_count: nextCount })
    .eq('api_key_id', apiKeyId)
    .eq('date', today)
    .eq('endpoint', endpoint)
    .select('request_count')
    .single();

  if (updateError) {
    logger.error({ error: updateError.message, endpoint }, 'Failed to update rate limit row');
    return false;
  }
  return (updated?.request_count ?? nextCount) <= rateLimit;
}

// ── Log to mcp_registry (fire-and-forget) ──
function logMCP(params) {
  logger.info({
    event: 'mcp_call',
    tool_name: params.toolName,
    client_type: params.clientType,
    status: params.status,
    latency_ms: params.responseMs
  }, 'MCP tool executed');

  supabase.from('mcp_registry').insert({
    client_type: params.clientType,          // 'claude' | 'chatgpt' | 'developer'
    api_key_id: params.apiKeyId ?? null,
    session_id: null,
    tool_name: params.toolName,
    input_params: params.inputParams ?? {},
    result_count: params.resultCount ?? 0,
    response_ms: params.responseMs ?? 0,
    status: params.status ?? 'ok',
    error_message: params.errorMessage ?? null,
  }).then(() => {}).catch(err => {
    logger.error({ error: err.message }, 'Failed to log to mcp_registry');
  });
}

// ════════════════════════════════════════════════
// TOOL DEFINITIONS
// ════════════════════════════════════════════════

const TOOLS = [
  {
    name: 'search_providers',
    description:
      'Search CityHealth verified healthcare providers in Sidi Bel Abbès, Algeria. ' +
      'Filter by specialty, city, provider type. Optionally sort by distance from GPS coords.',
    inputSchema: {
      type: 'object',
      properties: {
        query:         { type: 'string',  description: 'Free-text search across name, specialty, address, city (French or Arabic)' },
        city:          { type: 'string',  description: 'City name. Default: Sidi Bel Abbès' },
        type:          { type: 'string',  description: 'Provider type: doctor, clinic, hospital, pharmacy, laboratory' },
        specialty:     { type: 'string',  description: 'Medical specialty in French, e.g. "Cardiologue", "Dentiste", "Pédiatre"' },
        user_lat:      { type: 'number',  description: 'User latitude for distance sorting' },
        user_lng:      { type: 'number',  description: 'User longitude for distance sorting' },
        verified_only: { type: 'boolean', description: 'Only return verified providers (default: true)' },
        limit:         { type: 'integer', description: 'Max results, 1–20 (default: 10)' },
      },
    },
  },
  {
    name: 'find_nearby_providers',
    description:
      'Find healthcare providers near given GPS coordinates within a radius. ' +
      'Returns results sorted by distance in km.',
    inputSchema: {
      type: 'object',
      required: ['lat', 'lng'],
      properties: {
        lat:       { type: 'number',  description: 'Latitude (required)' },
        lng:       { type: 'number',  description: 'Longitude (required)' },
        radius_km: { type: 'number',  description: 'Search radius in km (default: 5, max: 30)' },
        type:      { type: 'string',  description: 'Filter by provider type' },
        limit:     { type: 'integer', description: 'Max results (default: 10)' },
      },
    },
  },
  {
    name: 'get_emergency_providers',
    description:
      'Get all healthcare providers offering emergency care or open 24/7. ' +
      'Includes hospitals, clinics with emergency flag, and providers open around the clock.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'User latitude — results sorted by distance if provided' },
        lng: { type: 'number', description: 'User longitude' },
      },
    },
  },
  {
    name: 'get_pharmacy_on_duty',
    description:
      'Get pharmacies currently on night duty (garde). ' +
      'These are open outside normal hours. Sorted by distance if coordinates provided.',
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'User latitude' },
        lng: { type: 'number', description: 'User longitude' },
      },
    },
  },
  {
    name: 'find_blood_donors',
    description:
      'Find active blood donation requests in Sidi Bel Abbès. ' +
      'Filter by blood type needed. Results sorted by urgency then distance.',
    inputSchema: {
      type: 'object',
      properties: {
        blood_type: { type: 'string', description: 'Blood type: A+, A-, B+, B-, AB+, AB-, O+, O-' },
        lat:        { type: 'number', description: 'User latitude for distance sorting' },
        lng:        { type: 'number', description: 'User longitude for distance sorting' },
      },
    },
  },
  {
    name: 'get_provider_details',
    description:
      'Get full details of a specific provider including their weekly schedule (opening hours). ' +
      'Use the provider id from search results.',
    inputSchema: {
      type: 'object',
      required: ['provider_id'],
      properties: {
        provider_id: { type: 'string', description: 'Provider ID (text, from search results)' },
      },
    },
  },
];

// ════════════════════════════════════════════════
// TOOL EXECUTION — reads from your real live tables
// ════════════════════════════════════════════════

async function executeTool(name, args, context) {
  const t0 = Date.now();
  const { apiKey, clientType, requestIp } = context;

  // ── Rate limit check ──
  if (apiKey) {
    const allowed = await checkAndIncrementRateLimit(apiKey.id, apiKey.rate_limit_per_day, name);
    if (!allowed) {
      logMCP({ clientType, apiKeyId: apiKey.id, toolName: name, inputParams: args, status: 'rate_limited', responseMs: 0 });
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(
            formatErrorPayload(
              'rate_limit_exceeded',
              `Daily limit of ${apiKey.rate_limit_per_day} requests reached. Visit cityhealth-dz.lovable.app for direct access.`,
              name
            )
          ),
        }],
        isError: true,
      };
    }
  } else if (!checkAnonymousRateLimit(requestIp ?? 'unknown')) {
    logMCP({ clientType, apiKeyId: null, toolName: name, inputParams: args, status: 'rate_limited', responseMs: 0 });
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(
          formatErrorPayload(
            'rate_limit_exceeded',
            `Anonymous limit of ${ANON_RATE_LIMIT_PER_MIN} requests/min reached.`,
            name
          )
        ),
      }],
      isError: true,
    };
  }

  try {
    let result;

    // ────────────────────────────────────────────
    // TOOL: search_providers
    // Table: providers_public
    // Columns: id, name, type, specialty, address, city, area,
    //          phone, lat, lng, is_verified, is_24h, is_open,
    //          night_duty, is_emergency, rating, reviews_count,
    //          description, image_url, languages, created_at
    // ────────────────────────────────────────────
    if (name === 'search_providers') {
      let q = supabase
        .from('providers_public')
        .select('id, name, type, specialty, address, city, area, phone, lat, lng, is_verified, is_24h, is_open, night_duty, is_emergency, rating, reviews_count, image_url');

      if (args.verified_only !== false) q = q.eq('is_verified', true);
      if (args.city)      q = q.ilike('city', `%${args.city}%`);
      if (args.type)      q = q.eq('type', args.type);
      if (args.specialty) q = q.ilike('specialty', `%${args.specialty}%`);
      if (args.query) {
        // Uses existing GIN index: idx_providers_public_search
        q = q.textSearch(
          'name,specialty,address,city',
          args.query,
          { type: 'websearch', config: 'french' }
        );
      }

      q = q.order('rating', { ascending: false })
           .limit(Math.min(args.limit ?? 10, 20));

      const { data, error } = await q.abortSignal(AbortSignal.timeout(5000));
      if (error) throw error;

      let rows = data ?? [];

      // Sort by distance client-side if GPS provided
      if (args.user_lat != null && args.user_lng != null) {
        rows = rows
          .map(r => ({
            ...r,
            distance_km: r.lat != null && r.lng != null
              ? +haversineKm(args.user_lat, args.user_lng, r.lat, r.lng).toFixed(2)
              : null,
          }))
          .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
      }

      result = rows;
    }

    // ────────────────────────────────────────────
    // TOOL: find_nearby_providers
    // Bounding-box pre-filter in SQL, exact Haversine in JS
    // ────────────────────────────────────────────
    else if (name === 'find_nearby_providers') {
      const R = Math.min(args.radius_km ?? 5, 30);
      const latD = R / 111;
      const lngD = R / (111 * Math.cos((args.lat * Math.PI) / 180));

      let q = supabase
        .from('providers_public')
        .select('id, name, type, specialty, address, city, area, phone, lat, lng, is_verified, is_24h, is_open, night_duty, is_emergency, rating, reviews_count, image_url')
        .eq('is_verified', true)
        .gte('lat', args.lat - latD).lte('lat', args.lat + latD)
        .gte('lng', args.lng - lngD).lte('lng', args.lng + lngD);

      if (args.type) q = q.eq('type', args.type);

      const { data, error } = await q.limit(150).abortSignal(AbortSignal.timeout(5000));
      if (error) throw error;

      result = (data ?? [])
        .map(r => ({
          ...r,
          distance_km: r.lat != null && r.lng != null
            ? +haversineKm(args.lat, args.lng, r.lat, r.lng).toFixed(2)
            : null,
        }))
        .filter(r => r.distance_km != null && r.distance_km <= R)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, args.limit ?? 10);
    }

    // ────────────────────────────────────────────
    // TOOL: get_emergency_providers
    // Filters: is_emergency = true OR is_24h = true
    // Uses: idx_providers_public_emergency + idx_providers_public_is_24h
    // ────────────────────────────────────────────
    else if (name === 'get_emergency_providers') {
      const { data, error } = await supabase
        .from('providers_public')
        .select('id, name, type, specialty, address, city, area, phone, lat, lng, is_verified, is_24h, is_open, night_duty, is_emergency, rating, image_url')
        .eq('is_verified', true)
        .or('is_emergency.eq.true,is_24h.eq.true')
        .order('rating', { ascending: false })
        .limit(20)
        .abortSignal(AbortSignal.timeout(5000));

      if (error) throw error;
      let rows = data ?? [];

      if (args.lat != null && args.lng != null) {
        rows = rows
          .map(r => ({
            ...r,
            distance_km: r.lat != null && r.lng != null
              ? +haversineKm(args.lat, args.lng, r.lat, r.lng).toFixed(2)
              : null,
          }))
          .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
      }

      result = rows;
    }

    // ────────────────────────────────────────────
    // TOOL: get_pharmacy_on_duty
    // Filter: type = 'pharmacy' AND night_duty = true
    // Column night_duty exists on providers_public ✓
    // ────────────────────────────────────────────
    else if (name === 'get_pharmacy_on_duty') {
      const { data, error } = await supabase
        .from('providers_public')
        .select('id, name, type, specialty, address, city, area, phone, lat, lng, is_verified, is_24h, is_open, night_duty, rating, image_url')
        .eq('is_verified', true)
        .eq('type', 'pharmacy')
        .eq('night_duty', true)
        .order('rating', { ascending: false })
        .limit(15)
        .abortSignal(AbortSignal.timeout(5000));

      if (error) throw error;
      let rows = data ?? [];

      if (args.lat != null && args.lng != null) {
        rows = rows
          .map(r => ({
            ...r,
            distance_km: r.lat != null && r.lng != null
              ? +haversineKm(args.lat, args.lng, r.lat, r.lng).toFixed(2)
              : null,
          }))
          .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
      }

      result = rows;
    }

    // ────────────────────────────────────────────
    // TOOL: find_blood_donors
    // Table: blood_emergencies (real table, not providers_public)
    // Columns: id, provider_id, provider_name, provider_lat, provider_lng,
    //          blood_type_needed, urgency_level, status, responders_count, message
    // Uses: idx_blood_type_status (index from migration)
    // ────────────────────────────────────────────
    else if (name === 'find_blood_donors') {
      let q = supabase
        .from('blood_emergencies')
        .select('id, provider_id, provider_name, provider_lat, provider_lng, blood_type_needed, urgency_level, status, responders_count, message, created_at')
        .eq('status', 'active');

      if (args.blood_type) q = q.eq('blood_type_needed', args.blood_type);

      const { data, error } = await q
        .order('urgency_level', { ascending: true })
        .limit(20)
        .abortSignal(AbortSignal.timeout(5000));

      if (error) throw error;

      const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };

      let rows = (data ?? []).sort(
        (a, b) => (urgencyOrder[a.urgency_level] ?? 9) - (urgencyOrder[b.urgency_level] ?? 9)
      );

      if (args.lat != null && args.lng != null) {
        rows = rows.map(r => ({
          ...r,
          distance_km: r.provider_lat != null && r.provider_lng != null
            ? +haversineKm(args.lat, args.lng, r.provider_lat, r.provider_lng).toFixed(2)
            : null,
        }));
      }

      result = rows;
    }

    // ────────────────────────────────────────────
    // TOOL: get_provider_details
    // Joins providers_public + schedules table
    // schedules columns: day_of_week, start_time, end_time, is_active
    // ────────────────────────────────────────────
    else if (name === 'get_provider_details') {
      const [providerRes, schedulesRes] = await Promise.all([
        supabase
          .from('providers_public')
          .select('*')
          .eq('id', args.provider_id)
          .single()
          .abortSignal(AbortSignal.timeout(5000)),
        supabase
          .from('schedules')
          .select('day_of_week, start_time, end_time, is_active')
          .eq('provider_id', args.provider_id)
          .eq('is_active', true)
          .order('day_of_week')
          .abortSignal(AbortSignal.timeout(5000)),
      ]);

      if (providerRes.error) throw providerRes.error;

      const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

      result = {
        ...providerRes.data,
        opening_hours: (schedulesRes.data ?? []).map(s => ({
          day: DAY_NAMES[s.day_of_week],
          day_index: s.day_of_week,
          opens: s.start_time,
          closes: s.end_time,
        })),
      };
    }

    else {
      throw new Error(`Unknown tool: ${name}`);
    }

    // ── Log success to mcp_registry ──
    const responseMs = Date.now() - t0;
    logMCP({
      clientType,
      apiKeyId: apiKey?.id ?? null,
      toolName: name,
      inputParams: {
        // Only safe, non-personal params
        city: args.city, type: args.type, specialty: args.specialty,
        blood_type: args.blood_type, radius_km: args.radius_km,
        has_coords: args.lat != null || args.user_lat != null,
        limit: args.limit,
      },
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      responseMs,
      status: 'ok',
    });

    return {
      content: [{ type: 'text', text: JSON.stringify(formatSuccessPayload(name, args, result), null, 2) }],
    };

  } catch (err) {
    const responseMs = Date.now() - t0;
    logMCP({ clientType, apiKeyId: apiKey?.id ?? null, toolName: name, inputParams: args, status: 'error', errorMessage: err.message, responseMs });
    return {
      content: [{ type: 'text', text: JSON.stringify(formatErrorPayload('internal_error', err.message, name)) }],
      isError: true,
    };
  }
}

// ════════════════════════════════════════════════
// MCP SERVER — for Claude
// ════════════════════════════════════════════════

function createMcpServer() {
  const server = new Server(
    { name: 'cityhealth', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    const args = { ...(request.params.arguments ?? {}) };
    const requestIp = args.__request_ip ?? 'unknown';
    const rawKey = extra?.headers?.['x-api-key'] || args.__api_key || process.env.MCP_API_KEY;
    if (!rawKey && MCP_REQUIRE_API_KEY) {
      return {
        content: [{ type: 'text', text: JSON.stringify(formatErrorPayload('auth_required', 'x-api-key header or MCP_API_KEY env var is required for MCP', request.params.name)) }],
        isError: true,
      };
    }
    let apiKey = null;
    if (rawKey) {
      apiKey = await validateApiKey(rawKey);
    }
    if (rawKey && !apiKey) {
      return {
        content: [{ type: 'text', text: JSON.stringify(formatErrorPayload('invalid_key', 'Invalid or disabled API key', request.params.name)) }],
        isError: true,
      };
    }
    // Detect client from User-Agent header
    const ua = extra?.headers?.['user-agent'] ?? '';
    const clientType = ua.toLowerCase().includes('claude') ? 'claude' : 'chatgpt';
    delete args.__api_key;
    delete args.__request_ip;

    // 8s Soft limit for MCP execution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(new Error('Tool execution timeout (8s)')), 8000);
    try {
      const result = await Promise.race([
        executeTool(request.params.name, args, { apiKey, clientType, requestIp }),
        new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason)))
      ]);
      clearTimeout(timeoutId);
      return result;
    } catch (err) {
      clearTimeout(timeoutId);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(
            formatErrorPayload(
              err.message === 'Tool execution timeout (8s)' ? 'timeout' : 'internal_error',
              err.message,
              request.params.name
            )
          ),
        }],
        isError: true,
      };
    }
  });

  return server;
}
// ════════════════════════════════════════════════
// SERVER STARTUP (Dual Mode)
// ════════════════════════════════════════════════

const isStdio = process.argv.includes('--stdio');

if (isStdio) {
  const mcpServer = createMcpServer();
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info({ mode: 'stdio' }, 'CityHealth MCP server running on stdio');
} else {
  // ════════════════════════════════════════════════
  // EXPRESS — REST endpoints & HTTP MCP
  // ════════════════════════════════════════════════

  const app = express();
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*';
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json());

  // 10s Request timeout middleware
  app.use((req, res, next) => {
    req.setTimeout(10000, () => {
      if (!res.headersSent) {
        res.status(504).json({ error: 'timeout', message: 'Request timeout (10s)' });
      }
    });
    next();
  });

  // Health check (liveness)
  app.get('/health', (_, res) => res.json({ status: 'ok', service: 'cityhealth-mcp', version: '1.0.0' }));

  // Ready check (readiness - hits Supabase)
  app.get('/ready', async (_, res) => {
    try {
      const { data, error } = await supabase.from('providers_public').select('id').limit(1).abortSignal(AbortSignal.timeout(5000));
      if (error) throw error;
      res.json({ status: 'ok', db: 'connected' });
    } catch (err) {
      logger.error({ error: err.message }, 'Readiness check failed');
      res.status(503).json({ status: 'error', db: 'disconnected' });
    }
  });

  app.use(express.static(process.cwd()));

  // OpenAPI spec — required by ChatGPT GPT Store and Claude OpenAPI integrations
  app.get('/openapi.json', (_, res) => {
    const publicUrl = process.env.RAILWAY_PUBLIC_URL ?? 'https://cityhealth-mcp.railway.app';
    res.json({
      openapi: '3.1.0',
      info: {
        title: 'CityHealth',
        version: '1.0.0',
        description: 'Healthcare providers in Sidi Bel Abbès, Algeria. Search doctors, pharmacies, emergencies, and blood donation requests.\n\n**Quick Links:**\n* [Providers Map](https://cityhealthdz.com/map/providers)\n* [Emergency Map](https://cityhealthdz.com/map/emergency)\n* [Blood Map](https://cityhealthdz.com/map/blood)\n* [Search](https://cityhealthdz.com/search)',
        contact: {
          name: 'CityHealth Support',
          email: 'contact@cityhealthdz.com',
          url: 'https://cityhealthdz.com'
        },
        'x-logo': {
          url: `${publicUrl}/bird%20logo.png`
        }
      },
      servers: [{ url: publicUrl }],
      paths: Object.fromEntries(
        TOOLS.map(tool => [
          `/${tool.name}`,
          {
            post: {
              operationId: tool.name,
              summary: tool.description.split('.')[0],
              requestBody: { required: true, content: { 'application/json': { schema: tool.inputSchema } } },
              responses: { 200: { description: 'Successful response' }, 429: { description: 'Rate limit exceeded' } },
            },
          },
        ])
      ),
      components: {
        securitySchemes: {
          apiKey: { type: 'apiKey', in: 'header', name: 'x-api-key' },
        },
      },
      security: [{ apiKey: [] }],
    });
  });

// REST endpoints — one per tool (for ChatGPT Actions)
for (const tool of TOOLS) {
  app.post(`/${tool.name}`, async (req, res) => {
    const rawKey = req.headers['x-api-key'];
    if (!rawKey) return res.status(401).json({ error: 'Missing x-api-key header' });

    const apiKey = await validateApiKey(rawKey);
    if (!apiKey) return res.status(401).json({ error: 'Invalid or disabled API key' });

    const result = await executeTool(tool.name, req.body, { apiKey, clientType: 'chatgpt' });

    if (result.isError) {
      const body = JSON.parse(result.content[0].text);
      const status = body?.response?.error === 'rate_limit_exceeded' ? 429 : 500;
      return res.status(status).json(body);
    }

    res.json(JSON.parse(result.content[0].text));
  });
}

  // MCP over HTTP (Streamable) — primary endpoint for Cursor/Claude integrations
  app.post('/mcp', async (req, res) => {
    let mcpServer;
    let transport;
    try {
      // Keep compatibility with clients that omit MCP Accept headers.
      if (!req.headers.accept) {
        req.headers.accept = 'application/json, text/event-stream';
      }
      if (
        req.body?.method === 'tools/call' &&
        req.body?.params
      ) {
        const safeArgs = { ...(req.body.params.arguments ?? {}) };
        if (req.headers['x-api-key']) {
          safeArgs.__api_key = req.headers['x-api-key'];
        }
        safeArgs.__request_ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown')
          .split(',')[0]
          .trim();
        req.body.params.arguments = safeArgs;
      }
      mcpServer = createMcpServer();
      transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      logger.error({ error: err.message }, 'MCP /mcp request failed');
      if (!res.headersSent) {
        res.status(500).json({ error: 'internal_error', message: err.message });
      }
    } finally {
      try {
        await transport?.close?.();
      } catch {}
      try {
        await mcpServer?.close?.();
      } catch {}
    }
  });

  // MCP over HTTP (SSE) — optional compatibility endpoint
  const sseTransports = new Map();

  app.get('/mcp/sse', async (req, res) => {
    const apiKeyRaw = req.query.api_key || req.headers['x-api-key'];

    const sseMcpServer = createMcpServer();
    const baseUrl = process.env.RAILWAY_PUBLIC_URL || `https://${req.get('host')}`;
    const messageUrl = new URL('/mcp/message', baseUrl).href;
    const sseTransport = new SSEServerTransport(messageUrl, res);
    
    await sseMcpServer.connect(sseTransport);
    sseTransports.set(sseTransport.sessionId, { transport: sseTransport, apiKey: apiKeyRaw });
    
    res.on('close', () => {
      sseTransports.delete(sseTransport.sessionId);
      sseMcpServer.close().catch(() => {});
    });
    
    logger.info({ event: 'mcp_sse_connect', sessionId: sseTransport.sessionId }, 'Client connected to SSE');
  });

  app.post('/mcp/message', async (req, res) => {
    const sessionId = req.query.sessionId;
    const sessionData = sseTransports.get(sessionId);
    if (sessionData) {
      if (req.body?.method === 'tools/call' && req.body?.params) {
        req.body.params.arguments = req.body.params.arguments || {};
        
        const key = req.headers['x-api-key'] || sessionData.apiKey;
        if (key) {
          req.body.params.arguments.__api_key = key;
        }
        
        req.body.params.arguments.__request_ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown')
          .split(',')[0]
          .trim();
      }
      await sessionData.transport.handlePostMessage(req, res);
    } else {
      res.status(404).send('Session not found');
    }
  });

  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    logger.info({ mode: 'http', port: PORT }, `CityHealth MCP server running`);
    logger.info({ url: `${process.env.RAILWAY_PUBLIC_URL ?? `http://localhost:${PORT}`}/openapi.json` }, `OpenAPI spec`);
  });
}
