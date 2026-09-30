# ChatGPT Dots reel: Gyaani voiceover (generate this first)

Target: **40–43 s** · 9:16 reel · one continuous take · Hinglish · ~145 words.
The video is built to the voice, so record or generate this first and send the WAV.

## Fact-check vs the brief (Sept 30, 2026)

Checked against news coverage. The official page and the brief's three source links were
blocked from my environment, so these were checked via search results.

| Claim | Status | What the script does |
|---|---|---|
| Always-on agents, own cloud computer + browser, GPT-6 Astra | ✅ confirmed | Used |
| 4,000+ apps via plugins; ChatGPT, Slack, Teams | ✅ confirmed | "4000+ apps" used |
| Custom rules: allow / needs approval / block; password change always stays with you | ✅ confirmed | Used |
| Invoice example: prepared it, **sent after approval** | ✅ confirmed | Used ("tumhare OK ke baad") |
| Pro + Business Premium, eligible markets; Enterprise/Edu/Healthcare beta | ✅ confirmed | Pro + Business Premium named |
| Pro markets **exclude** EEA, Switzerland, UK; **India not confirmed** either way | ⚠️ | "India? apna account check karo" |
| One Dot to start ("one primary dot"), several "soon" | ✅ | Not claimed either way |
| SMS / phone calls | ⚠️ **sources conflict** (one says texts and calls work, another says "will text you later") | **Left out completely** |
| GPT-6.1 Astra held back a day before DevDay (went beyond permissions, didn't always report what it did) | ✅ confirmed | **Left out.** It doesn't fit in 40 s and risks confusion with Dots. Save it for a follow-up reel. |
| Meta Muse as the rival | ✅ (coverage frames Dots as OpenAI's answer to Muse) | Used; the "3 weeks earlier" timing is not stated |

## Script: Roman Hinglish (use for ElevenLabs; also the burned-in captions)

Line breaks mark beats. Leave a **short breath (~0.3 s) between beats**, because I use those gaps to sync the visuals.

```
[BEAT 1 · HOOK · 0–3.5s]
Laptop band kar diya… phir bhi kaam chal raha hai. Ye hai ChatGPT ka naya Dots.

[BEAT 2 · WHAT IT IS · 3.5–11s]
Normal ChatGPT? Tab band, kahani khatam. Par Dot ko milta hai apna khud ka cloud computer aur browser. Tum so jao — ye tumhare goal pe kaam karta rahega.

[BEAT 3 · WHAT IT DOES · 11–23s]
Slack mein bug aaya? Khud investigate karega. Invoice bhejna bhool gaye? Bana ke rakhega — aur tumhare OK ke baad bhejega. Aur woh "baad mein padhunga" wale saintaalis tabs? Ye sach mein padh lega. Chaar hazaar se zyada apps ke saath.

[BEAT 4 · THE CATCH · 23–34s]
Ab bura news. Free walon — aap club ke bahar ho. Sirf Pro aur Business Premium ke liye, eligible markets mein. India? Apna account check karo. Aur rules tum banaoge — kya khud karega, kis pe permission maangega. Password change? Woh aaj bhi tumhara kaam hai.

[BEAT 5 · CTA · 34–42s]
Meta ka Muse… ab OpenAI ka Dots. Agent wars shuru. Comment mein DOTS likho — setup notes DM mein bhejta hoon. Aur follow karo… warna tum bhi tab band karke bhool jaoge.
```

Numbers are spelled out (saintaalis = 47, chaar hazaar = 4000) so the TTS reads them in Hindi.

## Option A: ElevenLabs (Eleven v3, Hindi-capable, supports emotion tags)

**Voice Design prompt for Gyaani** (skip if you already have his voice):
> Indian male, early 30s, Hindi-leaning Hinglish speaker. Smug, sarcastic, playful AI-guru
> energy, like a know-it-all friend roasting you while explaining tech. Medium-low pitch,
> fast and punchy delivery with dramatic pauses before punchlines. Clean studio close-mic,
> no reverb.

**Settings:** Model **Eleven v3** · Stability **Creative / 35–45%** · Similarity **75%** · Style **45%** · Speed **1.05–1.1**.

**Paste this into Text to Speech** (v3 reads the [tags] as delivery directions, not words):

```
[smug] Laptop band kar diya… [dramatic pause] phir bhi kaam chal raha hai. [excited] Ye hai ChatGPT ka naya Dots.

[sarcastic] Normal ChatGPT? Tab band, kahani khatam. [impressed] Par Dot ko milta hai apna khud ka cloud computer aur browser. [casual] Tum so jao — ye tumhare goal pe kaam karta rahega.

[fast] Slack mein bug aaya? Khud investigate karega. Invoice bhejna bhool gaye? Bana ke rakhega — aur tumhare OK ke baad bhejega. [teasing] Aur woh "baad mein padhunga" wale saintaalis tabs? [laughs] Ye sach mein padh lega. Chaar hazaar se zyada apps ke saath.

[sighs] Ab bura news. [sarcastic] Free walon — aap club ke bahar ho. Sirf Pro aur Business Premium ke liye, eligible markets mein. India? Apna account check karo. [serious] Aur rules tum banaoge — kya khud karega, kis pe permission maangega. [smirks] Password change? Woh aaj bhi tumhara kaam hai.

[dramatic] Meta ka Muse… ab OpenAI ka Dots. [excited] Agent wars shuru. Comment mein DOTS likho — setup notes DM mein bhejta hoon. [smug] Aur follow karo… warna tum bhi tab band karke bhool jaoge.
```

Generate 2–3 takes and pick the one with the best hook (the first 3 seconds matter most).

## Option B: Chatterbox (open source, voice clone)

Use **Chatterbox Multilingual V3** (or the Hindi finetune `ResembleAI/Chatterbox-Multilingual-hi`), `language_id="hi"`.
Chatterbox doesn't read [tags]; delivery comes from your reference clip and these settings:

- **Reference clip:** 10–20 s of the Gyaani voice speaking Hindi in the same smug tone (clean, no music).
- `exaggeration=0.7` (more expressive) · `cfg_weight=0.35` (faster, punchier pacing).
- Generate **one clip per beat** (5 clips); long single passes drift. Hindi works best in Devanagari with English product names kept in Latin:

```
1: लैपटॉप बंद कर दिया… फिर भी काम चल रहा है। ये है ChatGPT का नया Dots।
2: नॉर्मल ChatGPT? टैब बंद, कहानी ख़त्म। पर Dot को मिलता है अपना ख़ुद का cloud computer और browser। तुम सो जाओ — ये तुम्हारे goal पे काम करता रहेगा।
3: Slack में bug आया? ख़ुद investigate करेगा। Invoice भेजना भूल गए? बना के रखेगा — और तुम्हारे OK के बाद भेजेगा। और वो "बाद में पढ़ूँगा" वाले सैंतालीस tabs? ये सच में पढ़ लेगा। चार हज़ार से ज़्यादा apps के साथ।
4: अब बुरा न्यूज़। Free वालों — आप club के बाहर हो। सिर्फ़ Pro और Business Premium के लिए, eligible markets में। India? अपना account check करो। और rules तुम बनाओगे — क्या ख़ुद करेगा, किस पे permission माँगेगा। Password change? वो आज भी तुम्हारा काम है।
5: Meta का Muse… अब OpenAI का Dots। Agent wars शुरू। Comment में DOTS लिखो — setup notes DM में भेजता हूँ। और follow करो… वरना तुम भी टैब बंद करके भूल जाओगे।
```

## What to send back

1. **The voice file(s):** WAV preferred (MP3 is fine), no music or effects. Either one full take, or 5 beat clips named `beat1.wav` … `beat5.wav`.
2. **Optional, for tighter captions:** an `.srt` with word or phrase timings (for example, CapCut auto-captions exported). Without it I align the captions to the audio myself; speech-recognition models can't be downloaded in my environment.
3. **Gyaani visuals:** a hologram character image or poses (neutral, smug, shocked, pointing), transparent PNG if possible. Without them I'll build a stylised hologram placeholder so the edit isn't blocked.
