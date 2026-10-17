import test from 'node:test';
import assert from 'node:assert/strict';
import {createContactHandler,validate} from './contact.js';
import {createApp} from './app.js';
import {validateContact,sendContact,contactSuccess} from '../src/lib/contactValidation.ts';
const valid={name:'Visitor',email:'visitor@example.com',subject:'Opportunity',message:'Let us discuss a backend project.'};
const response=()=>({code:200,status(n){this.code=n;return this},json(data){this.data=data;return this}});
test('rejects invalid, oversized and header-injection input',()=>{for(const data of [{},{...valid,email:'invalid'},{...valid,name:'x\r\nBcc: x@y.com'},{...valid,message:'x'.repeat(5001)}])assert.ok(validate(data).error)});
test('fixed recipient, verified sender, visitor replyTo, timestamp',async()=>{let mail;const handler=createContactHandler({env:{CONTACT_FROM_EMAIL:'verified@example.com'},transport:{sendMail:async value=>{mail=value;return {accepted:[value.to]}}}});const res=response();await handler({ip:'one',body:{...valid,to:'attacker@example.com'}},res);assert.equal(res.code,200);assert.equal(res.data.accepted,true);assert.equal(mail.to,'bhattacharyyasukanya5@gmail.com');assert.equal(mail.from,'verified@example.com');assert.equal(mail.replyTo.address,valid.email);assert.match(mail.text,/Submitted:/)});
test('honeypot suppresses delivery without claiming acceptance; rate limit applies',async()=>{let sent=0;const handler=createContactHandler({transport:{sendMail:async()=>sent++}});for(let i=0;i<6;i++){const res=response();await handler({ip:'spam',body:{...valid,website:'spam'}},res);if(i===5)assert.equal(res.code,429);else{assert.equal(res.code,202);assert.equal(res.data.accepted,false)}}assert.equal(sent,0)});
test('missing SMTP and delivery failure return honest errors',async()=>{let res=response();await createContactHandler({env:{}})({body:valid},res);assert.equal(res.code,503);res=response();await createContactHandler({transport:{sendMail:async()=>{throw Error('failure')}}})({body:valid},res);assert.equal(res.code,502)});

test('provider recipient rejection cannot produce success',async()=>{const res=response();await createContactHandler({transport:{sendMail:async()=>({accepted:[],rejected:['recipient']})}})({body:valid},res);assert.equal(res.code,502);assert.notEqual(res.data.accepted,true)});

test('client validation covers required fields, email, bounds and single-line headers',()=>{
  assert.deepEqual(validateContact(valid),{});
  assert.equal(Object.keys(validateContact({name:' ',email:'',subject:'',message:''})).length,4);
  assert.ok(validateContact({...valid,email:'not-an-email'}).email);
  assert.ok(validateContact({...valid,message:'short'}).message);
  assert.ok(validateContact({...valid,message:'x'.repeat(5001)}).message);
  assert.ok(validateContact({...valid,subject:'Header\nInjection'}).subject);
  assert.deepEqual(validateContact({...valid,message:'x'.repeat(10)}),{});
  assert.deepEqual(validateContact({...valid,message:'x'.repeat(5000)}),{});
});

test('client submission stays pending until explicit backend acceptance',async()=>{
  let release;const gate=new Promise(resolve=>{release=resolve});let complete=false;
  const pending=sendContact(valid,'',async(url,options)=>{assert.equal(url,'/api/contact');assert.equal(options.method,'POST');assert.ok(options.signal);assert.equal(JSON.parse(options.body).email,valid.email);await gate;return Response.json({accepted:true})}).then(()=>{complete=true});
  await Promise.resolve();assert.equal(complete,false);release();await pending;assert.equal(complete,true);
  assert.equal(contactSuccess,"Thank you for reaching out! Your message has been submitted successfully. I'll get back to you as soon as possible.");
});

test('client rejects failed, blocked, malformed and offline submissions; retry can succeed',async()=>{
  for(const result of [Response.json({error:'Email delivery is not configured.'},{status:503}),Response.json({accepted:false},{status:202}),Response.json({}),Response.json(null),new Response('not JSON')])await assert.rejects(sendContact(valid,'',async()=>result));
  await assert.rejects(sendContact(valid,'',async()=>{throw Error('offline')}),/Unable to confirm delivery/);
  await sendContact(valid,'',async()=>Response.json({accepted:true}));
});

test('HTTP endpoint validates, accepts mocked email, rejects body injection and limits JSON',async()=>{
  let mail;const app=createApp({env:{CONTACT_FROM_EMAIL:'verified@example.com'},transport:{sendMail:async value=>{mail=value;return {accepted:[value.to]}}}});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=body=>fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    const invalid=await post({});assert.equal(invalid.status,400);
    const accepted=await post({...valid,to:'attacker@example.com'});assert.equal(accepted.status,200);assert.equal((await accepted.json()).accepted,true);assert.equal(mail.to,'bhattacharyyasukanya5@gmail.com');assert.ok(accepted.headers.get('content-security-policy'));
    const malformed=await fetch(base+'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:'{bad'});assert.equal(malformed.status,400);
    const oversized=await post({...valid,message:'x'.repeat(17000)});assert.equal(oversized.status,413);
  }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
});
