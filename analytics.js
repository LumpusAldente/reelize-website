/* ============ Reelize — GA4 (Consent Mode v2) + Cookie-Consent ============ */
(function(){
  'use strict';
  var GA_ID = 'G-QFQ0J12KBC';
  var KEY = 'cookie-consent';

  window.dataLayer = window.dataLayer || [];
  function gtag(){ dataLayer.push(arguments); }
  window.gtag = gtag;

  /* Consent Mode v2: alles standardmaessig verweigert, bevor irgendetwas laedt */
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    wait_for_update: 500
  });
  gtag('js', new Date());
  gtag('config', GA_ID, { anonymize_ip: true });

  /* gtag.js wird erst nach Zustimmung geladen — vorher keinerlei Requests/Cookies */
  var gaLoaded = false;
  function loadGA(){
    if(gaLoaded) return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function getChoice(){ try { return localStorage.getItem(KEY); } catch(e){ return null; } }
  function setChoice(v){ try { localStorage.setItem(KEY, v); } catch(e){} }

  function grantAnalytics(){
    gtag('consent', 'update', { analytics_storage: 'granted' });
    loadGA();
  }
  function denyAnalytics(){
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }

  /* ---------- Cookie-Banner ---------- */
  var banner = null, lastFocus = null;

  function closeBanner(){
    if(banner){ banner.remove(); banner = null; }
    if(lastFocus && document.contains(lastFocus) && lastFocus.focus){ lastFocus.focus(); }
    lastFocus = null;
  }

  function openBanner(){
    if(banner){ banner.querySelector('.cc-accept').focus(); return; }
    banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-label', 'Cookie-Einstellungen');
    banner.setAttribute('aria-live', 'polite');
    banner.innerHTML =
      '<div class="cc-txt">' +
        '<b>Cookies &amp; Tracking</b>' +
        '<p>Wir nutzen Google Analytics, um zu verstehen, wie unsere Website genutzt wird — aber nur mit deiner Zustimmung. Ohne Zustimmung werden keine Tracking-Cookies gesetzt.</p>' +
      '</div>' +
      '<div class="cc-btns">' +
        '<button type="button" class="btn primary cc-accept">Alle akzeptieren</button>' +
        '<button type="button" class="btn ghost cc-reject">Nur notwendige</button>' +
      '</div>';
    banner.addEventListener('keydown', function(e){
      if(e.key === 'Escape'){ closeBanner(); }
    });
    banner.querySelector('.cc-accept').addEventListener('click', function(){
      setChoice('accepted'); grantAnalytics(); closeBanner();
    });
    banner.querySelector('.cc-reject').addEventListener('click', function(){
      setChoice('rejected'); denyAnalytics(); closeBanner();
    });
    document.body.appendChild(banner);
    banner.querySelector('.cc-accept').focus();
  }

  /* Footer-Link "Cookie-Einstellungen": Auswahl jederzeit aenderbar */
  window.reelizeCookieSettings = function(){
    lastFocus = document.activeElement;
    openBanner();
  };

  function init(){
    var choice = getChoice();
    if(choice === 'accepted'){ grantAnalytics(); }
    else if(choice !== 'rejected'){ openBanner(); }
  }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', init); }
  else { init(); }
})();
