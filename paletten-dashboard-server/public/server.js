import http from 'node:http';
import { Pool } from 'pg';
import { readFile } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';
import { validateSnapshot, bearerToken } from './validation.js';

const { DATABASE_URL, API_TEST_TOKEN, ALLOWED_ORIGIN } = process.env;
if (!DATABASE_URL || !API_TEST_TOKEN || API_TEST_TOKEN.length < 32 || !ALLOWED_ORIGIN || !/^https:\/\//.test(ALLOWED_ORIGIN)) {
  console.error('Missing DATABASE_URL, API_TEST_TOKEN (32+ characters), or HTTPS ALLOWED_ORIGIN');
  process.exit(1);
}
const pool = new Pool({ connectionString: DATABASE_URL, max: 5, connectionTimeoutMillis: 10000 });
const schema = await readFile(new URL('../sql/001_init.sql', import.meta.url), 'utf8');
await pool.query(schema);
const port = Number(process.env.PORT || 10000);
function json(res, status, body, headers={}) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store',...headers});
  res.end(JSON.stringify(body));
}
function tokenValid(header) {
  const supplied = Buffer.from(bearerToken(header));
  const expected = Buffer.from(API_TEST_TOKEN);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
const server = http.createServer(async (req,res)=>{
  const origin=req.headers.origin;
  if(origin && origin !== ALLOWED_ORIGIN) return json(res,403,{error:'Origin not allowed'});
  const cors = origin === ALLOWED_ORIGIN ? {'access-control-allow-origin':ALLOWED_ORIGIN,'vary':'Origin','access-control-allow-headers':'Authorization, Content-Type','access-control-allow-methods':'GET, PUT, OPTIONS'} : {};
  if(req.method==='OPTIONS') {res.writeHead(204,cors);return res.end();}
  if(req.url==='/health' && req.method==='GET') {
    try {await pool.query('SELECT 1');return json(res,200,{status:'ok',database:'connected'},cors);}
    catch {return json(res,503,{status:'unavailable'},cors);}
  }
  if(req.url!=='/api/state' || !['GET','PUT'].includes(req.method)) return json(res,404,{error:'Not found'},cors);
  if(!tokenValid(req.headers.authorization)) return json(res,401,{error:'Unauthorized'},cors);
  try {
    if(req.method==='GET') {
      const {rows}=await pool.query('SELECT revision,payload FROM dashboard_state WHERE id=1');
      return json(res,200,{revision:Number(rows[0].revision),state:rows[0].payload},cors);
    }
    let raw='';
    for await (const chunk of req) {
      raw+=chunk.toString();
      if(Buffer.byteLength(raw)>2_000_000) return json(res,413,{error:'Snapshot exceeds 2MB'},cors);
    }
    let input;
    try {input=JSON.parse(raw);} catch {return json(res,400,{error:'Invalid JSON'},cors);}
    const invalid=validateSnapshot(input);
    if(invalid) return json(res,400,{error:invalid},cors);
    const result=await pool.query(
      'UPDATE dashboard_state SET payload=$1::jsonb, revision=revision+1, updated_at=now() WHERE id=1 AND revision=$2 RETURNING revision',
      [JSON.stringify(input.state),input.revision]
    );
    if(!result.rowCount) return json(res,409,{error:'Revision conflict: reload and retry; do not overwrite concurrent changes'},cors);
    return json(res,200,{revision:Number(result.rows[0].revision)},cors);
  } catch (error) {
    console.error('Request failed:',error.message);
    return json(res,500,{error:'Server error'},cors);
  }
});
server.listen(port,'0.0.0.0',()=>console.log(`Test backend listening on ${port}`));
process.on('SIGTERM',()=>server.close(()=>pool.end()));
