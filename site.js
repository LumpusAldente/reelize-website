/* ============ Reelize Website — shared behavior ============ */
(function(){
  'use strict';

  /* mobile nav */
  document.addEventListener('click', function(e){
    var burger = e.target.closest('.burger');
    var nav = document.querySelector('.nav ul');
    if(burger && nav){ var open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', open ? 'true' : 'false'); return; }
    if(nav && nav.classList.contains('open') && e.target.closest('.nav ul a')){ nav.classList.remove('open'); }
  });

  /* reveal on scroll */
  if('IntersectionObserver' in window){
    var ro = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    },{rootMargin:'0px 0px -8% 0px'});
    document.querySelectorAll('[data-reveal]').forEach(function(el){ ro.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('in'); });
  }

  /* -------- lazy 9:16 videos --------
     Jedes Element mit class="reel" und data-video="videos/xxx.mp4" bekommt sein
     Video erst geladen, wenn es fast im Viewport ist (Lazy Loading).
     Fehlt die Datei (noch), bleibt der Platzhalter einfach stehen.

     Standbild beim Laden: Der erste Frame jedes Videos wird direkt im Browser
     aus dem Video selbst gezogen (Canvas) und als kleines Bild im localStorage
     zwischengespeichert. Beim naechsten Besuch erscheint dieses Standbild
     sofort, noch bevor das Video (neu) geladen ist. */
  var POSTER_CACHE_PREFIX = 'reelize_poster_v1:';
  var REDUCE_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function getCachedPoster(src){
    try { return localStorage.getItem(POSTER_CACHE_PREFIX + src); } catch(e){ return null; }
  }

  function cachePoster(src, dataUrl){
    try { localStorage.setItem(POSTER_CACHE_PREFIX + src, dataUrl); } catch(e){ /* quota o.ae. -> einfach ignorieren */ }
  }

  function capturePosterFrame(slot, v, src){
    try {
      var tw = 120;
      var th = Math.round(tw * (v.videoHeight || 16) / (v.videoWidth || 9));
      var c = document.createElement('canvas');
      c.width = tw; c.height = th;
      c.getContext('2d').drawImage(v, 0, 0, tw, th);
      var dataUrl = c.toDataURL('image/jpeg', 0.6);
      cachePoster(src, dataUrl);
    } catch(e) { /* z.B. Video noch nicht dekodiert -> einfach uebergehen */ }
  }

  function attachVideo(slot){
    if(slot.dataset.loaded) return;
    slot.dataset.loaded = '1';
    var src = slot.getAttribute('data-video');
    if(!src) return;

    var cached = getCachedPoster(src);
    if(cached){
      slot.classList.add('has-cached-poster');
      slot.style.setProperty('--poster', "url('" + cached + "')");
    }

    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('muted',''); v.setAttribute('playsinline','');
    v.preload = 'metadata';
    if(cached) v.poster = cached;
    v.src = src;
    v.addEventListener('loadeddata', function(){
      slot.classList.add('has-video');
      capturePosterFrame(slot, v, src);
      /* graue -> farbige Uebergangsanimation, kurz zeitversetzt zum Video-Fade-in */
      setTimeout(function(){ slot.classList.add('color-in'); }, 120);
      var snd = document.createElement('button');
      snd.className = 'snd'; snd.setAttribute('aria-label','Ton einschalten'); snd.textContent = '\u{1F507}';
      snd.addEventListener('click', function(ev){
        ev.stopPropagation();
        v.muted = !v.muted;
        snd.textContent = v.muted ? '\u{1F507}' : '\u{1F50A}';
        snd.setAttribute('aria-label', v.muted ? 'Ton einschalten' : 'Ton ausschalten');
      });
      slot.appendChild(snd);

      var pp = document.createElement('button');
      pp.className = 'playpause'; pp.setAttribute('aria-label','Video pausieren');
      slot.appendChild(pp);
      pp.addEventListener('click', function(ev){
        ev.stopPropagation();
        slot.dataset.userPaused = v.paused ? '' : '1';
        if(v.paused){ v.play().catch(function(){}); } else { v.pause(); }
      });
      v.addEventListener('play', function(){ slot.classList.remove('is-paused'); pp.setAttribute('aria-label','Video pausieren'); });
      v.addEventListener('pause', function(){ slot.classList.add('is-paused'); pp.setAttribute('aria-label','Video abspielen'); });
      if(REDUCE_MOTION){ slot.dataset.userPaused = '1'; slot.classList.add('is-paused'); pp.setAttribute('aria-label','Video abspielen'); }

      playIfVisible(slot, v);
    });
    v.addEventListener('error', function(){ v.remove(); }); /* Datei fehlt -> Platzhalter bleibt */
    slot.appendChild(v);
  }

  var playObs = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      var v = en.target.querySelector('video');
      if(!v) return;
      if(en.target.dataset.userPaused === '1') return; /* Nutzer hat pausiert -> Auto-Play/Pause nicht ueberschreiben */
      if(en.isIntersecting){ v.play().catch(function(){}); } else { v.pause(); }
    });
  },{threshold:.35}) : null;

  function playIfVisible(slot, v){
    if(playObs){ playObs.observe(slot); } else { v.play().catch(function(){}); }
  }

  if('IntersectionObserver' in window){
    var lazyObs = new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){ attachVideo(en.target); lazyObs.unobserve(en.target); }
      });
    },{rootMargin:'400px 0px'});
    document.querySelectorAll('.reel[data-video]').forEach(function(el){ lazyObs.observe(el); });
  } else {
    document.querySelectorAll('.reel[data-video]').forEach(attachVideo);
  }

  /* Work-Seite: rotierendes Wort — Breite laeuft mit, damit kein Loch entsteht */
  (function(){
    var box = document.querySelector('.page-head .roll-box');
    var roll = box && box.querySelector('.roll4');
    if(!roll || roll.children.length < 2) return;
    if(REDUCE_MOTION) return;
    var words = roll.children, n = words.length, i = 0;
    function measure(txt){
      var m = document.createElement('span');
      m.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
      m.textContent = txt;
      box.parentNode.appendChild(m);
      var w = m.offsetWidth; m.remove(); return w;
    }
    function setWidth(){ box.style.width = measure(words[i].textContent) + 'px'; }
    box.style.transition = 'width .5s ease';
    roll.style.transition = 'transform .5s ease';
    if(document.fonts && document.fonts.ready){ document.fonts.ready.then(setWidth); } else { setWidth(); }
    window.addEventListener('resize', setWidth);
    setInterval(function(){
      i++;
      roll.style.transform = 'translateY(calc(-' + i + ' * .95em))';
      setWidth();
      if(i === n - 1){
        setTimeout(function(){
          roll.style.transition = 'none';
          roll.style.transform = 'translateY(0)';
          i = 0;
          requestAnimationFrame(function(){ requestAnimationFrame(function(){ roll.style.transition = 'transform .5s ease'; }); });
        }, 550);
      }
    }, 4000);
  })();

  /* Case-Studies: beim Öffnen Videos der Case laden */
  document.querySelectorAll('details.case').forEach(function(d){
    d.addEventListener('toggle', function(){
      if(d.open){ d.querySelectorAll('.reel[data-video]').forEach(attachVideo); }
    });
  });
})();
