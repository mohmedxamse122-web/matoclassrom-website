document.addEventListener('DOMContentLoaded', function() {
  const items = document.querySelectorAll('.tour-item');
  const scoreEl = document.getElementById('score');
  let score = 0;

  function markFound(el) {
    if (el.classList.contains('found')) return;
    el.classList.add('found');
    el.setAttribute('aria-pressed', 'true');
    score += 1;
    scoreEl.textContent = score;
    // small visual feedback
    el.classList.add('pulse');
    setTimeout(() => el.classList.remove('pulse'), 600);
    // celebrate when all items are found
    const total = items.length;
    if (score === total) {
      showWinMessage();
    }
  }

  function showWinMessage() {
    const toast = document.createElement('div');
    toast.className = 'win-toast';
    toast.textContent = `You found all ${items.length} items! Claim your badge 🎉`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 50);
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  items.forEach(item => {
    item.tabIndex = 0; // make focusable
    item.setAttribute('role', 'button');
    item.addEventListener('click', () => markFound(item));
    item.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        markFound(item);
      }
    });
  });

  /* Challenges logic */
  const challengeEls = document.querySelectorAll('.challenge');
  const totalChallenges = challengeEls.length;
  const completedEl = document.getElementById('challenges-completed');
  const totalEl = document.getElementById('challenges-total');
  totalEl.textContent = totalChallenges;

  function loadChallenges() {
    try {
      const saved = JSON.parse(localStorage.getItem('classroomChallenges') || '[]');
      return new Set(saved);
    } catch (e) { return new Set(); }
  }

  function saveChallenges(set) {
    localStorage.setItem('classroomChallenges', JSON.stringify(Array.from(set)));
  }

  const completedSet = loadChallenges();

  // Answers persistence
  function loadAnswers() {
    try { return JSON.parse(localStorage.getItem('classroomChallengesAnswers') || '{}'); }
    catch (e) { return {}; }
  }
  function saveAnswers(obj) { localStorage.setItem('classroomChallengesAnswers', JSON.stringify(obj)); }
  const savedAnswers = loadAnswers();

  // Simple auto-check rules: keyword lists for some challenges.
  // If empty or missing, that challenge will be marked for teacher review.
  const correctChecks = {
    // c1 expects a genre keyword
    c1: ['mystery','fantasy','fiction','nonfiction','science','history','biography','poetry','adventure','romance'],
    // c2: open answer -> teacher review
    c2: null,
    // c3: colors -> check for color words (simple)
    c3: ['red','blue','green','yellow','orange','purple','pink','brown','black','white'],
    // c4: caption -> teacher review
    c4: null
  };

  function updateChallengesUI() {
    challengeEls.forEach(ch => {
      const id = ch.dataset.id;
      const btn = ch.querySelector('.challenge-btn');
      const input = ch.querySelector('.challenge-input');
      const feedback = ch.querySelector('.challenge-feedback');
      const saved = savedAnswers[id];
      if (saved) {
        // saved may be object {text, correct}
        const value = typeof saved === 'string' ? saved : saved.text;

        // Correct answer -> mark completed and disable input
        if (saved.correct === true) {
          ch.classList.add('completed');
          btn.classList.add('completed');
          btn.textContent = 'Completed';
          input.disabled = true;
          feedback.innerHTML = 'Correct! <span class="emoji pop">🎉</span>';
          feedback.classList.remove('pending','incorrect');
          feedback.classList.add('correct');
          ch.classList.add('correct');
          ch.classList.remove('incorrect');
          const e = feedback.querySelector('.emoji');
          if (e) { e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }

        // Incorrect -> do NOT mark completed; instruct user to try again
        } else if (saved.correct === false) {
          ch.classList.remove('completed');
          btn.classList.remove('completed');
          btn.textContent = 'Failed. Try again';
          // Do not autofill the old incorrect answer; leave the input empty for retyping
          input.value = '';
          input.disabled = false; // allow user to edit and resubmit
          feedback.innerHTML = 'Failed. Try again. <span class="emoji fall">😵</span>';
          feedback.classList.remove('pending','correct');
          feedback.classList.add('incorrect');
          ch.classList.add('incorrect');
          ch.classList.remove('correct');
          const e = feedback.querySelector('.emoji');
          if (e) { e.classList.remove('fall'); void e.offsetWidth; e.classList.add('fall'); }
          // Note: reveal UI removed per user request — do not create a reveal button or overlay

        // Pending teacher review
        } else {
          ch.classList.remove('completed');
          btn.classList.remove('completed');
          btn.textContent = 'Saved (pending)';
          feedback.innerHTML = 'Answer saved. Pending teacher review. <span class="emoji">🕒</span>';
          feedback.classList.remove('correct','incorrect');
          feedback.classList.add('pending');
          ch.classList.remove('correct','incorrect');
        }
      } else if (completedSet.has(id)) {
        ch.classList.add('completed');
        btn.classList.add('completed');
        btn.textContent = 'Completed';
      } else {
        ch.classList.remove('completed');
        btn.classList.remove('completed');
        btn.textContent = 'Submit answer';
        feedback.textContent = '';
        feedback.classList.remove('correct','incorrect','pending');
        if (input) input.disabled = false;
      }
    });
    completedEl.textContent = completedSet.size;
    // Show congratulations when all challenges are done
    const congrats = document.getElementById('congratulations');
    if (congrats) {
      if (completedSet.size === totalChallenges) congrats.classList.add('visible');
      else congrats.classList.remove('visible');
    }
  }

  // small celebratory burst when user completes all challenges
  function celebrateBurst(targetEl, count = 6) {
    if (!targetEl) return;
    const colors = ['🎉','✨','🎈','🥳','🌟','🍾'];
    const container = document.createElement('div');
    container.className = 'celebrate-burst';
    container.style.position = 'relative';
    container.style.overflow = 'visible';
    container.style.pointerEvents = 'none';
    targetEl.appendChild(container);

    for (let i = 0; i < count; i++) {
      const e = document.createElement('div');
      e.className = 'burst-emoji';
      e.textContent = colors[i % colors.length];
      e.style.position = 'absolute';
      e.style.left = (50 + (Math.random() * 120 - 60)) + '%';
      e.style.top = '0%';
      container.appendChild(e);
      // animate via CSS class
      setTimeout(() => e.classList.add('launch'), 20 + i * 60);
      setTimeout(() => e.remove(), 1400 + i * 60);
    }
    setTimeout(() => { if (container.parentNode) container.remove(); }, 2200);
  }

  // show a big fullscreen emoji briefly for correct answers
  function showFullscreenEmoji(emoji = '🎉', ms = 3000) {
    const existing = document.querySelector('.fullscreen-emoji');
    if (existing) existing.remove();
    const wrap = document.createElement('div');
    wrap.className = 'fullscreen-emoji';
    wrap.innerHTML = `<div class="big-emoji">${emoji}</div>`;
    document.body.appendChild(wrap);
    // force reflow then show
    void wrap.offsetWidth;
    wrap.classList.add('show');
    setTimeout(() => {
      wrap.classList.remove('show');
      setTimeout(() => wrap.remove(), 300);
    }, ms);
  }

  // Add rub-to-reveal overlays for disabled inputs so users can "rub" (hover/press) to see their saved answer
  function setupRevealOverlays() {
    // Only add a reveal overlay for the last challenge (data-id="c4").
    challengeEls.forEach(ch => {
      const id = ch.dataset.id;
      const input = ch.querySelector('.challenge-input');
      if (!input) return;
      // clean any leftover global reveal UI first for this challenge
      const existingOverlay = ch.querySelector('.reveal-overlay');
      if (existingOverlay) existingOverlay.remove();
      const existingRevealBtn = ch.querySelector('.reveal-saved');
      if (existingRevealBtn) existingRevealBtn.remove();

      // only for c4: if there's a saved answer and it hasn't been revealed yet, add an overlay
      if (id !== 'c4') return;
      const saved = savedAnswers[id];
      if (!saved) return;
      if (saved.revealed === true) return;

      // wrap input if needed
      let wrap = input.closest('.input-reveal-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'input-reveal-wrap';
        input.parentNode.replaceChild(wrap, input);
        wrap.appendChild(input);
      }

      // create overlay
      if (!wrap.querySelector('.reveal-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'reveal-overlay';
        overlay.textContent = 'Rub to reveal';
        wrap.appendChild(overlay);

        // on first interaction reveal permanently and enable editing
        overlay.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const saved = savedAnswers[id];
          if (saved) {
            input.value = saved.text || '';
            input.disabled = false;
            saved.revealed = true;
            saveAnswers(savedAnswers);
          }
          overlay.remove();
        });
        overlay.addEventListener('touchstart', (e) => {
          e.preventDefault();
          const saved = savedAnswers[id];
          if (saved) {
            input.value = saved.text || '';
            input.disabled = false;
            saved.revealed = true;
            saveAnswers(savedAnswers);
          }
          overlay.remove();
        }, { passive: false });
      }
    });
  }

  challengeEls.forEach(ch => {
    const id = ch.dataset.id;
    const btn = ch.querySelector('.challenge-btn');
    const input = ch.querySelector('.challenge-input');
    const feedback = ch.querySelector('.challenge-feedback');

    // Prefill from saved answers
    if (savedAnswers[id]) {
      const saved = savedAnswers[id];
      input.value = typeof saved === 'string' ? saved : saved.text || '';
      input.disabled = true;
    }

    btn.addEventListener('click', () => {
      const text = input ? input.value.trim() : '';
      if (!text) {
        feedback.textContent = 'Please enter an answer before submitting.';
        return;
      }
      // Determine correctness if we have rules
      let correctness = null; // null -> pending review
      const rules = correctChecks[id];
      if (Array.isArray(rules) && rules.length > 0) {
        const lower = text.toLowerCase();
        // match whole words or simple substrings
        const matched = rules.some(k => new RegExp("\\b" + k + "\\b","i").test(lower));
        correctness = matched;
      }

      // Persist only correct answers or pending (teacher-review) answers.
      if (id === 'c4') {
        // For the last question, persist answers (hidden by default) so the user must rub to reveal.
        savedAnswers[id] = { text, correct: correctness, revealed: false };
        saveAnswers(savedAnswers);
        if (correctness === true) {
          completedSet.add(id);
          showFullscreenEmoji('🎉', 5000);
        } else {
          if (completedSet.has(id)) completedSet.delete(id);
        }
      } else {
        // Default behavior for other challenges
        if (correctness === true) {
          savedAnswers[id] = { text, correct: true };
          saveAnswers(savedAnswers);
          completedSet.add(id);
          showFullscreenEmoji('🎉', 5000);
        } else if (correctness === null) {
          // pending review - save but don't mark completed
          savedAnswers[id] = { text, correct: null };
          saveAnswers(savedAnswers);
          if (completedSet.has(id)) completedSet.delete(id);
        } else {
          // incorrect: do not persist the wrong answer. Remove any prior saved wrong answer.
          if (savedAnswers[id]) {
            delete savedAnswers[id];
            saveAnswers(savedAnswers);
          }
          if (completedSet.has(id)) completedSet.delete(id);
        }
      }
      saveChallenges(completedSet);

      updateChallengesUI();
      // if the user just completed the final challenge with a correct answer, celebrate
      if (correctness === true && completedSet.size === totalChallenges) {
        const congrats = document.getElementById('congratulations');
        // animate burst near the heading
        const heading = congrats ? congrats.querySelector('h2') : null;
        celebrateBurst(heading, 8);
      }
      // ensure reveal overlays / reveal buttons are added after update
      setupRevealOverlays();
    });
  });

  // initialize
  updateChallengesUI();
  setupRevealOverlays();

  // Feedback handling
  const fbInput = document.getElementById('feedback-input');
  const fbSubmit = document.getElementById('feedback-submit');
  const fbMsg = document.getElementById('feedback-msg');
  const fbList = document.getElementById('feedback-list');

  function loadFeedback() {
    try { return JSON.parse(localStorage.getItem('classroomFeedback') || '[]'); }
    catch (e) { return []; }
  }
  function saveFeedback(arr) { localStorage.setItem('classroomFeedback', JSON.stringify(arr)); }

  function renderFeedback() {
    const items = loadFeedback();
    fbList.innerHTML = '';
    items.slice().reverse().forEach(f => {
      const el = document.createElement('div');
      el.className = 'feedback-item';
      const meta = document.createElement('div'); meta.className = 'feedback-meta';
      const ts = new Date(f.ts).toLocaleString();
      meta.textContent = `Submitted: ${ts}`;
      const txt = document.createElement('div'); txt.textContent = f.text;
      el.appendChild(meta); el.appendChild(txt);
      fbList.appendChild(el);
    });
  }

  fbSubmit.addEventListener('click', () => {
    const text = fbInput.value.trim();
    if (!text) {
      fbMsg.textContent = 'Please type some feedback first.';
      return;
    }
    const arr = loadFeedback();
    arr.push({ text, ts: Date.now() });
    saveFeedback(arr);
    fbInput.value = '';
    fbMsg.textContent = 'Thanks — feedback sent!';
    setTimeout(() => fbMsg.textContent = '', 2600);
    renderFeedback();
  });

  // initial render
  renderFeedback();
});