/*
This file is licensed under CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0),
allowing use, modification, and distribution without restriction,
including commercially, and without requiring this notice.
*/

globalThis.StreamIncompleteError = class StreamIncompleteError extends Error {};
globalThis.StreamClosedError = class StreamClosedError extends Error {};

globalThis.ArrayStream = class ArrayStream {
    static closed = (elements = []) => new ArrayStream().writeChunk(elements).close();
    static canceled = reason => new ArrayStream().cancel(reason);
    static merge = (...streams) => {
        let merged = new ArrayStream();
        Promise.all(streams.flat(Infinity).map(stream => stream.copyTo(merged).promise)).then(merged.close, merged.cancel);
        return merged;
    };
    static redirect = (target, ...streams) => {
        streams.flat(Infinity).forEach(stream => stream.copyTo(target));
        return target;
    };
    
    #closed = false;
    #canceled = false;
    #reason = false;
    #close = Promise.withResolvers();
    get open() {
        return !this.#closed && !this.#canceled;
    }
    get closed() {
        return this.#closed;
    }
    get canceled() {
        return this.#canceled;
    }
    get reason() {
        return this.#reason;
    }
    
    close = () => {
        if (this.open) {
            this.#closed = true;
            this.#close.resolve();
        }
        return this;
    };
    cancel = reason => {
        if (this.open) {
            this.#canceled = true;
            this.#reason = reason;
            this.#content = [];
            this.#close.resolve();
        }
        return this;
    };

    #content = [];
    #taken = 0;
    #next = Promise.withResolvers();
    writeChunk = (elements = []) => {
        if (this.open && elements.length) {
            for (let element of elements) {
                this.#content.push(element);
            }
            this.#next.resolve();
            this.#next = Promise.withResolvers();
        }
        return this;
    };
    writeEach = (...element) => this.writeChunk(element);

    get promise() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this;
        });
    }
    get copy() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this.copyAvailable();
        });
    }
    get take() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this.takeAvailable();
        });
    }

    get copyChunks() {
        let index = this.#taken;
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (index - this.#taken < this.#content.length) {
                    let start = index - this.#taken;
                    index = this.#content.length + this.#taken;
                    return {value: this.#content.slice(start)};
                } else if (this.closed) {
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get copyEach() {
        let index = this.#taken;
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (index - this.#taken < this.#content.length) {
                    return {value: this.#content[index++ + this.#taken]};
                } else if (this.closed) {
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get takeChunks() {
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (this.#content.length) {
                    let content = this.#content;
                    this.#content = [];
                    this.#taken += content.length;
                    return {value: content};
                } else if (this.closed) {
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get takeEach() {
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (this.#content.length) {
                    this.#taken++;
                    return {value: this.#content.shift()};
                } else if (this.closed) {
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get takeNext() {
        return (async () => {
            while (this.open && !this.available) {
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
            if (this.canceled) {
                throw this.reason;
            } else if (this.available) {
                this.#taken++;
                return this.#content.shift();
            }
            throw new StreamClosedError();
        })();
    }

    copyTo = (...stream) => {
        let streams = stream.flat(Infinity);
        (async () => {
            try {
                for await (let chunk of this.copyChunks) {
                    streams.forEach(stream => stream.writeChunk(chunk));
                }
            } catch (e) {}
        })();
        return this;
    };
    takeTo = (...stream) => {
        let streams = stream.flat(Infinity);
        (async () => {
            try {
                for await (let chunk of this.takeChunks) {
                    streams.forEach(stream => stream.writeChunk(chunk));
                }
            } catch (e) {}
        })();
        return this;
    };

    get available() {
        if (this.canceled) {
            throw this.reason;
        }
        return this.#content.length;
    }
    copyAvailable = () => {
        if (this.canceled) {
            throw this.reason;
        }
        return Array.from(this.#content);
    };
    takeAvailable = () => {
        if (this.canceled) {
            throw this.reason;
        }
        let content = this.#content;
        this.#content = [];
        this.#taken += content.length;
        return content;
    };
    takeNextAvailable = () => {
        if (this.canceled) {
            throw this.reason;
        } else if (this.available) {
            this.#taken++;
            return this.#content.shift();
        }
        throw new StreamIncompleteError();
    };
};

globalThis.StringStream = class StringStream {
    static closed = (...string) => new StringStream().writeChunk(string).close();
    static canceled = reason => new StringStream().cancel(reason);
    static merge = (...streams) => {
        let merged = new StringStream();
        Promise.all(streams.flat(Infinity).map(stream => stream.copyTo(merged).promise)).then(merged.close, merged.cancel);
        return merged;
    };
    static redirect = (target, ...streams) => {
        streams.flat(Infinity).forEach(stream => stream.copyTo(target));
        return target;
    };

    #closed = false;
    #canceled = false;
    #reason = false;
    #close = Promise.withResolvers();
    get open() {
        return !this.#closed && !this.#canceled;
    }
    get closed() {
        return this.#closed;
    }
    get canceled() {
        return this.#canceled;
    }
    get reason() {
        return this.#reason;
    }
    
    close = () => {
        if (this.open) {
            this.#closed = true;
            this.#close.resolve();
        }
        return this;
    };
    cancel = reason => {
        if (this.open) {
            this.#canceled = true;
            this.#reason = reason;
            this.#content = "";
            this.#close.resolve();
        }
        return this;
    };

    #content = "";
    #taken = 0;
    #inLine = false;
    #next = Promise.withResolvers();
    writeChunk = (...string) => {
        if (this.open) {
            string = string.flat(Infinity).join("");
            if (string) {
                this.#content += string;
                this.#inLine = string.at(-1) != "\n";
                this.#next.resolve();
                this.#next = Promise.withResolvers();
            }
        }
        return this;
    };
    writeLine = (...line) => this.writeChunk(this.#inLine ? "\n" : "", line.flat(Infinity).map(line => `${line}\n`));

    get promise() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this;
        });
    }
    get copy() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this.copyAvailable();
        });
    }
    get copyLines() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this.copyAvailableLines();
        });
    }
    get take() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this.takeAvailable();
        });
    }
    get takeLines() {
        return this.#close.promise.then(() => {
            if (this.#canceled) {
                throw this.#reason;
            }
            return this.takeAvailableLines();
        });
    }

    get copyChunks() {
        let index = this.#taken;
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (index - this.#taken < this.#content.length) {
                    let start = index - this.#taken;
                    index = this.#content.length + this.#taken;
                    return {value: this.#content.slice(start)};
                } else if (this.closed) {
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get copyEachLine() {
        let index = this.#taken;
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (this.#content.indexOf("\n", index - this.#taken) > -1) {
                    let start = index - this.#taken;
                    index = this.#content.indexOf("\n", index - this.#taken) + this.#taken;
                    return {value: this.#content.slice(start, index++ - this.#taken)};
                } else if (this.closed) {
                    if (index - this.#taken < this.#content.length) {
                        let start = index - this.#taken;
                        index = this.#content.length + this.#taken;
                        return {value: this.#content.slice(start)};
                    }
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get takeChunks() {
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (this.#content.length) {
                    let value = this.#content;
                    this.#content = "";
                    this.#taken += value.length;
                    return {value};
                } else if (this.closed) {
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get takeEachLine() {
        let next = async () => {
            while (true) {
                if (this.canceled) {
                    throw this.reason;
                } else if (this.#content.includes("\n")) {
                    let value = this.#content.slice(0, this.#content.indexOf("\n"));
                    this.#content = this.#content.slice(value.length + 1);
                    this.#taken += value.length + 1;
                    return {value};
                } else if (this.closed) {
                    if (this.#content.length) {
                        let value = this.#content;
                        this.#content = "";
                        this.#taken += value.length;
                        return {value};
                    }
                    return {done: true};
                }
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
        };
        return {[Symbol.asyncIterator]: () => ({next})};
    }
    get takeNextLine() {
        return (async () => {
            while (this.open && !this.#content.includes("\n")) {
                await Promise.race([this.#next.promise, this.#close.promise]);
            }
            if (this.canceled) {
                throw this.reason;
            } else if (this.#content.includes("\n")) {
                let line = this.#content.slice(0, this.#content.indexOf("\n"));
                this.#content = this.#content.slice(line.length + 1);
                this.#taken += line.length + 1;
                return line;
            } else if (this.closed && this.available) {
                let line = this.#content;
                this.#content = "";
                this.#taken += line.length;
                return line;
            }
            throw new StreamClosedError();
        })();
    }

    copyTo = (...stream) => {
        let streams = stream.flat(Infinity);
        (async () => {
            try {
                for await (let chunk of this.copyChunks) {
                    streams.forEach(stream => stream.writeChunk(chunk));
                }
            } catch (e) {}
        })();
        return this;
    };
    takeTo = (...stream) => {
        let streams = stream.flat(Infinity);
        (async () => {
            try {
                for await (let chunk of this.takeChunks) {
                    streams.forEach(stream => stream.writeChunk(chunk));
                }
            } catch (e) {}
        })();
        return this;
    };

    get available() {
        if (this.canceled) {
            throw this.reason;
        }
        return !!this.#content.length;
    }
    get availableLines() {
        if (this.canceled) {
            throw this.reason;
        }
        return this.#content.split("\n").length - 1 + (this.closed && this.available && this.#content.at(-1) != "\n");
    }
    copyAvailable = () => {
        if (this.canceled) {
            throw this.reason;
        }
        return this.#content;
    };
    copyAvailableLines = () => {
        if (this.canceled) {
            throw this.reason;
        }
        let lines = this.#content.split("\n");
        if (this.open || !lines.at(-1)) {
            lines.pop();
        }
        return lines;
    };
    takeAvailable = () => {
        if (this.canceled) {
            throw this.reason;
        }
        let content = this.#content;
        this.#content = "";
        this.#taken += content.length;
        return content;
    };
    takeAvailableLines = () => {
        if (this.canceled) {
            throw this.reason;
        }
        let lines = [];
        while (this.#content.includes("\n")) {
            let line = this.#content.slice(0, this.#content.indexOf("\n"));
            this.#content = this.#content.slice(line.length + 1);
            this.#taken += line.length + 1;
            lines.push(line);
        }
        if (this.closed && this.available) {
            lines.push(this.#content);
            this.#taken += this.#content.length;
            this.#content = "";
        }
        return lines;
    };
    takeNextAvailableLine = () => {
        if (this.canceled) {
            throw this.reason;
        } else if (this.#content.includes("\n")) {
            let line = this.#content.slice(0, this.#content.indexOf("\n"));
            this.#content = this.#content.slice(line.length + 1);
            this.#taken += line.length + 1;
            return line;
        } else if (this.closed && this.available) {
            let line = this.#content;
            this.#content = "";
            this.#taken += line.length;
            return line;
        }
        throw new StreamIncompleteError();
    };
};
