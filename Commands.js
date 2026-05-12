/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Commands = class Commands {
    static CommandNotFoundError = class CommandNotFoundError extends Error {
        constructor(command) {
            super(`Command not found: ${command}`);
            this.#command = command;
        }

        #command;
        get command() {
            return this.#command;
        }
    };

    constructor() {
        this.register(new Commands.Command({
            name: "help",
            summary: "Help for commands.",
            description: `
            ${Commands.style.blue(`help`)}: List all commands with summaries or the description for a specific command.
            ${Commands.style.yellow(`(topic)`)}: Defaults to "${Commands.style.blue(`overview`)}" for an overview, can be "${Commands.style.blue(`syntax`)}" for an explanation of the command syntax, "${Commands.style.blue(`commands`)}" for a list of commands with their summaries or "${Commands.style.blue(`command`)}" for the description of a specific command.
            ${Commands.style.blue(`topic=command`)}:
            ${Commands.style.yellow(`(command)`)}: Command to describe.
            `,
            handler: async (args, stream) => {
                let topic = await args.enum("topic", {default: "overview", values: ["overview", "syntax", "commands", "command"]});
                if (topic == "overview") {
                    stream.writeLine(`
                    ${Commands.style.blue(`help syntax`)}: Explanation of the command syntax.
                    ${Commands.style.blue(`help commands`)}: List of commands with their summaries.
                    ${Commands.style.blue(`help command `)}${Commands.style.yellow(`(command)`)}: Description of a specific command.
                    ${Commands.style.blue(`find "{help commands}" "`)}${Commands.style.yellow(`(find)`)}${Commands.style.blue(`"`)}: Search for commands by summaries.
                    `.replace(/^\s*|\s*$/gi, "").replace(/^\s*|\s*$/gmi, ""));
                } else if (topic == "syntax") {
                    stream.writeLine(`
                    Every command is a group. Groups contain named values ${Commands.style.yellow("(name)")}${Commands.style.blue("=")}${Commands.style.yellow("(value)")}, and ordered values ${Commands.style.yellow("(value)")}, which may be named or taken by the executed command. Names have to be unique.
                    Values are either another group ${Commands.style.blue("[")}${Commands.style.yellow("(values...)")}${Commands.style.blue("]")}, or text, which can be quoted ${Commands.style.blue("\"")}${Commands.style.yellow("(text...)")}${Commands.style.blue("\"")} to allow spaces, line breaks and other reserved characters that have to be escaped otherwise.

                    Escapes behave the same everywhere. A backslash ${Commands.style.blue("\\")} followed by a line break is ignored, ${Commands.style.blue("\\x")}${Commands.style.yellow("(NN)")} creates a byte from a hex value, ${Commands.style.blue("\\u")}${Commands.style.yellow("(NNNN)")} creates a Unicode character from a hex value, ${Commands.style.blue("\\n")} creates a line break (${Commands.style.blue("\\x0A")}), ${Commands.style.blue("\\e")} creates an escape start (${Commands.style.blue("\\x1E")}), ${Commands.style.blue("\\f")} creates an escape end (${Commands.style.blue("\\x1F")}) and a backslash ${Commands.style.blue("\\")} followed by any other character creates that character.

                    Line comments are started with ${Commands.style.blue("#>")}. Block comments are toggled with ${Commands.style.blue("##")} and ended with ${Commands.style.blue("#")}.
 
                    Output of plain subcommands ${Commands.style.blue("{")}${Commands.style.yellow("(command...)")}${Commands.style.blue("}")} is parsed and merge it into the group it's in.
                    Output of subcommands in quotes ${Commands.style.blue("\"{")}${Commands.style.yellow("(command...)")}${Commands.style.blue("}\"")} or in a named value ${Commands.style.yellow("(name)")}${Commands.style.blue("={")}${Commands.style.yellow("(command...)")}${Commands.style.blue("}")} is streamed as literal text.

                    Multiple commands can be run sequentially, in parallel or as a fallback by writing operators between them. They are executed from left to right unless parentheses ${Commands.style.blue("()")} are used to control precedence. A line break without adjacent operators implies sequential execution.
                    Sequential ${Commands.style.blue(">")} executes the second command once the first is completed.
                    Parallel ${Commands.style.blue("|")} executes both commands at the same time, merges their outputs, completes once both are completed and fails if either failed.
                    Fallback ${Commands.style.blue("?")} waits for the first command to complete. Sends the first commands output if it is completed or executes the second if it failed.
                    `.replace(/^\s*|\s*$/gi, "").replace(/^[\r\t\f\v ]*|[\r\t\f\v ]*$/gmi, ""));
                } else if (topic == "commands") {
                    this.registered.forEach(command => stream.writeLine(`${Commands.style.blue(command.name)}${command.summary ? `: ${command.summary}` : ""}`));
                } else {
                    let command = await args.string("command");
                    if (this.command(command)) {
                        stream.writeLine(this.command(command).description);
                    } else {
                        throw new Commands.CommandNotFoundError(command);
                    }
                }
            },
        }));
        this.register(new Commands.Command({
            name: "out",
            summary: "Output the input.",
            description: `
            ${Commands.style.blue(`out`)}: Output the input.
            ${Commands.style.yellow(`(input...)`)}: Text to output.
            ${Commands.style.yellow(`(mode)`)}: Separator. Defaults to "${Commands.style.blue(`lines`)}" to output each input as an individual line, can be "${Commands.style.blue(`line`)}" to output the whole input separated by spaces as one line, or "${Commands.style.blue(`raw`)}" to output the whole input without separators or a line break.
            `,
            handler: async (args, stream) => {
                let inputs = await args.remainingStreamStream();
                let mode = await args.enum("mode", {default: "lines", values: ["lines", "line", "raw"]});
                let inLine = false;
                for await (let input of inputs.copyEach) {
                    if (inLine && mode == "line") {
                        stream.writeChunk(" ");
                    }
                    await input.copyTo(stream).promise;
                    inLine = input.copyAvailable().at(-1) != "\n";
                    if (inLine && mode == "lines") {
                        stream.writeChunk("\n");
                        inLine = false;
                    }
                }
                if (inLine && mode == "line") {
                    stream.writeChunk("\n");
                }
            },
        }));
        this.register(new Commands.Command({
            name: "error",
            summary: "Throw an error.",
            description: `
            ${Commands.style.blue(`error`)}: Throw an error with a given message.
            ${Commands.style.yellow(`(message)`)}: Text to output.
            `,
            handler: async args => {
                let message = await args.string("message");
                throw new Error(message);
            },
        }));
        this.register(new Commands.Command({
            name: "style",
            summary: "Style the input.",
            description: `
            ${Commands.style.blue(`style`)}: Output the input with style.
            ${Commands.style.yellow(`(text)`)}: Text to style.
            ${Commands.style.yellow(`(style...)`)}: Style to apply.
            Colors: ${Commands.style.white(`white`)}, ${Commands.style.red(`red`)}, ${Commands.style.orange(`orange`)}, ${Commands.style.yellow(`yellow`)}, ${Commands.style.lime(`lime`)}, ${Commands.style.green(`green`)}, ${Commands.style.turquoise(`turquoise`)}, ${Commands.style.blue(`blue`)}, ${Commands.style.violet(`violet`)}, ${Commands.style.purple(`purple`)}, ${Commands.style.magenta(`magenta`)}, ${Commands.style.cleanColor(`cleanColor`)}.
            Weights: ${Commands.style.regular(`regular`)}, ${Commands.style.bold(`bold`)}, ${Commands.style.cleanWeight(`cleanWeight`)}.
            Postures: ${Commands.style.roman(`roman`)}, ${Commands.style.italic(`italic`)}, ${Commands.style.cleanPosture(`cleanPosture`)}.
            Special: ${Commands.style.default(`default`)} (white, regular, roman), ${Commands.style.clean(`clean`)}.
            `,
            handler: async (args, stream) => {
                let input = await args.stream("text");
                let styles = await args.remainingEnums({default: "default", values: ["white", "red", "orange", "yellow", "lime", "green", "turquoise", "blue", "violet", "purple", "magenta", "cleanColor", "regular", "bold", "cleanWeight", "roman", "italic", "cleanPosture", "default", "clean"]});
                for (let style of styles) {
                    input = Commands.style[style](input);
                }
                input.copyTo(stream);
                await input.promise;
            },
        }));
        this.register(new Commands.Command({
            name: "wait",
            summary: "Wait for a given duration.",
            description: `
            ${Commands.style.blue(`wait`)}: Wait for a given duration.
            ${Commands.style.yellow(`(duration)`)}: Number of seconds to wait.
            `,
            handler: async args => {
                let duration = await args.number("duration", {default: 0, minValue: 0, minValueInclusive: true});
                return new Promise(resolve => setTimeout(resolve, duration * 1000));
            },
        }));
        this.register(new Commands.Command({
            name: "void",
            summary: "Nothing.",
            description: `
            ${Commands.style.blue(`void`)}: Nothing.
            `,
            handler: () => {},
        }));

        this.register(new Commands.Command({
            name: "find",
            summary: "Find lines of text.",
            description: `
            ${Commands.style.blue(`find`)}: Find lines of text.
            ${Commands.style.yellow(`(input)`)}: Text to find in.
            ${Commands.style.yellow(`(find)`)}: Text to find.
            ${Commands.style.yellow(`(mode)`)}: Defaults to "${Commands.style.blue(`text`)}" to match literally, can be "${Commands.style.blue(`regex`)}" to match as a regular expression.
            ${Commands.style.yellow(`(flags)`)}: Regular expression flags.
            `,
            handler: async (args, stream) => {
                let input = await args.stream("input");
                let find = await args.string("find");
                let mode = await args.enum("mode", {default: "text", values: ["text", "regex"]});
                let flags = new Set("giu");
                Array.from(await args.string("flags")).forEach(flag => {
                    if ("gisu".includes(flag.toLowerCase())) {
                        if (flag == flag.toLowerCase()) {
                            flags.add(flag);
                        } else {
                            flags.delete(flag);
                        }
                    }
                });
                let test;
                if (mode == "text") {
                    test = flags.has("i") ? (text => text.toLowerCase().includes(find.toLowerCase())) : (text => text.includes(find));
                } else {
                    let regex = new RegExp(find, Array.from(flags).join(""));
                    test = text => regex.test(text);
                }
                for await (let line of input.copyEachLine) {
                    if (test(line)) {
                        stream.writeLine(line);
                    }
                }
            },
        }));
        // TODO 'replace (text) (find) (replace) (mode) (flags)'
        // TODO 'split (text) (delimiter) (mode) (flags)'
        // TODO 'join (text...) (delimiter)'

        this.register(new Commands.Command({
            name: "select",
            summary: "Output the one of the given texts at the given index.",
            description: `
            ${Commands.style.blue(`select`)}: Select a text to output.
            ${Commands.style.yellow(`(index)`)}: The zero-based index of the text output.
            ${Commands.style.yellow(`(text...)`)}: The text to pick one of to output.
            `,
            handler: async (args, stream) => {
                let index = await args.integer("index", {default: 0, minValue: 0});
                let remaining = index;
                let streams = await args.remainingStreamStream();
                try {
                    while (remaining) {
                        await streams.takeNext;
                        remaining--;
                    }
                    await (await streams.takeNext).takeTo(stream).promise;
                } catch (e) {
                    if (e instanceof StreamClosedError) {
                        throw new Error(`Cannot output text at index ${index} of only ${index - remaining}.`);
                    }
                    throw e;
                }
            },
        }));
        this.register(new Commands.Command({
            name: "repeat",
            summary: "Repeat a command a number of times.",
            description: `
            ${Commands.style.blue(`repeat`)}: Repeat a command a number of times.
            ${Commands.style.yellow(`(count)`)}: Number of times to run the command.
            ${Commands.style.yellow(`(command)`)}: The command to run.
            ${Commands.style.yellow(`(mode)`)}: Output separator. Defaults to "${Commands.style.blue(`lines`)}" to output each command's output as an individual line, can be "${Commands.style.blue(`line`)}" to output all commands outputs separated by spaces as one line, or "${Commands.style.blue(`raw`)}" to output all commands outputs without separators or a line break.
            `,
            handler: async (args, stream) => {
                let count = await args.number("count", {default: 1, minValue: 0});
                let command = await args.string("command");
                let mode = await args.enum("mode", {default: "lines", values: ["lines", "line", "raw"]});
                for (let i = 0; i < count; i++) {
                    await this.exec(command, stream);
                    if (i < input.length - 1) {
                        if (mode == "lines") {
                            stream.writeLine();
                        } else if (mode == "line") {
                            stream.writeChunk(" ");
                        }
                    }
                }
                if (count && mode == "line") {
                    stream.writeLine();
                }
            },
        }));
        // TODO 'eval (calculation)'
        // TODO Text comparison.
    }

    #registered = Object.create(null);
    get registered() {
        return Object.values(this.#registered).sort((a, b) => a.name.localeCompare(b.name));
    }
    command = name => this.#registered[name];
    register = command => {
        this.#registered[command.name] = command;
        return this;
    };
    unregister = command => {
        delete this.#registered[command.name ?? command];
        return this;
    };

    #stream = new StringStream();
    get stream() {
        return this.#stream;
    }

    run = async (command, stream) => {
        let name = await command.string();
        if (this.command(name)) {
            await this.command(name).handler(command, stream);
        } else if (name) {
            throw new Commands.CommandNotFoundError(name);
        }
    };

    exec = async (command, stream = this.stream) => {
        // {type: "chain", op: ">" | "|" | "?", first: #parse(), second: #parse()} | {type: "command", args: [parseValue()]}
        // parseValue(): {type: "named", name: "…", value: parseValue()} | {type: "text", value: "…"} | {type: "quoted", parts: [{type: "literal", value: "…"} | {type: "group", args: [parseValue()]} | {type: "subcommand", chain: #parse()}
        let tokens = []; // {type: ">" | "|" | "?" | "=" | "(" | ")" | "[" | "]" | "{" | "}" | "\n" | ""} | {type: "text", value: "…"} | {type: "quotes", parts: [{type: "literal", value: "…"} | {type: "subcommand", raw: "…"}]}
        let i = 0;
        let blockComment = false;
        while (i < command.length) {
            let c = command[i];
            if (blockComment) {
                if (c == "#") {
                    blockComment = false;
                    if (command[++i] == "#") {
                        i++;
                    }
                } else {
                    i++;
                }
            } else if (c == "#") {
                if (command[i + 1] == ">") {
                    while (i < command.length && command[i] != "\n") {
                        i++;
                    }
                } else if (command[++i] == "#") {
                    blockComment = true;
                    i++;
                }
            } else if (c == "\n") {
                let last = tokens.at(-1);
                if (last && !["\n", "|", ">", "?", "("].includes(last.type)) {
                    tokens.push({type: "\n"});
                }
                i++;
            } else if (" \t\r".includes(c)) {
                i++;
            } else if (">|?=()[]{}".includes(c)) {
                tokens.push({type: c});
                i++;
            } else if (c == "\"") {
                i++;
                let parts = [];
                let value = "";
                while (i < command.length && command[i] != '"') {
                    if (command[i] == "\\") {
                        if (++i < command.length) {
                            let c = command[i++];
                            value += c == "n" ? "\n" : c == "e" ? "\x1E" : c == "f" ? "\x1F" : c == "x" ? String.fromCharCode(parseInt(command.slice(i, i += 2), 16)) : c == "u" ? String.fromCharCode(parseInt(command.slice(i, i += 4), 16)) : c == "\n" ? "" : c;
                        }
                    } else {
                        if (command[i] == "{") {
                            if (value) {
                                parts.push({type: "literal", value});
                                value = "";
                            }
                            let depth = 1;
                            let start = ++i;
                            while (i < command.length) {
                                if (command[i] == "{") {
                                    depth++;
                                } else if (command[i] == "}") {
                                    depth--;
                                    if (!depth) {
                                        break;
                                    }
                                }
                                i++;
                            }
                            parts.push({type: "subcommand", raw: command.slice(start, i)});
                            i++;
                        } else {
                            value += command[i++];
                        }
                    }
                }
                if (value) {
                    parts.push({type: "literal", value});
                }
                i++;
                tokens.push({type: "quoted", parts});
            } else {
                let value = "";
                while (i < command.length) {
                    if (command[i] == "\\") {
                        if (++i < command.length) {
                            let c = command[i++];
                            value += c == "n" ? "\n" : c == "e" ? "\x1E" : c == "f" ? "\x1F" : c == "x" ? String.fromCharCode(parseInt(command.slice(i, i += 2), 16)) : c == "u" ? String.fromCharCode(parseInt(command.slice(i, i += 4), 16)) : c == "\n" ? "" : c;
                        }
                    } else {
                        if (">|?=()[]{}#\\\n \t\r\"".includes(command[i])) {
                            break;
                        }
                        value += command[i++];
                    }
                }
                if (value) {
                    tokens.push({type: "text", value});
                }
            }
        }
        tokens.push({type: ""});
        i = 0;
        let parseValue = () => {
            let token = tokens[i] ?? {type: ""};
            if (token.type == "text" && tokens[i + 1]?.type == "=") {
                let name = tokens[i].value;
                i += 2;
                return {type: "named", name, value: parseValue()};
            } else if (token.type == "text") {
                i++;
                return {type: "text", value: token.value};
            } else if (token.type == "quoted") {
                i++;
                return {type: "quoted", parts: token.parts};
            } else if (token.type == "[") {
                i++;
                let args = [];
                while (tokens[i]?.type != "]" && tokens[i]?.type != "") {
                    if (tokens[i]?.type == "\n") {
                        i++;
                    } else {
                        args.push(parseValue());
                    }
                }
                if (tokens[i]?.type == "]") {
                    i++;
                }
                return {type: "group", args};
            } else if (token.type == "{") {
                i++;
                let chain = parseChain();
                if (tokens[i]?.type == "}") {
                    i++;
                }
                return {type: "subcommand", chain};
            }
            throw new SyntaxError(`Unexpected token '${token.type}'`);
        };
        let parseItem = () => {
            if (tokens[i]?.type == "(") {
                i++;
                let item = parseChain();
                if (tokens[i]?.type == ")") {
                    i++;
                }
                return item;
            }
            let args = [];
            while (![">", "|", "?", ")", "}", "\n", ""].includes(tokens[i]?.type)) {
                args.push(parseValue());
            }
            return args.length ? {type: "command", args} : undefined;
        };
        let parseChain = () => {
            while (tokens[i]?.type == "\n") {
                i++;
            }
            let first = parseItem();
            if (first) {
                while (true) {
                    if (tokens[i]?.type == ">" || tokens[i]?.type == "|" || tokens[i]?.type == "?") {
                        let op = tokens[i++].type;
                        while (tokens[i]?.type == "\n") {
                            i++;
                        }
                        first = {type: "chain", op, first, second: parseItem()};
                    } else if (tokens[i]?.type == "\n") {
                        let j = i;
                        while (tokens[++j]?.type == "\n") {}
                        if (!tokens[j]?.type || tokens[j]?.type == ")" || tokens[j]?.type == "}" || tokens[j]?.type == "") {
                            break;
                        }
                        while (tokens[i]?.type == "\n") {
                            i++;
                        }
                        first = {type: "chain", op: ">", first, second: parseItem()};
                    } else {
                        break;
                    }
                }
            }
            return first;
        };
        await this.#execute(parseChain(), stream);
    };

    async #execute(node, stream) {
        if (node.type == "command") {
            let group = new Commands.Group();
            try {
                let runStream = new StringStream().takeTo(stream);
                await Promise.all([Promise.race([this.run(group, runStream), runStream.promise]), this.#fillGroup(group, node.args).promise]);
                runStream.close();
            } catch (e) {
                stream.writeLine(Commands.style.red(e?.message ?? "Unknown error"));
                throw e;
            }
        } else if (node.type == "chain") {
            let {op, first, second} = node;
            if (op == ">") {
                await this.#execute(first, stream);
                await this.#execute(second, stream);
            } else if (op == "|") {
                let errors = (await Promise.allSettled([this.#execute(first, stream), this.#execute(second, stream)])).filter(result => result.status == "rejected").map(result => result.reason).flat(Infinity);
                if (errors.length) {
                    throw errors.length == 1 ? errors[0] : errors;
                }
            } else {
                let buffer = new StringStream();
                try {
                    await this.#execute(first, buffer);
                    buffer.copyTo(stream);
                } catch(e) {
                    await this.#execute(second, stream);
                }
            }
        }
    }

    async #fillGroup(group, args) {
        try {
            let resolve = arg => {
                if (arg.type == "text") {
                    return StringStream.closed(arg.value);
                } else if (arg.type == "quoted") {
                    let stream = new StringStream();
                    (async () => {
                        try {
                            for (let part of arg.parts) {
                                if (part.type == "literal") {
                                    stream.writeChunk(part.value);
                                } else {
                                    let partStream = new StringStream();
                                    this.exec(part.raw, partStream).then(partStream.close, partStream.cancel);
                                    await partStream.takeTo(stream).promise;
                                }
                            }
                            stream.close();
                        } catch (e) {
                            stream.cancel(e);
                        }
                    })();
                    return stream;
                } else if (arg.type == "subcommand") {
                    let stream = new StringStream();
                    this.#execute(arg.chain, stream).then(stream.close, stream.cancel);
                    return stream;
                }
                let group = new Commands.Group();
                this.#fillGroup(group, arg.args);
                return group;
            };
            let ordered = Promise.resolve();
            for (let arg of args) {
                if (arg.type == "named") {
                    group.addEachNamed(arg.name, resolve(arg.value));
                } else if (arg.type == "subcommand") {
                    let stream = new StringStream();
                    this.#execute(arg.chain, stream).then(stream.close, stream.cancel);
                    ordered = ordered.then(async () => {
                        let buffer = "";
                        let blockComment = false;
                        let scan = () => {
                            let i = 0;
                            let parseValue = done => {
                                if (buffer[i] == "\"") {
                                    let value = "";
                                    while (++i < buffer.length && buffer[i] != "\"") {
                                        if (buffer[i] == "\\") {
                                            if (++i < buffer.length && (buffer[i] != "x" || i + 2 < buffer.length) && (buffer[i] != "u" || i + 4 < buffer.length)) {
                                                let c = buffer[i++];
                                                value += c == "n" ? "\n" : c == "e" ? "\x1E" : c == "f" ? "\x1F" : c == "x" ? String.fromCharCode(parseInt(buffer.slice(i, i += 2), 16)) : c == "u" ? String.fromCharCode(parseInt(buffer.slice(i, i += 4), 16)) : c == "\n" ? "" : c;
                                            } else {
                                                return;
                                            }
                                        } else {
                                            value += buffer[i];
                                        }
                                    }
                                    if (i < buffer.length) {
                                        i++;
                                        return StringStream.closed(value);
                                    }
                                } else if (buffer[i] == "[") {
                                    i++;
                                    let group = new Commands.Group();
                                    while (i < buffer.length && buffer[i] != "]") {
                                        while (i < buffer.length && "\n \t\r".includes(buffer[i])) {
                                            i++;
                                        }
                                        if (buffer.length <= i || buffer[i] == "]") {
                                            break;
                                        }
                                        let c = buffer[i];
                                        if (c == "#") {
                                            if (buffer[i + 1] == ">") {
                                                let index = buffer.indexOf("\n", i + 2);
                                                if (index < 0) {
                                                    return;
                                                }
                                                i = index + 1;
                                            } else if (buffer[++i] == "#") {
                                                blockComment = !blockComment;
                                                i++;
                                            } else if (blockComment) {
                                                blockComment = false;
                                            }
                                        } else if (blockComment) {
                                            i++;
                                        } else {
                                            let result = parseToken(true);
                                            if (!result) {
                                                return;
                                            } else if ("name" in result) {
                                                group.addEachNamed(result.name, result.value);
                                            } else {
                                                group.addEachOrdered(result.value);
                                            }
                                        }
                                    }
                                    if (i < buffer.length) {
                                        i++;
                                        return group.close();
                                    }
                                } else if (i < buffer.length) {
                                    let start = i;
                                    let value = "";
                                    while (i < buffer.length) {
                                        let c = buffer[i];
                                        if (c == "\\") {
                                            if (++i < buffer.length && (buffer[i] != "x" || i + 2 < buffer.length) && (buffer[i] != "u" || i + 4 < buffer.length)) {
                                                let c = buffer[i++];
                                                value += c == "n" ? "\n" : c == "e" ? "\x1E" : c == "f" ? "\x1F" : c == "x" ? String.fromCharCode(parseInt(buffer.slice(i, i += 2), 16)) : c == "u" ? String.fromCharCode(parseInt(buffer.slice(i, i += 4), 16)) : c == "\n" ? "" : c;
                                            } else {
                                                i = start;
                                                return;
                                            }
                                        } else {
                                            if (">|?=()[]{}#\\\n \t\r\"".includes(c)) {
                                                break;
                                            }
                                            value += buffer[i++];
                                        }
                                    }
                                    if (value) {
                                        if (done || i < buffer.length) {
                                            return StringStream.closed(value);
                                        }
                                        i = start;
                                    }
                                }
                            };
                            let parseToken = done => {
                                if (i < buffer.length) {
                                    let start = i;
                                    let name = "";
                                    while (i < buffer.length) {
                                        let c = buffer[i];
                                        if (c == "\\") {
                                            if (++i < buffer.length && (buffer[i] != "x" || i + 2 < buffer.length) && (buffer[i] != "u" || i + 4 < buffer.length)) {
                                                let c = buffer[i++];
                                                name += c == "n" ? "\n" : c == "e" ? "\x1E" : c == "f" ? "\x1F" : c == "x" ? String.fromCharCode(parseInt(buffer.slice(i, i += 2), 16)) : c == "u" ? String.fromCharCode(parseInt(buffer.slice(i, i += 4), 16)) : c == "\n" ? "" : c;
                                            } else {
                                                i = start;
                                                name = "";
                                                break;
                                            }
                                        } else if (">|?=()[]{}#\\\n \t\r\"".includes(c)) {
                                            break;
                                        } else {
                                            name += buffer[i++];
                                        }
                                    }
                                    if (name && i < buffer.length && buffer[i++] == "=") {
                                        let value = parseValue(done);
                                        if (value) {
                                            return {name, value};
                                        }
                                        i = start;
                                    } else {
                                        i = start;
                                        let value = parseValue(done);
                                        if (value) {
                                            return {value};
                                        }
                                    }
                                }
                            };
                            while (i < buffer.length) {
                                while (i < buffer.length && "\n \t\r".includes(buffer[i])) {
                                    i++;
                                }
                                if (buffer.length < i) {
                                    break;
                                }
                                let c = buffer[i];
                                if (c == "#") {
                                    if (buffer[++i] == ">") {
                                        let index = buffer.indexOf("\n", i + 1);
                                        if (index < 0) {
                                            break;
                                        }
                                        i = index + 1;
                                    } else if (buffer[i] == "#") {
                                        blockComment = !blockComment;
                                        i++;
                                    } else if (blockComment) {
                                        blockComment = false;
                                    }
                                } else if (blockComment) {
                                    i++;
                                } else {
                                    let start = i;
                                    let result = parseToken(stream.closed);
                                    if (result) {
                                        if ("name" in result) {
                                            group.addEachNamed(result.name, result.value);
                                        } else {
                                            group.addEachOrdered(result.value);
                                        }
                                    } else {
                                        i = start;
                                        break;
                                    }
                                }
                            }
                            buffer = buffer.slice(i);
                        };
                        for await (let chunk of stream.copyChunks) {
                            buffer += chunk;
                            scan();
                        }
                        scan();
                    });
                } else {
                    ordered = ordered.then(() => group.addEachOrdered(resolve(arg)));
                }
            }
            await ordered;
            return group.close();
        } catch (e) {
            group.cancel(e);
            throw e;
        }
    }
};

Commands.Command = class Command {
    constructor(command) {
        this.#name = command?.name || "";
        this.summary = command?.summary;
        this.description = command?.description ? command.description : this.summary;
        this.handler = command?.handler || (() => {});
    }

    #name;
    get name() {
        return this.#name;
    }

    #summary;
    get summary() {
        return this.#summary;
    }
    set summary(summary) {
        this.#summary = summary;
    }

    #description;
    get description() {
        return this.#description;
    }
    set description(description) {
        this.#description = description.replace(/^\s*|\s*$/gi, "").replace(/^[\r\t\f\v ]*|[\r\t\f\v ]*$/gmi, "");
    }

    #handler;
    get handler() {
        return this.#handler;
    }
    set handler(handler) {
        this.#handler = handler;
    }
};

Commands.Group = class Group {
    static NameTakenError = class NameTakenError extends Error {
        constructor(name) {
            super(`Option with name already exists: ${name}`); // TODO Shorten message.
            this.#name = name;
        }

        #name;
        get name() {
            return this.#name;
        }
    };

    static closed = (ordered = [], named = {}) => new Group().add(ordered, named).close();
    static canceled = reason => new Group().cancel(reason);

    #remainingTaken = false;
    #changePromise = Promise.withResolvers();
    #ordered = new ArrayStream();
    #named = Object.create(null);
    add = (ordered = [], named = {}) => {
        if (ordered.length || Object.keys(named).length) {
            this.#ordered.writeChunk(ordered);
            Object.entries(named).forEach(([name, value]) => {
                if (this.#named[name]) {
                    throw new Commands.Group.NameTakenError(name);
                }
                this.#named[name] = value;
            });
            this.#changePromise.resolve();
            this.#changePromise = Promise.withResolvers();
        }
        return this;
    };
    addOrdered = (ordered = []) => this.add(ordered);
    addEachOrdered = (...ordered) => this.add(ordered);
    addNamed = (named = {}) => this.add([], named);
    addEachNamed = (name, value) => this.add([], {[name]: value});

    get open() {
        return this.#ordered.open;
    }
    get closed() {
        return this.#ordered.closed;
    }
    get canceled() {
        return this.#ordered.canceled;
    }
    get reason() {
        return this.#ordered.reason;
    }

    close = () => {
        this.#ordered.close();
        this.#changePromise.resolve();
        this.#changePromise = Promise.withResolvers();
        return this;
    };
    cancel = reason => {
        this.#ordered.cancel(reason);
        this.#changePromise.resolve();
        this.#changePromise = Promise.withResolvers();
        return this;
    };

    get promise() {
        return this.#ordered.promise.then(() => this);
    }

    #countComplaint(type, options, requirement) {
        let complaint = `${type} must be `;
        if ((options?.minCount ?? 0) > 0) {
            complaint += (options?.maxCount ?? Infinity) == Infinity ? `at least ${options?.minCount ?? 0} ` : `${options?.minCount ?? 0} to ${options?.maxCount ?? Infinity} `;
        } else if ((options?.maxCount ?? Infinity) < Infinity) {
            complaint += `up to ${options?.maxCount ?? Infinity} `;
        }
        return complaint + requirement(options);
    }

    async #get(name) {
        if (name) {
            while (!this.#named[name] && this.#ordered.open) {
                await this.#changePromise.promise;
            }
            if (this.canceled) {
                throw this.reason;
            } else if (this.#named[name]) {
                return this.#named[name];
            }
        }
        let value = this.#remainingTaken ? StringStream.closed() : await new Promise((resolve, reject) => this.#ordered.takeNext.then(resolve, e => {
            if (this.#ordered.closed) {
                resolve(StringStream.closed());
            } else {
                reject(e);
            }
        }));
        if (name) {
            this.#named[name] = value;
        }
        return value;
    }

    async #value(name, options, transform, requirement) {
        let value = await transform(await this.#get(name), options);
        if (value == undefined) {
            throw new Error(`${name ? `"${name}"` : "Option"} must be ${requirement(options)}.`);
        }
        return value;
    }
    async #values(name, options, transform, requirement) {
        let value = await this.#get(name);
        if (value instanceof Commands.Group) {
            let streams = new ArrayStream();
            let length = 0;
            (async () => {
                try {
                    for await (let value of this.#ordered.copyEach) {
                        if ((options?.maxCount ?? Infinity) < ++length) {
                            streams.cancel(new Error(`${this.#countComplaint(name ? `"${name}"` : "Option", options, requirement)}, but is too many.`));
                        } else {
                            value = await transform(value, options);
                            if (value == undefined) {
                                streams.cancel(new Error(`${this.#countComplaint(name ? `"${name}"` : "Option", options, requirement)}, but index ${length - 1} is not.`));
                            }
                            streams.writeEach(value);
                        }
                    }
                    if (length < (options?.minCount ?? 0)) {
                        streams.cancel(new Error(`${this.#countComplaint(name ? `"${name}"` : "Option", options, requirement)}, but is only ${length}.`));
                    }
                    streams.close();
                } catch (e) {
                    streams.cancel(e);
                }
            })();
            return streams;
        } else {
            if (1 < (options?.minCount ?? 0) || (options?.maxCount ?? Infinity) < 1) {
                throw new Error(`${this.#countComplaint(name ? `"${name}"` : "Option", options, requirement)}, but is singular.`);
            }
            value = await transform(value, options);
            if (value == undefined) {
                throw new Error(`${this.#countComplaint(name ? `"${name}"` : "Option", options, requirement)}, but singular is not.`);
            }
            return [value];
        }
    }
    async #remaining(options, transform, requirement) {
        let streams = new ArrayStream();
        if (!this.#remainingTaken) {
            this.#remainingTaken = true;
            let length = 0;
            (async () => {
                try {
                    for await (let value of this.#ordered.takeEach) {
                        if ((options?.maxCount ?? Infinity) < ++length) {
                            streams.cancel(new Error(`${this.#countComplaint("Remainder", options, requirement)}, but is too many.`));
                        } else {
                            value = await transform(value, options);
                            if (value == undefined) {
                                streams.cancel(new Error(`${this.#countComplaint("Remainder", options, requirement)}, but number ${length - 1} is not.`));
                            }
                            streams.writeEach(value);
                        }
                    }
                    if (length < (options?.minCount ?? 0)) {
                        streams.cancel(new Error(`${this.#countComplaint("Remainder", options, requirement)}, but is only ${length}.`));
                    }
                    streams.close();
                } catch (e) {
                    streams.cancel(e);
                }
            })();
        }
        return streams;
    }

    #streamRequirement = () => "a string";
    #streamsRequirement = () => "strings";
    #streamTransform = value => value instanceof StringStream ? value : undefined;
    stream = (name = "", options = {}) => this.#value(name, options, this.#streamTransform, this.#streamRequirement);
    streams = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#streamTransform, this.#streamsRequirement).then(stream => stream.copy);
    streamStream = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#streamTransform, this.#streamsRequirement);
    remainingStreams = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#streamTransform, this.#streamsRequirement).then(stream => stream.copy);
    remainingStreamStream = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#streamTransform, this.#streamsRequirement);

    #stringRequirement = () => "a string";
    #stringsRequirement = () => "strings";
    #stringTransform = (value, options) => value instanceof StringStream ? value.copy.then(value => value || (options?.default ?? "")) : undefined;
    string = (name = "", options = {default: ""}) => this.#value(name, options, this.#stringTransform, this.#stringRequirement);
    strings = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#stringTransform, this.#stringsRequirement).then(stream => stream.copy);
    stringStream = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#stringTransform, this.#stringsRequirement);
    remainingStrings = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#stringTransform, this.#stringsRequirement).then(stream => stream.copy);
    remainingStringStream = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#stringTransform, this.#stringsRequirement);

    #numberRequirement = options => {
        if ((options?.minValue ?? -Infinity) == -Infinity && (options?.maxValue ?? Infinity) == Infinity && !(options.minValueInclusive ?? false) == !(options.maxValueInclusive ?? false)) {
            return `a ${options.minValueInclusive ?? false ? "" : "finite "}number`;
        } else if ((options?.minValue ?? -Infinity) == -Infinity && (options?.maxValue ?? Infinity) == 0) {
            return `a ${options.minValueInclusive ?? false ? "" : "finite "}${options.maxValueInclusive ?? false ? "non-positive " : "negative "}number`;
        } else if ((options?.minValue ?? -Infinity) == 0 && (options?.maxValue ?? Infinity) == Infinity) {
            return `a ${options.maxValueInclusive ?? false ? "" : "finite "}${options.minValueInclusive ?? false ? "non-negative " : "positive "}number`;
        } else if ((options?.minValue ?? -Infinity) == -Infinity && (options?.maxValue ?? Infinity) != Infinity) {
            return `${options.minValueInclusive ?? false ? "a" : "a finite"} number ${options.maxValueInclusive ?? false ? "at most " : "less than "}${`${options?.maxValue ?? Infinity}`.replace("Infinity", "∞")}`;
        } else if ((options?.minValue ?? -Infinity) != -Infinity && (options?.maxValue ?? Infinity) == Infinity) {
            return `${options.maxValueInclusive ?? false ? "a" : "a finite"} number ${options.minValueInclusive ?? false ? "at least " : "greater than "}${`${options?.minValue ?? -Infinity}`.replace("Infinity", "∞")}`;
        } else if ((options.minValueInclusive ?? false) && (options.maxValueInclusive ?? false)) {
            return `a number from ${`${options?.minValue ?? -Infinity}`.replace("Infinity", "∞")} to ${`${options?.maxValue ?? Infinity}`.replace("Infinity", "∞")}`;
        } else if (!(options.minValueInclusive ?? false) && !(options.maxValueInclusive ?? false)) {
            return `a number between ${`${options?.minValue ?? -Infinity}`.replace("Infinity", "∞")} and ${`${options?.maxValue ?? Infinity}`.replace("Infinity", "∞")}`;
        } else if (options.minValueInclusive ?? false) {
            return `a number starting at ${`${options?.minValue ?? -Infinity}`.replace("Infinity", "∞")} less than ${`${options?.maxValue ?? Infinity}`.replace("Infinity", "∞")}`;
        }
        return `a number greater than ${`${options?.minValue ?? -Infinity}`.replace("Infinity", "∞")} up to ${`${options?.maxValue ?? Infinity}`.replace("Infinity", "∞")}`;
    };
    #numbersRequirement = options => this.#numberRequirement(options).replace(/a (.*?number)/u, "$1s");
    #numberTransform = async (value, options) => value instanceof StringStream ? value.copy.then(value => value ? (!isNaN(value = +value.replace(/infinity|∞/iu, "Infinity")) && (options?.minValueInclusive ?? false ? (options?.minValue ?? -Infinity) <= value : (options?.minValue ?? -Infinity) < value) && (options?.maxValueInclusive ?? true ? value <= (options?.maxValue ?? Infinity) : value < (options?.maxValue ?? Infinity)) ? value : undefined) : options.default) : undefined;
    number = (name = "", options = {default: 0, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#value(name, options, this.#numberTransform, this.#numberRequirement);
    numbers = (name = "", options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#values(name, options, this.#numberTransform, this.#numbersRequirement).then(stream => stream.copy);
    numberStream = (name = "", options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#values(name, options, this.#numberTransform, this.#numbersRequirement);
    remainingNumbers = (options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#remaining(options, this.#numberTransform, this.#numbersRequirement).then(stream => stream.copy);
    remainingNumberStream = (options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#remaining(options, this.#numberTransform, this.#numbersRequirement);

    #integerRequirement = options => this.#numbersRequirement(options).replace("a number", "an integer").replace("number", "integer");
    #integersRequirement = options => this.#numbersRequirement(options).replace("numbers", "integers");
    #integerTransform = (value, options) => value instanceof StringStream ? value.copy.then(value => value ? (!isNaN(value = +value.replace(/infinity|∞/iu, "Infinity")) && value == Math.round(value) && (options?.minValueInclusive ?? false ? (options?.minValue ?? -Infinity) <= value : (options?.minValue ?? -Infinity) < value) && (options?.maxValueInclusive ?? true ? value <= (options?.maxValue ?? Infinity) : value < (options?.maxValue ?? Infinity)) ? value : undefined) : options.default) : undefined;
    integer = (name = "", options = {default: 0, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#value(name, options, this.#integerTransform, this.#integerRequirement);
    integers = (name = "", options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#values(name, options, this.#integerTransform, this.#integersRequirement).then(stream => stream.copy);
    integerStream = (name = "", options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#values(name, options, this.#integerTransform, this.#integersRequirement);
    remainingIntegers = (options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#remaining(options, this.#integerTransform, this.#integersRequirement).then(stream => stream.copy);
    remainingIntegerStream = (options = {minCount: 0, maxCount: Infinity, minValue: -Infinity, maxValue: Infinity, minValueInclusive: false, maxValueInclusive: false}) => this.#remaining(options, this.#integerTransform, this.#integersRequirement);

    #booleanRequirement = () => "a boolean";
    #booleansRequirement = () => "booleans";
    #booleanTransform = (value, options) => value instanceof StringStream ? value.copy.then(value => value ? (["0", "1", "n", "y", "false", "true"].includes(value = value.toLowerCase()) ? ["1", "y", "true"].includes(value) : undefined) : options?.default ?? false) : undefined;
    boolean = (name = "", options = {default: false}) => this.#value(name, options, this.#booleanTransform, this.#booleanRequirement);
    booleans = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#booleanTransform, this.#booleansRequirement).then(stream => stream.copy);
    booleanStream = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#booleanTransform, this.#booleansRequirement);
    remainingBooleans = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#booleanTransform, this.#booleansRequirement).then(stream => stream.copy);
    remainingBooleanStream = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#booleanTransform, this.#booleansRequirement);

    #enumRequirement = options => (options?.values.length ?? 0) == 1 ? `"${options?.values[0] ?? ""}"` : `one of ${options?.values.slice(0, -1).map(value => `"${value}"`).join(", ")} or "${options?.values.at(-1)}"`;
    #enumsRequirement = options => (options?.values.length ?? 0) == 1 ? `"${options?.values[0] ?? ""}"` : `${options?.values.slice(0, -1).map(value => `"${value}"`).join(", ")} and "${options?.values.at(-1)}"`;
    #enumTransform = (value, options) => value instanceof StringStream ? value.copy.then(value => value ? (options?.values.includes(value) ? value : undefined) : options?.default ?? "") : undefined;
    enum = (name = "", options = {default: "", values: []}) => this.#value(name, options, this.#enumTransform, this.#enumRequirement);
    enums = (name = "", options = {minCount: 0, maxCount: Infinity, values: []}) => this.#values(name, options, this.#enumTransform, this.#enumsRequirement).then(stream => stream.copy);
    enumStream = (name = "", options = {minCount: 0, maxCount: Infinity, values: []}) => this.#values(name, options, this.#enumTransform, this.#enumsRequirement);
    remainingEnums = (options = {minCount: 0, maxCount: Infinity, values: []}) => this.#remaining(options, this.#enumTransform, this.#enumsRequirement).then(stream => stream.copy);
    remainingEnumStream = (options = {minCount: 0, maxCount: Infinity, values: []}) => this.#remaining(options, this.#enumTransform, this.#enumsRequirement);

    #groupRequirement = () => "a group";
    #groupsRequirement = () => "groups";
    #groupTransform = value => value instanceof Commands.Group ? value : Commands.Group.closed([value]);
    group = (name = "", options = {}) => this.#value(name, options, this.#groupTransform, this.#groupRequirement);
    groups = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#groupTransform, this.#groupsRequirement).then(stream => stream.copy);
    groupStream = (name = "", options = {minCount: 0, maxCount: Infinity}) => this.#values(name, options, this.#groupTransform, this.#groupsRequirement);
    remainingGroups = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#groupTransform, this.#groupsRequirement).then(stream => stream.copy);
    remainingGroupStream = (options = {minCount: 0, maxCount: Infinity}) => this.#remaining(options, this.#groupTransform, this.#groupsRequirement);
};

Commands.style = class style {
    static #adder = (base, data) => text => {
        let active = `\x1E${base}${data}\x1F`;
        let last = `\x1E${base}${data}\x1F`;
        let current = "";
        let editChunk = chunk => {
            let out = "";
            while (chunk.length) {
                if (current) {
                    let end = chunk.indexOf("\x1F");
                    if (end < 0) {
                        current += chunk;
                        chunk = "";
                    } else {
                        current += chunk.slice(0, end + 1);
                        chunk = chunk.slice(end + 1);
                        if (current.startsWith(`\x1E${base}`)) {
                            if (current == `\x1E${base}\x1F`) {
                                current = `\x1E${base}${data}\x1F`;
                            }
                            last = current == active ? "" : current;
                        } else {
                            out += current;
                        }
                        current = "";
                    }
                }
                let next = chunk.indexOf("\x1E");
                if (next && last) {
                    out += active = last;
                    last = "";
                }
                if (next < 0) {
                    out += chunk;
                    chunk = "";
                } else {
                    if (next) {
                        out += chunk.slice(0, next);
                    }
                    chunk = chunk.slice(next + 1);
                    current = "\x1E";
                }
            }
            return out;
        };
        if (text instanceof StringStream) {
            let stream = new StringStream();
            (async () => {
                try {
                    for await (let chunk of text.copyChunks) {
                        stream.writeChunk(editChunk(chunk));
                    }
                    stream.writeChunk(`\x1E${base}\x1F`).close();
                } catch (e) {
                    stream.cancel(e);
                }
            })();
            return stream;
        }
        return `${editChunk(text.replaceAll(`\x1E${base}\x1F`, `\x1E${base}${data}\x1F`))}\x1E${base}\x1F`;
    };
    static #cleaner = base => {
        let regex = new RegExp(`\x1E${base}[0-9A-Fa-f]*\x1F`, "gu");
        return text => {
            if (text instanceof StringStream) {
                let stream = new StringStream();
                (async () => {
                    try {
                        let current = "";
                        for await (let chunk of text.copyChunks) {
                            while (chunk.length) {
                                if (current) {
                                    let end = chunk.indexOf("\x1F");
                                    if (end < 0) {
                                        current += chunk;
                                        chunk = "";
                                    } else {
                                        current += chunk.slice(0, end + 1);
                                        chunk = chunk.slice(end + 1);
                                        if (!current.startsWith(`\x1E${base}`)) {
                                            stream.writeChunk(current);
                                        }
                                        current = "";
                                    }
                                }
                                let next = chunk.indexOf("\x1E");
                                if (next < 0) {
                                    stream.writeChunk(chunk);
                                    chunk = "";
                                } else {
                                    if (next) {
                                        stream.writeChunk(chunk.slice(0, next));
                                    }
                                    chunk = chunk.slice(next + 1);
                                    current = "\x1E";
                                }
                            }
                        }
                        if (!current.startsWith(`\x1E${base}`)) {
                            stream.writeChunk(current);
                        }
                        stream.close();
                    } catch (e) {
                        stream.cancel(e);
                    }
                })();
                return stream;
            }
            return text.replace(regex, "");
        };
    };

    static white = style.#adder("0", "0");
    static red = style.#adder("0", "1");
    static orange = style.#adder("0", "2");
    static yellow = style.#adder("0", "3");
    static lime = style.#adder("0", "4");
    static green = style.#adder("0", "5");
    static turquoise = style.#adder("0", "6");
    static blue = style.#adder("0", "7");
    static violet = style.#adder("0", "8");
    static purple = style.#adder("0", "9");
    static magenta = style.#adder("0", "A");
    static cleanColor = style.#cleaner("0");

    static regular = style.#adder("1", "0");
    static bold = style.#adder("1", "1");
    static cleanWeight = style.#cleaner("1");

    static roman = style.#adder("2", "0");
    static italic = style.#adder("2", "1");
    static cleanPosture = style.#cleaner("2");

    static default = text => style.white(style.regular(style.roman(text)));
    static clean = style.#cleaner("");
};
