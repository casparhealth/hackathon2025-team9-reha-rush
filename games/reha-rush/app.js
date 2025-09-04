(() => {
  "use strict";

  // Element references
  const elements = {
    introSection: document.getElementById("intro"),
    questionSection: document.getElementById("questionArea"),
    mediaContainer: document.getElementById("mediaContainer"),
    mediaImg: document.getElementById("mediaImg"),
    passage: document.getElementById("passage"),
    questionText: document.getElementById("questionText"),
    answersForm: document.getElementById("answers"),
    submitButton: document.getElementById("submitBtn"),
    backButton: document.getElementById("backBtn"),
    nextButton: document.getElementById("nextBtn"),
    restartButton: document.getElementById("restartBtn"),
    startButton: document.getElementById("startBtn"),
    modeSelect: document.getElementById("modeSelect"),
    difficultySelect: document.getElementById("difficultySelect"),
    coachToggle: document.getElementById("coachToggle"),
    voiceToggle: document.getElementById("voiceToggle"),
    avatarSizeSelect: document.getElementById("avatarSizeSelect"),
    avatarThemeSelect: document.getElementById("avatarThemeSelect"),
    petToggle: document.getElementById("petToggle"),
    timerValue: document.getElementById("timer"),
    scoreValue: document.getElementById("score"),
    highScoreValue: document.getElementById("highScore"),
    feedback: document.getElementById("feedback"),
    explanation: document.getElementById("explanation"),
    coachPanel: document.getElementById("coachPanel"),
    therapist: document.getElementById("therapist"),
    therapistAvatar: document.getElementById("therapistAvatar"),
    therapistActions: document.getElementById("therapistActions"),
    highFiveBtn: document.getElementById("highFiveBtn"),
    tipBtn: document.getElementById("tipBtn"),
  };

  /**
   * Question bank with difficulty labels to scale cognitive load progressively.
   */
  const questionBank = [

    // Detail-oriented paragraphs (names, places, times)
    { difficulty: "easy", passage: "On Monday at 7:30 PM, Maya and Leo met at Oak Park to practice badminton.", question: "What time did they meet?", options: ["6:30 PM", "7:30 PM", "8:30 PM", "7:00 PM"], correctIndex: 1 },
    { difficulty: "easy", passage: "Carlos placed the red notebook on the second shelf beside the green vase before leaving for class.", question: "What color was the notebook?", options: ["Blue", "Green", "Red", "Black"], correctIndex: 2 },
    { difficulty: "medium", passage: "Priya caught the 8:05 train from Riverdale Station to Central, meeting Amir at 8:30 near Gate B.", question: "Where did Priya meet Amir?", options: ["Gate A", "Gate B", "Platform 2", "Ticket desk"], correctIndex: 1 },

    // Image-based detail question (uses external image URL)
    { difficulty: "easy", media: { type: "image", src: "https://upload.wikimedia.org/wikipedia/commons/1/15/Red_Apple.jpg", alt: "A red apple on a white background" }, passage: "", question: "What color is the fruit?", options: ["Green", "Yellow", "Red", "Purple"], correctIndex: 2 },

    // Additional image-based (inline SVGs) - Properly sized and centered
    { difficulty: "easy", media: { type: "image", src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='300' height='200' fill='white'/><rect x='100' y='50' width='100' height='100' fill='red'/></svg>", alt: "Red square" }, passage: "", question: "What shape is shown?", options: ["Square", "Circle", "Triangle", "Star"], correctIndex: 0 },
    { difficulty: "easy", media: { type: "image", src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='300' height='200' fill='white'/><rect x='100' y='50' width='100' height='100' fill='purple'/></svg>", alt: "Purple square" }, passage: "", question: "What color is the square?", options: ["Purple", "Orange", "Blue", "Yellow"], correctIndex: 0 },
    { difficulty: "medium", media: { type: "image", src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='300' height='200' fill='white'/><circle cx='75' cy='100' r='40' fill='red'/><circle cx='150' cy='100' r='40' fill='red'/><circle cx='225' cy='100' r='40' fill='red'/></svg>", alt: "Three red circles in a row" }, passage: "", question: "How many circles are shown?", options: ["2", "3", "4", "5"], correctIndex: 1 },
    { difficulty: "medium", media: { type: "image", src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='300' height='200' fill='white'/><rect x='50' y='75' width='60' height='60' fill='blue'/><rect x='120' y='75' width='60' height='60' fill='green'/><rect x='190' y='75' width='60' height='60' fill='red'/></svg>", alt: "Three squares: blue, green, red" }, passage: "", question: "What is the color of the rightmost square?", options: ["Blue", "Green", "Red", "Yellow"], correctIndex: 2 },
   
    // Paragraph-based True/False set (example like the user's format)
    { difficulty: "easy", type: "paragraph", passage: "Liam has a garden behind his house. He waters flowers every morning. Last Saturday, he planted tomatoes and carrots. After gardening, he drinks tea on his porch.", question: "Liam waters flowers only on weekends.", options: ["True", "False"], correctIndex: 1 },
    { difficulty: "easy", type: "paragraph", passage: "Liam has a garden behind his house. He waters flowers every morning. Last Saturday, he planted tomatoes and carrots. After gardening, he drinks tea on his porch.", question: "Last Saturday, Liam planted tomatoes and carrots.", options: ["True", "False"], correctIndex: 0 },
    { difficulty: "easy", type: "paragraph", passage: "Emma enjoys baking in her kitchen. Every Sunday, she makes cookies and cakes. Last Sunday, she baked chocolate chip cookies and a lemon cake. After baking, she cleaned up the kitchen.", question: "Last Sunday, she baked chocolate chip cookies and a lemon cake.", options: ["True", "False"], correctIndex: 0 },
    { difficulty: "easy", type: "paragraph", passage: "Emma enjoys baking in her kitchen. Every Sunday, she makes cookies and cakes. Last Sunday, she baked chocolate chip cookies and a lemon cake. After baking, she cleaned up the kitchen.", question: "After baking, Emma cleaned up the kitchen.", options: ["True", "False"], correctIndex: 0 },
    

];

  // Game configuration
  const config = {
    gameSeconds: 90,
    pointsPerCorrect: 10,
  };

  // Game state
  const state = {
    isActive: false,
    score: 0,
    currentIndex: 0,
    order: [],
    secondsLeft: config.gameSeconds,
    intervalId: null,
    hasAnsweredCurrent: false,
    streak: 0,
    coachEnabled: false,
    coachVoice: false,
    therapistEnabled: true,
    avatarSize: "md",
    avatarTheme: "wiggle",
    petEnabled: false,
    imageHideTimeoutId: null,
    imageCountdown: 0,
    imageCountdownInterval: null,
    paragraphHideTimeoutId: null,
    paragraphCountdown: 0,
    paragraphCountdownInterval: null,
    lastPointsEarned: null, // Added for points earned display
  };

  // Utilities
  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function pickProgressiveOrder(items) {
    const easy = items.filter(q => q.difficulty === "easy");
    const medium = items.filter(q => q.difficulty === "medium");
    const hard = items.filter(q => q.difficulty === "hard");
    return [...shuffle(easy), ...shuffle(medium), ...shuffle(hard)].map((q, idx) => ({ ...q, _idx: idx }));
  }

  function filterByMode(items, mode) {
    if (mode === "text") return items.filter(q => !q.media);
    if (mode === "image") return items.filter(q => q.media && q.media.type === "image");
    if (mode === "paragraph") return items.filter(q => q.type === "paragraph");
    return items;
  }

  function filterByDifficulty(items, difficulty) {
    if (difficulty === "all") return items;
    return items.filter(q => q.difficulty === difficulty);
  }

  // High score persistence
  function loadHighScore() {
    const raw = localStorage.getItem("nc_reading_high_score");
    return raw ? Number(raw) : 0;
  }
  function saveHighScore(value) {
    const prev = loadHighScore();
    if (value > prev) localStorage.setItem("nc_reading_high_score", String(value));
  }

  // Rendering
  function renderHud() {
    elements.scoreValue.textContent = String(state.score);
    elements.timerValue.textContent = formatTime(state.secondsLeft);
    elements.highScoreValue.textContent = String(loadHighScore());
    if (elements.coachPanel) elements.coachPanel.hidden = !state.coachEnabled;
    if (elements.therapist) elements.therapist.hidden = !state.coachEnabled; // tied to coach toggle
  }

  // Automatically select idle animation based on situation
  function updateAvatarIdleAnimation() {
    const avatar = elements.therapistAvatar;
    if (!avatar) return;
    avatar.classList.remove('idle-wiggle','idle-breathe','idle-nod');
    let theme = 'breathe';
    if (state.secondsLeft <= 15) theme = 'wiggle';
    else if (state.streak >= 2) theme = 'nod';
    avatar.classList.add(`idle-${theme}`);
  }

  function updateImageCountdown() {
    if (state.imageCountdown <= 0) return;
    
    // Update countdown display in coach panel (text only, no voice)
    if (elements.coachPanel) {
      elements.coachPanel.textContent = `Image will hide in ${state.imageCountdown} seconds`;
    }
    
    // Decrease countdown
    state.imageCountdown--;
    
    // Continue countdown every second
    if (state.imageCountdown > 0) {
      state.imageCountdownInterval = setTimeout(updateImageCountdown, 1000);
    }
  }

  function showImageHiddenMessage() {
    // Show message in coach panel
    if (elements.coachPanel) {
      elements.coachPanel.textContent = "Image hidden! Use your memory to answer the question below.";
    }
  }

  function updateParagraphCountdown() {
    if (state.paragraphCountdown <= 0) return;
    
    // Update countdown display in coach panel (text only, no voice)
    if (elements.coachPanel) {
      elements.coachPanel.textContent = `Passage will hide in ${state.paragraphCountdown} seconds`;
    }
    
    // Decrease countdown
    state.paragraphCountdown--;
    
    // Continue countdown every second
    if (state.paragraphCountdown > 0) {
      state.paragraphCountdownInterval = setTimeout(updateParagraphCountdown, 1000);
    }
  }

  function showParagraphHiddenMessage() {
    // Show message in coach panel
    coachSay("Passage hidden! Use your memory to answer the question below.");
  }

  function showCompletionScreen() {
    console.log('showCompletionScreen called!');
    // Stop the game timer
    stopTimer();
    state.isActive = false;
    
    // Save high score
    saveHighScore(state.score);
    
    // Clear any existing coach messages
    if (elements.coachPanel) {
      elements.coachPanel.textContent = "";
    }
    
    // Show completion message
    elements.questionText.textContent = "🎉 All Questions Completed! 🎉";
    elements.passage.textContent = `Congratulations! You've completed all ${state.order.length} questions.`;
    
    // Hide question elements
    elements.answersForm.innerHTML = "";
    elements.mediaContainer.hidden = true;
    
    // Show completion stats
    const completionStats = document.createElement('div');
    completionStats.className = 'completion-stats';
    completionStats.innerHTML = `
      <h3>Final Results</h3>
      <p><strong>Final Score:</strong> ${state.score}</p>
      <p><strong>Questions Answered:</strong> ${state.order.length}</p>
      <p><strong>Time Remaining:</strong> ${formatTime(state.secondsLeft)}</p>
      <p><strong>High Score:</strong> ${loadHighScore()}</p>
    `;
    elements.questionSection.appendChild(completionStats);
    
    // Show restart button
    elements.restartButton.hidden = false;
    elements.restartButton.textContent = "Play Again";
    elements.restartButton.focus();
    
    // Hide other buttons
    elements.submitButton.hidden = true;
    elements.nextButton.hidden = true;
    elements.backButton.hidden = true;
    
    // Show final congratulatory message in coach panel
    if (elements.coachPanel) {
      elements.coachPanel.textContent = `Excellent work! You completed all questions with a score of ${state.score}.`;
    }
    
    // Update HUD
    renderHud();
  }

  function spawnHearts(count) {
    // Create floating heart animations for pet companion
    for (let i = 0; i < count; i++) {
      const heart = document.createElement('div');
      heart.className = 'heart';
      heart.innerHTML = '❤️';
      heart.style.left = `${Math.random() * 100}%`;
      heart.style.animationDelay = `${Math.random() * 500}ms`;
      
      const avatarFx = elements.therapist?.querySelector('.avatar-fx');
      if (avatarFx) {
        avatarFx.appendChild(heart);
        heart.classList.add('animate');
        
        // Remove heart after animation
        setTimeout(() => {
          if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
          }
        }, 1000);
      }
    }
  }

  function speak(text) {
    if (!state.coachVoice) return;
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.05;
      utter.pitch = 1.0;
      utter.volume = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      console.log('Speaking:', text); // Debug log
    } catch (error) { 
      console.log('Speech synthesis error:', error); // Debug log
    }
  }

  function coachSay(message) {
    if (!state.coachEnabled || !elements.coachPanel) return;
    elements.coachPanel.textContent = message;
    speak(message);
  }

  function clearFeedback() {
    elements.feedback.textContent = "";
    elements.feedback.className = "feedback";
    elements.explanation.hidden = true;
    elements.explanation.textContent = "";
  }

  function renderQuestion() {
    const question = state.order[state.currentIndex];
    if (!question) return;

    clearFeedback();
    // Cancel any pending timeouts from previous question
    if (state.imageHideTimeoutId) {
      clearTimeout(state.imageHideTimeoutId);
      state.imageHideTimeoutId = null;
    }
    if (state.paragraphHideTimeoutId) {
      clearTimeout(state.paragraphHideTimeoutId);
      state.paragraphHideTimeoutId = null;
    }
    
    // Media (optional)
    if (question.media && question.media.type === "image" && question.media.src) {
      elements.mediaImg.src = question.media.src;
      elements.mediaImg.alt = question.media.alt || "";
      elements.mediaContainer.hidden = false;
      
      // Voice announcement: "4 seconds left" (spoken once)
      if (state.coachVoice) {
        speak("4 seconds left");
      }
      
      // Start countdown timer for image questions
      state.imageCountdown = 4;
      updateImageCountdown();
      
      // Hide image after 4 seconds for image-type questions
      state.imageHideTimeoutId = setTimeout(() => {
        elements.mediaContainer.hidden = true;
        // Clear countdown when image hides
        if (state.imageCountdownInterval) {
          clearInterval(state.imageCountdownInterval);
          state.imageCountdownInterval = null;
        }
        // Show message that image is hidden
        showImageHiddenMessage();
      }, 4000);
    } else {
      elements.mediaImg.removeAttribute("src");
      elements.mediaImg.alt = "";
      elements.mediaContainer.hidden = true;
      // Clear any existing countdown
      if (state.imageCountdownInterval) {
        clearInterval(state.imageCountdownInterval);
        state.imageCountdownInterval = null;
      }
    }
    
    // Handle paragraph questions with 10-second timeout
    if (question.type === "paragraph") {
      // Always show passage for new paragraph questions
      elements.passage.style.display = "block";
      
      // Voice announcement: "10 seconds left" (spoken once)
      if (state.coachVoice) {
        speak("10 seconds left");
      }
      
      // Start countdown timer for paragraph questions (will show in coach panel)
      state.paragraphCountdown = 10;
      updateParagraphCountdown();
      
      // Hide passage after 10 seconds for paragraph-type questions
      state.paragraphHideTimeoutId = setTimeout(() => {
        elements.passage.style.display = "none";
        // Clear countdown when passage hides
        if (state.paragraphCountdownInterval) {
          clearInterval(state.paragraphCountdownInterval);
          state.paragraphCountdownInterval = null;
        }
        // Show message that passage is hidden
        showParagraphHiddenMessage();
      }, 10000);
    } else {
      // Show passage for non-paragraph questions
      elements.passage.style.display = "block";
      // Clear any existing paragraph countdown
      if (state.paragraphCountdownInterval) {
        clearInterval(state.paragraphCountdownInterval);
        state.paragraphCountdownInterval = null;
      }
      // Clear any existing paragraph hide timeout
      if (state.paragraphHideTimeoutId) {
        clearTimeout(state.paragraphHideTimeoutId);
        state.paragraphHideTimeoutId = null;
      }
    }
    elements.passage.textContent = question.passage;
    elements.questionText.textContent = question.question;

    // Build options (radio for single, checkbox for multi)
    elements.answersForm.innerHTML = "";
    const isMulti = question.type === "multi";
    if (isMulti) {
      elements.answersForm.setAttribute("role", "group");
    } else {
      elements.answersForm.setAttribute("role", "radiogroup");
    }

    question.options.forEach((optionText, optionIndex) => {
      const id = `opt-${state.currentIndex}-${optionIndex}`;
      const wrapper = document.createElement("label");
      wrapper.className = "answer";
      const input = document.createElement("input");
      input.type = isMulti ? "checkbox" : "radio";
      input.name = isMulti ? `answer-${state.currentIndex}-${optionIndex}` : "answer";
      input.value = String(optionIndex);
      input.id = id;
      const text = document.createElement("span");
      text.textContent = `${optionIndex + 1}. ${optionText}`;
      wrapper.appendChild(input);
      wrapper.appendChild(text);
      elements.answersForm.appendChild(wrapper);
    });

    elements.submitButton.disabled = true;
    elements.nextButton.disabled = true;
    if (elements.backButton) elements.backButton.disabled = state.currentIndex === 0;
    elements.restartButton.hidden = true;
    state.hasAnsweredCurrent = false;

    // Focus first option for keyboard flow
    const first = elements.answersForm.querySelector("input");
    if (first) first.focus();

    if (state.currentIndex === 0) {
      coachSay("Let's do this! Steady focus, one question at a time.");
    }

    // Reset therapist facial expression
    try {
      const happy = elements.therapist?.querySelector('.mouth-happy');
      const sad = elements.therapist?.querySelector('.mouth-sad');
      const idle = elements.therapist?.querySelector('.mouth-idle');
      if (happy) happy.classList.remove('show');
      if (sad) sad.classList.remove('show');
      if (idle) idle.classList.add('show');
      const avatar = elements.therapistAvatar;
      avatar?.classList.remove('animate','idle-wiggle','idle-breathe','idle-nod','size-sm','size-lg','pet');
      // Always enable pet visuals by default
      avatar?.classList.add('pet');
      if (state.avatarSize === 'sm') avatar?.classList.add('size-sm');
      if (state.avatarSize === 'lg') avatar?.classList.add('size-lg');
      updateAvatarIdleAnimation();
      if (elements.therapistActions) elements.therapistActions.hidden = true;
    } catch (_) {}
  }

  // Game control
  function startTimer() {
    stopTimer();
    state.intervalId = setInterval(() => {
      state.secondsLeft -= 1;
      renderHud();
      updateAvatarIdleAnimation();
      if (state.coachEnabled && state.secondsLeft === 30) coachSay("30 seconds left. Breathe and keep your pace.");
      if (state.secondsLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  function startGame() {
    state.isActive = true;
    state.score = 0;
    state.currentIndex = 0;
    const mode = elements.modeSelect?.value || "all";
    const difficulty = elements.difficultySelect?.value || "all";
    const byMode = filterByMode(questionBank, mode);
    const byDifficulty = filterByDifficulty(byMode, difficulty);
    const candidate = byDifficulty.length ? byDifficulty : questionBank;
    state.order = pickProgressiveOrder(candidate);
    
    console.log('Game started with:', {
      mode: mode,
      difficulty: difficulty,
      totalQuestions: questionBank.length,
      filteredQuestions: byMode.length,
      finalQuestions: state.order.length
    });
    
    state.secondsLeft = config.gameSeconds;
    state.hasAnsweredCurrent = false;
    state.streak = 0;
    // Force defaults regardless of toggles
    state.coachEnabled = true;
    state.coachVoice = !!elements.voiceToggle?.checked;
    state.avatarSize = 'sm';
    state.avatarTheme = 'auto';
    state.petEnabled = true;

    elements.introSection.hidden = true;
    elements.questionSection.hidden = false;
    renderHud();
    renderQuestion();
    startTimer();
  }

  function endGame() {
    stopTimer();
    state.isActive = false;
    elements.submitButton.disabled = true;
    elements.nextButton.disabled = true;
    elements.restartButton.hidden = false;
    saveHighScore(state.score);
    renderHud();
    elements.feedback.textContent = `Time's up! Final score: ${state.score}`;
    elements.feedback.className = "feedback ok";
    elements.restartButton.focus();
    coachSay(`Session complete. Score ${state.score}. Nice work!`);
  }

  function submitAnswer() {
    if (state.hasAnsweredCurrent) return;
    const question = state.order[state.currentIndex];
    const isMulti = question.type === "multi";

    if (!isMulti) {
      const selected = elements.answersForm.querySelector("input[name=\"answer\"]:checked");
      if (!selected) return;

      state.hasAnsweredCurrent = true;
      const chosenIndex = Number(selected.value);

      const optionLabels = Array.from(elements.answersForm.querySelectorAll("label.answer"));
      optionLabels.forEach((label, idx) => {
        if (idx === question.correctIndex) label.classList.add("correct");
        if (idx === chosenIndex && chosenIndex !== question.correctIndex) label.classList.add("wrong");
      });

              if (chosenIndex === question.correctIndex) {
          // Calculate points earned
          const basePoints = config.pointsPerCorrect;
          const streakBonus = Math.min(state.streak * 2, 20); // 2 points per streak, max 20
          const totalPoints = basePoints + streakBonus;
          
          state.score += totalPoints;
          state.streak += 1;
          
          // Store points earned for display
          state.lastPointsEarned = {
            base: basePoints,
            streak: streakBonus,
            total: totalPoints
          };
          
          elements.scoreValue.textContent = String(state.score);
          
          elements.feedback.textContent = "Correct!";
          elements.feedback.className = "feedback ok";
          if (state.streak >= 3) coachSay("Great streak! Keep it going."); else coachSay("Good job! Next one.");
          try {
            const happy = elements.therapist?.querySelector('.mouth-happy');
            const sad = elements.therapist?.querySelector('.mouth-sad');
            const idle = elements.therapist?.querySelector('.mouth-idle');
            const tongue = elements.therapist?.querySelector('.tongue');
            if (happy) happy.classList.add('show');
            if (sad) sad.classList.remove('show');
            if (idle) idle.classList.remove('show');
            if (tongue) { tongue.classList.remove('pop'); void tongue.offsetWidth; tongue.classList.add('pop'); }
            elements.therapistAvatar?.classList.add('animate');
            elements.therapistAvatar?.classList.remove('idle-wiggle','idle-breathe','idle-nod');
            if (state.petEnabled) {
              const earL = elements.therapist?.querySelector('.ear-left');
              const earR = elements.therapist?.querySelector('.ear-right');
              const tail = elements.therapist?.querySelector('.pet-tail');
              const handL = elements.therapist?.querySelector('.hand-left');
              const handR = elements.therapist?.querySelector('.hand-right');
              const body = elements.therapist?.querySelector('.pet-body');
              const legFL = elements.therapist?.querySelector('.leg-front-left');
              const legFR = elements.therapist?.querySelector('.leg-front-right');
              const legBL = elements.therapist?.querySelector('.leg-back-left');
              const legBR = elements.therapist?.querySelector('.leg-back-right');
              const pawFL = elements.therapist?.querySelector('.paw-front-left');
              const pawFR = elements.therapist?.querySelector('.paw-front-right');
              const pawBL = elements.therapist?.querySelector('.paw-back-left');
              const pawBR = elements.therapist?.querySelector('.paw-back-right');
              
              // Head animations
              earL?.classList.add('ear-wiggle-left');
              earR?.classList.add('ear-wiggle-right');
              tail?.classList.add('tail-wag');
              handL?.classList.add('hand-wave-enhanced');
              handR?.classList.add('hand-wave-enhanced');
              
              // Enhanced body jumping animation
              body?.classList.add('jump');
              legFL?.classList.add('leg-bounce-left');
              legFR?.classList.add('leg-bounce-right');
              legBL?.classList.add('leg-bounce-left');
              legBR?.classList.add('leg-bounce-right');
              pawFL?.classList.add('leg-bounce-left');
              pawFR?.classList.add('leg-bounce-right');
              pawBL?.classList.add('leg-bounce-left');
              pawBR?.classList.add('leg-bounce-right');
              
              // Special celebration for high streaks
              if (state.streak >= 5) {
                elements.therapistAvatar?.classList.add('celebration-spin');
              }
              
              // Enhanced celebrations - 3 effects at once
              spawnHearts(3);
              showPointsEarned();
              
              setTimeout(() => { 
                earL?.classList.remove('ear-wiggle-left'); 
                earR?.classList.remove('ear-wiggle-right'); 
                tail?.classList.remove('tail-wag');
                handL?.classList.remove('hand-wave-enhanced');
                handR?.classList.remove('hand-wave-enhanced');
                body?.classList.remove('jump');
                legFL?.classList.remove('leg-bounce-left');
                legFR?.classList.remove('leg-bounce-right');
                legBL?.classList.remove('leg-bounce-left');
                legBR?.classList.remove('leg-bounce-right');
                pawFL?.classList.remove('leg-bounce-left');
                pawFR?.classList.remove('leg-bounce-right');
                pawBL?.classList.remove('leg-bounce-left');
                pawBR?.classList.remove('leg-bounce-right');
                elements.therapistAvatar?.classList.remove('celebration-spin');
              }, 1200);
            }
            if (elements.therapistActions) elements.therapistActions.hidden = false;
          } catch (_) {}
          setTimeout(() => updateAvatarIdleAnimation(), 1000);
        } else {
        state.streak = 0;
        elements.feedback.textContent = `Oops! Correct answer: ${question.options[question.correctIndex]}`;
        elements.feedback.className = "feedback no";
        coachSay("No worries. Read the key detail and try the next.");
        try {
          const happy = elements.therapist?.querySelector('.mouth-happy');
          const sad = elements.therapist?.querySelector('.mouth-sad');
          const idle = elements.therapist?.querySelector('.mouth-idle');
          if (happy) happy.classList.remove('show');
          if (sad) sad.classList.add('show');
          if (idle) idle.classList.remove('show');
          elements.therapistAvatar?.classList.add('animate');
          elements.therapistAvatar?.classList.remove('idle-wiggle');
          if (elements.therapistActions) elements.therapistActions.hidden = false;
        } catch (_) {}
        setTimeout(() => updateAvatarIdleAnimation(), 1000);
      }
      if (question.explanation) {
        elements.explanation.textContent = question.explanation;
        elements.explanation.hidden = false;
      }
    } else {
      const checked = Array.from(elements.answersForm.querySelectorAll("input[type=checkbox]:checked"));
      if (checked.length === 0) return;

      state.hasAnsweredCurrent = true;
      const chosenIndexes = checked.map(i => Number(i.value)).sort();
      const correct = (question.correctIndexes || []).slice().sort();

      const isExactlyCorrect = chosenIndexes.length === correct.length && chosenIndexes.every((v, i) => v === correct[i]);

      const optionLabels = Array.from(elements.answersForm.querySelectorAll("label.answer"));
      optionLabels.forEach((label, idx) => {
        if (correct.includes(idx)) label.classList.add("correct");
        if (chosenIndexes.includes(idx) && !correct.includes(idx)) label.classList.add("wrong");
      });

             if (isExactlyCorrect) {
         // Calculate points earned
         const basePoints = config.pointsPerCorrect;
         const streakBonus = Math.min(state.streak * 2, 20); // 2 points per streak, max 20
         const totalPoints = basePoints + streakBonus;
         
         state.score += totalPoints;
         state.streak += 1;
         
         // Store points earned for display
         state.lastPointsEarned = {
           base: basePoints,
           streak: streakBonus,
           total: totalPoints
         };
         
         elements.scoreValue.textContent = String(state.score);
         
         elements.feedback.textContent = "Correct!";
         elements.feedback.className = "feedback ok";
         if (state.streak >= 3) coachSay("Excellent streak!"); else coachSay("Nice! Onward.");
         try {
           const happy = elements.therapist?.querySelector('.mouth-happy');
           const sad = elements.therapist?.querySelector('.mouth-sad');
           const idle = elements.therapist?.querySelector('.mouth-idle');
           const tongue = elements.therapist?.querySelector('.tongue');
           if (happy) happy.classList.add('show');
           if (sad) sad.classList.remove('show');
           if (idle) idle.classList.remove('show');
           if (tongue) { tongue.classList.remove('pop'); void tongue.offsetWidth; tongue.classList.add('pop'); }
           elements.therapistAvatar?.classList.add('animate');
           elements.therapistAvatar?.classList.remove('idle-wiggle','idle-breathe','idle-nod');
           if (state.petEnabled) {
             const earL = elements.therapist?.querySelector('.ear-left');
             const earR = elements.therapist?.querySelector('.ear-right');
             const tail = elements.therapist?.querySelector('.pet-tail');
             const handL = elements.therapist?.querySelector('.hand-left');
             const handR = elements.therapist?.querySelector('.hand-right');
             const body = elements.therapist?.querySelector('.pet-body');
             const legFL = elements.therapist?.querySelector('.leg-front-left');
             const legFR = elements.therapist?.querySelector('.leg-front-right');
             const legBL = elements.therapist?.querySelector('.leg-back-left');
             const legBR = elements.therapist?.querySelector('.leg-back-right');
             const pawFL = elements.therapist?.querySelector('.paw-front-left');
             const pawFR = elements.therapist?.querySelector('.paw-front-right');
             const pawBL = elements.therapist?.querySelector('.paw-back-left');
             const pawBR = elements.therapist?.querySelector('.paw-back-right');
             
             // Head animations
             earL?.classList.add('ear-wiggle-left');
             earR?.classList.add('ear-wiggle-right');
             tail?.classList.add('tail-wag');
             handL?.classList.add('hand-wave-enhanced');
             handR?.classList.add('hand-wave-enhanced');
             
             // Enhanced body jumping animation
             body?.classList.add('jump');
             legFL?.classList.add('leg-bounce-left');
             legFR?.classList.add('leg-bounce-right');
             legBL?.classList.add('leg-bounce-left');
             legBR?.classList.add('leg-bounce-right');
             pawFL?.classList.add('leg-bounce-left');
             pawFR?.classList.add('leg-bounce-right');
             pawBL?.classList.add('leg-bounce-left');
             pawBR?.classList.add('leg-bounce-right');
             
             // Special celebration for high streaks
             if (state.streak >= 5) {
               elements.therapistAvatar?.classList.add('celebration-spin');
             }
             
             // Enhanced celebrations - 3 effects at once
             spawnHearts(3);
             showPointsEarned();
             
             setTimeout(() => { 
               earL?.classList.remove('ear-wiggle-left'); 
               earR?.classList.remove('ear-wiggle-right'); 
               tail?.classList.remove('tail-wag');
               handL?.classList.remove('hand-wave-enhanced');
               handR?.classList.remove('hand-wave-enhanced');
               body?.classList.remove('jump');
               legFL?.classList.remove('leg-bounce-left');
               legFR?.classList.remove('leg-bounce-right');
               legBL?.classList.remove('leg-bounce-left');
               legBR?.classList.remove('leg-bounce-right');
               pawFL?.classList.remove('leg-bounce-left');
               pawFR?.classList.remove('leg-bounce-right');
               pawBL?.classList.remove('leg-bounce-left');
               pawBR?.classList.remove('leg-bounce-right');
               elements.therapistAvatar?.classList.remove('celebration-spin');
             }, 1200);
           }
           if (elements.therapistActions) elements.therapistActions.hidden = false;
         } catch (_) {}
         setTimeout(() => updateAvatarIdleAnimation(), 1000);
       } else {
        state.streak = 0;
        const correctText = correct.map(i => question.options[i]).join(", ");
        elements.feedback.textContent = `Close! Correct answers: ${correctText}`;
        elements.feedback.className = "feedback no";
        coachSay("Close one. Check each option carefully next time.");
        try {
          const happy = elements.therapist?.querySelector('.mouth-happy');
          const sad = elements.therapist?.querySelector('.mouth-sad');
          const idle = elements.therapist?.querySelector('.mouth-idle');
          if (happy) happy.classList.remove('show');
          if (sad) sad.classList.add('show');
          if (idle) idle.classList.remove('show');
          elements.therapistAvatar?.classList.add('animate');
          elements.therapistAvatar?.classList.remove('idle-wiggle');
          if (elements.therapistActions) elements.therapistActions.hidden = false;
        } catch (_) {}
        setTimeout(() => updateAvatarIdleAnimation(), 1000);
      }
      if (question.explanation) {
        elements.explanation.textContent = question.explanation;
        elements.explanation.hidden = false;
      }
    }

    renderHud();

    // Lock inputs
    const inputs = elements.answersForm.querySelectorAll("input");
    inputs.forEach(r => r.disabled = true);

    elements.submitButton.disabled = true;
    elements.nextButton.disabled = false;
    elements.nextButton.focus();
  }

  function goNext() {
    if (!state.isActive) return;
    state.currentIndex += 1;
    console.log('goNext called, currentIndex:', state.currentIndex, 'order length:', state.order.length);
    if (state.currentIndex >= state.order.length) {
      // Show completion screen when all questions are done
      console.log('Showing completion screen!');
      showCompletionScreen();
      return;
    }
    renderQuestion();
  }

  function goBack() {
    if (!state.isActive) return;
    if (state.currentIndex === 0) return;
    state.currentIndex -= 1;
    renderQuestion();
  }

  function onAnswerChange() {
    if (!state.isActive) return;
    const question = state.order[state.currentIndex];
    const isMulti = question.type === "multi";
    if (!isMulti) {
      const hasSelection = !!elements.answersForm.querySelector("input[name=\"answer\"]:checked");
      elements.submitButton.disabled = !hasSelection;
    } else {
      const anyChecked = elements.answersForm.querySelectorAll("input[type=checkbox]:checked").length > 0;
      elements.submitButton.disabled = !anyChecked;
    }
  }

  function showPointsEarned() {
    if (!state.lastPointsEarned) return;
    
    const { base, streak, total } = state.lastPointsEarned;
    
    // Create points display element
    const pointsDisplay = document.createElement('div');
    pointsDisplay.className = 'points-earned';
    pointsDisplay.innerHTML = `
      <div class="points-base">+${base} pts</div>
      ${streak > 0 ? `<div class="points-streak">+${streak} streak bonus!</div>` : ''}
      <div class="points-total">Total: +${total} pts</div>
    `;
    
    // Position it near the avatar
    pointsDisplay.style.position = 'absolute';
    pointsDisplay.style.bottom = '200px';
    pointsDisplay.style.right = '20px';
    pointsDisplay.style.zIndex = '1000';
    
    document.body.appendChild(pointsDisplay);
    
    // Animate the points display
    setTimeout(() => {
      pointsDisplay.style.transform = 'translateY(-20px) scale(1.1)';
      pointsDisplay.style.opacity = '0.8';
    }, 100);
    
    // Remove after animation
    setTimeout(() => {
      if (pointsDisplay.parentNode) {
        pointsDisplay.parentNode.removeChild(pointsDisplay);
      }
    }, 2000);
  }
  
  // Keyboard interactions
  function onKeyDown(evt) {
    if (!state.isActive) return;
    const key = evt.key.toLowerCase();

    // Number keys 1-9 toggle/select options. For radio: select one. For multi: toggle.
    if (["1","2","3","4","5","6","7","8","9"].includes(key)) {
      const index = Number(key) - 1;
      const inputs = elements.answersForm.querySelectorAll("input");
      const target = inputs[index];
      if (target && !target.disabled) {
        if (target.type === "radio") {
          target.checked = true;
        } else {
          target.checked = !target.checked;
        }
        onAnswerChange();
        target.focus();
        evt.preventDefault();
      }
      return;
    }

    if (key === "enter") {
      if (!elements.submitButton.disabled) submitAnswer();
      else if (!elements.nextButton.disabled) goNext();
      evt.preventDefault();
      return;
    }

    if (key === "n") {
      if (!elements.nextButton.disabled) goNext();
      evt.preventDefault();
      return;
    }

    if (key === "b") {
      if (elements.backButton && !elements.backButton.disabled) goBack();
      evt.preventDefault();
      return;
    }

    if (key === "r") {
      if (!state.isActive) startGame();
      evt.preventDefault();
    }
  }

  // Wire events
  function wireEvents() {
    elements.startButton?.addEventListener("click", startGame);
    elements.restartButton?.addEventListener("click", startGame);
    elements.submitButton?.addEventListener("click", (e) => { e.preventDefault(); submitAnswer(); });
    elements.backButton?.addEventListener("click", (e) => { e.preventDefault(); goBack(); });
    elements.nextButton?.addEventListener("click", (e) => { e.preventDefault(); goNext(); });
    elements.answersForm?.addEventListener("change", onAnswerChange);
    document.addEventListener("keydown", onKeyDown);
    elements.highFiveBtn?.addEventListener("click", () => coachSay("High five! You’re building skills step by step."));
    elements.tipBtn?.addEventListener("click", () => coachSay("Tip: skim for names, places, and times before options."));
    elements.therapistAvatar?.addEventListener("click", () => {
      try {
        const left = elements.therapist?.querySelector('.eyelid-left');
        const right = elements.therapist?.querySelector('.eyelid-right');
        if (right) { right.style.opacity = '1'; setTimeout(() => { right.style.opacity = '0'; }, 180); }
        coachSay("I'm here with you. Let's keep going!");
      } catch (_) {}
    });
  }

  // Initialize
  function init() {
    elements.highScoreValue.textContent = String(loadHighScore());
    elements.timerValue.textContent = formatTime(config.gameSeconds);
    wireEvents();
  }

  init();
})();


