/* frst — all interactions, no dependencies */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } }
  };

  /* ---------- theme ---------- */
  const themeToggle = $('#theme-toggle');
  const root = document.documentElement;
  const savedTheme = storage.get('frst-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') root.dataset.theme = savedTheme;

  const syncThemeMeta = () => {
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = root.dataset.theme === 'dark' ? '#0b0e0d' : '#f7f7f1';
  };
  syncThemeMeta();

  const syncThemeLabel = () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${next} theme`);
  };
  syncThemeLabel();
  themeToggle.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    storage.set('frst-theme', root.dataset.theme);
    syncThemeLabel();
    syncThemeMeta();
  });

  /* ---------- header state + mobile nav ---------- */
  const header = $('.site-header');
  const menuToggle = $('#menu-toggle');
  const mobileNav = $('#mobile-nav');

  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobileNav.hidden = !open;
  };
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', mobileNav).forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 940) setMenu(false); });

  /* ---------- active nav link ---------- */
  const navLinks = $$('.desktop-nav a');
  if ('IntersectionObserver' in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    ['why', 'how', 'demo', 'features', 'pricing', 'faq'].forEach(id => {
      const el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
      revealObserver.observe(el);
    });
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- live date + year ---------- */
  const todayLabel = $('#today-label');
  if (todayLabel) {
    todayLabel.textContent = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());
  }
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- interactive planner ---------- */
  const form = $('#planner-form');
  const input = $('#tasks');
  const error = $('#form-error');
  const emptyState = $('#plan-empty');
  const result = $('#plan-result');
  const list = $('#plan-list');
  const summary = $('#plan-summary');

  const DEEP = /\b(write|draft|design|build|code|sketch|review|fix|research|outline|architect|prototype|think|create|draw|edit|refactor)\b/i;
  const MEETING = /\b(call|meeting|standup|stand-up|sync|1:1|interview|demo|workshop)\b/i;
  const ADMIN = /\b(email|emails|inbox|reply|replies|clear|admin|update|changelog|expense|invoice|schedule|file|organize|slack)\b/i;

  const classify = (task) => {
    if (DEEP.test(task)) return { minutes: 45, kind: 'Deep work' };
    if (MEETING.test(task)) return { minutes: 30, kind: 'Meeting' };
    if (ADMIN.test(task)) return { minutes: 20, kind: 'Admin' };
    return { minutes: 30, kind: 'Focus' };
  };

  const formatTime = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };
  const formatDuration = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m} min`;
  };
  const titleCase = (text) => text.charAt(0).toUpperCase() + text.slice(1);

  const buildPlan = (rawTasks) => {
    const tasks = rawTasks.slice(0, 8);
    list.innerHTML = '';
    let clock = 8 * 60;
    let total = 0;

    tasks.forEach((task, index) => {
      const { minutes, kind } = classify(task);
      const li = document.createElement('li');
      if (index === 0) li.classList.add('is-priority');
      li.style.animationDelay = `${index * 55}ms`;

      const time = document.createElement('span');
      time.className = 'plan-time';
      time.textContent = formatTime(clock);

      const body = document.createElement('div');
      body.className = 'plan-task';
      const strong = document.createElement('strong');
      strong.textContent = titleCase(task.replace(/\s+/g, ' ').trim());
      const small = document.createElement('small');
      small.textContent = `${minutes} min · ${kind}`;
      body.append(strong, small);
      li.append(time, body);
      list.append(li);
      clock += minutes;
      total += minutes;

      if ((index + 1) % 2 === 0 && index !== tasks.length - 1) {
        const breakLi = document.createElement('li');
        breakLi.className = 'is-break';
        breakLi.style.animationDelay = `${(index + 1) * 55}ms`;
        const bTime = document.createElement('span');
        bTime.className = 'plan-time';
        bTime.textContent = formatTime(clock);
        const bBody = document.createElement('div');
        bBody.className = 'plan-task';
        const bStrong = document.createElement('strong');
        bStrong.textContent = 'Breathe. Look out a window.';
        const bSmall = document.createElement('small');
        bSmall.textContent = '10 min · Buffer';
        bBody.append(bStrong, bSmall);
        breakLi.append(bTime, bBody);
        list.append(breakLi);
        clock += 10;
        total += 10;
      }
    });

    summary.textContent = formatDuration(total);
    emptyState.hidden = true;
    result.hidden = false;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const tasks = input.value.split(/[\n,;]+/).map(t => t.trim()).filter(Boolean);
    if (!tasks.length) {
      error.hidden = false;
      input.focus();
      return;
    }
    error.hidden = true;
    buildPlan(tasks);
  });
  input.addEventListener('input', () => { if (!error.hidden) error.hidden = true; });

  $('#clear-tasks').addEventListener('click', () => {
    input.value = '';
    error.hidden = true;
    result.hidden = true;
    emptyState.hidden = false;
    list.innerHTML = '';
    $$('.chip').forEach(chip => chip.classList.remove('is-active'));
    input.focus();
  });

  $$('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = (chip.dataset.preset || '').replace(/\\n/g, '\n');
      error.hidden = true;
      $$('.chip').forEach(c => c.classList.toggle('is-active', c === chip));
      buildPlan(input.value.split('\n').map(t => t.trim()).filter(Boolean));
    });
  });

  /* ---------- pricing toggle ---------- */
  const billingButtons = $$('.billing-toggle button');
  billingButtons.forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.dataset.billing;
      billingButtons.forEach(b => {
        const active = b === button;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      $$('.amount').forEach(amount => {
        amount.textContent = amount.dataset[mode];
        if (typeof amount.animate === 'function') {
          amount.animate(
            [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
            { duration: 260, easing: 'cubic-bezier(.22,1,.36,1)' }
          );
        }
      });
      const note = $('[data-billing-note]');
      if (note) note.textContent = mode === 'yearly'
        ? 'Billed $72 once a year. Cancel anytime.'
        : 'Billed monthly. Cancel anytime.';
    });
  });

  /* ---------- FAQ: keep one open at a time ---------- */
  $$('.faq-list details').forEach(detail => {
    detail.addEventListener('toggle', () => {
      if (detail.open) $$('.faq-list details').forEach(other => { if (other !== detail) other.open = false; });
    });
  });

  /* ---------- newsletter (concept-site demo) ---------- */
  const signup = $('#signup-form');
  const signupMsg = $('#signup-msg');
  signup.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#email');
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    signupMsg.hidden = false;
    signupMsg.classList.toggle('is-error', !valid);
    if (!valid) {
      signupMsg.textContent = 'That email looks a little off — mind checking it?';
      email.focus();
      return;
    }
    storage.set('frst-email', email.value.trim());
    signupMsg.textContent = "You're in. Well, locally — this is a concept site, so nothing was actually sent.";
    email.value = '';
  });
})();
