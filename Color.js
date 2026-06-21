/*
This file is licensed under CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0),
allowing use, modification, and distribution without restriction,
including commercially, and without requiring this notice.
*/

// https://github.com/thefrostypixel/antica/wiki/Color
globalThis.Color = class Color {
    static okLab(...okLab) {
        return new Color(...okLab);
    }
    static lRgb(...lRgb) {
        let lRgb2 = [];
        if (lRgb.length) {
            if (lRgb[0] instanceof Array) {
                lRgb2 = [lRgb[0][0], lRgb[0][1], lRgb[0][2], lRgb[0][3] ?? lRgb[1]];
            } else if (typeof lRgb[0] == "object") {
                lRgb2 = [lRgb[0].r, lRgb[0].g, lRgb[0].b, lRgb[0].a ?? lRgb[1]];
            } else {
                lRgb2 = [lRgb[0], lRgb[1], lRgb[2], lRgb[3]];
            }
        }
        lRgb2[0] ??= 0;
        lRgb2[1] ??= 0;
        lRgb2[2] ??= 0;
        let l = Math.cbrt(.4122214708 * lRgb2[0] + .5363325363 * lRgb2[1] + .0514459929 * lRgb2[2]);
        let m = Math.cbrt(.2119034982 * lRgb2[0] + .6806995451 * lRgb2[1] + .1073969566 * lRgb2[2]);
        let s = Math.cbrt(.0883024619 * lRgb2[0] + .2817188376 * lRgb2[1] + .6299787005 * lRgb2[2]);
        return Color.okLab(.2104542553 * l + .7936177850 * m - .0040720468 * s, 1.9779984951 * l - 2.4285922050 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - 0.8086757660 * s, lRgb2[3] ?? 1);
    }
    static sRgb(...sRgb) {
        let sRgb2 = [];
        if (sRgb.length) {
            if (sRgb[0] instanceof Array) {
                sRgb2 = [sRgb[0][0], sRgb[0][1], sRgb[0][2], sRgb[0][3] ?? sRgb[1]];
            } else if (typeof sRgb[0] == "object") {
                sRgb2 = [sRgb[0].r, sRgb[0].g, sRgb[0].b, sRgb[0].a ?? sRgb[1]];
            } else {
                sRgb2 = [sRgb[0], sRgb[1], sRgb[2], sRgb[3]];
            }
        }
        let l = n => n < .04045 ? n / 12.92 : ((+n + .055) / 1.055) ** 2.4;
        return Color.lRgb(l(sRgb2[0] ?? 0), l(sRgb2[1] ?? 0), l(sRgb2[2] ?? 0), sRgb2[3] ?? 1);
    }
    static hex(hex) {
        if (!hex.indexOf("#")) {
            hex = hex.slice(1);
        }
        if (hex.length == 3 || hex.length == 4) {
            return Color.sRgb(parseInt(hex[0].repeat(2), 16) / 255, parseInt(hex[1].repeat(2), 16) / 255, parseInt(hex[2].repeat(2), 16) / 255, hex.length == 4 ? parseInt(hex[3].repeat(2), 16) / 255 : 1);
        } else if (hex.length == 6 || hex.length == 8) {
            return Color.sRgb(parseInt(hex.slice(0, 2), 16) / 255, parseInt(hex.slice(2, 4), 16) / 255, parseInt(hex.slice(4, 6), 16) / 255, hex.length == 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1);
        }
        return new Color();
    }
    static int(int) {
        return Color.sRgb((int >>> 24 & 0xFF) / 255, (int >> 16 & 0xFF) / 255, (int >> 8 & 0xFF) / 255, (int & 0xFF) / 255);
    }

    constructor(...okLab) {
        if (okLab.length) {
            if (okLab[0] instanceof Array) {
                [this.L, this.a, this.b, this.o] = [okLab[0][0], okLab[0][1], okLab[0][2], okLab[0][3] ?? okLab[1]];
            } else if (typeof okLab[0] == "object") {
                [this.L, this.a, this.b, this.o] = [okLab[0].L, okLab[0].a, okLab[0].b, okLab[0].o ?? okLab[1]];
            } else {
                [this.L, this.a, this.b, this.o] = [okLab[0], okLab[1], okLab[2], okLab[3]];
            }
        }
    }

    #L = 0;
    get L() {
        return this.#L;
    }
    set L(L) {
        if (!isNaN(L)) {
            this.#L = +L;
        }
    }

    #a = 0;
    get a() {
        return this.#a;
    }
    set a(a) {
        if (!isNaN(a)) {
            this.#a = +a;
        }
    }

    #b = 0;
    get b() {
        return this.#b;
    }
    set b(b) {
        if (!isNaN(b)) {
            this.#b = +b;
        }
    }

    #o = 1;
    get o() {
        return this.#o;
    }
    set o(o) {
        if (!isNaN(o)) {
            this.#o = +o;
        }
    }

    get copy() {
        return new Color(this);
    }

    saturate(scale = 1) {
        if (!isNaN(scale)) {
            this.a *= scale;
            this.b *= scale;
        }
        return this;
    }

    opacify(scale = 1, clip = false) {
        if (!isNaN(scale)) {
            if (clip) {
                this.o = Math.min(Math.max(this.o * scale, 0), clip);
            } else {
                this.o *= scale;
            }
        }
        return this;
    }

    mix(other, t = .5) {
        if (this.o * (1 - t) + other.o * t) {
            this.L = (this.L * this.o * (1 - t) + other.L * other.o * t) / (this.o * (1 - t) + other.o * t);
            this.a = (this.a * this.o * (1 - t) + other.a * other.o * t) / (this.o * (1 - t) + other.o * t);
            this.b = (this.b * this.o * (1 - t) + other.b * other.o * t) / (this.o * (1 - t) + other.o * t);
        } else {
            this.L = this.a = this.b = 0;
        }
        this.o += (other.o - this.o) * t;
        return this;
    }

    over(other) {
        let o = this.o + other.o * (1 - this.o);
        if (o) {
            this.L = (this.L * this.o + other.L * other.o * (1 - this.o)) / o;
            this.a = (this.a * this.o + other.a * other.o * (1 - this.o)) / o;
            this.b = (this.b * this.o + other.b * other.o * (1 - this.o)) / o;
        } else {
            this.L = this.a = this.b = 0;
        }
        this.o = o;
        return this;
    }

    under(other) {
        let o = this.o * (1 - other.o) + other.o;
        if (o) {
            this.L = (this.L * this.o * (1 - other.o) + other.L * other.o) / o;
            this.a = (this.a * this.o * (1 - other.o) + other.a * other.o) / o;
            this.b = (this.b * this.o * (1 - other.o) + other.b * other.o) / o;
        } else {
            this.L = this.a = this.b = 0;
        }
        this.o = o;
        return this;
    }

    in(other) {
        this.o *= other.o;
        return this;
    }

    out(other) {
        this.o *= 1 - other.o;
        return this;
    }

    atop(other) {
        if (other.o) {
            this.L = this.L * this.o + other.L * (1 - this.o);
            this.a = this.a * this.o + other.a * (1 - this.o);
            this.b = this.b * this.o + other.b * (1 - this.o);
        }
        this.o = other.o;
        return this;
    }

    xor(other) {
        let o = this.o * (1 - other.o) + other.o * (1 - this.o);
        if (o) {
            this.L = (this.L * this.o * (1 - other.o) + other.L * other.o * (1 - this.o)) / o;
            this.a = (this.a * this.o * (1 - other.o) + other.a * other.o * (1 - this.o)) / o;
            this.b = (this.b * this.o * (1 - other.o) + other.b * other.o * (1 - this.o)) / o;
        }
        this.o = o;
        return this;
    }

    // TODO More blending functions.

    okLab() {
        return {L: this.L, a: this.a, b: this.b, o: this.o};
    }
    lRgbObj(clip = false, preMult = false) {
        let okLabToLRgb = (L, a, b) => {
            let l = (L + .3963377774 * a + .2158037573 * b) ** 3;
            let m = (L - .1055613458 * a - .0638541728 * b) ** 3;
            let s = (L - .0894841775 * a - 1.2914855480 * b) ** 3;
            return {r: 4.0767416621 * l -3.3077115913 * m + .2309699292 * s, g: -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, b: -.0041960863 * l - .7034186147 * m + 1.7076147010 * s};
        };
        let clamp = n => Math.min(Math.max(n, 0), 1);
        let lRgb = okLabToLRgb(this.L, this.a, this.b);
        if (clip && (lRgb.r < 0 || lRgb.r > 1 || lRgb.g < 0 || lRgb.g > 1 || lRgb.b < 0 || lRgb.b > 1)) {
            let {r, g, b} = okLabToLRgb(clamp(this.L), this.a, this.b);
            let gray = okLabToLRgb(clamp(this.L), 0, 0);
            let t = Math.max(r < 0 ? -r / (gray.r - r) : 0, r > 1 ? (1 - r) / (gray.r - r) : 0, g < 0 ? -g / (gray.g - g) : 0, g > 1 ? (1 - g) / (gray.g - g) : 0, b < 0 ? b / (gray.b - b) : 0, b > 1 ? (1 - b) / (gray.b - b) : 0);
            lRgb = {r: clamp(r + (gray.r - r) * t), g: clamp(g + (gray.g - g) * t), b: clamp(b + (gray.b - b) * t)};
        }
        let a = clip ? clamp(this.o) : this.o;
        let mult = preMult ? a : 1;
        return {r: lRgb.r * mult, g: lRgb.g * mult, b: lRgb.b * mult, a};
    }
    lRgbList(clip = false, preMult = false) {
        let lRgb = this.lRgbObj(clip, preMult);
        return [lRgb.r, lRgb.g, lRgb.b, lRgb.a];
    }
    sRgbObj(clip = false) {
        let lRgb = this.lRgbObj(clip);
        let s = n => n == 1 ? 1 : n < .0031308 ? n * 12.92 : n ** (1 / 2.4) * 1.055 - .055;
        return {r: s(lRgb.r), g: s(lRgb.g), b: s(lRgb.b), a: lRgb.a};
    }
    sRgbList(clip = false) {
        let sRgb = this.sRgbObj(clip);
        return [sRgb.r, sRgb.g, sRgb.b, sRgb.a];
    }
    hex(alwaysIncludeAlpha = false, plain = false) {
        let sRgb = this.sRgbObj(true);
        return `${plain ? "" : "#"}${Math.round(sRgb.r * 255).toString(16).padStart(2, "0")}${Math.round(sRgb.g * 255).toString(16).padStart(2, "0")}${Math.round(sRgb.b * 255).toString(16).padStart(2, "0")}${alwaysIncludeAlpha || sRgb.a < 1 ? Math.round(sRgb.a * 255).toString(16).padStart(2, "0") : ""}`.toUpperCase();
    }
    int() {
        let sRgb = this.sRgbObj(true);
        return Math.round(sRgb.r * 255 << 24) | Math.round(sRgb.g * 255 << 16) | Math.round(sRgb.b * 255 << 8) | Math.round(sRgb.a * 255);
    }
};

