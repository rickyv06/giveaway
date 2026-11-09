/* v1p motion + haptics — vanilla, feature-detect, reduced-motion aware */
(function(){
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(_){}

  // —— haptics (Android; silent where unsupported) ——
  function haptic(pattern){
    try {
      if (reduce) return;
      if (!(navigator.vibrate instanceof Function)) return;
      navigator.vibrate(pattern);
    } catch(_){}
  }
  window.v1pHaptic = {
    tap: function(){ haptic(12); },
    select: function(){ haptic(14); },
    success: function(){ haptic([12, 40, 18, 40, 28]); },
    soft: function(){ haptic(8); }
  };

  // —— scroll reveals ——
  function initReveals(){
    var nodes = document.querySelectorAll('.reveal');
    if (!nodes.length) return;
    if (reduce || !('IntersectionObserver' in window)){
      nodes.forEach(function(n){ n.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach(function(n){ io.observe(n); });
  }

  // —— countdown flip when digits change ——
  function initCountdownFlip(){
    ['cd-d','cd-h','cd-m'].forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      el.classList.add('cd-val');
      var last = el.textContent;
      var obs = new MutationObserver(function(){
        var now = el.textContent;
        if (now === last) return;
        last = now;
        if (reduce) return;
        el.classList.remove('flip');
        void el.offsetWidth;
        el.classList.add('flip');
      });
      obs.observe(el, { characterData: true, childList: true, subtree: true });
    });
  }

  // —— CTA occasional glow + press/haptic ——
  function initCta(){
    var btns = document.querySelectorAll('.btn-primary');
    btns.forEach(function(btn){
      btn.addEventListener('pointerdown', function(){
        btn.classList.add('is-press');
        window.v1pHaptic.tap();
      });
      ['pointerup','pointerleave','pointercancel'].forEach(function(ev){
        btn.addEventListener(ev, function(){ btn.classList.remove('is-press'); });
      });
    });
    if (reduce) return;
    var hero = document.querySelector('#heroCta .btn-primary');
    if (!hero) return;
    function pulse(){
      hero.classList.remove('glow-pulse');
      void hero.offsetWidth;
      hero.classList.add('glow-pulse');
    }
    setTimeout(pulse, 1800);
    setInterval(pulse, 9000);
  }

  // —— form option / nav haptics (delegated) ——
  function initFormFeel(){
    var form = document.getElementById('entryForm');
    if (!form) return;
    form.addEventListener('pointerdown', function(e){
      var opt = e.target.closest('.opt');
      if (opt){
        opt.classList.add('is-press');
        window.v1pHaptic.select();
        setTimeout(function(){ opt.classList.remove('is-press'); }, 160);
        return;
      }
      if (e.target.closest('[data-next], #submitBtn, .back')){
        window.v1pHaptic.tap();
      }
    });
  }

  // —— thanks confetti + success haptic ——
  function initThanks(){
    if (!document.querySelector('.ty .burst')) return;
    window.v1pHaptic.success();
    if (reduce) return;
    var layer = document.createElement('div');
    layer.className = 'confetti';
    layer.setAttribute('aria-hidden','true');
    var colors = ['#C8102E','#1F4A36','#C4A35A','#E01E3C','#2F6B4F','#F4C430'];
    var n = 28;
    for (var i=0;i<n;i++){
      var bit = document.createElement('i');
      var left = Math.random()*100;
      var delay = Math.random()*0.35;
      var dur = 1.05 + Math.random()*0.55;
      var x = (Math.random()*160 - 80) + 'px';
      var r = (180 + Math.random()*280) + 'deg';
      bit.style.left = left + '%';
      bit.style.background = colors[i % colors.length];
      bit.style.animationDelay = delay + 's';
      bit.style.animationDuration = dur + 's';
      bit.style.setProperty('--x', x);
      bit.style.setProperty('--r', r);
      bit.style.width = (6 + Math.random()*6) + 'px';
      bit.style.height = (6 + Math.random()*8) + 'px';
      layer.appendChild(bit);
    }
    document.body.appendChild(layer);
    setTimeout(function(){ layer.remove(); }, 2200);
  }

  function boot(){
    // hero-kick: above-fold reveals after first paint
    requestAnimationFrame(function(){
      document.querySelectorAll('.hero .reveal').forEach(function(n,i){
        setTimeout(function(){ n.classList.add('in'); }, reduce ? 0 : 60 + i*50);
      });
    });
    initReveals();
    initCountdownFlip();
    initCta();
    initFormFeel();
    initThanks();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
