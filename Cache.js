/*
This file is licensed under CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0),
allowing use, modification, and distribution without restriction,
including commercially, and without requiring this notice.
*/

// https://github.com/thefrostypixel/antica/wiki/Cache
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
        return this;
    };
    clean = () => {
        for (let key in this.#cache) {
            this.#cache[key][1]?.(this.#cache[key][0]);
            delete this.#cache[key];
        }
        this.#used.clear();
        return this;
    };
};
