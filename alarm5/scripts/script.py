# The narration of "Iss hafte 5 alarm": 15 scenes, split into clauses (PHRASES), each tagged with its scene. This is the single source for the transcript:
# scripts/align.py aligns it against public/vo.mp3 and scripts/timings.py refines the result into src/timings.json.
# The voice has almost no pauses (the audio was cut tight), so the alignment runs on the whole script at once, not phrase by phrase.
PHRASES = [
 ("S1", "Iss hafte tech ki duniya mein paanch alarm baje."), ("S1", "Zyaadatar logon ne suna bhi nahi."), ("S1", "Lekin inmein se kam se kam ek..."), ("S1", "seedha aapko chhoota hai."),
 ("S2", "Darr nahi, sach."), ("S2", "Number paanch se shuru karte hain."),
 ("S3", "Number paanch."), ("S3", "America ke bade banks ne customers ke AI agents pe brake laga diya."), ("S3", "Account mein login?"), ("S3", "Mana."), ("S3", "Paise bhejna?"),
 ("S3", "Bilkul mana."), ("S3", "Kyunki galat transaction hua..."), ("S3", "toh zimmedaar kaun?"),
 ("S4", "Seekh simple hai."), ("S4", "Apna bank password kabhi kisi AI agent ko mat do."),
 ("S5", "Number chaar."), ("S5", "LiteLLM, developers ka popular AI tool."), ("S5", "Uske ek version mein chupke se chor code daal diya gaya..."), ("S5", "jo cloud aur AI ki keys chura raha tha."),
 ("S6", "Developer ho?"), ("S6", "Version check karo, aur saari keys badal do."),
 ("S7", "Number teen."), ("S7", "Zeabur, ek hosting platform."), ("S7", "Do mahine mein doosri baar breach."), ("S7", "Battees lakh se zyaada secret records leak..."), ("S7", "aur ab company hi band ho rahi hai."),
 ("S8", "Wahan aapka app hai?"), ("S8", "Abhi shift karo, aur passwords badlo."),
 ("S9", "Number do."), ("S9", "Signal, jise sabse secure app maana jaata hai."), ("S9", "Usmein bug mila..."), ("S9", "jisse call kaatne ke baad bhi saamne wala aapko sun sakta tha."),
 ("S10", "Achhi khabar, fix aa chuka hai."), ("S10", "Signal abhi update karo."),
 ("S11", "Aur number ek..."), ("S11", "PHP2Shell."), ("S11", "Woh bug jo WordPress jaisi websites ki neev, PHP, mein das saal se chhupa tha."),
 ("S12", "Website hai?"), ("S12", "PHP update karo."), ("S12", "Poori kahani meri pichhli reel mein hai."),
 ("S13", "Ab ek baat notice karo."), ("S13", "Paanch mein se teen kahaniyon mein AI ya toh khatra tha..."), ("S13", "ya target..."), ("S13", "ya chowkidaar."),
 ("S14", "Isliye AI se darna nahi hai."), ("S14", "Samajhdaari se use karna hai."), ("S14", "Update karo."), ("S14", "Keys badlo."), ("S14", "Aur password kisi ko mat do..."), ("S14", "AI ko bhi nahi."),
 ("S15", "Har hafte aise alarm, simple bhasha mein chahiye?"), ("S15", "Follow karo."), ("S15", "Aur comment karo ALERT..."), ("S15", "main paanchon ka checklist bhej dunga."),
]

# Spoken forms. A display word that is not here is spoken as itself (lower case, letters only). Where the voice's reading of a token is not known in advance
# (spelled letters, English names, numbers inside names) several variants are listed; align.py picks, word by word, the one the whole alignment scores best.
VARIANTS = {
 "php": [["pee", "aitch", "pee"], ["pee", "ech", "pee"]],
 "php2shell": [["pee", "aitch", "pee", "two", "shell"], ["pee", "aitch", "pee", "tu", "shell"], ["pee", "ech", "pee", "two", "shell"]],
 "ai": [["ay", "eye"], ["ey", "ai"], ["aye", "aye"]],
 "litellm": [["lite", "el", "el", "em"], ["lite", "ellem"], ["light", "el", "el", "em"], ["lit", "el", "el", "em"]],
 "zeabur": [["zeebur"], ["zeabar"], ["zeabor"], ["zebur"]],
 "alert": [["alert"], ["alert2"]],
 "wordpress": [["wordpress"], ["wordpress2"]],
 "customers": [["customers"], ["customers2"]],
 "transaction": [["transaction"], ["transaction2"]],
 "login": [["login"], ["login2"]],
 "version": [["version"], ["version2"]],
 "number": [["number"], ["number2"]],
 "battees": [["battees"], ["batees"], ["battis"]],
 "signal": [["signal"], ["signal2"]],
 "reel": [["reel"], ["reel2"]],
 "checklist": [["checklist"], ["checklist2"]],
 "hafte": [["hafte"], ["haphte"]],
 "seedha": [["seedha"], ["seedhaa"]],
}
def bare(w): return "".join(ch for ch in w.lower() if ch.isalnum() or ch == ".").strip(".")
