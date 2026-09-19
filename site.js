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

  /* info-row lists (principles, services): tap any row to highlight it, or use the
     ↑/↓ buttons — those work with touch, unlike arrow keys, which only reach desktop
     keyboard users and are kept here as a bonus, not the primary way to move it. */
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
          return;
        }
        if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        var next = activate(e.key === 'ArrowDown' ? i + 1 : i - 1);
        if(idxs[next]) idxs[next].focus();
      });
    });

    var nav = section.querySelector('.list-nav');
    if(nav){
      nav.querySelectorAll('.list-nav-btn').forEach(function(btn){
        btn.addEventListener('click', function(){
          var dir = btn.getAttribute('data-dir') === 'down' ? 1 : -1;
          activate(currentIndex() + dir);
        });
      });
    }
  }
  wireHighlightList('principles');
  wireHighlightList('services');

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
})();
