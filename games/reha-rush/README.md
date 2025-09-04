# Neuro-Cognitive Reading Game

A lightweight, accessible web app to practice reading comprehension and fast, accurate responses. Built with vanilla JavaScript, HTML, and CSS. No build step required.

## Run

- Option 1: Double-click `index.html` to open in your browser.
- Option 2: Serve locally for best results:

```bash
cd /Users/Charitha/Documents/Game
python3 -m http.server 5500
# then open http://localhost:5500 in your browser
```

## How to Play

1. Press Start to begin a 90-second session.
2. Read the passage and the question.
3. Select an answer (1–4 keys also work), press Enter to submit.
4. Press Next (or N) to continue. Try to beat your high score.

### Modes

- Choose question mode on the intro screen:
  - All: mix of text and image questions
  - Text only: hide image-based questions
  - Image only: only questions with images

### Difficulty
### AI Coach

- Enable "AI Coach encouragement" on the intro screen to see motivational messages during play.
- Optional "Voice (text-to-speech)" will read the coach messages aloud (uses the browser's TTS).
- Triggers: session start, correct/incorrect answers, streaks, low time, session end.

### Therapist Avatar

- A friendly therapist-like avatar reacts to correct/incorrect answers with subtle animations.
- Interactive actions: "High five" and "Tip" provide encouragement and quick strategy reminders.
- Tied to the AI Coach toggle; disable the coach to hide the avatar.

- Choose difficulty on the intro screen:
  - All: mixed difficulty
  - Easy, Medium, Hard: filter to selected level

## Features

- Progressive difficulty (easy → medium → hard)
- Timer and scoring (+10 for each correct answer)
- Local high score using `localStorage`
- Keyboard shortcuts: 1–9 select/toggle, Enter submit, N next, R restart
- Accessible labels, focus states, and live feedback
- Responsive, mobile-friendly UI

## Customize

- Edit `app.js` and modify `questionBank` to add your own content.
- Tweak `config.gameSeconds` or `config.pointsPerCorrect` for different session rules.

## Multi-choice types

- Single-select (default): omit `type` or set `type: "single"`, and provide `correctIndex`.
- Multi-select: set `type: "multi"`, and provide an array `correctIndexes`.

Example entries in `questionBank`:

```js
// Single-select
{ passage: "Water freezes at 0°C.", question: "At what temperature does water freeze?", options: ["100°C", "0°C", "10°C", "-10°C"], correctIndex: 1 }

// Multi-select
{ type: "multi", passage: "Healthy habits include regular exercise, balanced diet, and adequate sleep.", question: "Select all healthy habits mentioned.", options: ["Regular exercise", "Skipping breakfast", "Balanced diet", "Adequate sleep"], correctIndexes: [0, 2, 3] }
```

## Explanations

- Add an optional `explanation` to any question to show immediate feedback with a brief rationale after submission.

Example:

```js
{ passage: "The hippocampus helps form new declarative memories.", question: "Which brain region is critical for forming new memories?", options: ["Hippocampus", "Cerebellum", "Medulla", "Cochlea"], correctIndex: 0, explanation: "The hippocampus is essential for forming new episodic/declarative memories." }
```

## Media (images)

- You can attach an optional image to a question via a `media` object.
- Supported: `{ media: { type: "image", src: "URL", alt: "description" } }`

Example:

```js
{ media: { type: "image", src: "https://example.com/image.jpg", alt: "A red apple" }, passage: "", question: "What color is the fruit?", options: ["Green", "Yellow", "Red", "Purple"], correctIndex: 2 }
```

## License

MIT


