import numpy as np, wave
SR = 48000; DUR = 21.5; N = int(SR * DUR)
rng = np.random.default_rng(7)
def buf(): return np.zeros((N, 2))
def hz(m): return 440 * 2 ** ((m - 69) / 12)
def env(n, a, d, sus=0.0, rel=None):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1) * (sus + (1 - sus) * np.exp(-t / d))
    if rel: e *= np.clip((n / SR - t) / rel, 0, 1)
    return e
def put(b, x, t, pan=0.0, g=1.0):
    i = int(t * SR); x = x[: max(0, N - i)]
    b[i:i + len(x), 0] += x * g * (1 - pan) ** 0.5 * 0.71 * 1.41
    b[i:i + len(x), 1] += x * g * (1 + pan) ** 0.5 * 0.71 * 1.41
def lp(x, a):  # one-pole lowpass
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def saw(f, n, det=0.0):
    t = np.arange(n) / SR
    return sum(2 * ((t * f * (1 + d)) % 1) - 1 for d in (-det, 0, det)) / 3

beat = lambda k: 0.25 + 0.5 * k
CH = [[57, 61, 64, 69], [54, 57, 61, 66], [50, 54, 57, 62], [52, 56, 59, 64]]  # A F#m D E
def chord_at(t): return CH[int((t - 0.25) // 2) % 4]

drums, bass, pad, keys, sfx = buf(), buf(), buf(), buf(), buf()

def kick():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 45 + 90 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
def hat():
    n = int(0.06 * SR); x = rng.standard_normal(n)
    x = x - lp(x, 0.5); return x * np.exp(-np.arange(n) / SR * 70)
def clap():
    n = int(0.2 * SR); x = rng.standard_normal(n); x = lp(x, 0.35) - lp(x, 0.05)
    e = np.exp(-np.arange(n) / SR * 22); return x * e
K, H, C = kick(), hat(), clap()

# Hook hits: kick + chord stab per word
for i in range(4):
    t = beat(i); put(drums, K, t, g=0.9)
    n = int(0.45 * SR)
    stab = sum(lp(saw(hz(m + 12 * (i >= 2)), n, 0.006), 0.18) for m in CH[0]) / 4
    put(keys, stab * env(n, 0.003, 0.18), t, g=0.55)
    put(bass, np.sin(2 * np.pi * hz(33) * np.arange(n) / SR) * env(n, 0.005, 0.25), t, g=0.6)
# riser into the groove
n = int(0.5 * SR); x = rng.standard_normal(n); x = x - lp(x, 0.2)
put(sfx, x * np.linspace(0, 1, n) ** 2 * 0.12, 1.75)

GROOVE_END = 20.25
k = 4
while beat(k) < GROOVE_END:
    t = beat(k)
    full = t >= 4.25
    put(drums, K, t, g=0.85 if full else 0.6)
    if full and k % 2 == 1: put(drums, C, t, g=0.18, pan=0.05)
    put(drums, H, t + 0.25, g=0.10 if full else 0.05, pan=0.3)
    if full: put(drums, H, t, g=0.04, pan=-0.3)
    # bass: root eighths, ducked by kick
    root = chord_at(t)[0] - 24
    for j, off in enumerate((0, 0.25)):
        n = int(0.24 * SR); tt = np.arange(n) / SR
        b = lp(saw(hz(root), n), 0.08) + 0.5 * np.sin(2 * np.pi * hz(root) * tt)
        put(bass, b * env(n, 0.004, 0.12, 0.3, 0.03), t + off, g=0.33 if j else 0.22)
    # pluck arpeggio on sixteenths
    if full:
        ch = chord_at(t)
        for j in range(4):
            m = ch[[0, 2, 3, 1][(k * 4 + j) % 4]] + 12
            n = int(0.2 * SR)
            pl = np.sin(2 * np.pi * hz(m) * np.arange(n) / SR) + 0.3 * np.sin(4 * np.pi * hz(m) * np.arange(n) / SR)
            put(keys, pl * env(n, 0.002, 0.07), t + j * 0.125, pan=(-0.35 if j % 2 else 0.35), g=0.10)
    k += 1
# pad per bar
for b in range(1, 11):
    t = 0.25 + 2 * b
    if t >= GROOVE_END: break
    n = int(2.0 * SR)
    p = sum(lp(saw(hz(m), n, 0.004), 0.05) for m in chord_at(t)) / 4
    put(pad, p * env(n, 0.25, 9, 1, 0.3), t, g=0.32)
# final chord
n = int((DUR - GROOVE_END) * SR)
fin = sum(lp(saw(hz(m), n, 0.005), 0.07) for m in CH[0] + [69 + 12]) / 5
put(pad, fin * env(n, 0.005, 0.5, 0.35, 0.8), GROOVE_END, g=0.6)
put(drums, K, GROOVE_END, g=0.9)
put(bass, np.sin(2 * np.pi * hz(33) * np.arange(n) / SR) * env(n, 0.005, 0.6, 0, 0.5), GROOVE_END, g=0.6)

# SFX: the app's own triangle chimes (feedback.ts), tuned to A major
def tone(t0, freqs, step=0.09, g=0.3):
    for i, f in enumerate(freqs):
        n = int(step * 1.8 * SR); tt = np.arange(n) / SR
        tri = 2 * np.abs(2 * ((tt * f) % 1) - 1) - 1
        e = np.minimum(tt / 0.01, 1) * np.exp(-tt / (step * 0.55))
        put(sfx, tri * e, t0 + i * step, g=g)
def click(t, g=0.05):
    n = int(0.03 * SR); x = rng.standard_normal(n); x = lp(x, 0.3) - lp(x, 0.03)
    put(sfx, x * np.exp(-np.arange(n) / SR * 160), t, g=g)
def whoosh(t, d=0.4, g=0.06):
    n = int(d * SR); x = rng.standard_normal(n); x = lp(x, 0.12) - lp(x, 0.01)
    put(sfx, x * np.sin(np.pi * np.arange(n) / n) ** 2, t, g=g)

whoosh(3.95, 0.6, 0.08)
for t in (7.75, 8.55, 9.35, 11.6, 12.2, 12.65, 13.2, 14.6, 15.35): click(t)
for t in (7.75, 11.6, 14.6): whoosh(t, 0.32, 0.035)
tone(9.47, [659.25, 880, 1108.7], g=0.16)
tone(13.32, [329.6, 220], 0.12, g=0.18)
tone(15.47, [554.4, 659.25, 880, 1108.7, 1318.5], 0.08, g=0.14)
whoosh(17.3, 0.45, 0.05)

# Shared room reverb
def reverb(x, secs=1.6, decay=3.5):
    n = int(secs * SR); ir = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / SR * decay)[:, None]
    ir = ir / np.sqrt((ir ** 2).sum(0))
    L = len(x) + n; F = 1 << (L - 1).bit_length()
    y = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], F) * np.fft.rfft(ir[:, c], F), F)[: len(x)] for c in range(2)], 1)
    return y
music = drums + bass + pad + keys
# gentle duck under the chimes
duck = np.ones(N)
for t in (9.47, 13.32, 15.47):
    i = int(t * SR); m = int(0.6 * SR)
    duck[i:i + m] = np.minimum(duck[i:i + m], 1 - 0.3 * np.sin(np.pi * np.arange(m) / m)[: len(duck[i:i + m])])
music *= duck[:, None]
wet = reverb(pad * 0.5 + keys + sfx * 1.2 + drums * 0.15)
mix = music + sfx + 0.22 * wet
mix[-int(0.3 * SR):] *= np.linspace(1, 0, int(0.3 * SR))[:, None]
mix = np.tanh(mix * 1.1) ; mix *= 0.89 / np.abs(mix).max()
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('ok')
