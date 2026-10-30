# Skypost

Postcards of the sky in four places, right now. Pick up to four places and each one arrives as a postcard: a live sky drawn from its real weather and local time on the front, and the weather written on the back. Then paint all four as one AI-generated picture, a 2x2 grid with one panel per place, and each postcard gets its own panel. The prompt is built in code from the weather data and shown as the big card's message.

![Skypost with four postcards and the painted picture](docs/screenshot.jpg)

## Run it

Needs Node.js 20.9 or newer and an OpenAI API key with credit.

```bash
git clone https://github.com/HaralambosARDELEAN/weather-dashboard.git
cd weather-dashboard
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
```

Put your key in `.env` (`OPENAI_API_KEY=...`), then:

```bash
npm run dev                 # open http://localhost:3000
```

Tests: `npm test` (no network or key needed). Production build: `npm run build && npm start`. On every push, GitHub Actions runs the lint, type check, tests and build ([`ci.yml`](.github/workflows/ci.yml)).

The key is read only on the server and never sent to the browser. Without a key, the postcards work and painting shows a message saying the key is missing.

## What it does

- **Search any city or town**, or start with a ready-made set: four time zones around the clock, four places called Paris, or four very different climates.
- **Each place is a postcard.** The front is a live sky: day, dawn, dusk or night from the place's real sunrise and sunset, and the weather on top of it. Light drizzle, rain and a downpour look different, as do light and heavy snow, fog and storms; the wind tilts the rain; frost edges the card below 0 °C and heat glows above 30 °C. The back has the temperature on a stamp, the local time on a postmark, the wind, today's high and low, and the next sunrise or sunset.
- **On a phone, swipe between the postcards**; the dots underneath show which one is in view.
- **Pick up a postcard** to read it large. Replace or remove one (with Undo); the desk keeps the four places in the browser.
- **The weather stays current:** a card older than 15 minutes is refreshed, checked every minute and when you come back to the tab.
- **Paint the picture** (the airmail button): it shows how long it has been painting, and Cancel if it takes longer than usual. The painting goes on the big card "Greetings from", each postcard shows its quadrant, and the painting can be opened large or downloaded.

## Choices

**Weather: [Open-Meteo](https://open-meteo.com/).** No key, and its geocoding returns region and country, which is what tells the many Springfields apart. Weather is requested in °C and km/h and in each place's own timezone, so "today's high and low" is that place's today, and with sunrise and sunset, so day and night follow the real sun (including polar day and night). Its free API is for non-commercial use only; a client project would need one of their paid plans.

**Image model: OpenAI `gpt-image-2.5-flare`.** OpenAI's fast image model: in my tests a picture took about 15–20 seconds, and it handles four labelled panels well. The model can be changed in `.env` (`OPENAI_IMAGE_MODEL`) without touching code. I first planned for `gpt-image-1`, but OpenAI shut it down on 23 October 2026.

**Next.js + TypeScript.** One process, API routes keep the key on the server, and it is the stack I know best.

**Postcards.** The brief asks for four places and one picture made of four panels. A postcard gives every piece of data a natural home: the sky is the picture, the temperature is the stamp, the local time is the postmark, the details are the message. And the AI painting splits back into the four postcards.

How it fits together:

- The browser sends only the four place IDs to `/api/image`. The server looks up each place and its weather itself and builds the prompt, so every number in the prompt comes from the weather API and nothing can be injected from the browser.
- Every outside answer is checked with zod. Every outside call has a timeout (8 s for Open-Meteo, 90 s for the image model), and Open-Meteo is tried again when it is busy.
- No personal data is collected. The four places are saved only in the browser (localStorage), there are no accounts or cookies, and the fonts are served by the app itself, not by Google. Open-Meteo and OpenAI are called only from the server, so they never see the visitor's IP address.
- Failures stay local: a place that does not exist, a card whose weather does not load (with Try again), an image model that times out, refuses or has no credit. Each shows a clear message, and the rest of the desk keeps working.
- Motion is decorative and stops when it is off screen or when the system asks for reduced motion.

## What does not work yet

- The painting is not kept after a reload. Only the four places are.
- The live sky shows a generic horizon, not the real place. The painting is where the place itself appears.
- The prompt rules reduce the model's mistakes but do not remove them. For example, Cairo sometimes gets autumn leaves it would not have.
- There is no limit on how often the picture can be painted, so anyone using a running copy can spend the key's credit.

## With one more day

In this order:

1. **A rate limit on `/api/image`.** Every picture costs money, and anyone who can open a running copy can spend the key's credit.
2. **End-to-end tests with Playwright, added to the CI:** search, paint and the failure messages, in a real browser. The current tests cover the logic and the API routes, not the page.
3. **Weather cached on the server for a few minutes:** fewer calls to Open-Meteo and faster reloads.
4. **Keep the last painting** after a reload.

## How I used AI

I built this with **Claude Code** (Anthropic's coding agent, model Claude Opus 5.5). I gave it the brief; we chose the stack and planned the design together before any code. It wrote most of the code and tests. I checked every step in the browser before each commit and asked for changes when something was wrong.

**The design.** The first version worked but looked too plain for a product. I asked for several complete designs instead of one: Claude Code ran four separate design agents, each with the same brief and real data, and each made a full working mock-up. I compared them in the browser and picked the postcards, then we ported it into the app and refined it together. The name Skypost came out of that.

What I changed or threw away along the way:

- Its first design, a cream "printed almanac" with a serif display face, looked like a typical AI template, and the cards after it were too plain. Both were replaced.
- Weather-map station symbols were unclear to me; normal weather icons replaced them. Snowflake-like ice crystals for frost looked like snow, so frost is now an icy edge on the card.
- Light drizzle and light rain were hard to see by day; each step of rain and snow now looks clearly different.
- The headline first summarised the weather ("Night in three places…"), which repeated the postcards; it now just says where the postcards are in their journey.
- I found in the browser that removing a postcard under the mouse left its quadrant highlighted on the big card; fixed.
- I asked for the local time with AM/PM, a clearly highlighted search result, the ready-made sets, and a postmark that is easy to read.
- The first plan sent whole place objects from the browser to the image route; we changed it to IDs only (see above).

What the image model got wrong, and how the prompt now constrains it. All of these were found by generating real pictures, and each rule has a test:

- **Cherry blossom in Tokyo at the end of October.** Each panel now states its season, by hemisphere, and none near the equator.
- **Flowers in Antarctica at -43 °C**, because it was spring there. Plants must match the temperature too: no flowers or green leaves below freezing.
- **Rain hardly visible, and wet streets under a dry night sky.** Rain and snow are described by what can be seen, and each panel states its ground (dry, wet, snow).
- Two guards added before seeing the failure: no landmarks from other places with the same name (Paris, Texas got its water tower, not the Eiffel Tower), and no snow on the ground in a warm "winter".

Problems caught by running the checks (the production build and real requests), not by reading the code: `next build` failed because the API routes read `request.url` inside a `try` block, which hid Next 16's "this route is dynamic" signal; Open-Meteo answers 429 "Too many concurrent requests" when four cards load at once, which is why it is now tried again; and a client component that read the clock during prerendering broke the build until the page waited for the saved places first.

---

Weather data by [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
