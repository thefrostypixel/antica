globalThis.Rect = {};

globalThis.Box2 = class Box2 {
    constructor(...r) {
        this.set(...r);
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


    move(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        this.xMin += v.x;
        this.xMax += v.x;
        this.yMin += v.y;
        this.yMax += v.y;
        return this;
    }
    scaleOrigin(s) {
        this.xMin *= s;
        this.xMax *= s;
        this.yMin *= s;
        this.yMax *= s;
        return this;
    }
    scaleCenter(s) {
        let center = this.center;
        this.xMin = this.xMin * s + center.x * (1 - s);
        this.xMax = this.xMax * s + center.x * (1 - s);
        this.yMin = this.yMin * s + center.y * (1 - s);
        this.yMax = this.yMax * s + center.y * (1 - s);
        return this;
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

    set(...r) {
        r = r.flat(Infinity);
        this.xMin = r[0]?.xMin ?? r[0]?.left ?? r[0];
        this.xMax = r[0]?.xMax ?? r[0]?.right ?? r[1];
        this.yMin = r[0]?.yMin ?? r[0]?.bottom ?? r[2];
        this.yMax = r[0]?.yMax ?? r[0]?.top ?? r[3];
        this.xSize = r[0]?.xSize ?? r[0]?.width;
        this.ySize = r[0]?.ySize ?? r[0]?.height;
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
    include(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        this.xMin = Math.min(this.xMin, v.x);
        this.xMax = Math.max(this.xMax, v.x);
        this.yMin = Math.min(this.yMin, v.y);
        this.yMax = Math.max(this.yMax, v.y);
        return this;
    }
    includes(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec2(...v);
        return this.xMin <= v.x && v.x <= this.xMax && this.yMin <= v.y && v.y <= this.yMax;
    }
};

globalThis.Box3 = class Box3 {
    constructor(...r) {
        this.set(...r);
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
    scaleOrigin(s) {
        this.xMin *= s;
        this.xMax *= s;
        this.yMin *= s;
        this.yMax *= s;
        this.zMin *= s;
        this.zMax *= s;
        return this;
    }
    scaleCenter(s) {
        let center = this.center;
        this.xMin = this.xMin * s + center.x * (1 - s);
        this.xMax = this.xMax * s + center.x * (1 - s);
        this.yMin = this.yMin * s + center.y * (1 - s);
        this.yMax = this.yMax * s + center.y * (1 - s);
        this.zMin = this.zMin * s + center.z * (1 - s);
        this.zMax = this.zMax * s + center.z * (1 - s);
        return this;
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

    set(...r) {
        r = r.flat(Infinity);
        this.xMin = r[0]?.xMin ?? r[0]?.left ?? r[0];
        this.xMax = r[0]?.xMax ?? r[0]?.right ?? r[1];
        this.yMin = r[0]?.yMin ?? r[0]?.bottom ?? r[2];
        this.yMax = r[0]?.yMax ?? r[0]?.top ?? r[3];
        this.zMin = r[0]?.zMin ?? r[0]?.back ?? r[4];
        this.zMax = r[0]?.zMax ?? r[0]?.front ?? r[5];
        this.xSize = r[0]?.xSize ?? r[0]?.width;
        this.ySize = r[0]?.ySize ?? r[0]?.height;
        this.zSize = r[0]?.zSize ?? r[0]?.depth;
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
    include(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        this.xMin = Math.min(this.xMin, v.x);
        this.xMax = Math.max(this.xMax, v.x);
        this.yMin = Math.min(this.yMin, v.y);
        this.yMax = Math.max(this.yMax, v.y);
        this.zMin = Math.min(this.zMin, v.z);
        this.zMax = Math.max(this.zMax, v.z);
        return this;
    }
    includes(...v) {
        v = v[0] instanceof Object ? v[0] : new Vec3(...v);
        return this.xMin <= v.x && v.x <= this.xMax && this.yMin <= v.y && v.y <= this.yMax && this.zMin <= v.z && v.z <= this.zMax;
    }
};
