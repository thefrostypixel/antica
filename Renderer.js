/*
This file is licensed under CC0 1.0
(https://creativecommons.org/publicdomain/zero/1.0),
meaning you can use, modify, and distribute it however you want,
including commercially, and without including this license.
*/

globalThis.Renderer = class Renderer extends HTMLCanvasElement {
    static glDataTypes = {
        0x1406: "1f",
        0x8B50: "2f",
        0x8B51: "3f",
        0x8B52: "4f",

        0x1404: "1i",
        0x8B53: "2i",
        0x8B54: "3i",
        0x8B55: "4i",

        0x1405: "1ui",
        0x8DC6: "2ui",
        0x8DC7: "3ui",
        0x8DC8: "4ui",

        0x8B56: "1i",
        0x8B57: "2iv",
        0x8B58: "3iv",
        0x8B59: "4iv",

        0x8B5A: "Matrix2fv",
        0x8B5B: "Matrix3fv",
        0x8B5C: "Matrix4fv",

        0x8B5E: "1i",
        0x8DC1: "1iv",
    };

    static prepareDiscreteData(data, indexed) {
        let count = 0;
        let stride = 0;
        let attributes = Object.entries(data).map(([name, dataArray]) => {
            let f = dataArray[0];
            let type = isFinite(f) ? "Num" : f.constructor.name;
            let size = ({Num: 1, Color: 4, Vec2: 2, Vec3: 3, Vec4: 4, Mat2: 4, Mat3: 9, Mat4: 16})[type] || 0;
            count = Math.max(count, dataArray.length);
            return {name, type, start: stride, end: stride += size, size, data: dataArray.map(isFinite(f) ? (n => [n]) : f instanceof Color ? (c => c.lRgbList(true)) : (v => v.list))};
        });
        let dataIndices = Object.create(null);
        let packedArray = [];
        let indices = [];
        for (let i = 0; i < count; i++) {
            let packed = [];
            attributes.forEach(data => {
                for (let j = 0; j < data.size; j++) {
                    packed.push(data.data[i]?.[j] || 0);
                }
            });
            if (indexed) {
                let key = packed.join();
                dataIndices[key] ??= packedArray.length;
                packedArray[dataIndices[key]] = packed;
                indices.push(dataIndices[key]);
            } else {
                packedArray.push(packed);
            }
        }
        attributes.forEach(data => delete data.data);
        return {attributes, stride, interleaved: packedArray.flat(), ...(indexed ? {indices} : {})};
    }
    static prepareInterleavedData(types, interleaved, indices) {
        let stride = 0;
        let attributes = types.map(type => {
            let size = ({Num: 1, Color: 4, Vec2: 2, Vec3: 3, Vec4: 4, Mat2: 4, Mat3: 9, Mat4: 16})[type.type] || 0;
            return {...type, start: stride, end: stride += size, size};
        });
        return {attributes, stride, interleaved, ...(indices ? {indices} : {})};
    }

    static create() {
        return document.createElement("canvas", {is: "renderer-canvas"});
    }

    static {
        customElements.define("renderer-canvas", Renderer, {extends: "canvas"});
    }

    constructor() {
        super();
        this.gl = this.#internal.gl = this.getContext("webgl2", {depth: false, stencil: false, antialias: false, premultipliedAlpha: true});
        this.#internal.readBuffer = this.#internal.gl.createFramebuffer();
        this.#internal.drawBuffer = this.#internal.gl.createFramebuffer();
        this.#internal.freeTextureSlots = new Set(Array.from({length: this.#internal.gl.getParameter(0x8872)}, (_, i) => i));
    }

    static #lastId = 0;
    #id = ++Renderer.#lastId;
    get id() {
        return this.#id;
    }

    gl;
    #internal = {
        renderer: this,
        gl: undefined,

        setReadTarget: target => this.#setReadTarget(target),
        readBuffer: undefined,
        readBufferActive: false,
        boundReadBufferTexture: undefined,

        setDrawTargets: (colorTargets, depthTarget) => this.#setDrawTargets(colorTargets, depthTarget),
        drawBuffer: undefined,
        drawBufferActive: false,
        activeDrawBufferSlots: [0],
        boundDrawBufferTextures: [],
        boundDrawBufferDepth: undefined,

        activeTextureSlot: undefined,
        freeTextureSlots: undefined,
        boundTextures: [],
        copy: (src, dst, srcCutout, dstCutout) => {
            this.#internal.setReadTarget(src == this ? undefined : src);
            if (dst == this) {
                this.#internal.setDrawTargets();
            } else if (dst?.format?.isDepth) {
                this.#internal.setDrawTargets(undefined, dst);
            } else {
                this.#internal.setDrawTargets([dst].flat(Infinity));
            }
            this.#internal.gl.blitFramebuffer(srcCutout?.left ?? 0, srcCutout?.top ?? 0, srcCutout?.right ?? src.width, srcCutout?.bottom ?? src.height, dstCutout?.left ?? 0, dstCutout?.top ?? 0, dstCutout?.right ?? dst.width, dstCutout?.bottom ?? dst.height, dst?.format?.isDepth ? 0x00000100 : 0x00004000, 0x2600);
        },
        clearTexture: texture => {
            if (texture.format.isDepth) {
                this.#internal.setDrawTargets(undefined, texture);
                this.#internal.gl.depthMask(true);
                this.#internal.gl.clearDepth(0);
                this.#internal.gl.clear(0x00000100);
            } else {
                this.#internal.setDrawTargets([texture]);
                this.#internal.gl.clearColor(0, 0, 0, 0);
                this.#internal.gl.clear(0x00004000);
            }
        },

        activeProgram: undefined,
        setProgram: settings => this.#setProgram(settings),

        vertexArrays: [],
        activeVertexArray: undefined,
        activateVertexArray: settings => this.#activateVertexArray(settings),

        lastDraw: new Renderer.Draw(),
        applySettings: settings => this.#applySettings(settings),

        drawQueue: [],
        microtaskActive: false,
    };
    get internal() {
        return this.#internal;
    }

    get width() {
        return super.width;
    }
    set width(width) {
        if (!isNaN(width) && +width > 0) {
            super.width = +width;
        }
    }

    get height() {
        return super.height;
    }
    set height(height) {
        if (!isNaN(height) && +height > 0) {
            super.height = +height;
        }
    }


    texture(src, format = src?.format || Renderer.TextureFormat.sRGBA, straight = !(src instanceof Renderer.Texture), yDown = !(src instanceof Renderer.Texture)) {
        return new Renderer.Texture(this.#internal, src, format, straight, yDown);
    }
    async asyncTexture(src, format = src?.format || Renderer.TextureFormat.sRGBA, straight = !(src instanceof Renderer.Texture), yDown = !(src instanceof Renderer.Texture)) {
        src = await src;
        if (src instanceof Response) {
            src = await src.blob();
        }
        if (src instanceof Blob || src instanceof SVGImageElement) {
            src = await createImageBitmap(src, {imageOrientation: "flipY"});
        }
        return this.texture(src, format, straight, yDown);
    }

    program(vertexShader, fragmentShader) {
        return new Renderer.Program(this.#internal, vertexShader, fragmentShader);
    }

    discreteInstances(instances) {
        return new Renderer.Instances(this.#internal, Renderer.prepareDiscreteData(instances, false));
    }
    interleavedInstances(types, instances) {
        return new Renderer.Instances(this.#internal, Renderer.prepareInterleavedData(types, instances));
    }

    discreteMesh(vertices, type = Renderer.Mesh.Type.triangles) {
        return new Renderer.Mesh(this.#internal, Renderer.prepareDiscreteData(vertices, true), type);
    }
    interleavedMesh(types, vertices, indices, type = Renderer.Mesh.Type.triangles) {
        return new Renderer.Mesh(this.#internal, Renderer.prepareInterleavedData(types, vertices, indices), type);
    }

    draw(...settings) {
        return new Renderer.Draw(this.#internal, ...settings);
    }


    #setReadTarget(target) {
        if (target) {
            if (!this.#internal.readBufferActive) {
                this.#internal.gl.bindFramebuffer(0x8CA8, this.#internal.readBuffer);
                this.#internal.readBufferActive = true;
            }
            if (this.#internal.boundReadBufferTexture != target) {
                this.#internal.gl.framebufferTexture2D(0x8CA8, target.format.isDepth ? 0x8D00 : 0x8CE0, 0x0DE1, (this.#internal.boundReadBufferTexture = target).glTexture, 0);
            }
        } else if (this.#internal.readBufferActive) {
            this.#internal.gl.bindFramebuffer(0x8CA8, null);
            this.#internal.readBufferActive = false;
        }
    }

    #setDrawTargets(colorTargets, depthTarget) {
        if (colorTargets?.length || depthTarget) {
            if (!this.#internal.drawBufferActive) {
                this.#internal.gl.bindFramebuffer(0x8CA9, this.#internal.drawBuffer);
                this.#internal.drawBufferActive = true;
            }
            if (colorTargets?.length) {
                colorTargets.forEach((target, slot) => {
                    if (target && this.#internal.boundDrawBufferTextures[slot] != target) {
                        this.#internal.gl.framebufferTexture2D(0x8CA9, 0x8CE0 + slot, 0x0DE1, (this.#internal.boundDrawBufferTextures[slot] = target).glTexture, 0);
                    }
                });
                let slots = colorTargets.map((target, slot) => target ? slot : -1);
                if (slots.length != this.#internal.activeDrawBufferSlots.length || slots.some((slot, index) => slot != this.#internal.activeDrawBufferSlots[index])) {
                    this.#internal.gl.drawBuffers((this.#internal.activeDrawBufferSlots = slots).map(slot => slot < 0 ? 0 : 0x8CE0 + slot));
                }
            } else if (depthTarget && depthTarget != this.#internal.boundDrawBufferDepth) {
                this.#internal.gl.framebufferTexture2D(0x8CA9, 0x8D00, 0x0DE1, (this.#internal.boundDrawBufferDepth = depthTarget).glTexture, 0);
            }
        } else {
            if (this.#internal.drawBufferActive) {
                this.#internal.gl.bindFramebuffer(0x8CA9, null);
                this.#internal.drawBufferActive = false;
            }
        }
        this.#internal.gl.viewport(0, 0, (colorTargets?.[0] || depthTarget || this).width, (colorTargets?.[0] || depthTarget || this).height); // TODO Cache the viewport size.
    }

    #setProgram(draw) {
        if (this.#internal.activeProgram != draw.program) {
            this.#internal.activeProgram = draw.program;
            this.#internal.gl.useProgram(draw.program.glProgram);
        }
        let boundTextures = [];
        Object.entries(draw.uniforms).forEach(([name, value]) => {
            if (draw.program.uniforms[name]) {
                if (value instanceof Renderer.Texture) {
                    boundTextures.push(value);
                    let slot = value.bind();
                    if (slot != draw.program.uniforms[name].value) {
                        this.#internal.gl.uniform1i(draw.program.uniforms[name].location, draw.program.uniforms[name].value = slot);
                    }
                } else {
                    let values = [value].flat(Infinity).map(value => isFinite(value) ? value : value instanceof Color ? value.lRgbList(true) : value.list).flat();
                    if (!draw.program.uniforms[name].values || values.length != draw.program.uniforms[name].values.length || values.some((v, i) => v != draw.program.uniforms[name].values[i])) {
                        if (draw.program.uniforms[name].type[0] == "M") {
                            this.#internal.gl[`uniform${draw.program.uniforms[name].type}`](draw.program.uniforms[name].location, false, new Float32Array(draw.program.uniforms[name].values = values));
                        } else {
                            this.#internal.gl[`uniform${draw.program.uniforms[name].type}`](draw.program.uniforms[name].location, ...(draw.program.uniforms[name].values = values));
                        }
                    }
                }
            }
        });
        return boundTextures;
    }

    #activateVertexArray(draw) {
        let vertexArray = this.#internal.vertexArrays.find(vertexArray => vertexArray.program == draw.program && vertexArray.mesh == draw.mesh && vertexArray.instances == draw.instances);
        if (vertexArray) {
            this.#internal.gl.bindVertexArray((this.#internal.activeVertexArray = vertexArray).glVertexArray);
        } else {
            this.#internal.vertexArrays.push(this.#internal.activeVertexArray = {program: draw.program, mesh: draw.mesh, instances: draw.instances, glVertexArray: this.#internal.gl.createVertexArray()});
            this.#internal.gl.bindVertexArray(this.#internal.activeVertexArray.glVertexArray);
            this.#internal.gl.bindBuffer(0x8893, draw.mesh.glIndices);
            for (let which = 0; which < 1 + !!draw.instances; which++) {
                this.#internal.gl.bindBuffer(0x8892, which ? draw.instances.glInstances : draw.mesh.glVertices);
                (which ? draw.instances : draw.mesh).data.attributes.forEach(attribute => {
                    let programAttribute = draw.program.attributes[attribute.name];
                    if (programAttribute) {
                        let start = attribute.start;
                        let location = programAttribute.location;
                        let size = Math.min(attribute.size, programAttribute.locations * 4);
                        while (size > 0) {
                            this.#internal.gl.enableVertexAttribArray(location);
                            this.#internal.gl.vertexAttribPointer(location, Math.min(size, 4), 0x1406, false, (which ? draw.instances : draw.mesh).data.stride * 4, start * 4);
                            if (which) {
                                this.#internal.gl.vertexAttribDivisor(location, 1);
                            }
                            start += Math.min(size, 4);
                            location++;
                            size -= 4;
                        }
                    }
                });
            }
        }
    }

    #applySettings(draw) {
        if (!this.#internal.lastDraw.depthTest || draw.depthTest.gl != this.#internal.lastDraw.depthTest.gl) {
            if (draw.depthTest.gl && !this.#internal.lastDraw.depthTest?.gl) {
                this.gl.enable(0x0B71);
                this.gl.depthFunc(draw.depthTest.gl);
            } else if ((!this.#internal.lastDraw.depthTest || this.#internal.lastDraw.depthTest.gl) && !draw.depthTest.gl) {
                this.gl.disable(0x0B71);
            } else {
                this.gl.depthFunc(draw.depthTest.gl);
            }
        }
        if (this.#internal.lastDraw.depthLeniency == undefined || draw.depthLeniency != this.#internal.lastDraw.depthLeniency) {
            if (draw.polygonOffset && !this.#internal.lastDraw.depthLeniency) {
                this.gl.enable(0x8037);
                this.gl.polygonOffset(0, -draw.depthLeniency);
            } else if (this.#internal.lastDraw.depthLeniency && !draw.depthLeniency) {
                this.gl.disable(0x8037);
            } else {
                this.gl.polygonOffset(0, -draw.depthLeniency);
            }
        }
        if (!this.#internal.lastDraw.culling || draw.culling.gl != this.#internal.lastDraw.culling.gl) {
            if (draw.culling.gl && !this.#internal.lastDraw.culling?.gl) {
                this.gl.enable(0x0B44);
                this.gl.cullFace(draw.culling.gl);
            } else if ((!this.#internal.lastDraw.culling || this.#internal.lastDraw.culling.gl) && !draw.culling.gl) {
                this.gl.disable(0x0B44);
            } else {
                this.gl.cullFace(draw.culling.gl);
            }
        }
        if (!this.#internal.lastDraw.blending || draw.blending.glSource != this.#internal.lastDraw.blending.glSource || draw.blending.glDestination != this.#internal.lastDraw.blending.glDestination) {
            if (draw.blending.glSource != undefined && (!this.#internal.lastDraw.blending || this.#internal.lastDraw.blending.glSource != undefined)) {
                this.gl.enable(0x0BE2);
                this.gl.blendFunc(draw.blending.glSource, draw.blending.glDestination);
            } else if ((!this.#internal.lastDraw.blending || this.#internal.lastDraw.blending.glSource != undefined) && draw.blending.glSource == undefined) {
                this.gl.disable(0x0BE2);
            } else {
                this.gl.blendFunc(draw.blending.glSource, draw.blending.glDestination);
            }
        }
        if (draw.writeDepth != this.#internal.lastDraw.writeDepth) {
            this.gl.depthMask(draw.writeDepth);
        }
    }


    clear() {
        this.#internal.setDrawTargets();
        this.#internal.gl.clearColor(0, 0, 0, 0);
        this.#internal.gl.clear(0x00004000);
    }

    #boxMesh2D;
    get boxMesh2D() {
        if (!this.#boxMesh2D) {
            this.#boxMesh2D = this.discreteMesh({pos: [new Vec2(0, 0), new Vec2(1, 0), new Vec2(0, 1), new Vec2(1, 1)]}, Renderer.Mesh.Type.triangleStrip);
        }
        return this.#boxMesh2D;
    }

    copyTo(dst, srcCutout, dstCutout) {
        this.#internal.copy(this, dst, srcCutout, dstCutout);
        return this;
    }

    #copyProgram;
    drawCopy(src, dst = this, srcCutout = src.box, dstCutout = dst.box, blending = Renderer.Blending.overlay) {
        if (!this.#copyProgram) {
            this.#copyProgram = this.program(`#version 300 es

            in vec2 pos;
            uniform mat3 srcTransform;
            uniform mat3 dstTransform;
            out vec2 uv;

            void main() {
                uv = (srcTransform * vec3(pos, 1)).xy;
                gl_Position = vec4((dstTransform * vec3(pos, 1)).xy, 0, 1);
            }
            `, `#version 300 es
            precision mediump float;

            in vec2 uv;
            uniform sampler2D textureSampler;
            out vec4 color;

            void main() {
                color = texture(textureSampler, uv);
            }
            `);
        }
        return this.draw({
            target: dst,
            program: this.#copyProgram,
            mesh: this.boxMesh2D,
            uniforms: {
                textureSampler: src,
                srcTransform: new Mat3(srcCutout.width / src.width, 0, 0, 0, srcCutout.height / src.height, 0, srcCutout.left / src.width, srcCutout.bottom / src.height, 1),
                dstTransform: new Mat3(dstCutout.width / dst.width * 2, 0, 0, 0, dstCutout.height / dst.height * 2, 0, dstCutout.left / dst.width * 2 - 1, dstCutout.bottom / dst.height * 2 - 1, 1),
            },
            blending,
        });
    }

    #coloredCopyProgram;
    drawColoredCopy(src, dst = this, srcCutout = src.box, dstCutout = dst.box, color = Color.okLab(1), blending = Renderer.Blending.overlay) {
        if (!this.#coloredCopyProgram) {
            this.#coloredCopyProgram = this.program(`#version 300 es

            in vec2 pos;
            uniform mat3 srcTransform;
            uniform mat3 dstTransform;
            out vec2 uv;

            void main() {
                uv = (srcTransform * vec3(pos, 1)).xy;
                gl_Position = vec4((dstTransform * vec3(pos, 1)).xy, 0, 1);
            }
            `, `#version 300 es
            precision mediump float;

            in vec2 uv;
            uniform sampler2D textureSampler;
            uniform vec4 tint;
            out vec4 color;

            void main() {
                color = texture(textureSampler, uv).r * tint;
            }
            `);
        }
        return this.draw({
            target: dst,
            program: this.#coloredCopyProgram,
            mesh: this.boxMesh2D,
            uniforms: {
                textureSampler: src,
                srcTransform: new Mat3(srcCutout.width / src.width, 0, 0, 0, srcCutout.height / src.height, 0, srcCutout.left / src.width, srcCutout.bottom / src.height, 1),
                dstTransform: new Mat3(dstCutout.width / dst.width * 2, 0, 0, 0, dstCutout.height / dst.height * 2, 0, dstCutout.left / dst.width * 2 - 1, dstCutout.bottom / dst.height * 2 - 1, 1),
                tint: color,
            },
            blending,
        });
    }

    #showProgram;
    show(texture) {
        if (!this.#showProgram) {
            this.#showProgram = this.program(`#version 300 es

                in vec2 pos;
                out vec2 uv;

                void main() {
                    uv = pos;
                    gl_Position = vec4(2. * pos - 1., 0, 1);
                }
            `, `#version 300 es
            precision mediump float;

            in vec2 uv;
            uniform sampler2D textureSampler;
            out vec4 color;

            void main() {
                vec4 c = texture(textureSampler, uv);
                color = vec4(mix(12.92 * c.rgb, 1.055 * pow(c.rgb, vec3(1. / 2.4)) - .055, step(.0031308, c.rgb)), c.a);
            }
            `);
        }
        this.draw({
            target: this,
            program: this.#showProgram,
            mesh: this.boxMesh2D,
            uniforms: {
                textureSampler: texture,
            },
        }).exec();
        return texture;
    }
};

Renderer.Texture = class Texture {
    #glTexture;
    get glTexture() {
        return this.#glTexture;
    }

    constructor(internal, src, format = src?.format || Renderer.TextureFormat.sRGBA, straight = !(src instanceof Renderer.Texture), yDown = !(src instanceof Renderer.Texture)) {
        this.#internal = internal;
        this.#glTexture = this.#internal.gl.createTexture();
        this.upload(src, format, straight, yDown);
    }

    upload(src, format = src?.format || Renderer.TextureFormat.sRGBA, straight = !(src instanceof Renderer.Texture), yDown = !(src instanceof Renderer.Texture)) {
        this.#size = new Vec2(src.naturalWidth ?? src.videoWidth ?? src.codedWidth ?? src.width ?? src.x, src.naturalHeight ?? src.videoHeight ?? src.codedHeight ?? src.height ?? src.y);
        this.#format = format;
        this.bind();
        this.unbind();
        this.#internal.gl.pixelStorei(0x9240, yDown);
        this.#internal.gl.pixelStorei(0x9241, straight);
        /*if (this.format.depth) {
            this.#interpolationMin = this.#interpolationMag = Renderer.Interpolation.nearest;
        }*/
        this.#internal.gl.texImage2D(0x0DE1, 0, this.format.glInternal, this.width, this.height, 0, this.format.glExternal, this.format.glType, src instanceof ImageBitmap || src instanceof ImageData || src instanceof HTMLImageElement || src instanceof HTMLCanvasElement || src instanceof HTMLVideoElement || src instanceof OffscreenCanvas || src instanceof VideoFrame ? src : null);
        if (src instanceof Renderer || src instanceof Renderer.Texture) {
            src.copyTo(this);
        } else if (this.format.isDepth) {
            this.clear();
        }
        return this;
    }

    clear(size = this.size) {
        if (this.size.x != size.x || this.size.y != size.y) {
            this.#size = new Vec2(size.width ?? size.x, size.height ?? size.y);
            this.bind();
            this.unbind();
            this.#internal.gl.texImage2D(0x0DE1, 0, this.format.glInternal, this.width, this.height, 0, this.format.glExternal, this.format.glType, null);
            if (this.format.isDepth) {
                this.#internal.clearTexture(this);
            }
        } else {
            this.#internal.clearTexture(this);
        }
        return this;
    }

    #internal;
    get renderer() {
        return this.#internal.renderer;
    }

    #size;
    get size() {
        return this.#size.copy;
    }
    get box() {
        return new Box2(0, this.size.x, 0, this.size.y);
    }
    get width() {
        return this.size.x;
    }
    get height() {
        return this.size.y;
    }

    #format;
    get format() {
        return this.#format;
    }

    #interpolationMin = Renderer.Interpolation.linear;
    #interpolationMag = Renderer.Interpolation.linear;
    #interpolationMinChanged = true;
    #interpolationMagChanged = true;
    interpolation(min, mag) {
        /*if (this.depthTest) {
            return this;
        }*/
        if (min instanceof Renderer.Interpolation && min != this.#interpolationMin) {
            this.#interpolationMin = min;
            this.#interpolationMinChanged = true;
        }
        if ((mag ?? min) instanceof Renderer.Interpolation && (mag ?? min) != this.#interpolationMag) {
            this.#interpolationMag = mag ?? min;
            this.#interpolationMagChanged = true;
        }
        return this;
    }

    #overflowX = Renderer.OverflowBehaviour.repeat;
    #overflowY = Renderer.OverflowBehaviour.repeat;
    #overflowXChanged = true;
    #overflowYChanged = true;
    overflow(x, y) {
        if (x instanceof Renderer.OverflowBehaviour && x != this.#overflowX) {
            this.#overflowX = x;
            this.#overflowXChanged = true;
        }
        if ((y ?? x) instanceof Renderer.OverflowBehaviour && (y ?? x) != this.#overflowY) {
            this.#overflowY = y ?? x;
            this.#overflowYChanged = true;
        }
        return this;
    }

    get settingsChanged() {
        return this.#interpolationMinChanged || this.#interpolationMagChanged || this.#overflowXChanged || this.#overflowYChanged;
    }
    updateSettings() {
        if (this.#interpolationMinChanged) {
            this.#internal.gl.texParameteri(0x0DE1, 0x2801, this.#interpolationMin.gl);
        }
        if (this.#interpolationMagChanged) {
            this.#internal.gl.texParameteri(0x0DE1, 0x2800, this.#interpolationMag.gl);
        }
        if (this.#overflowXChanged) {
            this.#internal.gl.texParameteri(0x0DE1, 0x2802, this.#overflowX.gl);
        }
        if (this.#overflowYChanged) {
            this.#internal.gl.texParameteri(0x0DE1, 0x2803, this.#overflowY.gl);
        }
    }

    copyTo(dst, srcCutout, dstCutout) {
        this.#internal.copy(this, dst, srcCutout, dstCutout);
        return this;
    }

    // TODO Move bind and unbind into the Renderer?
    bind() {
        let slot = this.#internal.boundTextures.indexOf(this);
        if (slot < 0) {
            this.#internal.boundTextures[slot = this.#internal.freeTextureSlots.values().next().value] = this;
            this.#internal.gl.activeTexture(0x84C0 + (this.#internal.activeTextureSlot = slot));
            this.#internal.gl.bindTexture(0x0DE1, this.glTexture);
        }
        if (this.settingsChanged) {
            if (slot != this.#internal.activeTextureSlot) {
                this.#internal.gl.activeTexture(0x84C0 + (this.#internal.activeTextureSlot = slot));
            }
            this.updateSettings();
        }
        this.#internal.freeTextureSlots.delete(slot);
        return slot;
    }
    unbind() {
        if (this.#internal.boundTextures.includes(this)) {
            this.#internal.freeTextureSlots.add(this.#internal.boundTextures.indexOf(this));
        }
    }

    delete() {
        this.#internal.gl.deleteTexture(this.#glTexture);
        this.unbind();
    }
};

Renderer.TextureFormat = class TextureFormat {
    static R = new TextureFormat("R", ["r"], 8, 0x8229, 0x1903, 0x1401);
    static RG = new TextureFormat("RG", ["r", "g"], 8, 0x822B, 0x8227, 0x1401);
    static RGB = new TextureFormat("RGB", ["r", "g", "b"], 8, 0x8051, 0x1907, 0x1401);
    static RGBA = new TextureFormat("RGBA", ["r", "g", "b", "a"], 8, 0x8058, 0x1908, 0x1401);

    static sRGB = new TextureFormat("sRGB", ["r", "g", "b"], 8, 0x8C41, 0x1907, 0x1401);
    static sRGBA = new TextureFormat("sRGBA", ["r", "g", "b", "a"], 8, 0x8C43, 0x1908, 0x1401);

    static depthInt = new TextureFormat("Depth int", ["d"], 24, 0x81A6, 0x1902, 0x1405);
    static depthFloat = new TextureFormat("Depth float", ["d"], 32, 0x8CAC, 0x1902, 0x1406);

    static vec1 = new TextureFormat("Vec 1", ["x"], 32, 0x822E, 0x1903, 0x1406);
    static vec2 = new TextureFormat("Vec 2", ["x", "y"], 32, 0x8230, 0x8227, 0x1406);
    static vec3 = new TextureFormat("Vec 3", ["x", "y", "z"], 32, 0x8815, 0x1907, 0x1406);
    static vec4 = new TextureFormat("Vec 4", ["x", "y", "z", "w"], 32, 0x8814, 0x1908, 0x1406);

    constructor(name, channels, channelBits, glInternal, glExternal, glType) {
        this.#name = name;
        this.#channels = channels;
        this.#channelBits = channelBits;
        this.#glInternal = glInternal;
        this.#glExternal = glExternal;
        this.#glType = glType;
    }

    #name;
    get name() {
        return this.#name;
    }

    #channels;
    #channelBits;
    get channels() {
        return Array.from(this.#channels);
    }
    get channelBits() {
        return this.#channelBits;
    }
    get totalBits() {
        return this.#channels.length * this.#channelBits;
    }

    #isData;
    get isData() {
        return this.#isData ??= !this.isColor && !this.isDepth;
    }

    #isColor;
    get isColor() {
        return this.#isColor ??= this.#channels.includes("r") || this.#channels.includes("g") || this.#channels.includes("b") || this.#channels.includes("a");
    }

    #hasAlpha;
    get hasAlpha() {
        return this.#hasAlpha ??= this.#channels.includes("a");
    }

    #isDepth;
    get isDepth() {
        return this.#isDepth ??= this.#channels.includes("d");
    }

    #glInternal;
    get glInternal() {
        return this.#glInternal;
    }

    #glExternal;
    get glExternal() {
        return this.#glExternal;
    }

    #glType;
    get glType() {
        return this.#glType;
    }
};

Renderer.Interpolation = class Interpolation {
    static nearest = new Interpolation("Nearest", 0x2600);
    static linear = new Interpolation("Linear", 0x2601);

    constructor(name, gl) {
        this.#name = name;
        this.#gl = gl;
    }

    #name;
    get name() {
        return this.#name;
    }

    #gl;
    get gl() {
        return this.#gl;
    }
};

Renderer.OverflowBehaviour = class OverflowBehaviour {
    static clamp = new OverflowBehaviour("Clamp", 0x812F);
    static repeat = new OverflowBehaviour("Repeat", 0x2901);
    static mirror = new OverflowBehaviour("Mirror", 0x8370);

    constructor(name, gl) {
        this.#name = name;
        this.#gl = gl;
    }

    #name;
    get name() {
        return this.#name;
    }

    #gl;
    get gl() {
        return this.#gl;
    }
};

Renderer.Program = class Program {
    static #compileShader = (gl, type, source) => {
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, 0x8B81)) {
            throw new Error(gl.getShaderInfoLog(shader));
        }
        return shader;
    };

    #glProgram;
    get glProgram() {
        return this.#glProgram;
    }

    constructor(internal, vertexShader, fragmentShader) {
        this.#internal = internal;
        this.#glProgram = this.#internal.gl.createProgram();
        this.#internal.gl.attachShader(this.#glProgram, Program.#compileShader(internal.gl, 0x8B31, vertexShader));
        this.#internal.gl.attachShader(this.#glProgram, Program.#compileShader(internal.gl, 0x8B30, fragmentShader));
        this.#internal.gl.linkProgram(this.#glProgram);
        if (!this.#internal.gl.getProgramParameter(this.#glProgram, 0x8B82)) {
            throw new Error(this.#internal.gl.getProgramInfoLog(this.#glProgram));
        }
        let uniformCount = this.#internal.gl.getProgramParameter(this.#glProgram, 0x8B86);
        for (let i = 0; i < uniformCount; i++) {
            let info = this.#internal.gl.getActiveUniform(this.#glProgram, i);
            if (Renderer.glDataTypes[info.type]) {
                this.#uniforms[info.name] = {type: Renderer.glDataTypes[info.type], location: this.#internal.gl.getUniformLocation(this.#glProgram, info.name)};
            }
        }
        let attributeCount = this.#internal.gl.getProgramParameter(this.#glProgram, 0x8B89);
        for (let i = 0; i < attributeCount; i++) {
            let info = this.#internal.gl.getActiveAttrib(this.#glProgram, i);
            if (Renderer.glDataTypes[info.type]) {
                this.#attributes[info.name] = {type: Renderer.glDataTypes[info.type], location: this.#internal.gl.getAttribLocation(this.#glProgram, info.name), locations: [0x8B5A, 0x8B65, 0x8B66].includes(info.type) ? 2 : [0x8B5B, 0x8B67, 0x8B68].includes(info.type) ? 3 : [0x8B5C, 0x8B69, 0x8B6A].includes(info.type) ? 4 : 1};
            }
        }
        Array.from(fragmentShader.replace(/\/\/.*|\/\*[\s\S]*?\*\//gu, " ").matchAll(/\bout\s+(?:lowp|mediump|highp)?\s*\w+\s+([\w\s,]+)/g)).forEach(targets => Array.from(targets[1].matchAll(/\w+/g)).forEach(target => {
            let location = this.#internal.gl.getFragDataLocation(this.#glProgram, target[0]);
            if (location > -1) {
                this.#targets[location] = target[0];
            }
        }));
        return this;
    }

    #internal;
    get renderer() {
        return this.#internal.renderer;
    }

    #uniforms = Object.create(null);
    get uniforms() {
        return this.#uniforms;
    }

    #attributes = Object.create(null);
    get attributes() {
        return this.#attributes;
    }

    #targets = [];
    get targets() {
        return this.#targets;
    }

    delete() {
        this.#internal.gl.deleteProgram(this.#glProgram);
        this.#internal.vertexArrays = this.#internal.vertexArrays.filter(vertexArray => {
            if (vertexArray.program != this) {
                return true;
            }
            this.#internal.gl.deleteVertexArray(vertexArray.glVertexArray);
        });
    }
};

Renderer.Instances = class Instances {
    constructor(internal, data) {
        this.#internal = internal;
        this.#data = data;
        this.#data.count = this.#data.indices.length;
        if (this.#internal.activeVertexArray) {
            this.#internal.gl.bindVertexArray(null);
            this.#internal.activeVertexArray = undefined;
        }
        this.#internal.gl.bindBuffer(0x8892, this.#glInstances = this.#internal.gl.createBuffer());
        this.#internal.gl.bufferData(0x8892, new Float32Array(this.#data.interleaved), 0x88E4);
        delete this.#data.interleaved;
    }

    #internal;
    get renderer() {
        return this.#internal.renderer;
    }

    #data;
    get data() {
        return this.#data;
    }

    #glInstances;
    get glInstances() {
        return this.#glInstances;
    }

    delete() {
        this.#internal.gl.deleteBuffer(this.#glInstances);
        this.#internal.vertexArrays = this.#internal.vertexArrays.filter(vertexArray => {
            if (vertexArray.instances != this) {
                return true;
            }
            this.#internal.gl.deleteVertexArray(vertexArray.glVertexArray);
        });
    }
};

Renderer.Mesh = class Mesh {
    static Type = class Type {
        static triangles = new Type("Triangles", 0x0004, indices => indices);
        static triangleStrip = new Type("Triangle strip", 0x0005, indices => indices);
        static triangleFan = new Type("Triangle fan", 0x0006, indices => indices);

        static triangleWireframe = new Type("Triangle wireframe", 0x0001, indices => {
            let edges = new Set();
            let add = (a, b) => a != b && edges.add(a < b ? `${a},${b}` : `${b},${a}`);
            for (let i = 0; i < indices.length; i += 3) {
                add(indices[i], indices[i + 1]);
                add(indices[i + 1], indices[i + 2]);
                add(indices[i + 2], indices[i]);
            }
            return [...edges].join().split(",").map(index => +index);
        });
        static triangleStripWireframe = new Type("Triangle strip wireframe", 0x0001, indices => {
            let edges = new Set();
            let add = (a, b) => a != b && edges.add(a < b ? `${a},${b}` : `${b},${a}`);
            for (let i = 0; i < indices.length - 2; i++) {
                add(indices[i], indices[i + 1]);
                add(indices[i + 1], indices[i + 2]);
                add(indices[i + 2], indices[i]);
            }
            return [...edges].join().split(",").map(index => +index);
        });
        static triangleFanWireframe = new Type("Triangle fan wireframe", 0x0001, indices => {
            let edges = new Set();
            let add = (a, b) => a != b && edges.add(a < b ? `${a},${b}` : `${b},${a}`);
            for (let i = 1; i < indices.length - 1; i++) {
                add(indices[0], indices[i]);
                add(indices[i], indices[i + 1]);
                add(indices[i + 1], indices[0]);
            }
            return [...edges].join().split(",").map(index => +index);
        });

        static lines = new Type("Lines", 0x0001, indices => indices);
        static lineStrip = new Type("Line strip", 0x0003, indices => indices);
        static lineLoop = new Type("Line loop", 0x0002, indices => indices);

        constructor(name, gl, converter) {
            this.#name = name;
            this.#gl = gl;
            this.#converter = converter;
        }

        #name;
        get name() {
            return this.#name;
        }

        #gl;
        get gl() {
            return this.#gl;
        }

        #converter;
        convert(indices) {
            return this.#converter(indices);
        }
    };

    constructor(internal, data, type = Mesh.Type.triangles) {
        this.#internal = internal;
        this.#data = data;
        this.#data.indices = (this.#type = type).convert(this.#data.indices);
        this.#data.count = this.#data.indices.length;
        if (this.#internal.activeVertexArray) {
            this.#internal.gl.bindVertexArray(null);
            this.#internal.activeVertexArray = undefined;
        }
        this.#internal.gl.bindBuffer(0x8892, this.#glVertices = this.#internal.gl.createBuffer());
        this.#internal.gl.bufferData(0x8892, new Float32Array(this.#data.interleaved), 0x88E4);
        this.#internal.gl.bindBuffer(0x8893, this.#glIndices = this.#internal.gl.createBuffer());
        this.#internal.gl.bufferData(0x8893, new Uint32Array(this.#data.indices), 0x88E4);
        delete this.#data.interleaved;
        delete this.#data.indices;
    }

    #internal;
    get renderer() {
        return this.#internal.renderer;
    }

    #type;
    get type() {
        return this.#type;
    }

    #data;
    get data() {
        return this.#data;
    }

    #glVertices;
    get glVertices() {
        return this.#glVertices;
    }

    #glIndices;
    get glIndices() {
        return this.#glIndices;
    }

    delete() {
        this.#internal.gl.deleteBuffer(this.#glVertices);
        this.#internal.gl.deleteBuffer(this.#glIndices);
        this.#internal.vertexArrays = this.#internal.vertexArrays.filter(vertexArray => {
            if (vertexArray.mesh != this) {
                return true;
            }
            this.#internal.gl.deleteVertexArray(vertexArray.glVertexArray);
        });
    }
};

Renderer.Draw = class Draw {
    constructor(internal, ...draws) {
        this.#internal = internal;
        this.set(...draws);
    }

    #internal;
    get renderer() {
        return this.#internal.renderer;
    }

    #targets = Object.create(null);
    get targets() {
        return this.#targets;
    }
    set targets(targets) {
        if (targets == undefined) {
            this.#targets = Object.create(null);
        } else if (targets instanceof Object) {
            this.#targets = targets;
        }
    }
    get target() {
        return this.#targets[""];
    }
    set target(target) {
        if (target) {
            this.#targets[""] = target;
        } else {
            delete this.#targets[""];
        }
    }

    #program = undefined;
    get program() {
        return this.#program;
    }
    set program(program) {
        if (program == undefined || program instanceof Renderer.Program) {
            this.#program = program ?? undefined;
        }
    }

    #instances = undefined;
    get instances() {
        return this.#instances;
    }
    set instances(instances) {
        if (instances == undefined || instances instanceof Renderer.Instances) {
            this.#instances = instances ?? undefined;
        }
    }

    #mesh = undefined;
    get mesh() {
        return this.#mesh;
    }
    set mesh(mesh) {
        if (mesh == undefined || mesh instanceof Renderer.Mesh) {
            this.#mesh = mesh ?? undefined;
        }
    }

    #uniforms = Object.create(null);
    get uniforms() {
        return this.#uniforms;
    }
    set uniforms(uniforms) {
        if (uniforms == undefined) {
            this.#uniforms = Object.create(null);
        } else if (uniforms instanceof Object) {
            this.#uniforms = uniforms;
        }
    }

    #depthTexture = undefined;
    get depthTexture() {
        return this.#depthTexture;
    }
    set depthTexture(depthTexture) {
        this.#depthTexture = depthTexture;
    }

    #depthTest = undefined;
    get depthTest() {
        return this.#depthTest;
    }
    set depthTest(depthTest) {
        if (depthTest == undefined || depthTest instanceof Renderer.DepthTest) {
            this.#depthTest = depthTest ?? undefined;
        }
    }

    #depthLeniency = undefined;
    get depthLeniency() {
        return this.#depthLeniency;
    }
    set depthLeniency(depthLeniency) {
        if (depthLeniency == undefined || isFinite(depthLeniency)) {
            this.#depthLeniency = depthLeniency ?? undefined;
        }
    }

    #writeDepth = undefined;
    get writeDepth() {
        return this.#writeDepth;
    }
    set writeDepth(writeDepth) {
        this.#writeDepth = writeDepth == undefined ? undefined : !!writeDepth;
    }

    #culling = undefined;
    get culling() {
        return this.#culling;
    }
    set culling(culling) {
        if (culling == undefined || culling instanceof Renderer.Culling) {
            this.#culling = culling ?? undefined;
        }
    }

    #blending = undefined;
    get blending() {
        return this.#blending;
    }
    set blending(blending) {
        if (blending == undefined || blending instanceof Renderer.Blending) {
            this.#blending = blending ?? undefined;
        }
    }

    // TODO colorMask: Which channels to draw.
    // TODO scissors: Box to crop drawing to.
    // TODO viewport: Box to resize drawing to.

    get copy() {
        return new Draw(this.#internal, this);
    }

    set(...draws) {
        draws.forEach(draw => {
            if (draw instanceof Object) {
                Object.assign(this.targets, draw.targets);
                Object.assign(this.uniforms, draw.uniforms);
                for (let setting of ["target", "program", "instances", "mesh", "depthTexture", "depthTest", "depthLeniency", "writeDepth", "culling", "blending"]) {
                    if (draw[setting] != undefined) {
                        this[setting] = draw[setting];
                    }
                }
            }
        });
        return this;
    }

    exec() {
        let draw = new Draw(this.#internal, {
            depthTest: Renderer.DepthTest.closer,
            depthLeniency: 0,
            writeDepth: true,
            culling: Renderer.Culling.showAll,
            blending: Renderer.Blending.overwrite,
        }, this);
        if (!draw.depthTexture) {
            draw.depthTest = Renderer.DepthTest.always;
            draw.writeDepth = false;
        }
        if (draw.targets[""] instanceof Renderer || !Object.keys(draw.targets).length && !draw.depthTexture) {
            this.#internal.setDrawTargets();
        } else {
            let targets = Array.from(draw.program.targets.map(target => draw.targets[target]));
            if (draw.targets[""]) {
                targets[draw.program.targets.findIndex((_, index) => !targets[index])] = draw.targets[""];
            }
            this.#internal.setDrawTargets(targets, draw.depthTexture);
        }
        let boundTextures = this.#internal.setProgram(draw);
        this.#internal.activateVertexArray(draw);
        this.#internal.applySettings(draw);
        if (draw.instances) {
            this.#internal.gl.drawElementsInstanced(draw.mesh.type.gl, draw.mesh.data.count, 0x1405, 0, draw.instances.data.count);
        } else {
            this.#internal.gl.drawElements(draw.mesh.type.gl, draw.mesh.data.count, 0x1405, 0);
        }
        boundTextures.forEach(texture => texture.unbind());
    }

    queue() {
        let resolve;
        let promise = new Promise(r => resolve = r);
        this.#internal.drawQueue.push({settings: this.copy, resolve});
        if (!this.#internal.microtaskActive) {
            this.#internal.microtaskActive = true;
            queueMicrotask(() => {
                while (this.#internal.drawQueue.length) {
                    let best = 0;
                    let bestCost = Infinity;
                    this.#internal.drawQueue.forEach((draw, i) => {
                        let cost = 4 * (draw.settings.target != this.#internal.drawTarget) + 2 * (draw.settings.program != this.#internal.activeProgram) + (draw.settings.program != this.#internal.activeVertexArray?.program || draw.settings.mesh != this.#internal.activeVertexArray?.mesh || draw.settings.instances != this.#internal.activeVertexArray?.instances);
                        if (cost < bestCost) {
                            best = i;
                            bestCost = cost;
                        }
                    });
                    let draw = this.#internal.drawQueue.splice(best, 1)[0];
                    draw.settings.exec();
                    draw.resolve();
                }
                this.#internal.microtaskActive = false;
            });
        }
        return promise;
    }
};

Renderer.DepthTest = class DepthTest {
    static always = new DepthTest("Always", 0x0207);
    static closer = new DepthTest("Closer", 0x0206);
    static strictlyCloser = new DepthTest("Strictly closer", 0x0204);
    static further = new DepthTest("Further", 0x0203);
    static strictlyFurther = new DepthTest("Strictly further", 0x0201);
    static same = new DepthTest("Same", 0x0202);
    static different = new DepthTest("Different", 0x0205);

    constructor(name, gl) {
        this.#name = name;
        this.#gl = gl;
    }

    #name;
    get name() {
        return this.#name;
    }

    #gl;
    get gl() {
        return this.#gl;
    }
};

Renderer.Culling = class Culling {
    static showAll = new Culling("Show all");
    static hideFront = new Culling("Hide front", 0x0404);
    static hideBack = new Culling("Hide back", 0x0405);

    constructor(name, gl) {
        this.#name = name;
        this.#gl = gl;
    }

    #name;
    get name() {
        return this.#name;
    }

    #gl;
    get gl() {
        return this.#gl;
    }
};

Renderer.Blending = class Blending {
    static overwrite = new Blending("Overwrite");
    static overlay = new Blending("Overlay", 1, 0x0303);
    static add = new Blending("Add", 1, 1);

    constructor(name, glSource, glDestination) {
        this.#name = name;
        this.#glSource = glSource;
        this.#glDestination = glDestination
    }

    #name;
    get name() {
        return this.#name;
    }

    #glSource;
    get glSource() {
        return this.#glSource;
    }

    #glDestination;
    get glDestination() {
        return this.#glDestination;
    }
};