globalThis.ColorAnim = class ColorAnim {
    #anim;

    constructor(color = new Color(), accel = 100, time) {
        this.#anim = new Anim(color.okLab(), accel, time);
    }

    get target() {
        return Color.okLab(this.#anim.targets.L, this.#anim.targets.a, this.#anim.targets.b, this.#anim.targets.o);
    }
    set target(target) {
        this.#anim.targets.L = target.L;
        this.#anim.targets.a = target.a;
        this.#anim.targets.a = target.b;
        this.#anim.targets.o = target.o;
    }

    get value() {
        return Color.okLab(this.#anim.values.L, this.#anim.values.a, this.#anim.values.b, this.#anim.values.o);
    }
    set value(value) {
        this.#anim.values.L = value.L;
        this.#anim.values.a = value.a;
        this.#anim.values.a = value.b;
        this.#anim.values.o = value.o;
        this.#anim.axes.L.vel = 0;
        this.#anim.axes.a.vel = 0;
        this.#anim.axes.a.vel = 0;
        this.#anim.axes.o.vel = 0;
    }

    get accel() {
        return this.#anim.accel;
    }
    set accel(accel) {
        this.#anim.accel = accel;
    }

    get time() {
        return this.#anim.time;
    }
    set time(time) {
        this.#anim.time = time;
    }

    get timeLeft() {
        return this.#anim.timeLeft;
    }

    get callback() {
        return this.#anim.callback;
    }
    set callback(callback) {
        this.#anim.callback = callback;
    }

    to = target => {
        this.target = target;
        return this;
    };
    skip = (ratio = 1) => {
        this.#anim.skip(ratio);
        return this;
    };
};

/*
Extremes:
#000: L = 0
#FFF: L = 1
#0F0: a = -0.234
#F0F: a = 0.275
#00F: b = -0.312
#FF0: b = 0.2

Ranges:
#000 ↔ #FFF: ∆L = 1
#0F0 ↔ #F0F: ∆a = 0.509
#00F ↔ #FF0: ∆b = 0.512

Smallest OKLab changes for smallest sRGB changes.
#FEFEFE ↔ #FFFFFF: ∆L = 0.003
#00FE00 ↔ #00FF00: ∆a = 0.0007
#FEFE00 ↔ #FFFF00: ∆b = 0.0006
*/
