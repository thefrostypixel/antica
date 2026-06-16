/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Inputs = class Inputs {
    #listeners = {};
    #fileInput;
    constructor(element = document, yUp = false, confirmExit = false) {
        this.element = element;
        this.#yUp = !!yUp;
        this.confirmExit = confirmExit;

        addEventListener("keydown", this.#listeners.onKeyDown = e => {
            if (e.code == "ArrowLeft") {
                this.onEvent?.(new Inputs.Event.Left(this.yUp));
            } else if (e.code == "ArrowRight") {
                this.onEvent?.(new Inputs.Event.Right(this.yUp));
            } else if (e.code == "ArrowUp") {
                this.onEvent?.(new Inputs.Event.Up(this.yUp));
            } else if (e.code == "ArrowDown") {
                this.onEvent?.(new Inputs.Event.Down(this.yUp));
            } else if (e.code == "Escape") {
                if (this.#moved) {
                    if (this.#grabbed) {
                        this.onEvent?.(new Inputs.Event.Abort());
                    }
                    this.#down = this.#lastDown = "";
                } else {
                    this.onEvent?.(new Inputs.Event.Escape());
                }
            } else if (e.code == "Enter" || e.code == "Space") {
                this.onEvent?.(new Inputs.Event.Confirm());
            }
        });

        addEventListener("mousedown", this.#listeners.onMouseDown = e => {
            if (this.element.contains(e.target) && (e.button == 0 || e.button == 2) && !this.#down) {
                let pos = new Vec2(e.clientX, yUp ? innerHeight - e.clientY : e.clientY);
                this.#down = e.button == 0 ? "primary" : "secondary";
                if (this.#lastDown == this.#down && this.#t <= this.#lastUpTime + this.repeatTime && !this.#moved) {
                    this.#consecutive++;
                } else {
                    this.#consecutive = 1;
                }
                this.#lastDown = this.#down;
                this.#pos.set(this.#startPos.set(pos));
                this.#moved = false;
                this.onEvent?.(new Inputs.Event[this.#down == "primary" ? "Primary" : "Secondary"](pos, this.#consecutive));
            }
        });
        addEventListener("mouseup", this.#listeners.onMouseUp = e => {
            if (e.button == 0 && this.#down == "primary" || e.button == 2 && this.#down == "secondary") {
                if (this.#down == "primary" && this.#moved && this.#grabbed) {
                    this.onEvent?.(new Inputs.Event.Release(this.#pos.copy, this.#startPos.copy));
                }
                this.#down = "";
                this.#lastUpTime = this.#t;
            }
        });
        addEventListener("contextmenu", this.#listeners.onContextMenu = e => this.element.contains(e.target) && e.preventDefault());
        addEventListener("mousemove", this.#listeners.onMouseMove = e => {
            if (this.#down == "primary") {
                let pos = new Vec2(e.clientX, yUp ? innerHeight - e.clientY : e.clientY);
                if (this.#moved || this.mouseSlop < this.#pos.dist(pos)) {
                    if (this.#moved) {
                        let e = new Inputs.Event.Grab(this.#pos.copy);
                        this.onEvent?.(e);
                        if (e.type == "grab") {
                            this.#grabbed = this.#dragging = e.grabbed;
                            this.#scrollAxis = "";
                        }
                        this.#moved = true;
                        this.#consecutive = 0;
                    }
                    if (this.#grabbed) {
                        let e = new Inputs.Event.Drag(pos.copy, this.#pos.copy, this.#startPos.copy);
                        this.onEvent?.(e);
                        this.#grabbed = e.grabbed;
                    }
                    this.#pos.set(pos);
                }
            }
        });
        addEventListener("wheel", this.#listeners.onWheel = e => {
            if (this.element.contains(e.target)) {
                if (!this.#scrollAxis || this.#lastScroll + this.scrollLockDuration < this.#t) {
                    this.#scrollAxis = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? "x" : "y";
                }
                if (this.#scrollAxis == "x" ? e.deltaX : yUp ? -e.deltaY : e.deltaY) {
                    this.#lastScroll = this.#t;
                }
                this.onEvent?.(new Inputs.Event.Scroll(new Vec2(e.clientX, yUp ? innerHeight - e.clientY : e.clientY), new Vec2(e.deltaX || 0, (yUp ? -e.deltaY : e.deltaY) || 0), this.#scrollAxis));
            }
        });

        addEventListener("touchstart", this.#listeners.onTouchStart = e => {
            if (this.element.contains(e.target)) {
                if (visualViewport.width == document.documentElement.clientWidth && visualViewport.height == document.documentElement.clientHeight) {
                    e.preventDefault();
                }
                let touch = e.changedTouches[0];
                if (!this.#down && touch) {
                    let pos = new Vec2(touch.clientX, yUp ? innerHeight - touch.clientY : touch.clientY);
                    this.#down = `touch ${touch.identifier}`;
                    this.#downTime = this.#t;
                    this.#pos.set(this.#startPos.set(pos));
                    this.#moved = false;
                    this.#downBecameSecondary = false;
                    setTimeout(() => {
                        if (this.#down == `touch ${touch.identifier}` && !this.#moved) {
                            this.#downBecameSecondary = true;
                            if (this.#lastDown == "secondary" && this.#downTime <= this.#lastUpTime + this.repeatTime) {
                                this.#consecutive++;
                            } else {
                                this.#consecutive = 1;
                            }
                            this.#lastDown = "secondary";
                            this.onEvent?.(new Inputs.Event.Secondary(this.#pos.copy, this.#consecutive));
                        }
                    }, this.holdTime);
                }
            }
        }, {passive: false});
        addEventListener("touchend", this.#listeners.onTouchEnd = e => {
            let touch = Array.from(e.changedTouches).find(touch => this.#down == `touch ${touch.identifier}`);
            if (touch) {
                if (this.#moved) {
                    if (this.#grabbed) {
                        this.onEvent?.(new Inputs.Event.Release(this.#pos.copy, this.#startPos.copy));
                    }
                } else if (!this.#downBecameSecondary) {
                    if (this.#lastDown == "primary" && this.#downTime <= this.#lastUpTime + this.repeatTime) {
                        this.#consecutive++;
                    } else {
                        this.#consecutive = 1;
                    }
                    this.#lastDown = "primary";
                    this.onEvent?.(new Inputs.Event.Primary(this.#pos.copy, this.#consecutive));
                }
                this.#down = "";
                this.#lastUpTime = this.#t;
            }
        });
        addEventListener("touchcancel", this.#listeners.onTouchCancel = e => {
            let touch = Array.from(e.changedTouches).find(touch => this.#down == `touch ${touch.identifier}`);
            if (touch && this.#moved) {
                if (this.#grabbed) {
                    this.onEvent?.(new Inputs.Event.Abort());
                }
                this.#down = this.#lastDown = "";
            }
        });
        addEventListener("touchmove", this.#listeners.onTouchMove = e => {
            let touch = Array.from(e.changedTouches).find(touch => this.#down == `touch ${touch.identifier}`);
            if (touch) {
                let pos = new Vec2(touch.clientX, yUp ? innerHeight - touch.clientY : touch.clientY);
                if (this.#moved || this.touchSlop < this.#pos.dist(pos)) {
                    if (!this.#moved) {
                        let e = new Inputs.Event.Grab(this.#pos.copy);
                        this.onEvent?.(e);
                        if (e.type == "grab") {
                            this.#grabbed = this.#dragging = e.grabbed;
                            this.#scrollAxis = "";
                        }
                        this.#moved = true;
                        this.#consecutive = 0;
                    }
                    if (this.#grabbed) {
                        let e = new Inputs.Event.Drag(pos.copy, this.#pos.copy, this.#startPos.copy, this.#grabbed);
                        this.onEvent?.(e);
                        this.#grabbed = e.grabbed;
                    } else if (!this.#dragging) {
                        if (!this.#scrollAxis || this.#lastScroll + this.scrollLockDuration < this.#t) {
                            this.#scrollAxis = Math.abs(this.#pos.x - pos.x) > Math.abs(this.#pos.y - pos.y) ? "x" : "y";
                        }
                        if (this.#pos[this.#scrollAxis] - pos[this.#scrollAxis]) {
                            this.#lastScroll = this.#t;
                        }
                        this.onEvent?.(new Inputs.Event.Scroll(this.#startPos.copy, this.#pos.copy.sub(pos), this.#scrollAxis));
                    }
                    this.#pos.set(pos);
                }
            }
        });

        let parseItems = e => {
            let items = [];
            let promises = [];
            let lastKind = "";
            for (let entry of (e.dataTransfer || e.clipboardData).items) {
                let type = entry.type;
                if (entry.kind == "string") {
                    let item = items.at(-1);
                    if (lastKind != entry.kind) {
                        items.push(item = new Inputs.Item());
                    }
                    promises.push(new Promise(resolve => entry.getAsString(content => {
                        item.add(type, content);
                        resolve();
                    })));
                } else {
                    let processEntry = async entry => {
                        entry = entry.webkitGetAsEntry?.() || entry;
                        if (entry?.isFile) {
                            return new Promise(resolve => entry.file(async file => {
                                items.push(new Inputs.Item(entry.fullPath.slice(1)).add(file.type, new Uint8Array(await file.arrayBuffer())));
                                resolve();
                            }));
                        } else if (entry?.isDirectory) {
                            let promises = [];
                            let reader = entry.createReader();
                            let children = [0];
                            while (children.length) {
                                (children = await new Promise(resolve => reader.readEntries(resolve))).forEach(child => promises.push(processEntry(child)));
                            }
                            await Promise.all(promises);
                        }
                    };
                    promises.push(processEntry(entry));
                }
                lastKind = entry.kind;
            }
            return Promise.all(promises).then(() => items);
        };
        addEventListener("dragover", this.#listeners.onDragOver = e => e.preventDefault());
        addEventListener("drop", this.#listeners.onDrop = e => {
            e.preventDefault();
            parseItems(e).then(items => this.onEvent?.(new Inputs.Event.Drop(new Vec2(e.clientX, yUp ? innerHeight - e.clientY : e.clientY), items)));
        });
        addEventListener("paste", this.#listeners.onPaste = e => parseItems(e).then(items => this.onEvent?.(new Inputs.Event.Insert(items))));
        this.#fileInput = document.createElement("input");
        this.#fileInput.type = "file";
        this.#fileInput.onchange = () => {
            let items = [];
            Promise.all(Array.from(this.#fileInput.files).map(async file => {
                let item = new Inputs.Item(file.webkitRelativePath || file.name);
                items.push(item);
                item.add(file.type, new Uint8Array(await file.arrayBuffer()));
            })).then(() => this.onEvent?.(new Inputs.Event.Insert(items)));
        };
        addEventListener("copy", this.#listeners.onCopy = e => {
            e.preventDefault();
            let event = new Inputs.Event.Copy(new Inputs.Item());
            this.onEvent?.(event);
            event.item.types.forEach(type => e.clipboardData.setData(type, event.item.text(type)));
        });
        addEventListener("cut", this.#listeners.onCut = e => {
            e.preventDefault();
            let event = new Inputs.Event.Cut(new Inputs.Item());
            this.onEvent?.(event);
            event.item.types.forEach(type => e.clipboardData.setData(type, event.item.text(type)));
        });

        addEventListener("blur", this.#listeners.onBlur = () => {
            if (this.#down == "primary" && this.#moved && this.#grabbed) {
                this.onEvent?.(new Inputs.Event.Abort());
            }
            this.#down = this.#lastDown = "";
        });
        addEventListener("beforeunload", this.#listeners.onBeforeUnload = e => this.confirmExit && e.preventDefault());
    }

    get #t() {
        return performance.now();
    }

    #holdTime = 500;
    get holdTime() {
        return this.#holdTime;
    }
    set holdTime(holdTime) {
        if (isFinite(holdTime)) {
            this.#holdTime = +holdTime;
        }
    }

    #repeatTime = 500;
    get repeatTime() {
        return this.#repeatTime;
    }
    set repeatTime(repeatTime) {
        if (isFinite(repeatTime)) {
            this.#repeatTime = +repeatTime;
        }
    }

    #mouseSlop = 0;
    get mouseSlop() {
        return this.#mouseSlop;
    }
    set mouseSlop(mouseSlop) {
        if (isFinite(mouseSlop)) {
            this.#mouseSlop = +mouseSlop;
        }
    }

    #touchSlop = 10;
    get touchSlop() {
        return this.#touchSlop;
    }
    set touchSlop(touchSlop) {
        if (isFinite(touchSlop)) {
            this.#touchSlop = +touchSlop;
        }
    }

    #scrollLockDuration = 125;
    get scrollLockDuration() {
        return this.#scrollLockDuration;
    }
    set scrollLockDuration(scrollLockDuration) {
        if (isFinite(scrollLockDuration)) {
            this.#scrollLockDuration = +scrollLockDuration;
        }
    }

    #down = "";
    #downTime = 0;
    #lastDown = "";
    #lastUpTime = 0;
    #pos = new Vec2();
    #startPos = new Vec2();
    #moved = false;
    #grabbed;
    #dragging;
    #consecutive = 0;
    #downBecameSecondary = false;
    #scrollAxis = "";
    #lastScroll = 0;

    #onEvent;
    get onEvent() {
        return this.#onEvent;
    }
    set onEvent(onEvent) {
        this.#onEvent = onEvent;
    }

    #element = document;
    get element() {
        return this.#element;
    }
    set element(element) {
        this.#element = element == document || element instanceof Element ? element : this.#element;
    }

    #yUp;
    get yUp() {
        return this.#yUp;
    }

    #confirmExit = false;
    get confirmExit() {
        return this.#confirmExit;
    }
    set confirmExit(confirmExit) {
        this.#confirmExit = !!confirmExit;
    }

    #showFileInput = (types, multiple, folder) => {
        this.#fileInput.multiple = multiple;
        this.#fileInput.webkitdirectory = folder;
        this.#fileInput.accept = types?.length ? types.join() : undefined;
        this.#fileInput.click();
    };
    requestTextPaste = () => navigator.clipboard?.read().then(entries => {
        let items = [];
        let promises = [];
        entries.forEach(entry => {
            let item = new Inputs.Item();
            items.push(item);
            entry.types.forEach(type => promises.push(entry.getType(type).then(blob => blob.arrayBuffer()).then(arrayBuffer => item.add(type, new Uint8Array(arrayBuffer)))));
        });
        Promise.all(promises).then(() => this.onEvent?.(new Inputs.Event.Insert(items)));
    });
    requestFile = types => this.#showFileInput(types, false, false);
    requestFiles = types => this.#showFileInput(types, true, false);
    requestFolder = types => this.#showFileInput(types, false, true);

    remove = () => {
        removeEventListener("keydown", this.#listeners.onKeyDown);

        removeEventListener("mousedown", this.#listeners.onMouseDown);
        removeEventListener("mouseup", this.#listeners.onMouseUp);
        removeEventListener("contextmenu", this.#listeners.onContextMenu);
        removeEventListener("mousemove", this.#listeners.onMouseMove);
        removeEventListener("wheel", this.#listeners.onWheel);

        removeEventListener("touchstart", this.#listeners.onTouchStart);
        removeEventListener("touchend", this.#listeners.onTouchEnd);
        removeEventListener("touchcancel", this.#listeners.onTouchCancel);
        removeEventListener("touchmove", this.#listeners.onTouchMove);

        removeEventListener("dragover", this.#listeners.onDragOver);
        removeEventListener("drop", this.#listeners.onDrop);
        removeEventListener("paste", this.#listeners.onPaste);
        removeEventListener("copy", this.#listeners.onCopy);
        removeEventListener("cut", this.#listeners.onCut);

        removeEventListener("blur", this.#listeners.onBlur);
        removeEventListener("beforeunload", this.#listeners.onBeforeUnload);
    };
};

Inputs.Event = class InputEvent {
    constructor(type) {
        this.#type = type;
    }

    #type;
    get type() {
        return this.#type;
    }

    #captured = false;
    get captured() {
        return this.#captured;
    }
    set captured(captured) {
        this.#captured = !!captured;
    }
    capture = () => {
        this.#captured = true;
        return this;
    };
    uncapture = () => {
        this.#captured = false;
        return this;
    };
};
Inputs.Event.Positioned = class PositionedInputEvent extends Inputs.Event {
    constructor(type, pos) {
        super(type);
        this.pos = pos;
    }

    #pos;
    get pos() {
        return this.#pos;
    }
    set pos(pos) {
        this.#pos = pos;
    }
};
Inputs.Event.Basic = class BasicInputEvent extends Inputs.Event.Positioned {
    constructor(type, pos, consecutive) {
        super(type, pos);
        this.consecutive = consecutive;
    }

    #consecutive;
    get consecutive() {
        return this.#consecutive;
    }
    set consecutive(consecutive) {
        if (!isNaN(consecutive)) {
            return this.#consecutive;
        }
    }

    get primary() {
        return new Inputs.Event.Primary(this.pos, this.consecutive);
    }
    get secondary() {
        return new Inputs.Event.Secondary(this.pos, this.consecutive);
    }
};
Inputs.Event.Primary = class PrimaryInputEvent extends Inputs.Event.Basic {
    constructor(pos, consecutive) {
        super("primary", pos, consecutive);
    }

    get copy() {
        return new Inputs.Event.Primary(this.pos.copy, this.consecutive);
    }
};
Inputs.Event.Secondary = class SecondaryInputEvent extends Inputs.Event.Basic {
    constructor(pos, consecutive) {
        super("secondary", pos, consecutive);
    }

    get copy() {
        return new Inputs.Event.Secondary(this.pos.copy, this.consecutive.copy);
    }
};
Inputs.Event.Grab = class GrabInputEvent extends Inputs.Event.Positioned {
    constructor(pos) {
        super("grab", pos);
    }

    #grabbed;
    get grabbed() {
        return this.#grabbed;
    }
    set grabbed(grabbed) {
        this.#grabbed = grabbed;
    }
    grab = grabbed => {
        this.#grabbed = grabbed;
    };
    release = () => {
        this.#grabbed = undefined;
    };

    get copy() {
        return new Inputs.Event.Grab(this.pos.copy);
    }
};
Inputs.Event.Drag = class DragInputEvent extends Inputs.Event.Positioned {
    constructor(pos, lastPos, startPos, grabbed) {
        super("drag", pos);
        this.lastPos = lastPos;
        this.startPos = startPos;
        this.#grabbed = grabbed;
    }

    #lastPos;
    get lastPos() {
        return this.#lastPos;
    }
    set lastPos(lastPos) {
        this.#lastPos = lastPos;
    }
    get lastDelta() {
        return this.pos.copy.sub(this.lastPos);
    }

    #startPos;
    get startPos() {
        return this.#startPos;
    }
    set startPos(startPos) {
        this.#startPos = startPos;
    }
    get startDelta() {
        return this.pos.copy.sub(this.startPos);
    }

    #grabbed;
    get grabbed() {
        return this.#grabbed;
    }
    release = () => {
        this.#grabbed = undefined;
    };

    get copy() {
        return new Inputs.Event.Drag(this.pos.copy, this.lastPos.copy, this.startPos.copy, this.grabbed);
    }
};
Inputs.Event.Release = class ReleaseInputEvent extends Inputs.Event.Positioned {
    constructor(pos, startPos, grabbed) {
        super("release", pos);
        this.startPos = startPos;
        this.#grabbed = grabbed;
    }

    #startPos;
    get startPos() {
        return this.#startPos;
    }
    set startPos(startPos) {
        this.#startPos = startPos;
    }
    get startDelta() {
        return this.pos.copy.sub(this.startPos);
    }

    #grabbed;
    get grabbed() {
        return this.#grabbed;
    }

    get copy() {
        return new Inputs.Event.Release(this.pos.copy, this.startPos.copy, this.grabbed);
    }
};
Inputs.Event.Abort = class AbortInputEvent extends Inputs.Event {
    constructor(grabbed) {
        super("abort");
        this.#grabbed = grabbed;
    }

    #grabbed;
    get grabbed() {
        return this.#grabbed;
    }

    get copy() {
        return new Inputs.Event.Abort(this.grabbed);
    }
};
Inputs.Event.Drop = class DropInputEvent extends Inputs.Event.Positioned {
    constructor(pos, items) {
        super("drop", pos);
        this.#items = items;
    }

    #items = [];
    get items() {
        return this.#items;
    }
    set items(items) {
        this.#items = items || [];
    }

    get copy() {
        return new Inputs.Event.Drop(this.pos.copy, Array.from(this.items));
    }
};
Inputs.Event.Insert = class InsertInputEvent extends Inputs.Event {
    constructor(items) {
        super("insert");
        this.#items = items;
    }

    #items = [];
    get items() {
        return this.#items;
    }
    set items(items) {
        this.#items = items || [];
    }

    get copy() {
        return new Inputs.Event.Insert(Array.from(this.items));
    }
};
Inputs.Event.Copy = class CopyInputEvent extends Inputs.Event {
    constructor(item) {
        super("copy");
        this.#item = item;
    }

    #item = [];
    get item() {
        return this.#item;
    }
    set item(item) {
        this.#item = item || [];
    }

    get copy() {
        return new Inputs.Event.Copy(this.item.copy);
    }
};
Inputs.Event.Cut = class CutInputEvent extends Inputs.Event {
    constructor(item) {
        super("cut");
        this.#item = item;
    }

    #item = [];
    get item() {
        return this.#item;
    }
    set item(item) {
        this.#item = item || [];
    }

    get copy() {
        return new Inputs.Event.Cut(this.item.copy);
    }
};
Inputs.Event.Scroll = class ScrollInputEvent extends Inputs.Event.Positioned {
    constructor(pos, unlocked, axis) {
        super("scroll", pos);
        this.unlocked = unlocked;
        this.axis = axis;
    }

    #unlocked;
    get unlocked() {
        return this.#unlocked;
    }
    set unlocked(unlocked) {
        this.#unlocked = unlocked;
    }
    get locked() {
        return new Vec2({[this.#axis]: this.#unlocked[this.#axis]});
    }

    #axis;
    get axis() {
        return this.#axis;
    }
    set axis(axis) {
        this.#axis = axis;
    }

    get copy() {
        return new Inputs.Event.Scroll(this.pos.copy, this.unlocked.copy, this.axis);
    }
};
Inputs.Event.Directional = class DirectionalInputEvent extends Inputs.Event {
    constructor(type, axis, dir, yUp) {
        super(type);
        this.axis = axis;
        this.dir = dir;
        this.yUp = yUp;
    }

    #axis;
    get axis() {
        return this.#axis;
    }
    set axis(axis) {
        this.#axis = axis;
    }

    #dir;
    get dir() {
        return this.#dir;
    }
    set dir(dir) {
        this.#dir = dir;
    }

    #yUp;
    get yUp() {
        return this.#yUp;
    }
    set yUp(yUp) {
        this.#yUp = !!yUp;
    }
};
Inputs.Event.Left = class LeftInputEvent extends Inputs.Event.Directional {
    constructor(yUp) {
        super("left", "x", new Vec2(-1, 0), yUp);
    }

    get copy() {
        return new Inputs.Event.Left(this.yUp);
    }
};
Inputs.Event.Right = class RightInputEvent extends Inputs.Event.Directional {
    constructor(yUp) {
        super("right", "x", new Vec2(1, 0), yUp);
    }

    get copy() {
        return new Inputs.Event.Right(this.yUp);
    }
};
Inputs.Event.Up = class UpInputEvent extends Inputs.Event.Directional {
    constructor(yUp) {
        super("up", "y", new Vec2(0, !!yUp), yUp);
    }

    get copy() {
        return new Inputs.Event.Up(this.yUp);
    }
};
Inputs.Event.Down = class DownInputEvent extends Inputs.Event.Directional {
    constructor(yUp) {
        super("down", "y", new Vec2(0, -!!yUp), yUp);
    }

    get copy() {
        return new Inputs.Event.Down(this.yUp);
    }
};
Inputs.Event.Escape = class EscapeInputEvent extends Inputs.Event {
    constructor() {
        super("escape");
    }

    get copy() {
        return new Inputs.Event.Escape();
    }
};
Inputs.Event.Confirm = class ConfirmInputEvent extends Inputs.Event {
    constructor() {
        super("confirm");
    }

    get copy() {
        return new Inputs.Event.Confirm();
    }
};

Inputs.Item = class Item {
    static encoder = new TextEncoder();
    static decoder = new TextDecoder();

    constructor(name) {
        this.name = name;
    }

    #name;
    get name() {
        return this.#name;
    }
    set name(name) {
        this.#name = `${name || ""}`;
    }

    #types = new Set();
    get types() {
        return this.#types;
    }

    #bytes = Object.create(null);
    bytes = type => {
        if (this.#bytes[type]) {
            return this.#bytes[type];
        } else if (this.#text[type]) {
            return this.#bytes[type] = Item.encoder.encode(this.#text[type]);
        }
    };

    #text = Object.create(null);
    text = type => {
        if (this.#text[type]) {
            return this.#text[type];
        } else if (this.#bytes[type]) {
            return this.#text[type] = Item.decoder.decode(this.#bytes[type]);
        }
    };

    add = (type, data) => {
        this.#types.add(type);
        if (data instanceof Uint8Array) {
            this.#bytes[type] = data;
        } else {
            this.#text[type] = data;
        }
        return this;
    };
    remove = type => {
        this.#types.delete(type);
        delete this.#bytes[type];
        delete this.#text[type];
        return this;
    };

    get plain() {
        return this.text("text/plain");
    }
    set plain(plain) {
        this.add("text/plain", plain);
    }

    get html() {
        return this.text("text/html");
    }
    set html(html) {
        this.add("text/html", html);
    }

    get copy() {
        let item = new Item(this.name);
        this.types.forEach(type => {
            if (type in this.#bytes) {
                item.add(type, new Uint8Array(this.#bytes[type]));
            }
            if (type in this.#text) {
                item.add(type, this.#text[type]);
            }
        });
        return item;
    }
};
