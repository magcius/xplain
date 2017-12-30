// Implements an X compositing manager to show off how the COMPOSITE extension
// works, along with how redirection works. This implements both an X11-based
// renderer along with a WebGL-based one.

(function(exports) {
    "use strict";

    var CompositingManager = {};

    class RendererBase {
        constructor(triggerRedraw) {
            this._triggerRedraw = triggerRedraw;
            this._triggeredRedraw = false;

            // Maps XID to WindowActor
            this._windows = {};

            // A list of actors to draw in order, with the bottom-most actor
            // being first in the array.
            this._actorStacking = [];

            this._dirtyRegion = new Region();
            this._dirtyRegion.union_rect(this._dirtyRegion, 0, 0, 65535, 65535);
        }

        $addWindow(windowId, actor) {
            this._windows[windowId] = actor;
            this._actorStacking.push(actor);
        }

        $removeWindow(windowId) {
            this._windows[windowId] = null;
            this._actorStacking.splice(this._actorStacking.indexOf(actor), 1);
        }

        $stackWindow(actor, mode, siblingId) {
            this._actorStacking.splice(this._actorStacking.indexOf(actor), 1);

            var sibling = this._windows[siblingId];

            var siblingIdx;
            if (sibling)
                siblingIdx = this._actorStacking.indexOf(sibling);
            else
                siblingIdx = -1;

            switch (mode) {
            case "Above":
                if (siblingIdx > -1)
                    this._actorStacking.splice(siblingIdx, 0, actor);
                else
                    this._actorStacking.push(actor);
                break;
            case "Below":
                if (siblingIdx > -1)
                    this._actorStacking.splice(siblingIdx - 1, 0, actor);
                else
                    this._actorStacking.unshift(actor);
                break;
                // TODO: TopIf, BottomIf, Opposite. Ever seen in practice?
            }
        }

        addDirtyRect(rect) {
            this._dirtyRegion.union_rect(this._dirtyRegion, rect.x, rect.y, rect.width, rect.height);
        }

        queueRedraw(rect) {
            this.addDirtyRect(rect);
            if (!this._triggeredRedraw) {
                this._triggerRedraw();
                this._triggeredRedraw = true;
            }
        }
    }

    class WindowActorBase {
        constructor(renderer, server, windowId) {
            this._renderer = renderer;

            var connection = server.connect();
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));
            this._display = connection.display;

            this._windowId = windowId;
            this._display.selectInput({ windowId: this._windowId,
                                        events: ["StructureNotify", "SubstructureNotify", "Damage"] });

            this._geometry = this._display.getGeometry({ drawableId: this._windowId });

            this._renderer.$addWindow(this._windowId, this);
            this._renderer.queueRedraw(this._geometry);
        }

        _destroy() {
            this._display.disconnect();

            this._renderer.$removeWindow(this._windowId);
            this._renderer.queueRedraw(this._geometry);
            this._renderer = null;
        }

        _setNewGeometry(newGeometry) {
            if (newGeometry.x !== undefined)
                this._geometry.x = newGeometry.x;
            if (newGeometry.y !== undefined)
                this._geometry.y = newGeometry.y;
            if (newGeometry.width !== undefined)
                this._geometry.width = newGeometry.width;
            if (newGeometry.height !== undefined)
                this._geometry.height = newGeometry.height;
        }

        _configureNotify(event) {
            // Redraw where the window was
            this._renderer.queueRedraw(this._geometry);

            this._setNewGeometry(event);

            // Redraw where the window is
            this._renderer.queueRedraw(this._geometry);

            if (event.stackMode)
                this._renderer.$stackWindow(this._windowId, event.stackMode, event.sibling);
        }

        _damaged() {
            this._renderer.queueRedraw(this._geometry);
        }

        _handleEvent(event) {
            if (event.windowId != this._windowId)
                return;

            switch (event.type) {
            case "Damage":
                return this._damaged();
            case "ConfigureNotify":
                return this._configureNotify(event);
            case "UnmapNotify":
                return this._destroy();
            }
        }
    }

    class CompositingManagerBase {
        constructor(server, toplevelWindowId) {
            this._server = server;

            var connection = server.connect();
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));
            this._display = connection.display;

            this._toplevelWindowId = toplevelWindowId;
            this._display.selectInput({ windowId: toplevelWindowId,
                                        events: ["SubstructureNotify"] });
        }

        _redirectChildren() {
            var query = this._display.queryTree({ windowId: this._toplevelWindowId });
            query.children.forEach(this._addWindow.bind(this));
        }

        _addWindow(windowId) {
            var attrs = this._display.getAttributes({ windowId: windowId });
            if (attrs.mapState != "Viewable")
                return;

            this._display.redirectWindow({ windowId: windowId, mode: "manual" });
            var actor = this._createWindowActor(windowId);
        }

        _mapNotify(event) {
            var windowId = event.windowId;
            this._addWindow(windowId);
        }

        _handleEvent(event) {
            switch (event.type) {
            case "MapNotify":
                return this._mapNotify(event);
            }
        }
    }

    class Canvas2DRenderer extends RendererBase {
        draw(ctx) {
            if (this._triggeredRedraw) {
                CanvasUtil.pathFromRegion(ctx, this._dirtyRegion);
                ctx.clip();
                ctx.beginPath();
            }

            this._actorStacking.forEach(function(actor) {
                actor.draw(ctx);
            });

            this._dirtyRegion.clear();
            this._triggeredRedraw = false;
        }
    }

    class Canvas2DWindowActor extends WindowActorBase {
        draw(ctx) {
            var pixmapId = this._display.nameWindowPixmap({ windowId: this._windowId });
            var image = this._display.getPixmapImage({ pixmapId: pixmapId });
            ctx.save();
            ctx.translate(this._geometry.x, this._geometry.y);

            var opacity = this._display.getProperty({ windowId: this._windowId, name: 'OPACITY' });
            if (opacity === undefined)
                opacity = 1.0;

            ctx.globalAlpha = opacity;

            ctx.drawImage(image, 0, 0);
            ctx.restore();
            this._display.freePixmap({ drawableId: pixmapId });
        }
    }

    CompositingManager.Canvas2DCompositingManager = class Canvas2DCompositingManager extends CompositingManagerBase {
        constructor(server, toplevelWindowId) {
            super(server, toplevelWindowId);

            this._renderer = new Canvas2DRenderer(this._triggerRedraw.bind(this));

            this._display.selectInput({ windowId: toplevelWindowId,
                                        events: ["Expose"] });
            this._draw();

            this._redirectChildren();
        }

        _triggerRedraw() {
            this._display.invalidateWindow({ windowId: this._toplevelWindowId,
                                             includeChildren: true });
        }

        _createWindowActor(windowId) {
            return new Canvas2DWindowActor(this._renderer, this._server, windowId);
        }

        _draw() {
            this._display.drawTo(this._toplevelWindowId, function(ctx) {
                this._renderer.draw(ctx);
            }.bind(this));
        }

        _handleEvent(event) {
            switch (event.type) {
            case "Expose":
                this._renderer.addDirtyRect(event);
                if (event.count == 0)
                    this._draw();
                break;
            default:
                return super._handleEvent(event);
            }
        }
    };

    class GLRenderer extends RendererBase {
        constructor(needsRedrawFunc, gl) {
            super(needsRedrawFunc);
            this._gl = gl;
        }

        draw(dt) {
            var gl = this._gl;

            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
                                 gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            this._actorStacking.forEach(function(actor) {
                actor.draw(dt);
            });
            gl.disable(gl.BLEND);

            // It's too difficult to actually clip rendering to the updated
            // region, and WebGL requires a flag for it regardless, so we don't
            // bother using the dirty region in the GL renderer.
            this._dirtyRegion.clear();
            this._triggeredRedraw = false;
        }
    }

    function matIdentity(mat) {
        mat[0] = 1;
        mat[5] = 1;
        mat[10] = 1;
        mat[15] = 1;
    }

    function matOrtho2D(mat, width, height) {
        matIdentity(mat);

        // Set the scale so that pixels line up.
        mat[0] =  2 * (1 / width);
        mat[5] = -2 * (1 / height);

        // Adjust translation so coords are from 0..width / 0..height.
        mat[12] = -1;
        mat[13] = 1;
    }

    CompositingManager.TriangleActor = class TriangleActor {
        constructor(renderer, gl) {
            this._renderer = renderer;
            this._gl = gl;
            this._time = 0;
            this._allocate();
        }

        _getVertShaderSource() {
            return `
attribute vec2 a_position;
attribute vec3 a_color;

varying vec3 v_color;

uniform mat4 u_modelview;

void main() {
    v_color = a_color;
    gl_Position = u_modelview * vec4(a_position, 0.0, 1.0);
}`;
        }

        _getFragShaderSource() {
            return `
precision mediump float;

varying vec3 v_color;

void main() {
    gl_FragColor = vec4(v_color, 1.0);
}`;
        }

        _allocate() {
            var gl = this._gl;

            this._vertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(this._vertShader, this._getVertShaderSource());
            gl.compileShader(this._vertShader);
            if (!gl.getShaderParameter(this._vertShader, gl.COMPILE_STATUS))
                throw gl.getShaderInfoLog(this._vertShader);

            this._fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(this._fragShader, this._getFragShaderSource());
            gl.compileShader(this._fragShader);
            if (!gl.getShaderParameter(this._fragShader, gl.COMPILE_STATUS))
                throw gl.getShaderInfoLog(this._fragShader);

            this._shaderProgram = gl.createProgram();
            gl.attachShader(this._shaderProgram, this._vertShader);
            gl.attachShader(this._shaderProgram, this._fragShader);
            gl.linkProgram(this._shaderProgram);
        }

        draw(dt) {
            var gl = this._gl;

            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            var triVerts = new Float32Array([
                -0.2, -0.5, 1, 0, 0,
                 0.2, -0.5, 0, 1, 0,
                   0,  0.5, 0, 0, 1,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, triVerts, gl.STATIC_DRAW);

            gl.useProgram(this._shaderProgram);

            var mv = new Float32Array(16);
            matIdentity(mv);

            var angle = ((this._time += dt) / 100) * Math.PI;
            mv[0] = Math.cos(angle);
            mv[12] = -0.15;
            mv[13] = 0.15;

            var modelviewUniform = gl.getUniformLocation(this._shaderProgram, "u_modelview");
            gl.uniformMatrix4fv(modelviewUniform, false, mv);

            var posAttribute = gl.getAttribLocation(this._shaderProgram, "a_position");
            gl.enableVertexAttribArray(posAttribute);
            gl.vertexAttribPointer(posAttribute, 2, gl.FLOAT, false, 5 * 4, 0);

            var colorAttribute = gl.getAttribLocation(this._shaderProgram, "a_color");
            gl.enableVertexAttribArray(colorAttribute);
            gl.vertexAttribPointer(colorAttribute, 3, gl.FLOAT, false, 5 * 4, 2 * 4);

            gl.drawArrays(gl.TRIANGLES, 0, 3);

            gl.bindTexture(gl.TEXTURE_2D, null);

            gl.useProgram(null);
        }
    }

    function clampAbs(v, cap) {
        if (v > cap)
            v = cap;
        if (v < -cap)
            v = -cap;
        return v;
    }

    class GLWindowActor extends WindowActorBase {
        constructor(renderer, server, windowId, gl) {
            super(renderer, server, windowId);
            this._gl = gl;
            this._allocate();

            this._bend = 0;
        }

        _setNewGeometry(geometry) {
            const oldX = this._geometry.x;
            super._setNewGeometry(geometry);
            const newX = this._geometry.x;
            this._bend -= newX - oldX;
            this._allocatePixmap();
        }

        _stepBend(dt) {
            var DAMPEN = 0.9;
            this._bend *= Math.pow(DAMPEN, dt);
            if (Math.abs(this._bend) < 1)
                this._bend = 0;

            // Cap the bend to a 25px shift.
            var BEND_CAP = 25;
            this._bend = clampAbs(this._bend, BEND_CAP);
            return this._bend;
        }

        _getVertShaderSource() {
            return `
attribute vec2 a_position;
attribute vec2 a_uv;

varying vec2 v_uv;

uniform mat4 u_projection;

void main() {
    v_uv = a_uv;
    gl_Position = u_projection * vec4(a_position, 0.0, 1.0);
}`;
        }

        _getFragShaderSource() {
            return `
precision mediump float;

varying vec2 v_uv;

uniform sampler2D u_texture;
uniform float u_opacity;
uniform int u_tex_width;
uniform int u_bend_x;

void main() {
    float bend_x_coord = (float(u_bend_x) / float(u_tex_width));
    vec2 bent_uv = v_uv;
    float interp = ((1.0 - cos(bent_uv.y)) * 3.1415926) / 2.0;
    bent_uv.x -= (interp * float(bend_x_coord));
    vec4 sample = texture2D(u_texture, bent_uv);
    sample.a *= u_opacity;
    gl_FragColor = sample;
}`;
        }

        _allocate() {
            const gl = this._gl;

            this._vertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(this._vertShader, this._getVertShaderSource());
            gl.compileShader(this._vertShader);

            this._fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(this._fragShader, this._getFragShaderSource());
            gl.compileShader(this._fragShader);

            this._shaderProgram = gl.createProgram();
            gl.attachShader(this._shaderProgram, this._vertShader);
            gl.attachShader(this._shaderProgram, this._fragShader);
            gl.linkProgram(this._shaderProgram);

            this._allocatePixmap();
        }

        _allocatePixmap() {
            const gl = this._gl;

            // You can't really resize textures in GL, need to create a new one...
            if (this._texture)
                gl.deleteTexture(this._texture);

            this._texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

            // Add some blank pixels around the GL pixmap to prevent sampling issues.
            const pixWidth = this._geometry.width + 2, pixHeight = this._geometry.height + 2;
            const pixels = new Uint8Array(pixWidth * pixHeight * 4);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, pixWidth, pixHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
            this._imageDirty = true;
        }

        _destroy() {
            var gl = this._gl;

            gl.deleteTexture(this._texture);
            this._texture = null;

            gl.deleteProgram(this._shaderProgram);
            this._shaderProgram = null;

            gl.deleteShader(this._vertShader);
            this._vertShader = null;

            gl.deleteShader(this._fragShader);
            this._fragShader = null;
        }

        _damaged() {
            this._imageDirty = true;
            super._damaged();
        }

        draw(dt) {
            var gl = this._gl;

            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            if (this._imageDirty) {
                var pixmapId = this._display.nameWindowPixmap({ windowId: this._windowId });
                var image = this._display.getPixmapImage({ pixmapId: pixmapId });
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, image);
                this._imageDirty = false;
            }

            var x1 = this._geometry.x;
            var x2 = x1 + this._geometry.width;
            var y1 = this._geometry.y;
            var y2 = y1 + this._geometry.height;

            var x1upoffs = 1;
            var x2upoffs = x1upoffs + this._geometry.width;

            var bend = this._stepBend(dt);

            if (bend > 0) {
                x2 += bend;
                x2upoffs += bend;
            } else {
                x1 += bend;
                x1upoffs += bend;
            }

            var x1u = x1upoffs / (this._geometry.width + 2);
            var x2u = x2upoffs / (this._geometry.width + 2);

            var vpad = 1 / this._geometry.height;
            var y1v = vpad;
            var y2v = 1.0 - vpad;

            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            var windowVerts = new Float32Array([
                x1, y1, x1u, y1v,
                x1, y2, x1u, y2v,
                x2, y1, x2u, y1v,
                x2, y2, x2u, y2v,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, windowVerts, gl.STATIC_DRAW);

            gl.useProgram(this._shaderProgram);

            var projection = new Float32Array(16);
            matOrtho2D(projection, gl.$viewportWidth, gl.$viewportHeight);
            var projectionUniform = gl.getUniformLocation(this._shaderProgram, "u_projection");
            gl.uniformMatrix4fv(projectionUniform, false, projection);

            var opacityUniform = gl.getUniformLocation(this._shaderProgram, "u_opacity");

            var opacity = this._display.getProperty({ windowId: this._windowId, name: 'OPACITY' });
            if (opacity === undefined)
                opacity = 1.0;

            gl.uniform1f(opacityUniform, opacity);

            var bendUniform = gl.getUniformLocation(this._shaderProgram, "u_bend_x");
            gl.uniform1i(bendUniform, bend);

            var texWidthUniform = gl.getUniformLocation(this._shaderProgram, "u_tex_width");
            gl.uniform1i(texWidthUniform, this._geometry.width);

            var posAttribute = gl.getAttribLocation(this._shaderProgram, "a_position");
            gl.enableVertexAttribArray(posAttribute);
            gl.vertexAttribPointer(posAttribute, 2, gl.FLOAT, false, 4 * 4, 0);

            var uvAttribute = gl.getAttribLocation(this._shaderProgram, "a_uv");
            gl.enableVertexAttribArray(uvAttribute);
            gl.vertexAttribPointer(uvAttribute, 2, gl.FLOAT, false, 4 * 4, 2 * 4);

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

            gl.bindTexture(gl.TEXTURE_2D, null);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.deleteBuffer(buffer);

            gl.useProgram(null);
        }
    }

    CompositingManager.GLCompositingManager = class GLCompositingManager extends CompositingManagerBase {
        constructor(server, toplevelWindowId, gl) {
            super(server, toplevelWindowId);
            this._gl = gl;
            this._renderer = new GLRenderer(this._triggerRedraw.bind(this), this._gl);
            this._redirectChildren();
            this._time = 0;
        }

        _draw(time) {
            const dt = (time - this._time) / 10;
            this._time = time;
            this._renderer.draw(dt);
        }

        _triggerRedraw() {
            window.requestAnimationFrame(this._draw.bind(this));
        }

        _createWindowActor(windowId) {
            return new GLWindowActor(this._renderer, this._server, windowId, this._gl);
        }
    };

    exports.CompositingManager = CompositingManager;

})(window);
