"""Author the 6 SPATIAL showreel Lottie assets as valid Lottie JSON (bodymovin 5.x schema).
All shapes use ice white #EAF2FF so they can be recoloured easily. 60 fps.
"""
import json, math, random, os

OUT = "out"
os.makedirs(OUT, exist_ok=True)
WHITE = [0.918, 0.949, 1.0, 1]
MIST = [0.718, 0.769, 0.839, 1]
EASE_OUT = ({"x": [0.16], "y": [1]}, {"x": [0.3], "y": [1]})


def static(v):
    return {"a": 0, "k": v}


def kf(frames, ease=("io",)):
    """frames: list of (t, value). value list or number. ease per segment: 'io','in','out','lin'."""
    E = {"io": ({"x": [0.42], "y": [0]}, {"x": [0.58], "y": [1]}),
         "in": ({"x": [0.55], "y": [0]}, {"x": [0.9], "y": [0.6]}),
         "out": ({"x": [0.16], "y": [0.4]}, {"x": [0.3], "y": [1]}),
         "lin": ({"x": [0], "y": [0]}, {"x": [1], "y": [1]})}
    ks = []
    for i, (t, v) in enumerate(frames):
        v = v if isinstance(v, list) else [v]
        k = {"t": t, "s": v}
        if i < len(frames) - 1:
            e = ease[i] if i < len(ease) else ease[-1]
            o, ii = E[e]
            k["o"], k["i"] = o, ii
        ks.append(k)
    return {"a": 1, "k": ks}


