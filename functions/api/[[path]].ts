import { Env, HttpError, Row, assert, body, csrf, ipAddress, json, randomToken, rateLimit, securityHeaders } from '../../server/core';
import { auth, cookie, identify, staff, admin } from '../../server/auth';
import { Query, runQuery } from '../../server/database';
import { checkout } from '../../server/checkout';
import { storage } from '../../server/storage';
import { rpc } from '../../server/rpc';
import { guardDynamicRequest } from '../../server/requestGuard';
import { handle as facebook } from '../../server/integrations/fb-conversions-api';
import { handle as tiktok } from '../../server/integrations/tiktok-events-api';
import { handle as courier } from '../../server/integrations/send-to-courier';
import { handle as ratio } from '../../server/integrations/check-courier-ratio';

const integrationHandlers: Record<string, (request: Request, env: Env) => Promise<Response>> = {
  'fb-conversions-api': facebook,
  'tiktok-events-api': tiktok,
  'send-to-courier': courier,
  'check-courier-ratio': ratio,
};

const mediaWidths = ['', '384', '960', '1600'];
function mediaCacheKey(request: Request, path: string[], width = '') {
  const url = new URL(request.url);
  url.pathname = '/api/' + path.map(encodeURIComponent).join('/');
  url.search = '';
  url.searchParams.set('cache', '2');
  if (width) url.searchParams.set('width', width);
  return new Request(url, { method: 'GET' });
}

export const onRequest: PagesFunction<Env> = async ({request,env,waitUntil}) => {
  try {
    const path=new URL(request.url).pathname.slice(5).split('/').map(decodeURIComponent);
    if(!['GET','HEAD'].includes(request.method)) csrf(request);
    if(path[0]==='media'&&['GET','HEAD'].includes(request.method)) {
      // Only public, complete media responses enter the edge cache. Never cache auth or database responses.
      const cacheable=request.method==='GET'&&!request.headers.has('range')&&!request.headers.has('if-none-match');
      const cache=(caches as CacheStorage & {default:Cache}).default;
      const width = new URL(request.url).searchParams.get('width') ?? '';
      const key = mediaCacheKey(request, path, mediaWidths.includes(width) ? width : '');
      if(cacheable){const hit=await cache.match(key);if(hit)return hit;}
      const media=await storage(request,env,path.slice(1),null);
      if(cacheable&&media.status===200)waitUntil(cache.put(key,media.clone()).catch(()=>{}));
      return media;
    }
    assert(['media','database','checkout','auth','rpc','functions'].includes(path[0]),'Unknown API route',404);
    if(['database','checkout'].includes(path[0]))assert(path.length===1,'Unknown API route',404);
    if(['auth','rpc','functions'].includes(path[0]))assert(path.length===2,'Unknown API route',404);
    if (path[0] === 'auth') assert(request.method === (path[1] === 'session' ? 'GET' : 'POST'), 'Method not allowed', 405);
    else if (path[0] === 'media') assert(['PUT','DELETE'].includes(request.method), 'Method not allowed', 405);
    else assert(request.method === 'POST', 'Method not allowed', 405);
    if (path[0] === 'functions' && path[1] !== 'get-client-ip') {
      assert(Object.prototype.hasOwnProperty.call(integrationHandlers, path[1]), 'Unknown function', 404);
    }
    const blocked = guardDynamicRequest(request);
    if (blocked) return blocked;
    const user=await identify(request,env);
    let response:Response;
    if(path[0]==='media') {
      response=await storage(request,env,path.slice(1),user);
      if (request.method === 'DELETE' && response.ok) {
        const cache = (caches as CacheStorage & {default:Cache}).default;
        await Promise.allSettled(mediaWidths.map(width => cache.delete(mediaCacheKey(request, path, width))));
      }
    }
    else if(path[0]==='auth') {
      response=await auth(request,env,path[1],request.method==='POST'?await body(request,admin(user)?1024*1024:64*1024):{},user);
    } else {
      const input=await body(request,admin(user)?1024*1024:64*1024);
      if(path[0]==='database') response=json(await runQuery(env,input as unknown as Query,user,request));
      else if(path[0]==='checkout') response=await checkout(env,request,input,user);
      else if(path[0]==='rpc'&&path[1]) response=json({data:await rpc(env,request,path[1],input,user),error:null});
      else if(path[0]==='functions'&&path[1]) {
        const name=path[1];
        await rateLimit(env,'function:'+name+':'+ipAddress(request),120,60);
        if(name==='get-client-ip')response=json({ip:ipAddress(request)});
        else {
          if(['send-to-courier','check-courier-ratio'].includes(name))assert(staff(user),'Staff access required',403);
          if(['fb-conversions-api','tiktok-events-api'].includes(name)) {
            assert(typeof input.event_name==='string'&&input.event_name.length<=100,'Event name required');
            if(/cancel|refund/i.test(input.event_name))assert(staff(user),'Staff access required',403);
            if(input.test_only===true) {
              assert(admin(user),'Admin access required',403);
              input.event_name='PageView';
              input.event_id=randomToken();
              input.event_source_url=new URL('/',request.url).href;
              input.user_data={client_user_agent:request.headers.get('user-agent')||undefined};
              input.custom_data={};
            }
            const data=(input.user_data||{}) as Row;
            if(!staff(user))delete data.client_ip_address;
            input.user_data=data;
          }
          response=await integrationHandlers[name](new Request(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(input)}),env);
          if(!response.ok)response=json({error:{message:'Integration is unavailable or not configured'}},response.status);
        }
      } else throw new HttpError(404,'Unknown API route');
    }
    if(!cookie(request,'__Host-shop_guest')&&!response.headers.get('Set-Cookie')?.includes('__Host-shop_guest=')){
      response.headers.append('Set-Cookie',`__Host-shop_guest=${randomToken()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
    }
    for(const [name,value] of Object.entries(securityHeaders))response.headers.set(name,value);
    return response;
  } catch(error) {
    const conflict=error instanceof Error&&error.message.includes('UNIQUE constraint failed');
    const constraint=error instanceof Error&&/constraint|foreign key|unique/i.test(error.message);
    const status=error instanceof HttpError?error.status:constraint?409:500;
    return json({data:null,error:{code:conflict?'CONFLICT':undefined,message:error instanceof HttpError?error.message:'Operation could not be completed. Check the supplied data and try again.'}},status);
  }
};
