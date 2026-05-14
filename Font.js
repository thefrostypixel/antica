/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Font = class Font {
    static #canvas = new OffscreenCanvas(0, 0);
    static #context = this.#canvas.getContext("2d");

    constructor(...font) {
        this.set(...font);
    }

    get size() {
        return this.#size;
    }
    set size(size) {
        if (size == undefined || typeof size == "number") {
            this.#size = size ?? undefined;
        }
    }

    #weight = undefined;
    get weight() {
        return this.#weight;
    }
    set weight(weight) {
        if (weight == undefined || typeof weight == "number") {
            this.#weight = weight ?? undefined;
        }
    }

    #family = undefined;
    get family() {
        return this.#family;
    }
    set family(family) {
        if (family == undefined || typeof family == "string") {
            this.#family = family ?? undefined;
        }
    }

    #color = undefined;
    get color() {
        return this.#color;
    }
    set color(color) {
        if (color == undefined || color instanceof Color) {
            this.#color = color ?? undefined;
        }
    }

    #cache = undefined;
    get cache() {
        return this.#cache;
    }
    set cache(cache) {
        if (cache == undefined || cache instanceof Cache) {
            this.#cache = cache ?? undefined;
        }
    }

    get copy() {
        return new Text(this);
    }

    set(...font) {
        font.forEach(font => {
            if (font instanceof Object) {
                for (let setting of ["size", "weight", "font", "color", "cache"]) {
                    if (font[setting] != undefined) {
                        this[setting] = font[setting];
                    }
                }
            }
        });
        return this;
    }

    #cacheKey = () => `${this.size ?? 16}\0${this.weight ?? 400}\0${this.family ?? "Helvetica"}\0${this.color?.L ?? .95}\0${this.color?.a ?? 0}\0${this.color?.b ?? 0}\0${this.color?.alpha ?? 1}`;

    #metrics = text => (this.cache || {use: (_, creator) => creator()[0]}).use(`TextMetrics\0${text}\0${this.#cacheKey()}`, () => {
        Font.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.family ?? "Helvetica"}`;
        let measurements = Font.#context.measureText(text ?? "");
        let metrics = {};
        metrics.ascent = measurements.fontBoundingBoxAscent;
        metrics.descent = measurements.fontBoundingBoxDescent;
        metrics.height = metrics.ascent + metrics.descent;
        metrics.fine = new Box2(measurements.actualBoundingBoxLeft, measurements.actualBoundingBoxRight, -measurements.actualBoundingBoxDescent, measurements.actualBoundingBoxAscent);
        metrics.coarse = new Box2(Math.floor(metrics.fine.xMin), Math.ceil(metrics.fine.xMax), Math.floor(metrics.fine.yMin), Math.ceil(metrics.fine.yMax));
        return [metrics];
    });

    get ascent() {
        return this.#metrics().ascent;
    }
    get descent() {
        return this.#metrics().descent;
    }
    get height() {
        return this.#metrics().height;
    }

    fine = text => this.#metrics(text).fine.copy;
    coarse = text => this.#metrics(text).coarse.copy;

    monoTexture = (renderer, text = "") => this.cache.use(`TextMonoTexture\0${renderer.id}\0${text}\0${this.#cacheKey()}`, () => {
        Font.#context.clearRect(0, 0, Font.#canvas.width = this.coarse(text).width, Font.#canvas.height = this.coarse(text).height);
        Font.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.family ?? "Helvetica"}`;
        Font.#context.fillStyle = "#FFF";
        Font.#context.fillText(text ?? "", -this.coarse(text).left, this.coarse(text).top);
        return [renderer.texture(Font.#canvas, Renderer.TextureFormat.R), texture => texture.delete()];
    });
    colorTexture = (renderer, text = "") => this.cache.use(`TextColorTexture\0${renderer.id}\0${text}\0${this.#cacheKey()}`, () => {
        Font.#context.clearRect(0, 0, Font.#canvas.width = this.coarse(text).width, Font.#canvas.height = this.coarse(text).height);
        Font.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.family ?? "Helvetica"}`;
        Font.#context.fillStyle = (this.color ?? Color.okLab(.95)).hex();
        Font.#context.fillText(text ?? "", -this.coarse(text).left, this.coarse(text).top);
        return [renderer.texture(Font.#canvas, Renderer.TextureFormat.sRGBA), texture => texture.delete()];
    });
    draw = (target, text = "", pos = new Vec2(), blending = Renderer.Blending.overlay) => target.renderer.drawColoredCopy(this.monoTexture(target.renderer, text), target, undefined, this.coarse(text).copy.move(pos), this.color ?? Color.okLab(.95), blending);
};
