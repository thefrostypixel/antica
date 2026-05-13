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

    get xMinYMin() {
        return new Vec2(this.xMin, this.yMin);
    }
    get leftBottom() {
        return this.xMinYMin;
    }

    get xMaxYMin() {
        return new Vec2(this.xMax, this.yMin);
    }
    get topBottom() {
        return this.xMaxYMin;
    }

    get xMinYMax() {
        return new Vec2(this.xMin, this.yMax);
    }
    get leftTop() {
        return this.xMinYMax;
    }

    get xMaxYMax() {
        return new Vec2(this.xMax, this.yMax);
    }
    get rightTop() {
        return this.xMaxYMax;
    }

    get center() {
        return new Vec2((this.xMin + this.xMax) * .5, (this.yMin + this.yMax) * .5);
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

    get xMinYMinZMin() {
        return new Vec3(this.xMin, this.yMin, this.zMin);
    }
    get leftBottomBack() {
        return this.xMinYMinZMin;
    }

    get xMaxYMinZMin() {
        return new Vec3(this.xMax, this.yMin, this.zMin);
    }
    get rightBottomBack() {
        return this.xMinYMinZMin;
    }

    get xMinYMaxZMin() {
        return new Vec3(this.xMin, this.yMax, this.zMin);
    }
    get leftTopBack() {
        return this.xMinYMinZMin;
    }

    get xMaxYMaxZMin() {
        return new Vec3(this.xMax, this.yMax, this.zMin);
    }
    get rightTopBack() {
        return this.xMinYMinZMin;
    }

    get xMinYMinZMax() {
        return new Vec3(this.xMin, this.yMin, this.zMax);
    }
    get leftBottomFront() {
        return this.xMinYMinZMin;
    }

    get xMaxYMinZMax() {
        return new Vec3(this.xMax, this.yMin, this.zMax);
    }
    get rightBottomFront() {
        return this.xMinYMinZMin;
    }

    get xMinYMaxZMax() {
        return new Vec3(this.xMin, this.yMax, this.zMax);
    }
    get leftTopFront() {
        return this.xMinYMinZMin;
    }

    get xMaxYMaxZMax() {
        return new Vec3(this.xMax, this.yMax, this.zMax);
    }
    get rightTopFront() {
        return this.xMinYMinZMin;
    }

    get center() {
        return new Vec3((this.xMin + this.xMax) * .5, (this.yMin + this.yMax) * .5, (this.zMin + this.zMax) * .5);
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