def tr(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    def wrap(v):
        return v if isinstance(v, dict) else static(list(v) if isinstance(v, tuple) else v)
    return {"ty": "tr", "p": wrap(p), "a": wrap(a), "s": wrap(s), "r": wrap(r), "o": wrap(o),
            "sk": static(0), "sa": static(0)}


def ks(p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    def wrap(v, dims3=False):
        if isinstance(v, dict):
            return v
        if isinstance(v, tuple):
            return static(list(v) + [0])
        return static(v)
    return {"o": wrap(o), "r": wrap(r), "p": wrap(p), "a": wrap(a),
            "s": s if isinstance(s, dict) else static(list(s) + [100])}


def path(v, i=None, o=None, closed=True):
    n = len(v)
    return {"i": i or [[0, 0]] * n, "o": o or [[0, 0]] * n, "v": v, "c": closed}


def sh(p):
    return {"ty": "sh", "ks": p if "a" in p else static(p)}


def stroke(w=4, c=WHITE, o=100):
    return {"ty": "st", "c": static(c), "o": o if isinstance(o, dict) else static(o),
            "w": w if isinstance(w, dict) else static(w), "lc": 2, "lj": 2, "ml": 4}


def fill(c=WHITE, o=100):
    return {"ty": "fl", "c": static(c), "o": o if isinstance(o, dict) else static(o), "r": 1}


def ellipse(size, pos=(0, 0)):
    return {"ty": "el", "p": static(list(pos)), "s": size if isinstance(size, dict) else static(list(size)), "d": 1}


def trim(e, s=None):
    return {"ty": "tm", "s": s or static(0), "e": e, "o": static(0), "m": 1}


def group(items, t=None, nm="g"):
    return {"ty": "gr", "nm": nm, "it": items + [t or tr()]}


def layer(shapes, op, ind, nm="layer", k=None, ip=0):
    return {"ddd": 0, "ind": ind, "ty": 4, "nm": nm, "sr": 1, "ks": k or ks(), "ao": 0,
            "shapes": shapes, "ip": ip, "op": op, "st": 0, "bm": 0}


def comp(nm, w, h, op, layers, markers=()):
    return {"v": "5.7.4", "fr": 60, "ip": 0, "op": op, "w": w, "h": h, "nm": nm, "ddd": 0,
            "assets": [], "layers": layers,
            "markers": [{"tm": t, "cm": c, "dr": 0} for t, c in markers]}


def save(name, data):
    with open(f"{OUT}/{name}.json", "w") as f:
        json.dump(data, f, separators=(",", ":"))


# ---------------------------------------------------------------- 1. headphones (line draw)
def headphones():
    op = 120
    band = path([[-150, 40], [0, -150], [150, 40]],
                i=[[0, 0], [-95, 0], [0, -60]], o=[[0, -60], [95, 0], [0, 0]], closed=False)
    cupL = {"ty": "rc", "p": static([-150, 95]), "s": static([70, 130]), "r": static(28), "d": 1}
    cupR = {"ty": "rc", "p": static([150, 95]), "s": static([70, 130]), "r": static(28), "d": 1}
    draw = kf([(0, 0), (60, 100)], ("io",))
    g = group([sh(band), cupL, cupR, trim(draw), stroke(8)], nm="headphones")
    glow = group([cupL, cupR, fill(WHITE, kf([(55, 0), (80, 18)], ("io",)))], nm="cupGlow")
    lay = layer([g, glow], op, 1, "headphones", ks(p=(256, 236)))
    return comp("headphones", 512, 512, op, [lay], [(60, "drawn")])


# ---------------------------------------------------------------- 2. drop + splash + ripples
def drop():
    op = 150
    impact = 48
    tear = path([[0, -46], [26, 8], [0, 34], [-26, 8]],
                i=[[0, 0], [0, -22], [16, 0], [0, 16]],
                o=[[0, 0], [0, 16], [-16, 0], [0, -22]])
    drop_layer = layer([group([sh(tear), fill(WHITE)], nm="tear")], impact + 1, 1, "drop",
                       ks(p=kf([(0, [256, 120, 0]), (impact, [256, 760, 0])], ("in",)),
                          s=kf([(0, [90, 90, 100]), (impact - 6, [85, 128, 100]), (impact, [120, 80, 100])], ("in", "lin"))))
    layers = [drop_layer]
    # crown droplets
    random.seed(4)
    for j in range(9):
        ang = math.radians(-160 + j * 17.5)
        dist = random.uniform(70, 140)
        hgt = random.uniform(80, 170)
        x0, y0 = 256, 790
        apex = [x0 + math.cos(ang) * dist * 0.6, y0 - hgt, 0]
        end = [x0 + math.cos(ang) * dist, y0 + 10, 0]
        d = random.uniform(10, 18)
        layers.append(layer([group([ellipse((d, d)), fill(WHITE)], nm="d")], op, 2 + j, f"crown{j}",
                            ks(p=kf([(impact, [x0, y0, 0]), (impact + 16, apex), (impact + 40, end)], ("out", "in")),
                               o=kf([(impact, 100), (impact + 34, 100), (impact + 42, 0)], ("lin", "lin")),
                               s=kf([(impact, [40, 40, 100]), (impact + 10, [100, 100, 100])], ("out",))),
                            ip=impact))
    # ripples (flattened rings)
    for r in range(3):
        st = impact + r * 10
        layers.append(layer([group([ellipse(kf([(st, [20, 6]), (st + 80, [520, 120])], ("out",))),
                                    stroke(kf([(st, 5), (st + 80, 1)], ("out",)), WHITE,
                                           kf([(st, 90), (st + 80, 0)], ("out",)))], nm="ring")],
                            op, 20 + r, f"ripple{r}", ks(p=(256, 800)), ip=st))
    # impact flash
    layers.append(layer([group([ellipse((60, 18)), fill(WHITE)], nm="flash")], impact + 10, 30, "flash",
                        ks(p=(256, 795), o=kf([(impact, 100), (impact + 8, 0)], ("out",)),
                           s=kf([(impact, [60, 60, 100]), (impact + 8, [260, 200, 100])], ("out",))), ip=impact))
    return comp("drop", 512, 1024, op, layers, [(impact, "impact")])


# ---------------------------------------------------------------- 3. rain (seamless loop)
def rain():
    op = 120
    random.seed(11)
    layers = []
    for j in range(70):
        period = random.choice([30, 40, 60])
        x = random.uniform(20, 1060)
        ln = random.uniform(40, 110)
        w = random.choice([2, 2, 3])
        opac = random.uniform(25, 85)
        offs = random.randint(0, period - 1)
        streak = path([[0, -ln / 2], [0, ln / 2]], closed=False)
        # position keyframes repeated so the loop is seamless over 120 frames
        frames = []
        t = -offs
        while t < op:
            frames.append((t, [x, -120, 0]))
            frames.append((t + period - 0.01, [x - 18, 2040, 0]))
            t += period
        layers.append(layer([group([sh(streak), stroke(w, WHITE, opac)], nm="s")], op, j + 1, f"streak{j}",
                            ks(p={"a": 1, "k": [{"t": f[0], "s": f[1], "h": 0 if k % 2 == 0 else 1,
                                                 "o": {"x": [0], "y": [0]}, "i": {"x": [1], "y": [1]}}
                                                for k, f in enumerate(frames)]}, r=-0.5)))
    return comp("rain", 1080, 1920, op, layers)


# ---------------------------------------------------------------- 4. bird (flap loop)
def bird():
    op = 60
    # wing poses with identical vertex counts
    def wing(tip_y, mid_y, side):
        s = side
        return path([[0, 0], [s * 70, mid_y], [s * 150, tip_y], [s * 60, 18]],
                    i=[[0, 0], [-s * 25, 10], [-s * 30, 0], [s * 30, 0]],
                    o=[[s * 25, -10], [s * 30, 0], [-s * 30, 10], [0, 0]])
    up, mid, down = (-95, -45), (-10, -8), (70, 30)

    def wing_anim(side):
        poses = [up, mid, down, mid, up]
        times = [0, 8, 15, 23, 30]
        k = []
        for cycle in (0, 30):
            for i, (t, pz) in enumerate(zip(times, poses)):
                if cycle and i == 0:
                    continue
                e = ({"x": [0.42], "y": [0]}, {"x": [0.58], "y": [1]})
                k.append({"t": t + cycle, "s": [wing(pz[0], pz[1], side)], "o": e[0], "i": e[1]})
        return {"a": 1, "k": k}

    body = path([[-60, 0], [0, -12], [55, -4], [75, -10], [62, 6], [0, 14]],
                i=[[0, 0], [-30, 0], [-15, -4], [0, 0], [6, -4], [25, 0]],
                o=[[0, -8], [25, 0], [6, -3], [0, 0], [-15, 6], [-30, 0]])
    wl = group([sh(wing_anim(-1)), fill(MIST)], nm="wingL")
    wr = group([sh(wing_anim(1)), fill(WHITE)], nm="wingR")
    b = group([sh(body), fill(WHITE)], nm="body")
    lay = layer([wr, b, wl], op, 1, "bird",
                ks(p=kf([(0, [256, 262, 0]), (15, [256, 250, 0]), (30, [256, 262, 0]), (45, [256, 250, 0]), (60, [256, 262, 0])],
                        ("io", "io", "io", "io"))))
    return comp("bird", 512, 512, op, [lay], [(15, "wing_down"), (45, "wing_down")])


# ---------------------------------------------------------------- 5. leaf (sway + flips)
def leaf():
    op = 240
    shape = path([[0, -70], [42, -10], [0, 70], [-42, -10]],
                 i=[[0, 0], [8, -38], [26, 0], [-10, 40]],
                 o=[[10, 0], [-10, 40], [-26, 0], [-8, -38]])
    vein = path([[0, -60], [0, 80]], closed=False)
    g = group([sh(shape), fill(MIST), sh(vein), stroke(3, WHITE, 70)], nm="leaf")
    xs, rots, flips = [], [], []
    for k in range(9):
        t = k * 30
        side = 1 if k % 2 == 0 else -1
        xs.append((t, [256 + side * 110, 80 + t * 3.6, 0]))
        rots.append((t, side * 38))
        flips.append((t, [side * 100, 100, 100]))
    marks = [(15 + 30 * k, "flip") for k in range(8)]
    lay = layer([g], op, 1, "leaf",
                ks(p=kf(xs, ("io",) * 8), r=kf(rots, ("io",) * 8), s=kf(flips, ("io",) * 8)))
    return comp("leaf", 512, 1024, op, [lay], marks)


# ---------------------------------------------------------------- 6. burst (impact)
def burst():
    op = 90
    layers = []
    layers.append(layer([group([ellipse((80, 80)), fill(WHITE)], nm="core")], op, 1, "core",
                        ks(p=(512, 512), s=kf([(0, [20, 20, 100]), (6, [260, 260, 100]), (30, [320, 320, 100])], ("out", "out")),
                           o=kf([(0, 100), (4, 100), (30, 0)], ("lin", "out")))))
    for r in range(2):
        st = r * 5
        layers.append(layer([group([ellipse(kf([(st, [40, 40]), (st + 60, [980, 980])], ("out",))),
                                    stroke(kf([(st, 14), (st + 60, 1)], ("out",)), WHITE, kf([(st, 100), (st + 60, 0)], ("out",)))],
                                   nm="ring")], op, 2 + r, f"ring{r}", ks(p=(512, 512)), ip=st))
    random.seed(9)
    for j in range(24):
        ang = math.radians(j * 15 + random.uniform(-6, 6))
        dist = random.uniform(220, 460)
        d = random.uniform(6, 16)
        end = [512 + math.cos(ang) * dist, 512 + math.sin(ang) * dist, 0]
        layers.append(layer([group([ellipse((d, d)), fill(WHITE)], nm="p")], op, 10 + j, f"particle{j}",
                            ks(p=kf([(2, [512, 512, 0]), (2 + random.randint(40, 70), end)], ("out",)),
                               o=kf([(2, 100), (70, 0)], ("lin",)))))
        # streak trails
        tail = path([[0, 0], [-math.cos(ang) * 40, -math.sin(ang) * 40]], closed=False)
        layers.append(layer([group([sh(tail), stroke(2, WHITE, 60)], nm="t")], 40, 40 + j, f"trail{j}",
                            ks(p=kf([(2, [512, 512, 0]), (2 + 50, end)], ("out",)), o=kf([(2, 80), (36, 0)], ("lin",)))))
    return comp("burst", 1024, 1024, op, layers, [(0, "impact")])


for name, fn in [("headphones", headphones), ("drop", drop), ("rain", rain),
                 ("bird", bird), ("leaf", leaf), ("burst", burst)]:
    save(name, fn())
    print("wrote", name)
