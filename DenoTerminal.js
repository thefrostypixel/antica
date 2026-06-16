/*
This file is licensed under CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0),
allowing use, modification, and distribution without restriction,
including commercially, and without requiring this notice.
*/

globalThis.DenoTerminal = class DenoTerminal {
    constructor(commands = new Commands()) {
        let encoder = new TextEncoder();
        let decoder = new TextDecoder();
        let typed = "";
        let active = "";
        let pos = 0;
        try {
            Deno.stdin.setRaw(true);
        } catch (e) {}
        let input = Deno.stdin.readable.getReader();
        let inputOpen = true;
        (async () => {
            while (true) {
                await Deno.stdout.write(encoder.encode(`\r\x1B[0J\x1B[0m> ${active}${"\x1B[D".repeat(active.length - pos)}`));
                let {value, done} = await input.read();
                if (done) {
                    inputOpen = false;
                    await Deno.stdout.write(encoder.encode(`\r\x1B[0J`));
                    try {
                        Deno.stdin.setRaw(false);
                    } catch (e) {}
                    return;
                }
                value = decoder.decode(value);
                for (let i = 0; i < value.length; i++) {
                    if (value[i] == "\x1B") {
                        if (value[++i] == "[") {
                            if (value[++i] == "3") {
                                if (value[++i] == "~" && active.length > pos) { // ⌦
                                    typed = active = active.slice(0, pos) + active.slice(pos + 1);
                                    this.#historyIndex = this.#history.length;
                                }
                            } else if (value[i] == "A") { // △
                                if (this.#historyIndex) {
                                    pos = (active = this.#history[--this.#historyIndex] ?? typed).length;
                                }
                            } else if (value[i] == "B") { // ▽
                                if (this.#historyIndex < this.#history.length) {
                                    pos = (active = this.#history[++this.#historyIndex] ?? typed).length;
                                }
                            } else if (value[i] == "C") { // ▷
                                pos = Math.min(pos + 1, active.length);
                            } else if (value[i] == "D") { // ◁
                                pos = Math.max(pos - 1, 0);
                            }
                        }
                    } else if (value[i] == "\x7F") { // ⌫
                        if (pos) {
                            typed = active = active.slice(0, pos - 1) + active.slice(pos--);
                            this.#historyIndex = this.#history.length;
                        }
                    } else if (value[i] == "\x03") { // ^C
                        if (active) {
                            this.#historyIndex = this.#history.length;
                            typed = active = "";
                            pos = 0;
                        } else {
                            input.cancel();
                            break;
                        }
                    } else if (value[i] == "\n" || value[i] == "\r") {
                        await Deno.stdout.write(encoder.encode(`\r\x1B[0J\x1B[0m> ${active}\n`));
                        if (this.#history.at(-1) != active) {
                            this.#history.push(active);
                        }
                        this.#historyIndex = this.#history.length;
                        this.exec(active).catch(() => {});
                        typed = active = "";
                        pos = 0;
                    } else {
                        typed = active = active.slice(0, pos) + value[i] + active.slice(pos++);
                        this.#historyIndex = this.#history.length;
                    }
                }
            }
        })();
        this.#commands = commands;
        (async () => {
            let lastColor = "0";
            let lastWeight = "0";
            let lastPosture = "0";
            for await (let line of Commands.style.default(this.stream).copyEachLine) {
                let ansiColor = color => {
                    let id = {"0": 15 /* EEE */, "1": 202 /* F64 */, "2": 215 /* FA5 */, "3": 222 /* FD9 */, "4": 192 /* CE8 */, "5": 78 /* 7C7 */, "6": 116 /* 7DC */, "7": 111 /* 8AF */, "8": 147 /* AAF */, "9": 183 /* CAF */, "A": 212 /* F7D */}[color];
                    lastColor = id ? color : "15";
                    return `\x1B[38;5;${id || 15}m`;
                };
                let ansiWeight = weight => (lastWeight = weight) == "1" ? "\x1B[1m" : "\x1B[22m";
                let ansiPosture = posture => (lastPosture = posture) == "1" ? "\x1B[3m" : "\x1B[23m";
                line = ansiColor(lastColor) + ansiWeight(lastWeight) + ansiPosture(lastPosture) + line.replace(/\x1E([0-9A-F-af]*?)\x1F/g, (_, code) => {
                    if (code[0] == "0") {
                        return ansiColor(code.slice(1))
                    } else if (code[0] == "1") {
                        return ansiWeight(code.slice(1));
                    } else if (code[0] == "2") {
                        return ansiPosture(code.slice(1));
                    }
                    return "";
                });
                await Deno.stdout.write(encoder.encode(`\r\x1B[0J${line}\n`));
                if (inputOpen) {
                    await Deno.stdout.write(encoder.encode(`\x1B[0m> ${active}${"\x1B[D".repeat(active.length - pos)}`));
                }
            }
        })();
    }

    #history = [];
    #historyIndex = 0;

    #commands;
    get commands() {
        return this.#commands;
    }

    get registered() {
        return this.commands.registered;
    }
    command = name => this.commands.command(name);
    register = command => {
        this.commands.register(command);
        return this;
    };
    unregister = command => {
        this.commands.unregister(command);
        return this;
    };

    get stream() {
        return this.commands.stream;
    }

    exec = async (command, stream = this.stream) => this.commands.exec(command, stream);
};
