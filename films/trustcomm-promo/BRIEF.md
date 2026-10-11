---
workflow: product-launch-video
flow: automation
storyboard: no
message: "Hear from more of your customers, not just the loudest ones."
destination: portfolio-site
aspect: 1920x1080
language: en
audience: small-business owners in India, plus creative directors and hiring managers viewing it as a showreel piece
length: 15s
angle: problem-to-payoff launch promo
narration: no
---

## Intent

User's words: "make a dynamic 15-second motion graphics video that shows what an incredible motion designer you are, like it's your showreel for a résumé. go all out. it should be a launch saas video for https://trustcomm.app"

A SaaS launch promo for Trustcomm that doubles as a motion-design showreel piece. "Go all out" is read as a just-build-it signal: autonomous run (`flow: automation`, `storyboard: no`), ceiling treatment, no checkpoints before the final preview.

Chosen concept (internal pitch round, autonomous): **The Quiet Chorus.** Every customer is a rounded voice bar. One red bar shouts alone; a row of tiny bars stays silent. The quiet bars snap together into a QR code, a phone scans it, and the real Trustcomm review flow plays at speed: rate, six languages, pick mentions, choose where the words go. Both paths fly out as cards and multiply into a full chorus waveform of many voices, which folds into the Trustcomm wordmark. One system of rounded shapes reflows the whole way (bars → QR modules → chips → cards → waveform → logo), so the piece reads as one continuous design.

Typical direction left behind: a phone mock-up tour with feature captions over stock music.

## Assets

- ../trustcomm-launch/client/logo-from-chat.jpg — the Trustcomm wordmark (raster placeholder; rebuilt as live type for the end card, matched to it).
- ../trustcomm-launch/ui/demo-1…5.jpg — real screenshots of trustcomm.app/r/demo; the phone screens are rebuilt from these.
- ../trustcomm-launch/client/FACTS.md — the fact ledger (F1–F10). Nothing on screen may go beyond it.

## Customizations

- **No narration.** Kinetic type carries the copy; 15 s of motion is the message.
- **Score and SFX written in code**: a 120 BPM cue synthesized from scratch, with a designed sound on every visual event, frame-exact, mastered to −14 LUFS with true peak below −1 dBTP after AAC. Supplied to the workflow as host audio.
- 60 fps master.

## Notes

- **Compliance (from ../trustcomm-launch/BRIEF.md §2, non-negotiable):**
  - Never imply review gating: the customer chooses freely, and both paths (a Google post and a private note to the owner) appear equally.
  - No star-farming language ("5-star", "boost your rating").
  - No Google logo, Maps UI, Google font or colour sequence; "Google" appears as plain text only.
  - All shops, customers and review texts are fictional or the product's own demo copy ("Meera's Tiffin Room", the demo draft, the private-note example).
  - Price and trial exactly as F8/F9.
- **Brand colours** (measured from /r/demo, see FACTS.md): blue #1E5EFE, ink #111216, grey #6D6D75, hairline #EAE9E5, tint #E4EAF8, page #FAF9F5.
- **Type**: Poppins (OFL) for film type, Inter (OFL) on phone screens; Noto Sans Devanagari/Kannada/Tamil/Telugu for the language burst. All self-hosted from ../trustcomm-launch/fonts.
- **Language strings**: the Hinglish/Hindi/Kannada/Tamil/Telugu versions of the rating question are drafts, flagged for client confirmation (FACTS.md).
- **Destination inferred**: résumé/portfolio site and YouTube → 1920×1080 (16:9). A 9:16 cut can follow.
