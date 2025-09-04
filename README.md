# Neuro-Cognitive Game Suite

This project is a collection of games developed for the Neuro-Cognitive Games Hackathon, designed to target specific cognitive domains in an engaging and accessible way.

## Play the Games

[**Click here to play the latest version**](https://casparhealth.github.io/hackathon2025-team9-reha-rush/)

---

## Our Games

### 1. Reha Rush (Attention Game)

Reha Rush is a fast-paced routing game where players must direct therapeutic equipment to the correctly matching clinic, testing and training multiple facets of attention.

#### Game Idea & Therapeutic Intent

The core idea is to create a game that is simple to understand but increasingly difficult to master, directly targeting key aspects of **Attention**:

*   **Selective Attention:** Players must focus on the color and type of incoming equipment, filtering out other items on screen to make the correct routing decision at path switches.
*   **Divided Attention:** As the game progresses, players must handle multiple pieces of equipment at once, dividing their attention between different paths and upcoming spawns.
*   **Attentional Flexibility:** The need to constantly re-evaluate the board and adjust routing priorities as new equipment appears requires players to be mentally flexible.
*   **Sustained Attention:** The progressively faster pace of later levels challenges players to maintain focus over the entire duration of the game.

#### Use of LLMs

The development of Reha Rush was significantly accelerated through the use of Large Language Models in a pair-programming workflow:

*   **Replit AI Agent:** The initial MVP of the game, including the core grid and movement logic, was rapidly prototyped using Replit's AI agent. This allowed for quick iteration on the basic game mechanics.
*   **Cursor (GPT-5 and gemini-2.5-pro Integration):** The project was then moved to Cursor to build upon the Replit base. Cursor's AI features were used for more complex tasks, including refactoring the codebase, implementing new features like the tutorial and level progression, and debugging complex navigational logic.
*   **ChatGPT:** All visual assets for the game—including the clinic icons and equipment sprites—were generated using ChatGPT (DALL-E 3) to create a cohesive and friendly art style.

#### Notable Blockers

*   **Technical:** The primary technical challenge was managing the game's state and rendering logic in vanilla JavaScript without a formal game engine. Ensuring smooth animations and responsive controls required careful handling of the canvas rendering loop and event listeners.
*   **Clinical:** The main clinical challenge was balancing the game's difficulty to be engaging but not overwhelming. Fine-tuning the speed, number of items, and complexity of the maps was an iterative process to ensure the game effectively trains attention without causing excessive frustration.

---

### 2. Neuro-Cognitive Reading Game (Memory Game)

The Neuro-Cognitive Reading Game (Memory Game) is designed to strengthen working memory, attention, and reading comprehension

#### Game Idea & Therapeutic Intent

Train short-term and working memory

Support reading fluency and comprehension by embedding memory tasks within narrative or text-based contexts.

Enhance attention control by challenging players to focus on key textual details and ignore distractions.

#### Use of LLMs

*   **Cursor with GPT-5 Integration:** Cursor's AI features were  used to implement new features

#### Notable Blockers

Clinical validation: Ensuring that LLM-generated text is both therapeutically effective and clinically appropriate required review by cognitive therapists. Some outputs were too complex, culturally biased, or lacked therapeutic alignment.

