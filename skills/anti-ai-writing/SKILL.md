---
name: anti-ai-writing
description: Detect and eliminate signs of AI-generated writing. Use when producing any user-facing text — blog posts, landing pages, docs, emails, social media, README, marketing copy. Enforces human-quality prose by flagging Wikipedia's documented AI writing tells.
user-invocable: true
group: comms
prerequisites: []
next: []
workflows: [all]
always-load: true
---

# Anti-AI Writing

Every piece of text this harness produces must read like a human wrote it. AI-generated writing has documented tells. This skill flags and fixes them.

Source: Wikipedia's "Signs of AI writing" — the most comprehensive public catalog of AI writing patterns.

## Banned Words and Phrases

Never use these. They are the most documented AI tells:

**Promotional fluff:** vibrant, nestled, rich heritage, groundbreaking, showcasing, diverse array, pivotal moment, stands as, testament, marks a shift, broader trends, cutting-edge, revolutionizing, game-changing, innovative

**Vague intensifiers:** delve, intricate, tapestry, foster, enhance, leverage, utilize, multifaceted, comprehensive, robust, seamless

**False attribution:** industry reports suggest, experts argue, researchers note, studies show (without citing specific studies)

**Filler transitions:** additionally, furthermore, moreover, it's worth noting, it's important to note, in today's landscape, in the realm of

**Outline conclusions:** "Despite its [positive traits], [subject] faces challenges..." — never use this formula

## Structural Tells to Avoid

1. **Rule of Three abuse** — stop listing three adjectives or three phrases for artificial comprehensiveness. Use one strong word.
2. **Negative parallelisms** — "Not just X, but also Y" sounds like a press release. Say what it IS.
3. **Elegant variation** — don't replace a word with a synonym just to avoid repetition. Repeat the word. "The API" is clearer than "the interface" the second time.
4. **Em dash overuse** — use commas or parentheses. Em dashes in every paragraph = AI tell.
5. **Excessive boldface** — bold is for emphasis, not decoration. One bold per paragraph max.
6. **Title Case headings** — use sentence case: "How to deploy" not "How To Deploy"
7. **Inline-header bullet lists** — not everything needs to be a bold-header-colon-description bullet. Write prose.
8. **Section summaries** — never summarize what you just said at the end of a section.

## Tone Rules

1. **Never sound promotional.** You're explaining, not selling. "This tool syncs your database" not "This powerful tool revolutionizes database synchronization."
2. **Never inflate significance.** Small features are small. Don't call a config change a "pivotal moment."
3. **Never address the reader as "you" in docs** unless it's a tutorial with explicit steps. "Users can configure X" not "You can configure X."
4. **Never use collaborative language.** "Let's explore" and "we'll dive into" are chatbot patterns. State the information directly.
5. **Be specific.** "Reduces API calls by 40%" beats "significantly improves performance." Numbers over adjectives.
6. **Be direct.** "This function returns null on failure" beats "This function is designed to gracefully handle failure scenarios by returning a null value."

## Verification

After writing any text, check:
- [ ] No banned words/phrases from the list above
- [ ] No Rule of Three patterns (3 adjectives, 3 phrases in a row)
- [ ] No em dashes used where commas would work
- [ ] No promotional tone — would a technical writer approve this?
- [ ] No vague claims without specific evidence
- [ ] Sentence case headings, not Title Case
- [ ] Prose over bullet lists where possible
- [ ] No "in conclusion" or "in summary" wrapping sections

## Anti-Patterns

- Writing a landing page that sounds like every other AI-generated landing page
- Blog posts that "delve into" topics and find them "multifaceted"
- README files that describe the project as "a robust, comprehensive solution"
- Emails that start with "I hope this message finds you well"
- Social media posts with emoji before every bullet point
