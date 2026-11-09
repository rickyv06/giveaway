/* Stellar giveaway entry form. Posts to a Zapier Catch Hook, which upserts the contact in GHL. */
(function(){
  // ===== CONFIG =====
  var GHL_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/14885064/RXoZSKbECZDlm8HZ/';
  var ENTRY_DEADLINE  = '2026-12-01T05:59:00Z'; // Nov 30, 2026 11:59 PM CT
  var CAMPAIGN        = 'Ultimate Home Buying Package Giveaway 2026';
  var TAGS            = ['giveaway-2026','buyer-lead','fb-ig-ad'];
  var CONSENT_TEXT    = 'I agree to receive calls and text messages, including automated and marketing messages, from Ricardo Vasquez and Stellar Realty Group (726.200.6226) about this giveaway and real estate services at the number above. Consent is not a condition of entry or purchase. Message frequency varies. Msg and data rates may apply. Reply STOP to opt out, HELP for help.';

  // ===== countdown =====
  function tick(){
    var ms = new Date(ENTRY_DEADLINE) - new Date(); if (ms < 0) ms = 0;
    var d = Math.floor(ms/864e5), h = Math.floor(ms%864e5/36e5), m = Math.floor(ms%36e5/6e4);
    var p = function(n){return (n<10?'0':'')+n};
    var e = document.getElementById('cd-d'); if(!e) return;
    e.textContent = p(d); document.getElementById('cd-h').textContent = p(h); document.getElementById('cd-m').textContent = p(m);
  }
  tick(); setInterval(tick, 1000);

  // ===== sticky CTA managed by page script (past hero CTA + form in view) =====
  // (no-op here to avoid fighting mobile hero sticky logic)

  var form = document.getElementById('entryForm'); if(!form) return;
  var steps = [].slice.call(form.querySelectorAll('.fstep[data-step]')).filter(function(s){return s.dataset.step!=='sending'});
  var N = steps.length, cur = 0, data = {}, busy = false, partialSent = false;
  var bar = document.getElementById('bar'), lbl = document.getElementById('stepLabel'), pct = document.getElementById('stepPct');

  // UTM + click ids
  var qs = new URLSearchParams(location.search);
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid'].forEach(function(k){ if(qs.get(k)) data[k]=qs.get(k); });

  function progress(){
    var p = Math.round(cur / N * 100);
    bar.style.width = Math.max(p, 4) + '%';
    lbl.textContent = 'Question ' + (cur+1) + ' of ' + N;
    pct.textContent = p + '%';
  }
  function show(i, back){
    if (i === cur) return;
    var from = steps[cur], to = steps[i];
    from.classList.remove('active'); from.classList.add('leaving'); if(back) from.classList.add('back'); else from.classList.remove('back');
    setTimeout(function(){
      from.classList.remove('leaving'); from.classList.remove('back');
      to.classList.toggle('back-in', !!back); to.classList.add('active');
      var f = to.querySelector('input:not([type=checkbox]),textarea');
      if (f){ try{ f.focus({preventScroll:true}); }catch(_){ f.focus(); } }
    }, 200);
    cur = i; progress();
    var card = document.getElementById('formCard'), r = card.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight*.4) card.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function err(step, on){ var e = step.querySelector('[data-err]'); if(e){ e.classList.remove('show'); if(on){ void e.offsetWidth; e.classList.add('show'); } } }
  function val(id){ return (form.querySelector('#'+id)||{}).value ? form.querySelector('#'+id).value.trim() : ''; }
  function digits(s){ return (s||'').replace(/\D/g,''); }
  function e164(s){ var d = digits(s); if (d.length===11 && d[0]==='1') d = d.slice(1); return d.length===10 ? '+1'+d : ''; }

  function validate(step){
    var n = +step.dataset.step;
    if (n === 1){ var ok = val('first_name') && val('last_name'); if(ok){data.first_name=val('first_name');data.last_name=val('last_name');} return ok; }
    if (n === 2){ var p = e164(val('phone')); if(p){ data.phone=p; data.sms_consent = form.querySelector('#sms_consent').checked; } return !!p; }
    if (n === 3){ var em = val('email'); var ok3 = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em); if(ok3) data.email=em.toLowerCase(); return ok3; }
    if (step.dataset.field){ return !!data[step.dataset.field]; }
    return true;
  }
  function next(){
    var step = steps[cur];
    if (!validate(step)){ err(step,true); var b=step.querySelector('.fl input'); if(b) b.parentNode.classList.add('bad'); return; }
    err(step,false);
    if (+step.dataset.step === 3 && !partialSent){ partialSent = true; send(payload('partial')); } // save the lead as soon as contact info is in
    if (cur < N-1) show(cur+1);
  }

  // phone mask
  var ph = form.querySelector('#phone');
  if (ph) ph.addEventListener('input', function(){
    var d = digits(ph.value).replace(/^1/,'').slice(0,10), o = d;
    if (d.length>6) o='('+d.slice(0,3)+') '+d.slice(3,6)+' '+d.slice(6); else if (d.length>3) o='('+d.slice(0,3)+') '+d.slice(3); else if(d.length) o='('+d;
    ph.value = o;
  });
  form.addEventListener('input', function(e){ if(e.target.parentNode) e.target.parentNode.classList.remove('bad'); err(steps[cur],false); });

  // option cards: select + auto advance
  form.addEventListener('click', function(e){
    var o = e.target.closest('.opt'); if (o){
      var step = o.closest('.fstep'), field = step.dataset.field;
      step.querySelectorAll('.opt').forEach(function(x){x.classList.remove('sel')}); o.classList.add('sel');
      data[field] = o.dataset.v; err(step,false);
      if (!busy){ busy = true; setTimeout(function(){ busy=false; next(); }, 320); }
      return;
    }
    if (e.target.closest('[data-next]')){ e.preventDefault(); next(); }
    if (e.target.closest('[data-back]')){ e.preventDefault(); if(cur>0) show(cur-1,true); }
  });
  form.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox'){ e.preventDefault(); next(); }
  });

  function payload(stage){
    var p = Object.assign({}, data, {
      full_name: [data.first_name, data.last_name].filter(Boolean).join(' '),
      biggest_obstacle: val('biggest_obstacle'),
      consent_text: data.sms_consent ? CONSENT_TEXT : '',
      consent_timestamp: data.sms_consent ? new Date().toISOString() : '',
      submission_stage: stage,            // "partial" after email, "complete" on submit
      campaign: CAMPAIGN, source: 'Giveaway Landing Page', tags: TAGS.concat(stage==='complete'?['giveaway-entered']:['giveaway-partial']),
      page_url: location.href, user_agent: navigator.userAgent, submitted_at: new Date().toISOString(),
      honeypot: (form.querySelector('[name=company_website]')||{}).value || ''
    });
    return p;
  }
  function send(p){
    if (p.honeypot) return Promise.resolve();
    return fetch(GHL_WEBHOOK_URL, {method:'POST', headers:{'Content-Type':'text/plain;charset=UTF-8'}, body:JSON.stringify(p), keepalive:true})
      .catch(function(){});
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var sending = form.querySelector('[data-step=sending]');
    steps[cur].classList.remove('active'); sending.classList.add('active');
    bar.style.width = '100%'; pct.textContent = '100%'; lbl.textContent = 'All done';
    try{ if(window.v1pHaptic) window.v1pHaptic.success(); }catch(_){}
    var done = function(){ try{ sessionStorage.setItem('giveaway_first', data.first_name||''); }catch(_){}
      location.href = 'thanks.html?n=' + encodeURIComponent(data.first_name||''); };
    Promise.race([send(payload('complete')), new Promise(function(r){setTimeout(r,2500)})]).then(function(){ setTimeout(done, 700); });
  });

  progress();
})();
