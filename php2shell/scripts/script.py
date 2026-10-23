# The narration, as 44 spoken phrases (one per stretch of speech between pauses of >= 0.2 s in vo.mp3), each tagged with its scene.
# This is the single source for the transcript: scripts/align.py aligns it, scripts/timings.py refines it into src/timings.json.
PHRASES = [
 ("S1", "21 October ki raat."), ("S1", "Duniya bhar mein server sambhalne waalon ki neend udd gayi."),
 ("S2", "Aur agar aapki website WordPress pe hai..."), ("S2", "toh yeh kahani aapki bhi hai."),
 ("S3", "WordPress chalta hai PHP pe."), ("S3", "Aur PHP ke andar mile do aise bug..."), ("S3", "jo das saal se chupchaap baithe the."),
 ("S4", "Inhe pakda Wiz,"), ("S4", "Calif"), ("S4", "aur OpenAI ke researchers ne."),
 ("S5", "Ab samjho,"), ("S5", "hua kya."), ("S5", "Mumbai ka dabbawala."), ("S5", "Roz hazaaron tiffin, ek ghar se doosre ghar."),
 ("S6", "Socho ek tiffin wapas aata hai..."), ("S6", "aur uske andar pichhle ghar ki chaabi reh gayi."), ("S6", "Agla aadmi dabba kholta hai..."), ("S6", "aur chaabi uske haath mein."),
 ("S7", "PHP server bhi kuch aisa hi karta hai."), ("S7", "Har request ek tiffin hai."), ("S7", "Aur yeh bug,"), ("S7", "pichhli request ka bacha hua data... agle ke haath mein de sakta hai."), ("S7", "Password."), ("S7", "Token. API keys."),
 ("S8", "Aur kuch cases mein, hacker bina login kiye..."), ("S8", "poore server pe control le sakta hai."),
 ("S9", "Isliye PHP ne isey 10 mein se 9.2 ki critical rating di."), ("S9", "21 October ko fix aaya..."), ("S9", "aur usi din attack ki koshishein bhi dikhne lagi."),
 ("S10", "Lekin ab dar nahi,"), ("S10", "sach suniye."), ("S10", "Abhi tak kisi bade hack ki confirm khabar nahi hai."), ("S10", "Kuch companies ne safety ke liye services band ki."), ("S10", "Aur fix aa chuka hai."),
 ("S11", "Toh aaj hi apne hosting wale se ek sawaal pucho:"), ("S11", "Kya PHP update ho gaya?"), ("S11", "Naye versions screen pe hain."),
 ("S12", "Aur dhyan rakhna..."), ("S12", "sirf plugin update karne se yeh theek nahi hota."), ("S12", "PHP khud update karna padega."),
 ("S13", "Apni website check karne ka simple tareeka chahiye?"), ("S13", "Comment karo PHP, main bhej dunga."), ("S13", "Aur yeh video us dost ko bhejo..."), ("S13", "jiski website hai."),
]
assert len(PHRASES) == 44

# Spoken forms. A display word that is not here is spoken as itself (lower case, letters only). Where the voice's reading of a
# token is not known in advance (numbers, spelled letters, English names) several variants are listed and align.py picks the one the
# audio fits best (the acoustic score of the forced alignment).
VARIANTS = {
 "21": [["twenty", "one"], ["ikkees"], ["ikkis"]],
 "10": [["ten"], ["das"]],
 "9.2": [["nine", "point", "two"], ["nau", "point", "do"], ["nine", "point", "do"]],
 "php": [["pee", "aitch", "pee"], ["pee", "ech", "pee"]],
 "calif": [["calif"], ["calif2"], ["calif3"]],
 "october": [["october"], ["october2"]],
 "api": [["api"], ["api2"]],
 "login": [["login"], ["login2"]],
 "researchers": [["researchers"], ["researchers2"]],
 "mumbai": [["mumbai"], ["mumbai2"]],
 "data": [["data"], ["data2"]],
 "wiz": [["wiz"], ["wiz2"]],
}
def bare(w): return "".join(ch for ch in w.lower() if ch.isalnum() or ch == ".").strip(".")
