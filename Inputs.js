/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Inputs = class Inputs {
    #listeners = {};
    constructor(element = document, yUp = false, confirmExit = false) {
        this.element = element;
        this.#yUp = !!yUp;
        this.confirmExit = confirmExit;

        addEventListener("keydown", this.#listeners.onKeyDown = e => {
            if (e.code == "ArrowLeft") {
                this.#addEvent(new Inputs.Event.Left());
            } else if (e.code == "ArrowRight") {
                this.#addEvent(new Inputs.Event.Right());
            } else if (e.code == "ArrowUp") {
                this.#addEvent(new Inputs.Event.Up());
            } else if (e.code == "ArrowDown") {
                this.#addEvent(new Inputs.Event.Down());
            } else if (e.code == "Escape") {
                if (this.#moved) {
                    this.#addEvent(new Inputs.Event.Abort());
                    this.#down = this.#lastDown = "";
                } else {
                    this.#addEvent(new Inputs.Event.Escape());
                }
            } else if (e.code == "Enter" || e.code == "Space") {
                this.#addEvent(new Inputs.Event.Confirm());
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
                this.#addEvent(new Inputs.Event[this.#down == "primary" ? "Primary" : "Secondary"](pos, this.#consecutive));
            }
        });
        addEventListener("mouseup", this.#listeners.onMouseUp = e => {
            if (e.button == 0 && this.#down == "primary" || e.button == 2 && this.#down == "secondary") {
                if (this.#down == "primary" && this.#moved) {
                    this.#addEvent(new Inputs.Event.Release(this.#pos.copy, this.#startPos.copy));
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
                    if (!this.#moved) {
                        this.#addEvent(new Inputs.Event.Grab(this.#pos.copy));
                        this.#moved = true;
                        this.#consecutive = 0;
                    }
                    this.#addEvent({type: "move", pos: pos.copy, lastPos: this.#pos.copy, startPos: this.#startPos.copy});
                    this.#pos.set(pos);
                }
            }
        });
        addEventListener("wheel", this.#listeners.onWheel = e => {
            if (this.element.contains(e.target)) {
                this.#addEvent({type: "scroll", delta: new Vec2(e.deltaX || 0, (yUp ? -e.deltaY : e.deltaY) || 0), startPos: new Vec2(e.clientX, yUp ? innerHeight - e.clientY : e.clientY), t: this.#t});
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
                            this.#addEvent(new Inputs.Event.Secondary(this.#pos.copy, this.#consecutive));
                        }
                    }, this.holdTime);
                }
            }
        }, {passive: false});
        addEventListener("touchend", this.#listeners.onTouchEnd = e => {
            let touch = Array.from(e.changedTouches).find(touch => this.#down == `touch ${touch.identifier}`);
            if (touch) {
                if (this.#moved) {
                    this.#addEvent(new Inputs.Event.Release(this.#pos.copy, this.#startPos.copy));
                } else if (!this.#downBecameSecondary) {
                    if (this.#lastDown == "primary" && this.#downTime <= this.#lastUpTime + this.repeatTime) {
                        this.#consecutive++;
                    } else {
                        this.#consecutive = 1;
                    }
                    this.#lastDown = "primary";
                    this.#addEvent(new Inputs.Event.Primary(this.#pos.copy, this.#consecutive));
                }
                this.#down = "";
                this.#lastUpTime = this.#t;
            }
        });
        addEventListener("touchcancel", this.#listeners.onTouchCancel = e => {
            let touch = Array.from(e.changedTouches).find(touch => this.#down == `touch ${touch.identifier}`);
            if (touch && this.#moved) {
                this.#addEvent(new Inputs.Event.Abort());
                this.#down = this.#lastDown = "";
            }
        });
        addEventListener("touchmove", this.#listeners.onTouchMove = e => {
            let touch = Array.from(e.changedTouches).find(touch => this.#down == `touch ${touch.identifier}`);
            if (touch) {
                let pos = new Vec2(touch.clientX, yUp ? innerHeight - touch.clientY : touch.clientY);
                if (this.#moved || this.touchSlop < this.#pos.dist(pos)) {
                    if (!this.#moved) {
                        this.#addEvent(new Inputs.Event.Grab(this.#pos.copy));
                        this.#moved = true;
                        this.#consecutive = 0;
                    }
                    this.#addEvent({type: "move/scroll", pos: pos.copy, lastPos: this.#pos.copy, startPos: this.#startPos.copy, t: this.#t});
                    this.#pos.set(pos);
                }
            }
        });

        addEventListener("blur", this.#listeners.onBlur = () => {
            if (this.#down == "primary" && this.#moved) {
                this.#addEvent(new Inputs.Event.Abort());
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
    #consecutive = 0;
    #downBecameSecondary = false;
    #events = [];
    #addEvent = e => {
        this.#events.push(e);
        if (this.eventAvailable) {
            this.onEventAvailable?.(this);
        }
    };

    #lastEvent;
    #grabbed;
    #dragging;
    #scrollAxis = "";
    #lastScroll = 0;
    onEventAvailable;
    get eventAvailable() {
        if (this.#lastEvent?.type == "grab") {
            this.#grabbed = this.#dragging = this.#lastEvent.grabbed;
            this.#scrollAxis = "";
        } else if (this.#lastEvent?.type == "drag") {
            this.#grabbed = this.#lastEvent.grabbed;
        }
        while ((this.#events[0]?.type == "move" || this.#events[0]?.type == "release" || this.#events[0]?.type == "abort") && !this.#grabbed) {
            this.#events.shift();
        }
        return this.#events.length;
    }
    nextEvent = () => {
        if (this.eventAvailable) {
            let event = this.#events.shift();
            if (event.type == "move" || event.type == "move/scroll") {
                if (this.#grabbed) {
                    event = new Inputs.Event.Drag(event.pos, event.lastPos, event.startPos);
                } else if (!this.#dragging) {
                    event.type = "scroll";
                    event.delta = event.lastPos.sub(event.pos);
                }
            }
            if (event.type == "scroll") {
                if (!this.#scrollAxis || this.#lastScroll + this.scrollLockDuration < event.t) {
                    this.#scrollAxis = Math.abs(event.delta.x) > Math.abs(event.delta.y) ? "x" : "y";
                }
                if (event.delta[this.#scrollAxis]) {
                    this.#lastScroll = event.t;
                }
                event = new Inputs.Event.Scroll(event.startPos, event.delta, this.#scrollAxis);
            }
            this.#lastEvent = event;
            return event;
        }
    };

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

    remove = () => {
        // Keyboard
        removeEventListener("keydown", this.#listeners.onKeyDown);
        // Mouse
        removeEventListener("mousedown", this.#listeners.onMouseDown);
        removeEventListener("mouseup", this.#listeners.onMouseUp);
        removeEventListener("contextmenu", this.#listeners.onContextMenu);
        removeEventListener("mousemove", this.#listeners.onMouseMove);
        removeEventListener("wheel", this.#listeners.onWheel);
        // Touch
        removeEventListener("touchstart", this.#listeners.onTouchStart);
        removeEventListener("touchend", this.#listeners.onTouchEnd);
        removeEventListener("touchcancel", this.#listeners.onTouchCancel);
        removeEventListener("touchmove", this.#listeners.onTouchMove);
        // Window
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
Inputs.Event.Directional = class DirectionalInputEvent extends Inputs.Event {};
Inputs.Event.Left = class LeftInputEvent extends Inputs.Event.Directional {
    constructor() {
        super("left");
    }

    get copy() {
        return new Inputs.Event.Left();
    }
};
Inputs.Event.Right = class RightInputEvent extends Inputs.Event.Directional {
    constructor() {
        super("right");
    }

    get copy() {
        return new Inputs.Event.Right();
    }
};
Inputs.Event.Up = class UpInputEvent extends Inputs.Event.Directional {
    constructor() {
        super("up");
    }

    get copy() {
        return new Inputs.Event.Up();
    }
};
Inputs.Event.Down = class DownInputEvent extends Inputs.Event.Directional {
    constructor() {
        super("down");
    }

    get copy() {
        return new Inputs.Event.Down();
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
