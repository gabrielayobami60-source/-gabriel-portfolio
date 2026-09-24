(function(){
  "use strict";
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* live clock — Europe/London (only present on pages with a #clock element) */
  var clockEl = document.getElementById('clock');
  if(clockEl){
    function updateClock(){
      try{
        var fmt = new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Europe/London'});
        clockEl.textContent = fmt.format(new Date());
      }catch(e){
        clockEl.textContent = new Date().toTimeString().slice(0,5);
      }
    }
    updateClock();
    setInterval(updateClock, 15000);
  }

  /* dark mode toggle */
  var themeToggle = document.getElementById('themeToggle');
  if(themeToggle){
    var themeKnob = themeToggle.querySelector('.knob');
    function applyThemeIcon(){
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeKnob.textContent = isDark ? '☾' : '☀';
      themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    }
    applyThemeIcon();
    themeToggle.addEventListener('click', function(){
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if(isDark){
        document.documentElement.removeAttribute('data-theme');
        try{ localStorage.setItem('theme', 'light'); }catch(e){}
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        try{ localStorage.setItem('theme', 'dark'); }catch(e){}
      }
      applyThemeIcon();
    });
  }

  /* scroll progress bar */
  var progressEl = document.getElementById('scrollProgress');
  if(progressEl){
    function updateProgress(){
      var h = document.documentElement;
      var scrolled = h.scrollTop;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (scrolled / max) * 100 : 0;
      progressEl.style.width = pct + '%';
    }
    updateProgress();
    window.addEventListener('scroll', updateProgress, {passive:true});
    window.addEventListener('resize', updateProgress);
  }

  /* info-row lists (principles, services): tap any row to highlight it, use the
     ↑/↓ buttons, or — whenever the list is on screen — the ↑/↓ arrow keys, with
     no need to click into anything first. */
  var highlightLists = [];
  function wireHighlightList(sectionId){
    var section = document.getElementById(sectionId);
    if(!section) return;
    var rows = Array.prototype.slice.call(section.querySelectorAll('.info-row'));
    if(!rows.length) return;
    var idxs = rows.map(function(row){ return row.querySelector('.idx'); });

    function currentIndex(){
      for(var n = 0; n < rows.length; n++){ if(rows[n].classList.contains('is-dark')) return n; }
      return -1;
    }
    function activate(i){
      if(i < 0) i = rows.length - 1;
      if(i >= rows.length) i = 0;
      rows.forEach(function(r){ r.classList.remove('is-dark'); });
      idxs.forEach(function(x){ if(x) x.setAttribute('aria-pressed', 'false'); });
      rows[i].classList.add('is-dark');
      if(idxs[i]) idxs[i].setAttribute('aria-pressed', 'true');
      return i;
    }
    function step(dir){
      var next = activate(currentIndex() + dir);
      if(idxs[next]) idxs[next].focus({preventScroll: true});
    }

    rows.forEach(function(row, i){
      row.addEventListener('click', function(){ activate(i); });
      var idx = idxs[i];
      if(!idx) return;
      idx.setAttribute('tabindex', '0');
      idx.setAttribute('role', 'button');
      idx.setAttribute('aria-pressed', row.classList.contains('is-dark') ? 'true' : 'false');
      idx.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          activate(i);
        }
      });
    });

    var nav = section.querySelector('.list-nav');
    if(nav){
      nav.querySelectorAll('.list-nav-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          step(btn.getAttribute('data-dir') === 'down' ? 1 : -1);
        });
      });
    }

    highlightLists.push({section: section, step: step});
  }
  wireHighlightList('principles');
  wireHighlightList('services');

  if(highlightLists.length){
    document.addEventListener('keydown', function(e){
      if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      var tag = document.activeElement && document.activeElement.tagName;
      if(tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      var vh = window.innerHeight;
      var onScreen = highlightLists.filter(function(l){
        var r = l.section.getBoundingClientRect();
        return r.top < vh * 0.75 && r.bottom > vh * 0.25;
      });
      if(!onScreen.length) return;
      e.preventDefault();
      onScreen[0].step(e.key === 'ArrowDown' ? 1 : -1);
    });
  }

  /* cursor-spotlight glow on buttons */
  document.querySelectorAll('.btn').forEach(function(btn){
    btn.addEventListener('mousemove', function(e){
      var r = btn.getBoundingClientRect();
      btn.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
      btn.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* subtle 3D tilt on portfolio cards */
  if(!reduceMotion){
    document.querySelectorAll('.portfolio-grid .card').forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = 'rotateX(' + (py * -8) + 'deg) rotateY(' + (px * 8) + 'deg)';
      });
      card.addEventListener('mouseleave', function(){
        card.style.transform = 'rotateX(0) rotateY(0)';
      });
    });
  }

  /* animated count-up for stat-grid numerals (e.g. facts & figures) */
  if(!reduceMotion && 'IntersectionObserver' in window){
    var numerals = document.querySelectorAll('.fact-cell .numeral');
    var countIo = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        countIo.unobserve(entry.target);
        var el = entry.target;
        var match = el.textContent.match(/^(\d+)(.*)$/);
        if(!match) return;
        var target = parseInt(match[1], 10);
        var suffix = match[2];
        var start = null;
        var duration = 1100;
        function step(ts){
          if(!start) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if(progress < 1){ requestAnimationFrame(step); }
        }
        requestAnimationFrame(step);
      });
    }, {threshold:0.4});
    numerals.forEach(function(el){ countIo.observe(el); });
  }

  /* scroll reveal — progressive enhancement only.
     Without JS, or with reduced motion, .rv stays fully visible (see CSS defaults). */
  if(!reduceMotion && 'IntersectionObserver' in window){
    document.body.classList.add('rv-armed');
    var items = document.querySelectorAll('.rv');
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('rv-in');
          io.unobserve(entry.target);
        }
      });
    },{threshold:0.12, rootMargin:'0px 0px -5% 0px'});

    items.forEach(function(el){
      var r = el.getBoundingClientRect();
      if(r.top < window.innerHeight && r.bottom > 0){
        el.classList.add('rv-in');
      } else {
        io.observe(el);
      }
    });
  }

  /* image lightbox — click any content image (not a linked thumbnail) to view it full-size */
  var viewable = Array.prototype.filter.call(document.querySelectorAll('img'), function(img){
    return !img.closest('a');
  });
  if(viewable.length){
    var overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML = '<button type="button" class="lightbox-close" aria-label="Close">&times;</button><img class="lightbox-img" alt="">';
    document.body.appendChild(overlay);
    var overlayImg = overlay.querySelector('.lightbox-img');
    var closeBtn = overlay.querySelector('.lightbox-close');
    var lastFocused = null;

    function openLightbox(img){
      overlayImg.src = img.currentSrc || img.src;
      overlayImg.alt = img.alt || '';
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      lastFocused = document.activeElement;
      closeBtn.focus();
    }
    function closeLightbox(){
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      overlayImg.src = '';
      if(lastFocused && lastFocused.focus) lastFocused.focus();
    }

    viewable.forEach(function(img){
      img.classList.add('is-viewable');
      img.addEventListener('click', function(){ openLightbox(img); });
    });
    closeBtn.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', function(e){
      if(e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overlay.classList.contains('is-open')) closeLightbox();
    });
  }
})();
