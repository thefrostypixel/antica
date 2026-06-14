/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Anim = class Anim {
    constructor(axes = 0 ?? {}, accel = 10000, time) {
        this.axes = axes;
        this.accel = accel;
        this.time = time;
    }

    #createAxis(name) {
        let axis = {
            min: -Infinity,
            max: Infinity,
            target: 0,
            functions: [],
        };
        axis.proxy = new Proxy({}, {
            get: (_, property) => {
                if (["min", "max", "target"].includes(property)) {
                    return axis[property];
                } else {
                    let time = typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
                    let f = axis.functions.find(f => time <= f.end);
                    if (property == "value") {
                        return f ? f.n0 + f.n1 * time + f.n2 * time ** 2 : axis.target;
                    } else if (property == "vel") {
                        return f ? f.n1 + f.n2 * time * 2 : 0;
                    }
                }
            },
            set: (_, property, value) => {
                if (["min", "max", "target", "value", "vel"].includes(property) && !isNaN(value)) {
                    let t = this.#t;
                    let axes = this.#snapshot(t);
                    axes[name][property] = +value;
                    this.#updateFunctions(axes, t);
                    this.#startAnimationLoop();
                }
                return true;
            },
            has: (_, property) => ["min", "max", "target", "value", "vel"].includes(property),
            ownKeys: () => ["min", "max", "target", "value", "vel"],
            getOwnPropertyDescriptor: (_, property) => ["min", "max", "target", "value", "vel"].includes(property) ? {value: axis.proxy[property], writable: true, enumerable: true, configurable: true} : undefined,
        });
        return axis;
    }
    #axes = Object.create(null);
    #axesProxy = new Proxy({}, {
        get: (_, axis) => this.#axes[axis]?.proxy,
        set: (_, axis, value) => {
            let t = this.#t;
            if (value == undefined) {
                delete this.#axes[axis];
                this.#updateFunctions(this.#snapshot(t), t);
            } else if (!this.#axes[axis]) {
                this.#axes[`${axis}`] = this.#createAxis(`${axis}`);
            }
            if (value instanceof Object) {
                let axes = this.#snapshot(t);
                ["min", "max", "target", "value", "vel"].forEach(property => {
                    if (property in value && !isNaN(value[property])) {
                        axes[`${axis}`][property] = +value[property];
                    }
                });
                this.#updateFunctions(axes, t);
            } else if (!isNaN(value)) {
                let axes = this.#snapshot(t);
                axes[`${axis}`].value = axes[`${axis}`].target = +value;
                axes[`${axis}`].vel = 0;
                this.#updateFunctions(axes, t);
            }
            return true;
        },
        deleteProperty: (_, axis) => this.#axesProxy[axis] = undefined,
        has: (_, axis) => axis in this.#axes,
        ownKeys: () => Object.keys(this.#axes),
        getOwnPropertyDescriptor: (_, axis) => axis in this.#axes ? {value: this.#axes[axis].proxy, writable: true, enumerable: true, configurable: true} : undefined,
    });
    get axes() {
        return this.#axesProxy;
    }
    set axes(axes) {
        if (axes instanceof Object) {
            this.#axes = Object.create(null);
            Object.assign(this.#axesProxy, axes);
            this.#startAnimationLoop();
        } else if (isFinite(axes)) {
            this.#axes = Object.create(null);
            Object.assign(this.#axesProxy, {"": axes});
            this.#startAnimationLoop();
        }
    }
    get axis() {
        return this.axes[""];
    }
    set axis(axis) {
        this.#axesProxy[""] = axis;
    }

    #axisPropertyProxy(property) {
        return new Proxy({}, {
            get: (_, axis) => this.#axes[axis]?.proxy?.[property],
            set: (_, axis, value) => {
                if (axis in this.#axes) {
                    this.#axes[axis].proxy[property] = value;
                }
                return true;
            },
            has: (_, axis) => axis in this.#axes,
            ownKeys: () => Object.keys(this.#axes),
            getOwnPropertyDescriptor: (_, axis) => axis in this.#axes ? {value: this.#axes[axis].proxy[property], writable: false, enumerable: true, configurable: true} : undefined,
        });
    }
    #setAxisProperty(property, values) {
        if (values instanceof Object && Object.keys(values).some(axis => axis in this.#axes && values[axis] != this.#axes[axis].target)) {
            let t = this.#t;
            let axes = this.#snapshot(t);
            Object.keys(values).forEach(axis => {
                if (axis in this.#axes) {
                    axes[axis][property] = +values[axis];
                }
            });
            this.#updateFunctions(axes, t);
        }
    }

    #mins = this.#axisPropertyProxy("min");
    get mins() {
        return this.#mins;
    }
    set mins(mins) {
        this.#setAxisProperty("min", mins);
    }
    get min() {
        return this.mins[""];
    }
    set min(min) {
        this.mins[""] = min;
    }

    #maxs = this.#axisPropertyProxy("max");
    get maxs() {
        return this.#maxs;
    }
    set maxs(maxs) {
        this.#setAxisProperty("max", maxs);
    }
    get max() {
        return this.maxs[""];
    }
    set max(max) {
        this.maxs[""] = max;
    }

    #targets = this.#axisPropertyProxy("target");
    get targets() {
        return this.#targets;
    }
    set targets(targets) {
        this.#setAxisProperty("target", targets);
    }
    get target() {
        return this.targets[""];
    }
    set target(target) {
        this.targets[""] = target;
    }

    #vels = this.#axisPropertyProxy("vel");
    get vels() {
        return this.#vels;
    }
    set vels(vels) {
        this.#setAxisProperty("vel", vels);
    }
    get vel() {
        return this.vels[""];
    }
    set vel(vel) {
        this.vels[""] = vel;
    }

    #values = this.#axisPropertyProxy("value");
    get values() {
        return this.#values;
    }
    set values(values) {
        this.#setAxisProperty("value", values);
    }
    get value() {
        return this.values[""];
    }
    set value(value) {
        this.values[""] = value;
    }

    #accel = 10000;
    get accel() {
        return this.#accel;
    }
    set accel(accel) {
        if (!isNaN(accel) && +accel > 0) {
            let t = this.#t;
            let axes = this.#snapshot(t);
            this.#accel = +accel;
            this.#updateFunctions(axes, t);
        }
    }

    #time = undefined;
    get time() {
        return this.#time;
    }
    set time(time) {
        let t = typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
        let axes = this.#snapshot(t);
        this.#time = !isNaN(time) ? +time : time instanceof Object ? time : undefined;
        this.#updateFunctions(axes, t);
    }
    get #t() {
        return typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
    }

    get timeLeft() {
        return Math.max(0, Object.values(this.#axes).reduce((end, axis) => Math.max(end, axis.functions?.at(-1)?.end ?? 0), 0) - this.#t);
    }

    #callback = undefined;
    get callback() {
        return this.#callback;
    }
    set callback(callback) {
        if (callback instanceof Function || callback == undefined) {
            cancelAnimationFrame(this.#animationFrame);
            this.#animationFrame = undefined;
            this.#callback = callback;
            this.#startAnimationLoop();
        }
    }

    #animationFrame = undefined;
    #startAnimationLoop() {
        if (this.#callback && !this.#animationFrame) {
            let frame = () => {
                try {
                    this.#animationFrame = this.timeLeft ? requestAnimationFrame(frame) : undefined;
                    if (this.#callback) {
                        let time = typeof this.#time == "number" ? this.#time : this.#time?.sec ?? performance.now() / 1e3;
                        this.#callback(Object.fromEntries(Object.keys(this.#axes).map(axis => {
                            let f = this.#axes[axis].functions.find(f => time <= f.end);
                            return [axis, f ? f.n0 + f.n1 * time + f.n2 * time ** 2 : this.#axes[axis].target];
                        })));
                    }
                } catch (e) {
                    console.error(e);
                }
            };
            frame();
        }
    }

    to = targets => {
        if (targets instanceof Object) {
            this.targets = targets;
        } else if (isFinite(targets)) {
            this.target = targets;
        }
        return this;
    };
    offset = offsets => {
        if (isFinite(offsets)) {
            offsets = {"": offsets};
        }
        if (offsets instanceof Object) {
            Object.keys(offsets).forEach(axis => {
                if (axis in this.#axes && !!+offsets[axis]) {
                    this.#axes[axis].target += +offsets[axis];
                    this.#axes[axis].value += +offsets[axis];
                    this.#axes[axis].functions.forEach(f => f.n0 += +offsets[axis]);
                }
            });
        }
        return this;
    };
    skip = (ratio = 1) => {
        if (0 < ratio) {
            if (ratio < 1) {
                let t = +ratio * this.timeLeft;
                Object.keys(this.#axes).forEach(axis => this.#axes[axis].functions.forEach(f => {
                    f.n0 += f.n1 * t + f.n2 * t ** 2;
                    f.n1 += 2 * f.n2 * t;
                    f.end -= t;
                }));
            } else {
                Object.keys(this.#axes).forEach(axis => this.#axes[axis].functions = []);
            }
        }
        return this;
    };

    #snapshot(t = this.#t) {
        return Object.fromEntries(Object.keys(this.#axes).map(axis => {
            let f = this.#axes[axis].functions.find(f => t <= f.end);
            return [axis, {min: this.#axes[axis].min, max: this.#axes[axis].max, target: this.#axes[axis].target, value: f ? f.n0 + f.n1 * t + f.n2 * t ** 2 : this.#axes[axis].target, vel: f ? f.n1 + f.n2 * t * 2 : 0}];
        }));
    }
    get snapshot() {
        return this.#snapshot();
    }

    #updateFunctions(axes = {x: {min: -Infinity, max: Infinity, target: 0, value: 0, vel: 0}}, t = this.#t) {
        let targets = [{}];
        Object.keys(axes).forEach(axis => {
            this.#axes[axis].min = axes[axis].min;
            this.#axes[axis].max = axes[axis].max;
            this.#axes[axis].functions = [];
            if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                let min = Math.min(axes[axis].min, axes[axis].max);
                let diff = Math.max(axes[axis].min, axes[axis].max) - min;
                let mod = n => (n % diff + diff) % diff;
                let end = axes[axis].value + axes[axis].vel * Math.abs(axes[axis].vel) / this.#accel / 2;
                let end2 = end - min;
                targets = (Math.abs(mod(axes[axis].target - min) - mod(end - min)) < 1e-9 ? [Math.floor(end2 / diff) * diff + mod(axes[axis].target - min) + min] : [
                    Math.floor(end2 / diff) * diff + mod(axes[axis].target - min) + min,
                    (Math.floor(end2 / diff) + (mod(axes[axis].target - min) < mod(end - min) ? 1 : -1)) * diff + mod(axes[axis].target - min) + min,
                ]).map(axisTarget => targets.map(target => ({...target, [axis]: axisTarget}))).flat();
            } else {
                targets.forEach(target => target[axis] = axes[axis].target);
            }
        });
        let best = {duration: Infinity};
        targets.forEach(target => {
            let totalDist = Object.keys(axes).reduce((totalDist, axis) => totalDist + (target[axis] - axes[axis].value) ** 2, 0) ** .5;
            let totalVel = Object.values(axes).reduce((totalVel, axis) => totalVel + axis.vel ** 2, 0) ** .5;
            let normalApproach;
            let approachVel;
            let driftVel = 0;
            let normalDrift;
            if (totalDist > 1e-9) {
                normalApproach = Object.fromEntries(Object.keys(axes).map(axis => [axis, (target[axis] - axes[axis].value) / totalDist]));
                approachVel = Object.keys(axes).reduce((dot, axis) => dot + normalApproach[axis] * axes[axis].vel, 0);
                if (totalVel > 1e-9) {
                    let normalVel = Object.fromEntries(Object.keys(axes).map(axis => [axis, axes[axis].vel / totalVel]));
                    let dot = Object.keys(axes).reduce((dot, axis) => dot + normalApproach[axis] * normalVel[axis], 0);
                    if (Math.abs(dot) < 1 - 1e-9) {
                        let drift = Object.fromEntries(Object.keys(axes).map(axis => [axis, normalVel[axis] - dot * normalApproach[axis]]));
                        driftVel = Object.keys(axes).reduce((driftMag, axis) => driftMag + drift[axis] ** 2, 0) ** .5;
                        normalDrift = Object.fromEntries(Object.keys(axes).map(axis => [axis, drift[axis] / driftVel]));
                        driftVel *= totalVel;
                    }
                }
            } else if (totalVel > 1e-9) {
                normalApproach = Object.fromEntries(Object.keys(axes).map(axis => [axis, axes[axis].vel / totalVel]));
                approachVel = totalVel;
            } else {
                return;
            }
            let duration = Math.max(Math.abs(approachVel) < 1e-9 ? Math.abs(totalDist / this.#accel) ** .5 * 2 : (Math.abs(Math.abs(approachVel) * approachVel / 2 / this.#accel - totalDist) < 1e-9 ? Math.abs(approachVel) : approachVel ** 2 < Math.abs(totalDist) * this.#accel * 2 ? Math.max(0, (approachVel ** 2 / 2 + totalDist * this.#accel) ** .5 * 2) - approachVel : Math.abs(approachVel) + Math.abs(Math.abs(approachVel) * approachVel * 2 - totalDist * this.#accel * 4) ** .5) / this.#accel, Math.abs(driftVel / this.#accel) * (1 + Math.SQRT2));
            if (duration < best.duration) {
                best = {totalDist, normalApproach, approachVel, driftVel, normalDrift, duration, target};
            }
        });
        if (best.duration == Infinity) {
            Object.keys(axes).forEach(axis => {
                if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                    let min = Math.min(axes[axis].min, axes[axis].max);
                    let diff = Math.max(axes[axis].min, axes[axis].max) - min;
                    this.#axes[axis].target = ((axes[axis].target - min) % diff + diff) % diff + min;
                } else {
                    this.#axes[axis].target = axes[axis].target;
                }
            });
            return;
        }
        let {totalDist, normalApproach, approachVel, driftVel, normalDrift, duration, target} = best;
        let findFunctions = (dist, vel) => {
            let disc = ((vel * duration - dist * 2) ** 2 + (vel * duration) ** 2) ** .5;
            let x = (dist * 2 - vel * duration + disc) / duration ** 2;
            x = vel / x - duration < 1e-9 && vel / x + duration > -1e-9 ? x : (dist * 2 - vel * duration - disc) / duration ** 2;
            let rel = Math.min(Math.max(duration - vel / x, 0) / 2, duration);
            let function1 = {start: t, end: t + rel, n0: x * t ** 2 / 2 - vel * t, n1: vel - x * t, n2: x / 2};
            let function2 = {start: t + rel, end: t + duration, n0: -x * rel ** 2 - (vel + x * (rel * 2 + t / 2)) * t, n1: vel + x * rel * 2 + x * t, n2: -x / 2};
            return rel < 1e-9 ? [function2] : rel > duration - 1e-9 ? [function1] : [function1, function2];
        };
        let approachFunctions = findFunctions(totalDist, approachVel);
        let driftFunctions = normalDrift ? findFunctions(0, driftVel) : [];
        Object.keys(axes).forEach(axis => {
            if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                let min = Math.min(axes[axis].min, axes[axis].max);
                let diff = Math.max(axes[axis].min, axes[axis].max) - min;
                this.#axes[axis].target = ((target[axis] - min) % diff + diff) % diff + min;
            } else {
                this.#axes[axis].target = target[axis];
            }
        });
        [...new Set([...approachFunctions.map(f => f.end), ...driftFunctions.map(f => f.end)])].sort((a, b) => a - b).forEach(end => {
            let approachFunction = approachFunctions.find(f => end <= f.end);
            let driftFunction = driftFunctions.find(f => end <= f.end);
            Object.keys(axes).forEach(axis => {
                let n0 = normalApproach[axis] * (approachFunction?.n0 ?? 0) + (driftFunction ? normalDrift[axis] * driftFunction.n0 : 0) + axes[axis].value;
                let n1 = normalApproach[axis] * (approachFunction?.n1 ?? 0) + (driftFunction ? normalDrift[axis] * driftFunction.n1 : 0);
                let n2 = normalApproach[axis] * (approachFunction?.n2 ?? 0) + (driftFunction ? normalDrift[axis] * driftFunction.n2 : 0);
                if (Math.abs(n1) + Math.abs(n2) > 1e-9) {
                    if (isFinite(axes[axis].min) && isFinite(axes[axis].max) && axes[axis].min != axes[axis].max) {
                        let min = Math.min(axes[axis].min, axes[axis].max);
                        let max = Math.max(axes[axis].min, axes[axis].max);
                        let yMin = Math.min(n0 + n1 * t + n2 * t ** 2, n0 + n1 * end + n2 * end ** 2);
                        let yMax = Math.max(n0 + n1 * t + n2 * t ** 2, n0 + n1 * end + n2 * end ** 2);
                        if (n2) {
                            let vertex = -n1 / (2 * n2);
                            if (vertex > t && vertex < end) {
                                yMin = Math.min(yMin, n0 + n1 * vertex + n2 * vertex ** 2);
                                yMax = Math.max(yMax, n0 + n1 * vertex + n2 * vertex ** 2);
                            }
                        }
                        let loops = new Set([t, end]);
                        for (let k = Math.floor((yMin - min) / (max - min)); k <= Math.ceil((yMax - min) / (max - min)); k++) {
                            if (n2) {
                                let d = n1 ** 2 - 4 * n2 * (n0 - min - k * (max - min));
                                if (d >= 0) {
                                    let x1 = (-n1 + d ** .5) / (2 * n2);
                                    let x2 = (-n1 - d ** .5) / (2 * n2);
                                    if (x1 > t && x1 < end) {
                                        loops.add(x1);
                                    }
                                    if (x2 > t && x2 < end) {
                                        loops.add(x2);
                                    }
                                }
                            } else if (n1) {
                                let x = -(n0 - min - k * (max - min)) / n1;
                                if (x > t && x < end) {
                                    loops.add(x);
                                }
                            }
                        }
                        loops = [...loops].sort((a, b) => a - b);
                        for (let i = 0; i < loops.length - 1; i++) {
                            this.#axes[axis].functions.push({start: loops[i], end: loops[i + 1], n0: n0 - Math.floor((n0 + n1 * (loops[i] + loops[i + 1]) / 2 + n2 * (loops[i] + loops[i + 1]) ** 2 / 4 - min) / (max - min)) * (max - min), n1, n2});
                        }
                    } else {
                        this.#axes[axis].functions.push({start: t, end, n0, n1, n2});
                    }
                }
            });
            t = end;
        });
    }
};
