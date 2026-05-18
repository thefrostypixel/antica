/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Box2 = class Box2 {
    constructor(...b) {
        this.set(...b);
    }


    #xMin = 0;
    get xMin() {
        return this.#xMin;
    }
    set xMin(xMin) {
        if (isFinite(xMin)) {
            this.#xMin = +xMin;
        }
    }
    get left() {
        return this.xMin;
    }
    set left(left) {
        this.xMin = left;
    }

    #xMax = 0;
    get xMax() {
        return this.#xMax;
    }
    set xMax(xMax) {
        if (isFinite(xMax)) {
            this.#xMax = +xMax;
        }
    }
    get right() {
        return this.xMax;
    }
    set right(right) {
        this.xMax = right;
    }

    #yMin = 0;
    get yMin() {
        return this.#yMin;
    }
    set yMin(yMin) {
        if (isFinite(yMin)) {
            this.#yMin = +yMin;
        }
    }
    get bottom() {
        return this.yMin;
    }
    set bottom(bottom) {
        this.yMin = bottom;
    }

    #yMax = 0;
    get yMax() {
        return this.#yMax;
    }
    set yMax(yMax) {
        if (isFinite(yMax)) {
            this.#yMax = +yMax;
        }
    }
    get top() {
        return this.yMax;
    }
    set top(top) {
        this.yMax = top;
    }

    get min() {
        return new Vec2(this.xMin, this.yMin);
    }
    set min(min) {
        this.xMin = min?.x;
        this.yMin = min?.y;
    }
    get max() {
        return new Vec2(this.xMax, this.yMax);
    }
    set max(max) {
        this.xMax = max?.x;
        this.yMax = max?.y;
    }

    get xMinYMin() {
        return new Vec2(this.xMin, this.yMin);
    }
    set xMinYMin(xMinYMin) {
        this.xMin = xMinYMin?.x;
        this.yMin = xMinYMin?.y;
    }
    get leftBottom() {
        return this.xMinYMin;
    }
    set leftBottom(leftBottom) {
        this.xMinYMin = leftBottom;
    }

    get xMaxYMin() {
        return new Vec2(this.xMax, this.yMin);
    }
    set xMaxYMin(xMaxYMin) {
        this.xMax = xMaxYMin?.x;
        this.yMin = xMaxYMin?.y;
    }
    get topBottom() {
        return this.xMaxYMin;
    }
    set topBottom(topBottom) {
        this.xMaxYMin = topBottom;
    }

    get xMinYMax() {
        return new Vec2(this.xMin, this.yMax);
    }
    set xMinYMax(xMinYMax) {
        this.xMin = xMinYMax?.x;
        this.yMax = xMinYMax?.y;
    }
    get leftTop() {
        return this.xMinYMax;
    }
    set leftTop(leftTop) {
        this.xMinYMax = leftTop;
    }

    get xMaxYMax() {
        return new Vec2(this.xMax, this.yMax);
    }
    set xMaxYMax(xMaxYMax) {
        this.xMax = xMaxYMax?.x;
        this.yMax = xMaxYMax?.y;
    }
    get rightTop() {
        return this.xMaxYMax;
    }
    set rightTop(rightTop) {
        this.xMaxYMax = rightTop;
    }


    get xSize() {
        return this.xMax - this.xMin;
    }
    set xSize(xSize) {
        this.xMax = this.xMin + xSize;
    }
    get width() {
        return this.xSize;
    }
    set width(width) {
        return this.xSize = width;
    }

    get ySize() {
        return this.yMax - this.yMin;
    }
    set ySize(ySize) {
        this.yMax = this.yMin + ySize;
    }
    get height() {
        return this.ySize;
    }
    set height(height) {
        this.ySize = height;
    }

    get size() {
        return new Vec2(this.xSize, this.ySize);
    }
    set size(size) {
        this.xSize = size?.x;
        this.ySize = size?.y;
    }


    get xCenter() {
        return (this.xMin + this.xMax) * .5;
    }
    set xCenter(xCenter) {
        let diff = xCenter - this.xCenter;
        this.xMin += diff;
        this.xMax += diff;
    }

    get yCenter() {
        return (this.yMin + this.yMax) * .5;
    }
    set yCenter(yCenter) {
        let diff = yCenter - this.yCenter;
        this.yMin += diff;
        this.yMax += diff;
    }

    get center() {
        return new Vec2(this.xCenter, this.yCenter);
    }
    set center(center) {
        this.xCenter = center?.x;
        this.yCenter = center?.y;
    }


    get copy() {
        return new Box2(this);
    }
    get obj() {
        return {xMin: this.xMin, xMax: this.xMax, yMin: this.yMin, yMax: this.yMax};
    }
    get list() {
        return [this.xMin, this.xMax, this.yMin, this.yMax];
    }
    get box2() {
        return new Box2(this);
    }
    get box3() {
        return new Box3(this);
    }

    set(...b) {
        b = b.flat(Infinity);
        let box = [
            b[0]?.xMin ?? b[0]?.left ?? b[0],
            b[0]?.xMax ?? b[0]?.right ?? b[1],
            b[0]?.xSize ?? b[0]?.width,
            b[0]?.yMin ?? b[0]?.bottom ?? b[2],
            b[0]?.yMax ?? b[0]?.top ?? b[3],
            b[0]?.ySize ?? b[0]?.height,
        ];
        this.xMin = isFinite(box[0]) ? box[0] : 0;
        this.xMax = isFinite(box[1]) ? box[1] : this.xMin + box[2];
        if (!isFinite(box[0]) && isFinite(box[1])) {
            this.xMin = this.xMax - box[2];
        }
        this.yMin = isFinite(box[3]) ? box[3] : 0;
        this.yMax = isFinite(box[4]) ? box[4] : this.yMin + box[5];
        if (!isFinite(box[3]) && isFinite(box[4])) {
            this.yMin = this.yMax - box[5];
        }
        return this;
    }

    fix() {
        if (this.xSize < 0) {
            [this.xMin, this.xMax] = [this.xMax, this.xMin];
        }
        if (this.ySize < 0) {
            [this.yMin, this.yMax] = [this.yMax, this.yMin];
        }
        return this;
    }
    move(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        this.xMin += v.x;
        this.xMax += v.x;
        this.yMin += v.y;
        this.yMax += v.y;
        return this;
    }
    multOrigin(...v) {
        v = typeof v[0] == "number" ? new Vec2(v[0], v[1] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec2(...v);
        this.xMin *= v.x;
        this.xMax *= v.x;
        this.yMin *= v.y;
        this.yMax *= v.y;
        return this;
    }
    multCenter(...v) {
        v = typeof v[0] == "number" ? new Vec2(v[0], v[1] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec2(...v);
        let center = this.center;
        this.xMin = this.xMin * v.x + center.x * (1 - v.x);
        this.xMax = this.xMax * v.x + center.x * (1 - v.x);
        this.yMin = this.yMin * v.y + center.y * (1 - v.y);
        this.yMax = this.yMax * v.y + center.y * (1 - v.y);
        return this;
    }
    divOrigin(...v) {
        v = typeof v[0] == "number" ? new Vec2(v[0], v[1] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec2(...v);
        this.xMin /= v.x ?? Infinity;
        this.xMax /= v.x ?? Infinity;
        this.yMin /= v.y ?? Infinity;
        this.yMax /= v.y ?? Infinity;
        return this;
    }
    divCenter(...v) {
        v = typeof v[0] == "number" ? new Vec2(v[0], v[1] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec2(...v);
        let center = this.center;
        this.xMin = this.xMin / (v.x ?? Infinity) + center.x / (1 - v.x ?? Infinity);
        this.xMax = this.xMax / (v.x ?? Infinity) + center.x / (1 - v.x ?? Infinity);
        this.yMin = this.yMin / (v.y ?? Infinity) + center.y / (1 - v.y ?? Infinity);
        this.yMax = this.yMax / (v.y ?? Infinity) + center.y / (1 - v.y ?? Infinity);
        return this;
    }
    expand(...v) {
        if (v.length == 4 || v[0] instanceof Padding2) {
            v[0] = v[0] instanceof Padding2 ? v[0] : new Padding2(...v);
            this.xMin -= v.xMinus;
            this.xMax += v.xPlus;
            this.yMin -= v.yMinus;
            this.yMax += v.yPlus;
        } else {
            v = typeof v[0] == "number" ? new Vec2(v[0], v[1] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec2(...v);
            this.xMin -= v.x;
            this.xMax += v.x;
            this.yMin -= v.y;
            this.yMax += v.y;
        }
        return this;
    }
    include(...v) {
        if (v[0] instanceof Box2 || v[0] instanceof Box3) {
            this.xMin = Math.min(this.xMin, v[0].xMin);
            this.xMax = Math.max(this.xMax, v[0].xMax);
            this.yMin = Math.min(this.yMin, v[0].yMin);
            this.yMax = Math.max(this.yMax, v[0].yMax);
        } else {
            v = v[0] instanceof Object ? v[0] : new Vec2(...v);
            this.xMin = Math.min(this.xMin, v.x);
            this.xMax = Math.max(this.xMax, v.x);
            this.yMin = Math.min(this.yMin, v.y);
            this.yMax = Math.max(this.yMax, v.y);
        }
        return this;
    }
    includes(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        return this.xMin <= v.x && v.x <= this.xMax && this.yMin <= v.y && v.y <= this.yMax;
    }

    transformMat3(from = new Box2(0, 1, 0, 1)) {
        return new Mat3(this.xSize / from.xSize, 0, 0, 0, this.ySize / from.ySize, 0, this.xMin - from.xMin * this.xSize / from.xSize, this.yMin - from.yMin * this.ySize / from.ySize, 1);
    }
    vertexMat3(target, mesh = new Box2(0, 1, 0, 1)) {
        return new Mat3(this.xSize * 2 / target.width / mesh.xSize, 0, 0, 0, this.ySize * 2 / target.height / mesh.ySize, 0, this.xMin * 2 / target.width - 1 - mesh.xMin * this.xSize * 2 / target.width / mesh.xSize, this.yMin * 2 / target.height - 1 - mesh.yMin * this.ySize * 2 / target.height / mesh.ySize, 1);
    }
};

globalThis.Box3 = class Box3 {
    constructor(...b) {
        this.set(...b);
    }


    #xMin = 0;
    get xMin() {
        return this.#xMin;
    }
    set xMin(xMin) {
        if (isFinite(xMin)) {
            this.#xMin = +xMin;
        }
    }
    get left() {
        return this.xMin;
    }
    set left(left) {
        this.xMin = left;
    }

    #xMax = 0;
    get xMax() {
        return this.#xMax;
    }
    set xMax(xMax) {
        if (isFinite(xMax)) {
            this.#xMax = +xMax;
        }
    }
    get right() {
        return this.xMax;
    }
    set right(right) {
        this.xMax = right;
    }

    #yMin = 0;
    get yMin() {
        return this.#yMin;
    }
    set yMin(yMin) {
        if (isFinite(yMin)) {
            this.#yMin = +yMin;
        }
    }
    get bottom() {
        return this.yMin;
    }
    set bottom(bottom) {
        this.yMin = bottom;
    }

    #yMax = 0;
    get yMax() {
        return this.#yMax;
    }
    set yMax(yMax) {
        if (isFinite(yMax)) {
            this.#yMax = +yMax;
        }
    }
    get top() {
        return this.yMax;
    }
    set top(top) {
        this.yMax = top;
    }

    #zMin = 0;
    get zMin() {
        return this.#zMin;
    }
    set zMin(zMin) {
        if (isFinite(zMin)) {
            this.#zMin = +zMin;
        }
    }
    get back() {
        return this.zMin;
    }
    set back(back) {
        this.zMin = back;
    }

    #zMax = 0;
    get zMax() {
        return this.#zMax;
    }
    set zMax(zMax) {
        if (isFinite(zMax)) {
            this.#zMax = +zMax;
        }
    }
    get front() {
        return this.zMax;
    }
    set front(front) {
        this.zMax = front;
    }

    get min() {
        return new Vec3(this.xMin, this.yMin, this.zMin);
    }
    set min(min) {
        this.xMin = min?.x;
        this.yMin = min?.y;
        this.zMin = min?.z;
    }
    get max() {
        return new Vec3(this.xMax, this.yMax, this.zMax);
    }
    set max(max) {
        this.xMax = max?.x;
        this.yMax = max?.y;
        this.zMax = max?.z;
    }

    get xMinYMinZMin() {
        return new Vec3(this.xMin, this.yMin, this.zMin);
    }
    set xMinYMinZMin(xMinYMinZMin) {
        this.xMin = xMinYMinZMin?.x;
        this.yMin = xMinYMinZMin?.y;
        this.zMin = xMinYMinZMin?.z;
    }
    get leftBottomBack() {
        return this.xMinYMinZMin;
    }
    set leftBottomBack(leftBottomBack) {
        this.xMinYMinZMin = leftBottomBack;
    }

    get xMaxYMinZMin() {
        return new Vec3(this.xMax, this.yMin, this.zMin);
    }
    set xMaxYMinZMin(xMaxYMinZMin) {
        this.xMax = xMaxYMinZMin?.x;
        this.yMin = xMaxYMinZMin?.y;
        this.zMin = xMaxYMinZMin?.z;
    }
    get rightBottomBack() {
        return this.xMinYMinZMin;
    }
    set rightBottomBack(rightBottomBack) {
        this.xMaxYMinZMin = rightBottomBack;
    }

    get xMinYMaxZMin() {
        return new Vec3(this.xMin, this.yMax, this.zMin);
    }
    set xMinYMaxZMin(xMinYMaxZMin) {
        this.xMin = xMinYMaxZMin?.x;
        this.yMax = xMinYMaxZMin?.y;
        this.zMin = xMinYMaxZMin?.z;
    }
    get leftTopBack() {
        return this.xMinYMinZMin;
    }
    set leftTopBack(leftTopBack) {
        this.xMinYMaxZMin = leftTopBack;
    }

    get xMaxYMaxZMin() {
        return new Vec3(this.xMax, this.yMax, this.zMin);
    }
    set xMaxYMaxZMin(xMaxYMaxZMin) {
        this.xMax = xMaxYMaxZMin?.x;
        this.yMax = xMaxYMaxZMin?.y;
        this.zMin = xMaxYMaxZMin?.z;
    }
    get rightTopBack() {
        return this.xMinYMinZMin;
    }
    set rightTopBack(rightTopBack) {
        this.xMaxYMaxZMin = rightTopBack;
    }

    get xMinYMinZMax() {
        return new Vec3(this.xMin, this.yMin, this.zMax);
    }
    set xMinYMinZMax(xMinYMinZMax) {
        this.xMin = xMinYMinZMax?.x;
        this.yMin = xMinYMinZMax?.y;
        this.zMax = xMinYMinZMax?.z;
    }
    get leftBottomFront() {
        return this.xMinYMinZMin;
    }
    set leftBottomFront(leftBottomFront) {
        this.xMinYMinZMax = leftBottomFront;
    }

    get xMaxYMinZMax() {
        return new Vec3(this.xMax, this.yMin, this.zMax);
    }
    set xMaxYMinZMax(xMaxYMinZMax) {
        this.xMax = xMaxYMinZMax?.x;
        this.yMin = xMaxYMinZMax?.y;
        this.zMax = xMaxYMinZMax?.z;
    }
    get rightBottomFront() {
        return this.xMinYMinZMin;
    }
    set rightBottomFront(rightBottomFront) {
        this.xMaxYMinZMax = rightBottomFront;
    }

    get xMinYMaxZMax() {
        return new Vec3(this.xMin, this.yMax, this.zMax);
    }
    set xMinYMaxZMax(xMinYMaxZMax) {
        this.xMin = xMinYMaxZMax?.x;
        this.yMax = xMinYMaxZMax?.y;
        this.zMax = xMinYMaxZMax?.z;
    }
    get leftTopFront() {
        return this.xMinYMinZMin;
    }
    set leftTopFront(leftTopFront) {
        this.xMinYMaxZMax = leftTopFront;
    }

    get xMaxYMaxZMax() {
        return new Vec3(this.xMax, this.yMax, this.zMax);
    }
    set xMaxYMaxZMax(xMaxYMaxZMax) {
        this.xMax = xMaxYMaxZMax?.x;
        this.yMax = xMaxYMaxZMax?.y;
        this.zMax = xMaxYMaxZMax?.z;
    }
    get rightTopFront() {
        return this.xMinYMinZMin;
    }
    set rightTopFront(rightTopFront) {
        this.xMaxYMaxZMax = rightTopFront;
    }


    get xSize() {
        return this.xMax - this.xMin;
    }
    set xSize(xSize) {
        this.xMax = this.xMin + xSize;
    }
    get width() {
        return this.xSize;
    }
    set width(width) {
        this.xSize = width;
    }

    get ySize() {
        return this.yMax - this.yMin;
    }
    set ySize(ySize) {
        this.yMax = this.yMin + ySize;
    }
    get height() {
        return this.ySize;
    }
    set height(height) {
        this.ySize = height;
    }

    get zSize() {
        return this.zMax - this.zMin;
    }
    set zSize(zSize) {
        this.zMax = this.zMin + zSize;
    }
    get depth() {
        return this.zSize;
    }
    set depth(depth) {
        this.zSize = depth;
    }

    get size() {
        return new Vec3(this.xSize, this.ySize, this.zSize);
    }
    set size(size) {
        this.xSize = size?.x;
        this.ySize = size?.y;
        this.zSize = size?.z;
    }


    get xCenter() {
        return (this.xMin + this.xMax) * .5;
    }
    set xCenter(xCenter) {
        let diff = xCenter - this.xCenter;
        this.xMin += diff;
        this.xMax += diff;
    }

    get yCenter() {
        return (this.yMin + this.yMax) * .5;
    }
    set yCenter(yCenter) {
        let diff = yCenter - this.yCenter;
        this.yMin += diff;
        this.yMax += diff;
    }

    get zCenter() {
        return (this.zMin + this.zMax) * .5;
    }
    set zCenter(zCenter) {
        let diff = zCenter - this.zCenter;
        this.yMin += diff;
        this.yMax += diff;
    }

    get center() {
        return new Vec3(this.xCenter, this.yCenter, this.zCenter);
    }
    set center(center) {
        this.xCenter = center?.x;
        this.yCenter = center?.y;
        this.zCenter = center?.z;
    }


    get copy() {
        return new Box3(this);
    }
    get obj() {
        return {xMin: this.xMin, xMax: this.xMax, yMin: this.yMin, yMax: this.yMax, zMin: this.zMin, zMax: this.zMax};
    }
    get list() {
        return [this.xMin, this.xMax, this.yMin, this.yMax, this.zMin, this.zMax];
    }
    get box2() {
        return new Box2(this);
    }
    get box3() {
        return new Box3(this);
    }

    set(...b) {
        b = b.flat(Infinity);
        let box = [
            b[0]?.xMin ?? b[0]?.left ?? b[0],
            b[0]?.xMax ?? b[0]?.right ?? b[1],
            b[0]?.xSize ?? b[0]?.width,
            b[0]?.yMin ?? b[0]?.bottom ?? b[2],
            b[0]?.yMax ?? b[0]?.top ?? b[3],
            b[0]?.ySize ?? b[0]?.height,
            b[0]?.zMin ?? b[0]?.back ?? b[4],
            b[0]?.zMax ?? b[0]?.front ?? b[5],
            b[0]?.zSize ?? b[0]?.depth,
        ];
        this.xMin = isFinite(box[0]) ? box[0] : 0;
        this.xMax = isFinite(box[1]) ? box[1] : this.xMin + box[2];
        if (!isFinite(box[0]) && isFinite(box[1])) {
            this.xMin = this.xMax - box[2];
        }
        this.yMin = isFinite(box[3]) ? box[3] : 0;
        this.yMax = isFinite(box[4]) ? box[4] : this.yMin + box[5];
        if (!isFinite(box[3]) && isFinite(box[4])) {
            this.yMin = this.yMax - box[5];
        }
        this.zMin = isFinite(box[6]) ? box[6] : 0;
        this.zMax = isFinite(box[7]) ? box[7] : this.zMin + box[8];
        if (!isFinite(box[6]) && isFinite(box[7])) {
            this.zMin = this.zMax - box[8];
        }
        return this;
    }

    fix() {
        if (this.xSize < 0) {
            [this.xMin, this.xMax] = [this.xMax, this.xMin];
        }
        if (this.ySize < 0) {
            [this.yMin, this.yMax] = [this.yMax, this.yMin];
        }
        if (this.zSize < 0) {
            [this.zMin, this.zMax] = [this.zMax, this.zMin];
        }
        return this;
    }
    move(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        this.xMin += v.x;
        this.xMax += v.x;
        this.yMin += v.y;
        this.yMax += v.y;
        this.zMin += v.z;
        this.zMax += v.z;
        return this;
    }
    multOrigin(...v) {
        v = typeof v[0] == "number" ? new Vec3(v[0], v[1] ?? v[0], v[2] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec3(...v);
        this.xMin *= v.x;
        this.xMax *= v.x;
        this.yMin *= v.y;
        this.yMax *= v.y;
        this.zMin *= v.z;
        this.zMax *= v.z;
        return this;
    }
    multCenter(...v) {
        v = typeof v[0] == "number" ? new Vec3(v[0], v[1] ?? v[0], v[2] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec3(...v);
        let center = this.center;
        this.xMin = this.xMin * v.x + center.x * (1 - v.x);
        this.xMax = this.xMax * v.x + center.x * (1 - v.x);
        this.yMin = this.yMin * v.y + center.y * (1 - v.y);
        this.yMax = this.yMax * v.y + center.y * (1 - v.y);
        this.zMin = this.zMin * v.z + center.z * (1 - v.z);
        this.zMax = this.zMax * v.z + center.z * (1 - v.z);
        return this;
    }
    divOrigin(...v) {
        v = typeof v[0] == "number" ? new Vec3(v[0], v[1] ?? v[0], v[2] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec3(...v);
        this.xMin /= v.x ?? Infinity;
        this.xMax /= v.x ?? Infinity;
        this.yMin /= v.y ?? Infinity;
        this.yMax /= v.y ?? Infinity;
        this.zMin /= v.z ?? Infinity;
        this.zMax /= v.z ?? Infinity;
        return this;
    }
    divCenter(...v) {
        v = typeof v[0] == "number" ? new Vec3(v[0], v[1] ?? v[0], v[2] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec3(...v);
        let center = this.center;
        this.xMin = this.xMin / (v.x ?? Infinity) + center.x / (1 - v.x ?? Infinity);
        this.xMax = this.xMax / (v.x ?? Infinity) + center.x / (1 - v.x ?? Infinity);
        this.yMin = this.yMin / (v.y ?? Infinity) + center.y / (1 - v.y ?? Infinity);
        this.yMax = this.yMax / (v.y ?? Infinity) + center.y / (1 - v.y ?? Infinity);
        this.zMin = this.zMin / (v.z ?? Infinity) + center.z / (1 - v.z ?? Infinity);
        this.zMax = this.zMax / (v.z ?? Infinity) + center.z / (1 - v.z ?? Infinity);
        return this;
    }
    expand(...v) {
        if (v.length == 4 || v[0] instanceof Padding2) {
            v[0] = v[0] instanceof Padding2 ? v[0] : new Padding2(...v);
            this.xMin -= v.xMinus;
            this.xMax += v.xPlus;
            this.yMin -= v.yMinus;
            this.yMax += v.yPlus;
        } else {
            v = typeof v[0] == "number" ? new Vec3(v[0], v[1] ?? v[0], v[2] ?? v[0]) : v[0] instanceof Object ? v[0] : new Vec3(...v);
            this.xMin -= v.x;
            this.xMax += v.x;
            this.yMin -= v.y;
            this.yMax += v.y;
            this.zMin -= v.z;
            this.zMax += v.z;
        }
        return this;
    }
    include(...v) {
        if (v[0] instanceof Box2 || v[0] instanceof Box3) {
            this.xMin = Math.min(this.xMin, v[0].xMin);
            this.xMax = Math.max(this.xMax, v[0].xMax);
            this.yMin = Math.min(this.yMin, v[0].yMin);
            this.yMax = Math.max(this.yMax, v[0].yMax);
            this.zMin = Math.min(this.zMin, v[0].zMin);
            this.zMax = Math.max(this.zMax, v[0].zMax);
        } else {
            v = v[0] instanceof Object ? v[0] : new Vec3(...v);
            this.xMin = Math.min(this.xMin, v.x);
            this.xMax = Math.max(this.xMax, v.x);
            this.yMin = Math.min(this.yMin, v.y);
            this.yMax = Math.max(this.yMax, v.y);
            this.zMin = Math.min(this.zMin, v.z);
            this.zMax = Math.max(this.zMax, v.z);
        }
        return this;
    }
    includes(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        return this.xMin <= v.x && v.x <= this.xMax && this.yMin <= v.y && v.y <= this.yMax && this.zMin <= v.z && v.z <= this.zMax;
    }

    transformMat3(from = new Box3(0, 1, 0, 1, 0, 1)) {
        return new Mat3(this.xSize / from.xSize, 0, 0, 0, 0, this.ySize / from.ySize, 0, 0, 0, 0, this.zSize / from.zSize, 0, this.xMin - from.xMin * this.xSize / from.xSize, this.yMin - from.yMin * this.ySize / from.ySize, this.zMin - from.zMin * this.zSize / from.zSize, 1);
    }
};

globalThis.Padding2 = class Padding2 {
    constructor(...p) {
        this.set(...p);
    }


    #xMinus = 0;
    get xMinus() {
        return this.#xMinus;
    }
    set xMinus(xMinus) {
        if (isFinite(xMinus)) {
            this.#xMinus = +xMinus;
        }
    }
    get left() {
        return this.xMinus;
    }
    set left(left) {
        this.xMinus = left;
    }

    #xPlus = 0;
    get xPlus() {
        return this.#xPlus;
    }
    set xPlus(xPlus) {
        if (isFinite(xPlus)) {
            this.#xPlus = +xPlus;
        }
    }
    get right() {
        return this.xPlus;
    }
    set right(right) {
        this.xPlus = right;
    }

    #yMinus = 0;
    get yMinus() {
        return this.#yMinus;
    }
    set yMinus(yMinus) {
        if (isFinite(yMinus)) {
            this.#yMinus = +yMinus;
        }
    }
    get bottom() {
        return this.yMinus;
    }
    set bottom(bottom) {
        this.yMinus = bottom;
    }

    #yPlus = 0;
    get yPlus() {
        return this.#yPlus;
    }
    set yPlus(yPlus) {
        if (isFinite(yPlus)) {
            this.#yPlus = +yPlus;
        }
    }
    get top() {
        return this.yPlus;
    }
    set top(top) {
        this.yPlus = top;
    }

    get minus() {
        return new Vec2(this.xMinus, this.yMinus);
    }
    set minus(minus) {
        this.xMinus = minus?.x;
        this.yMinus = minus?.y;
    }
    get plus() {
        return new Vec2(this.xPlus, this.yPlus);
    }
    set plus(plus) {
        this.xPlus = plus?.x;
        this.yPlus = plus?.y;
    }


    get xTotal() {
        return this.xMinus + this.xPlus;
    }
    set xTotal(xTotal) {
        this.xPlus = xTotal - this.xMinus;
    }
    get horizontalTotal() {
        return this.xTotal;
    }
    set horizontalTotal(horizontalTotal) {
        return this.xTotal = horizontalTotal;
    }

    get yTotal() {
        return this.yMinus + this.yPlus;
    }
    set yTotal(yTotal) {
        this.yPlus = yTotal - this.yMinus;
    }
    get verticalTotal() {
        return this.yTotal;
    }
    set verticalTotal(verticalTotal) {
        this.yTotal = verticalTotal;
    }

    get total() {
        return new Vec2(this.xTotal, this.yTotal);
    }
    set total(total) {
        this.xTotal = total?.x;
        this.yTotal = total?.y;
    }


    get xAvg() {
        return (this.xMinus + this.xPlus) * .5;
    }
    set xAvg(xAvg) {
        this.xMinus = xAvg;
        this.xPlus = xAvg;
    }

    get yAvg() {
        return (this.yMinus + this.yPlus) * .5;
    }
    set yAvg(yAvg) {
        this.yMinus = yAvg;
        this.yPlus = yAvg;
    }

    get avg() {
        return new Vec2(this.xAvg, this.yAvg);
    }
    set avg(avg) {
        this.xAvg = avg?.x;
        this.yAvg = avg?.y;
    }


    get xMin() {
        return Math.min(this.xMinus, this.xPlus);
    }
    get xMax() {
        return Math.max(this.xMinus, this.xPlus);
    }

    get yMin() {
        return Math.min(this.yMinus, this.yPlus);
    }
    get yMax() {
        return Math.max(this.yMinus, this.yPlus);
    }

    get min() {
        return Math.min(this.xMinus, this.xPlus, this.yMinus, this.yPlus);
    }
    get max() {
        return Math.max(this.xMinus, this.xPlus, this.yMinus, this.yPlus);
    }


    scale(s) {
        this.xMinus *= s;
        this.xPlus *= s;
        this.yMinus *= s;
        this.yPlus *= s;
        return this;
    }

    get copy() {
        return new Padding2(this);
    }
    get obj() {
        return {xMinus: this.xMinus, xPlus: this.xPlus, yMinus: this.yMinus, yPlus: this.yPlus};
    }
    get list() {
        return [this.xMinus, this.xPlus, this.yMinus, this.yPlus];
    }
    get padding2() {
        return new Padding2(this);
    }

    set(...p) {
        p = p.flat(Infinity);
        let box = [
            p[0]?.xMinus ?? p[0]?.left ?? p[0],
            p[0]?.xPlus ?? p[0]?.right ?? (p.length == 2 ? p[0] : p[1] ?? p[0]),
            p[0]?.xTotal ?? p[0]?.horizontalTotal,
            p[0]?.yMinus ?? p[0]?.bottom ?? p[2] ?? p[1] ?? p[0],
            p[0]?.yPlus ?? p[0]?.top ?? p[3] ?? p[2] ?? p[1] ?? p[0],
            p[0]?.yTotal ?? p[0]?.verticalTotal,
        ];
        this.xMinus = isFinite(box[0]) ? box[0] : 0;
        this.xPlus = isFinite(box[1]) ? box[1] : this.xMinus + box[2];
        if (!isFinite(box[0]) && isFinite(box[1])) {
            this.xMinus = this.xPlus - box[2];
        }
        this.yMinus = isFinite(box[3]) ? box[3] : 0;
        this.yPlus = isFinite(box[4]) ? box[4] : this.yMinus + box[5];
        if (!isFinite(box[3]) && isFinite(box[4])) {
            this.yMinus = this.yPlus - box[5];
        }
        return this;
    }
};
