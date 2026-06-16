/*
This file is licensed under CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0),
allowing use, modification, and distribution without restriction,
including commercially, and without requiring this notice.
*/

globalThis.WebTerminal = class WebTerminal {
    constructor(commands = new Commands()) {
        document.body.appendChild(this.#element = document.createElement("terminal"));
        this.#element.setAttribute("style", "display: none;");
        this.#element.appendChild(this.#output = document.createElement("terminal-output"));
        this.#output.setAttribute("style", "box-sizing: border-box; width: 100%; padding: 24px; flex: 1; color: #EEE; font-size: 16px; line-height: 1; overflow: scroll;");
        this.#element.appendChild(this.#input = document.createElement("textarea"));
        this.#input.setAttribute("style", "box-sizing: border-box; width: 100%; height: 46px; padding: 14px 24px; background: none; border: none; border-top: 2px solid #666B; outline: none; color: #EEE; font-size: 16px; line-height: 1; overflow: scroll;");
        let typed = "";
        this.#input.oninput = () => {
            typed = this.#input.value;
            this.#historyIndex = this.#history.length;
        };
        this.#input.onkeydown = event => {
            if (event.key == "ArrowUp") {
                if (this.#historyIndex) {
                    this.#input.selectionStart = this.#input.selectionEnd = (this.#input.value = this.#history[--this.#historyIndex] ?? typed).length;
                }
                event.preventDefault();
            } else if (event.key == "ArrowDown") {
                if (this.#historyIndex < this.#history.length) {
                    this.#input.selectionStart = this.#input.selectionEnd = (this.#input.value = this.#history[++this.#historyIndex] ?? typed).length;
                }
                event.preventDefault();
            } else if (event.key == "Enter") {
                if (this.#input.value.trim()) {
                    this.stream.writeChunk(`> ${this.#input.value}\n`);
                    if (this.#history.at(-1) != this.#input.value) {
                        this.#history.push(this.#input.value);
                    }
                    this.#historyIndex = this.#history.length;
                    this.exec(this.#input.value).catch(() => {
                    });
                    typed = this.#input.value = "";
                    event.preventDefault();
                }
            }
        };
        this.#commands = commands;
        (async () => {
            let lastColor = "0";
            let lastWeight = "0";
            let lastPosture = "0";
            let current = "";
            for await (let chunk of Commands.style.default(this.stream).copyChunks) {
                while (chunk.length) {
                    if (current) {
                        let end = chunk.indexOf("\x1F");
                        if (end < 0) {
                            current += chunk;
                            chunk = "";
                        } else {
                            current += chunk.slice(0, end);
                            if (current[1] == "0") {
                                lastColor = current.slice(2);
                            } else if (current[1] == "1") {
                                lastWeight = current.slice(2);
                            } else if (current[1] == "2") {
                                lastPosture = current.slice(2);
                            }
                            current = "";
                            chunk = chunk.slice(end + 1);
                        }
                    } else if (chunk[0] == "\n") {
                        this.#output.append(document.createElement("br"));
                        chunk = chunk.slice(1);
                    } else if (chunk[0] == "\x1E") {
                        current = "\x1E";
                        chunk = chunk.slice(1);
                    } else {
                        let lineBreakIndex = chunk.indexOf("\n");
                        let styleIndex = chunk.indexOf("\x1E");
                        let end = Math.min(lineBreakIndex < 0 ? Infinity : lineBreakIndex, styleIndex < 0 ? Infinity : styleIndex);
                        let span = document.createElement("span");
                        span.setAttribute("style", `color: ${{"0": "#EEE", "1": "#F64", "2": "#FA5", "3": "#FD9", "4": "#CE8", "5": "#7C7", "6": "#7DC", "7": "#8AF", "8": "#AAF", "9": "#CAF", "A": "#F7D"}[lastColor] ?? "#EEE"}; font-weight: ${lastWeight == "1" ? "bold" : "normal"}; font-style: ${lastPosture == "1" ? "italic" : "normal"}`);
                        span.innerText = chunk.slice(0, end);
                        this.#output.append(span);
                        chunk = chunk.slice(end);
                    }
                }
            }
        })();
        document.addEventListener("keyup", event => {
            if (event.key == this.toggleKey) {
                this.visible = !this.visible;
            }
        });
    }

    #element;
    #output;
    #input;

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

    #visible = false;
    get visible() {
        return this.#visible;
    }
    set visible(visible) {
        if (this.#visible = !!visible) {
            this.#element.setAttribute("style", "box-sizing: border-box; position: fixed; right: 16px; top: 16px; width: calc(50vw - 24px); height: calc(50vh - 24px); display: flex; flex-direction: column; background: #0009; backdrop-filter: blur(8px); border: 2px solid #666B; border-radius: 32px;");
            this.#input.focus();
        } else {
            this.#element.setAttribute("style", "display: none;");
        }
    }
    toggleKey = "F1";
};
