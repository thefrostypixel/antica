/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Cache = class Cache {
    #cache = Object.create(null);
    #used = new Set();

    use = (key = "", creator = () => [undefined, () => {}]) => {
        this.#used.add(key);
        if (!(key in this.#cache)) {
            this.#cache[key] = creator();
        }
        return this.#cache[key][0];
    };

    sweep = () => {
        for (let key in this.#cache) {
            if (!this.#used.has(key)) {
                this.#cache[key][1]?.(this.#cache[key][0]);
                delete this.#cache[key];
            }
        }
        this.#used.clear();
    };
    clean = () => {
        for (let key in this.#cache) {
            this.#cache[key][1]?.(this.#cache[key][0]);
            delete this.#cache[key];
        }
        this.#used.clear();
    };
};
