/*
This file is licensed under CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0),
allowing use, modification, and distribution without restriction,
including commercially, and without requiring this notice.
*/

globalThis.Font = class Font {
    static #canvas = new OffscreenCanvas(0, 0);
    static #context = this.#canvas.getContext("2d");

    constructor(...font) {
        this.set(...font);
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

    #cacheKey = () => `${this.size ?? 16}\0${this.weight ?? 400}\0${this.family ?? "Helvetica"}\0${this.color?.L ?? .95}\0${this.color?.a ?? 0}\0${this.color?.b ?? 0}\0${this.color?.o ?? 1}`;

    #metrics = (text = "") => (this.cache || {use: (_, creator) => creator()[0]}).use(`TextMetrics\0${text}\0${this.#cacheKey()}`, () => {
        Font.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.family ?? "Helvetica"}`;
        let measurements = Font.#context.measureText(text);
        return [{
            box: new Box2(0, measurements.width, -measurements.fontBoundingBoxDescent, measurements.fontBoundingBoxAscent),
            fine: new Box2(measurements.actualBoundingBoxLeft, measurements.actualBoundingBoxRight, -measurements.actualBoundingBoxDescent, measurements.actualBoundingBoxAscent),
        }];
    });

    get ascent() {
        return this.#metrics().box.top;
    }
    get descent() {
        return -this.#metrics().box.bottom;
    }
    get height() {
        return this.#metrics().box.height;
    }

    box = (text = "") => this.#metrics(text).box.copy;
    fine = (text = "", pos = new Vec2()) => this.#metrics(text).fine.copy.move(pos);
    coarse = (text = "", pos = new Vec2()) => this.fine(text, pos).ceil();

    colorTexture = (renderer, text = "", pos = new Vec2(), pixelRatio = 1) => this.cache.use(`TextColorTexture\0${renderer.id}\0${text}\0${pos.x}\0${pos.y}\0${pixelRatio}\0${this.#cacheKey()}`, () => {
        Font.#context.clearRect(0, 0, Font.#canvas.width = Math.max(1, Math.ceil(pos.x + this.fine(text).xMax) * pixelRatio), Font.#canvas.height = Math.max(1, Math.ceil(pos.y + this.fine(text).yMax) * pixelRatio));
        Font.#context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        Font.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.family ?? "Helvetica"}`;
        Font.#context.fillStyle = (this.color ?? Color.okLab(.95)).hex();
        Font.#context.fillText(text ?? "", pos.x, pos.y);
        return [renderer.texture(Font.#canvas, Renderer.TextureFormat.sRGBA), texture => texture.delete()];
    });
    monoTexture = (renderer, text = "", pos = new Vec2(), pixelRatio = 1) => this.cache.use(`TextMonoTexture\0${renderer.id}\0${text}\0${pos.x}\0${pos.y}\0${pixelRatio}\0${this.#cacheKey()}`, () => {
        Font.#context.clearRect(0, 0, Font.#canvas.width = Math.max(1, Math.ceil(pos.x + this.fine(text).xMax) * pixelRatio), Font.#canvas.height = Math.max(1, Math.ceil(pos.y + this.fine(text).yMax) * pixelRatio));
        Font.#context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        Font.#context.font = `${this.weight ?? 400} ${this.size ?? 16}px ${this.family ?? "Helvetica"}`;
        Font.#context.fillStyle = "#FFF";
        Font.#context.fillText(text ?? "", pos.x, pos.y);
        return [renderer.texture(Font.#canvas, Renderer.TextureFormat.R), texture => texture.delete()];
    });
    draw = (target, text = "", pos = new Vec2(), pixelRatio = 1, blending = Renderer.Blending.overlay) => {
        let offset = new Vec2(Math.floor(pos.x + this.fine(text).xMin), Math.floor(pos.y - this.fine(text).yMax));
        let texture = this.monoTexture(target.renderer, text, pos.copy.sub(offset), pixelRatio);
        return target.renderer.drawColoredCopy(texture, target, undefined, new Box2(texture).move(offset.scale(pixelRatio)).round(), this.color ?? Color.okLab(.95), blending);
    };

    break = (text = "", maxWidth = 0) => {
        let words = text.split(" ");
        return text ? words.reduce((lines, word) => {
            if (maxWidth < this.#metrics(`${lines.at(-1)} ${word}`).box.width) {
                lines.push(word);
            } else {
                lines[lines.length - 1] += ` ${word}`;
            }
            return lines;
        }, [words.shift()]) : [];
    };
};
