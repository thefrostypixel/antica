/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Text = class Text {
    static #canvas = new OffscreenCanvas(0, 0);
    static #context = this.#canvas.getContext("2d");

    constructor(...text) {
        this.set(...text);
    }

    #text = undefined;
    get text() {
        return this.#text;
    }
    set text(text) {
        if (text == undefined || typeof text == "string") {
            this.#text = text ?? undefined;
        }
    }

    #size = undefined;
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

    #font = undefined;
    get font() {
        return this.#font;
    }
    set font(font) {
        if (font == undefined || typeof font == "string") {
            this.#font = font ?? undefined;
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

    set(...text) {
        text.forEach(text => {
            if (text instanceof Object) {
                for (let setting of ["text", "size", "weight", "font", "color", "cache"]) {
                    if (text[setting] != undefined) {
                        this[setting] = text[setting];
                    }
                }
            }
        });
        return this;
    }

    get #cacheKey() {
        return `${this.text ?? ""}\0${this.size ?? 16}\0${this.weight ?? 400}\0${this.font ?? "Helvetica"}\0${this.color?.L ?? .95}\0${this.color?.a ?? 0}\0${this.color?.b ?? 0}\0${this.color?.alpha ?? 1}`;
    }

    get #metrics() {
        return (this.cache || {use: (_, creator) => creator()[0]}).use(`TextMetrics\0${this.#cacheKey}`, () => {
            Text.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.font ?? "Helvetica"}`;
            let measurements = Text.#context.measureText(this.text ?? "");
            let metrics = {};
            metrics.ascent = measurements.fontBoundingBoxAscent;
            metrics.descent = measurements.fontBoundingBoxDescent;
            metrics.height = metrics.ascent + metrics.descent;
            metrics.fine = new Box2(measurements.actualBoundingBoxLeft, measurements.actualBoundingBoxRight, -measurements.actualBoundingBoxDescent, measurements.actualBoundingBoxAscent);
            metrics.coarse = new Box2(Math.floor(metrics.fine.xMin), Math.ceil(metrics.fine.xMax), Math.floor(metrics.fine.yMin), Math.ceil(metrics.fine.yMax));
            return [metrics];
        });
    }

    get ascent() {
        return this.#metrics.ascent;
    }
    get descent() {
        return this.#metrics.descent;
    }
    get height() {
        return this.#metrics.height;
    }

    get fine() {
        return this.#metrics.fine.copy;
    }
    get coarse() {
        return this.#metrics.coarse.copy;
    }

    monoTexture = renderer => this.cache.use(`TextMonoTexture\0${renderer.id}\0${this.#cacheKey}`, () => {
        Text.#context.clearRect(0, 0, Text.#canvas.width = this.coarse.width, Text.#canvas.height = this.coarse.height);
        Text.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.font ?? "Helvetica"}`;
        Text.#context.fillStyle = "#FFF";
        Text.#context.fillText(this.text ?? "", -this.coarse.left, this.coarse.top);
        return [renderer.texture(Text.#canvas, Renderer.TextureFormat.R), texture => texture.delete()];
    });
    colorTexture = renderer => this.cache.use(`TextColorTexture\0${renderer.id}\0${this.#cacheKey}`, () => {
        Text.#context.clearRect(0, 0, Text.#canvas.width = this.coarse.width, Text.#canvas.height = this.coarse.height);
        Text.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.font ?? "Helvetica"}`;
        Text.#context.fillStyle = (this.color ?? Color.okLab(.95)).hex();
        Text.#context.fillText(this.text ?? "", -this.coarse.left, this.coarse.top);
        return [renderer.texture(Text.#canvas, Renderer.TextureFormat.sRGBA), texture => texture.delete()];
    });
    draw = (target, pos = new Vec2(), blending = Renderer.Blending.overlay) => target.renderer.drawColoredCopy(this.monoTexture(target.renderer), target, undefined, this.coarse.copy.move(pos), this.color ?? Color.okLab(.95), blending);
};
