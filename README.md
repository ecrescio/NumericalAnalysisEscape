# The Enchanted Energy Manual

Complete static escape-room teaching activity in English. Open index.html, or upload this folder’s contents to the root of a GitHub Pages repository. No build is needed.

## Included
Four rooms, nine questions, field notes before each question, shuffled choices, numeric kinetic-energy lock, bouncing-ball selector, spring graph, dark magnifying-glass search, final rune puzzle, participant name and course/block, screenshot-ready final score, and CSV export.

Wrong answers deduct 20 seconds and display a short conceptual hint without marking a choice. The initial clock is 12 minutes. Timeout permits restarting the current room with a fresh clock; previous first-attempt results and errors remain recorded. Reviewing field notes does not pause the clock.

Score = round(100 × first-attempt correct answers / 9). The final word puzzle does not contribute to this score. Questions never attempted count as zero. The final page supports completed and timed-out attempts. Reopening the whole activity starts a new independent attempt.

## Data and submission
Name and block remain in browser memory until downloaded. No participant records are sent to a server by this app. Refreshing the page loses the current session.

The final page asks students to submit a screenshot in the course platform and upload the CSV to the OneDrive folder supplied by the instructor. No OneDrive folder URL has been provided, so upload is manual.

CSV uses UTF-8 with BOM and has nine rows per participant, one per question. Overall attempt fields repeat on each row: deduplicate by attempt_id when calculating participant-level averages. Question rows include attempts, errors, first-attempt correctness, solved status, time on the question screen, and submitted responses. Elapsed time includes field notes and retry screens; question time excludes field notes. Countdown time differs from elapsed time because of penalties and retries. Dates use UTC ISO format. Filenames include the participant, block, timestamp, and unique attempt UUID. Spreadsheet formula injection is escaped.

## Editing
- assets/js/rooms.js: all nine questions, field notes, hints, answers and explanations.
- assets/js/game.js: navigation, timer, scoring, magnifier and CSV export.
- assets/css/styles.css: visuals and responsive layout.
- assets/images/: reserved for custom artwork. This version uses CSS illustrations and an SVG graph; it does not include AI-generated room artwork.

## Hosting
Upload contents to a repository root, then select the main branch and root folder in GitHub Settings > Pages. The project has not been deployed. External fonts and KaTeX assets require an internet connection; plain-text formulas remain readable without them.

This is a formative classroom activity. Because scoring is calculated in the browser, it is not a tamper-resistant examination system.

## Typography and matching revision
Only formula blocks, formula-only choices, and explicitly recognized inline symbols use KaTeX. Normal English options retain spaces. Multiple formula blocks wrap independently on small screens.
Two matching practices precede questions 2 and 7: pendulum energy extrema on a time graph, and ordering four spring-experiment steps. Drag or select a card and then its destination; all four placements are checked together. Incorrect complete arrangements cost 20 seconds and give a hint. Their errors appear separately in CSV as practice_errors and do not change the nine-question first-attempt score. The original nine questions remain intact.
