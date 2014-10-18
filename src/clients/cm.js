(function(exports) {
    "use strict";

    var CompositingManager = {};

    var StageBase = new Class({
        initialize: function(needsRedrawFunc) {
            this._needsRedrawFunc = needsRedrawFunc;
            this._dirtyRegion = new Region();
            this._triggeredRedraw = false;

            this._actors = [];
        },

        $addActor: function(actor) {
            this._actors.push(actor);
        },

        $removeActor: function(actor) {
            var idx = this._actors.indexOf(actor);
            this._actors.splice(idx, 1);
        },

        queueRedraw: function(geometry) {
            this._dirtyRegion.union_rect(this._dirtyRegion, geometry.x, geometry.y, geometry.width, geometry.height);
            if (!this._triggeredRedraw) {
                this._needsRedrawFunc();
                this._triggeredRedraw = true;
            }
        },
    });

    var WindowActorBase = new Class({
        initialize: function(stage, server, windowId) {
            this._stage = stage;
            this._stage.$addActor(this);

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
            this._stage.queueRedraw(this._geometry);
        },

        _destroy: function() {
            this._display.disconnect();

            this._stage.$removeActor(this);
            this._stage.queueRedraw(this._geometry);
            this._stage = null;
        },

        _setNewGeometry: function(newGeometry) {
            // Redraw where the window was
            this._stage.queueRedraw(this._geometry);

            if (newGeometry.x !== undefined)
                this._geometry.x = newGeometry.x;
            if (newGeometry.y !== undefined)
                this._geometry.y = newGeometry.y;
            if (newGeometry.width !== undefined)
                this._geometry.width = newGeometry.width;
            if (newGeometry.height !== undefined)
                this._geometry.height = newGeometry.height;

            // Redraw where the window is
            this._stage.queueRedraw(this._geometry);
        },

        _damaged: function() {
            this._stage.queueRedraw(this._geometry);
        },

        _handleEvent: function(event) {
            if (event.windowId != this._windowId)
                return;

            switch (event.type) {
            case "Damage":
                return this._damaged();
            case "ConfigureNotify":
                return this._setNewGeometry(event);
            case "UnmapNotify":
                return this._destroy();
            }
        },
    });

    var CompositingManagerBase = new Class({
        initialize: function(server, toplevelWindowId) {
            this._server = server;

            var connection = server.connect();
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));
            this._display = connection.display;

            this._stage = this._createStage();

            this._toplevelWindowId = toplevelWindowId;
            this._display.selectInput({ windowId: toplevelWindowId,
                                        events: ["SubstructureNotify"] });
            var query = this._display.queryTree({ windowId: toplevelWindowId });
            query.children.forEach(this._addWindow.bind(this));
        },

        _addWindow: function(windowId) {
            var attrs = this._display.getAttributes({ windowId: windowId });
            if (attrs.mapState != "Viewable")
                return;

            this._display.redirectWindow({ windowId: windowId, mode: "manual" });
            var actor = this._createWindowActor(windowId);
        },

        _mapNotify: function(event) {
            var windowId = event.windowId;
            this._addWindow(windowId);
        },

        _handleEvent: function(event) {
            switch (event.type) {
            case "MapNotify":
                return this._mapNotify(event);
            }
        },
    });

    var Canvas2DStage = new Class({
        Extends: StageBase,

        draw: function(ctx) {
            if (this._triggeredRedraw) {
                CanvasUtil.pathFromRegion(ctx, this._dirtyRegion);
                ctx.clip();
                ctx.beginPath();
            }

            this._actors.forEach(function(actor) {
                actor.draw(ctx);
            });

            this._dirtyRegion.clear();
            this._triggeredRedraw = false;
        },
    });

    var Canvas2DWindowActor = new Class({
        Extends: WindowActorBase,

        draw: function(ctx) {
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
        },
    });

    var Canvas2DCompositingManager = new Class({
        Extends: CompositingManagerBase,

        initialize: function(server, toplevelWindowId) {
            this.parent(server, toplevelWindowId);

            this._display.selectInput({ windowId: toplevelWindowId,
                                        events: ["Expose"] });
            this._draw();
        },

        _onNeedsRedraw: function() {
            this._display.invalidateWindow({ windowId: this._toplevelWindowId,
                                             includeChildren: true });
        },

        _createStage: function() {
            return new Canvas2DStage(this._onNeedsRedraw.bind(this));
        },

        _createWindowActor: function(windowId) {
            return new Canvas2DWindowActor(this._stage, this._server, windowId);
        },

        _draw: function() {
            this._display.drawTo(this._toplevelWindowId, function(ctx) {
                this._stage.draw(ctx);
            }.bind(this));
        },

        _handleEvent: function(event) {
            switch (event.type) {
            case "Expose":
                if (event.count == 0)
                    return this._draw();
            default:
                return this.parent(event);
            }
        },
    });
    CompositingManager.Canvas2DCompositingManager = Canvas2DCompositingManager;

    var GLStage = new Class({
        Extends: StageBase,

        initialize: function(needsRedrawFunc, gl) {
            this._gl = gl;
            this.parent(needsRedrawFunc);
        },

        draw: function() {
            var gl = this._gl;

            gl.enable(gl.BLEND);
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
                                 gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            this._actors.forEach(function(actor) {
                actor.draw();
            });
            gl.disable(gl.BLEND);

            this._dirtyRegion.clear();
            this._triggeredRedraw = false;
        },
    });

    function ortho2D(mat, width, height) {
        // Identity.
        mat[0] = 1;
        mat[5] = 1;
        mat[10] = 1;
        mat[15] = 1;

        // Set the scale so that pixels line up.
        mat[0] =  2 * (1 / width);
        mat[5] = -2 * (1 / height);

        // Adjust translation so coords are from 0..width / 0..height.
        mat[12] = -1;
        mat[13] = 1;
    }

    function M(X) {
        return X.join('\n');
    }

    var GLWindowActor = new Class({
        Extends: WindowActorBase,

        initialize: function(stage, server, windowId, gl) {
            this._gl = gl;
            this._allocate();
            this.parent(stage, server, windowId);
        },

        _getVertShaderSource: function() {
            return M([
                'attribute vec2 a_position;',
                'attribute vec2 a_uv;',
                '',
                'varying vec2 v_position;',
                'varying vec2 v_uv;',
                '',
                'uniform mat4 u_projection;',
                '',
                'void main() {',
                ' v_position = a_position;',
                ' v_uv = a_uv;',
                '',
                ' gl_Position = u_projection * vec4(a_position, 0.0, 1.0);',
                '}',
            ]);
        },

        _getFragShaderSource: function() {
            return M([
                'precision mediump float;',
                '',
                'varying vec2 v_position;',
                'varying vec2 v_uv;',
                '',
                'uniform sampler2D u_texture;',
                'uniform float u_opacity;',
                '',
                'void main() {',
                '  vec4 sample = texture2D(u_texture, v_uv);',
                '  sample.a *= u_opacity;',
                '  gl_FragColor = sample;',
                '}',
            ]);
        },

        _allocate: function() {
            var gl = this._gl;

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

            this._texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            this._imageDirty = true;
        },

        _destroy: function() {
            var gl = this._gl;

            gl.deleteTexture(this._texture);
            this._texture = null;

            gl.deleteProgram(this._shaderProgram);
            this._shaderProgram = null;

            gl.deleteShader(this._vertShader);
            this._vertShader = null;

            gl.deleteShader(this._fragShader);
            this._fragShader = null;
        },

        _damaged: function() {
            this._imageDirty = true;
            this.parent();
        },

        draw: function() {
            var gl = this._gl;

            gl.bindTexture(gl.TEXTURE_2D, this._texture);
            if (this._imageDirty) {
                var pixmapId = this._display.nameWindowPixmap({ windowId: this._windowId });
                var image = this._display.getPixmapImage({ pixmapId: pixmapId });
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                this._imageDirty = false;
            }

            var x1 = this._geometry.x;
            var x2 = x1 + this._geometry.width;
            var y1 = this._geometry.y;
            var y2 = y1 + this._geometry.height;

            var buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            var windowVerts = new Float32Array([
                x1, y1, 0, 0,
                x1, y2, 0, 1,
                x2, y1, 1, 0,
                x2, y2, 1, 1,
            ]);
            gl.bufferData(gl.ARRAY_BUFFER, windowVerts, gl.STATIC_DRAW);

            gl.useProgram(this._shaderProgram);

            var projection = new Float32Array(16);
            ortho2D(projection, gl.$viewportWidth, gl.$viewportHeight);
            var projectionUniform = gl.getUniformLocation(this._shaderProgram, "u_projection");
            gl.uniformMatrix4fv(projectionUniform, false, projection);

            var opacityUniform = gl.getUniformLocation(this._shaderProgram, "u_opacity");

            var opacity = this._display.getProperty({ windowId: this._windowId, name: 'OPACITY' });
            if (opacity === undefined)
                opacity = 1.0;

            gl.uniform1f(opacityUniform, opacity);

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
        },
    });

    var GLCompositingManager = new Class({
        Extends: CompositingManagerBase,

        initialize: function(server, toplevelWindowId, gl) {
            this._gl = gl;
            this.parent(server, toplevelWindowId);
        },

        _draw: function() {
            this._stage.draw();
        },

        _onNeedsRedraw: function() {
            window.requestAnimationFrame(this._draw.bind(this));
        },

        _createStage: function() {
            return new GLStage(this._onNeedsRedraw.bind(this), this._gl);
        },

        _createWindowActor: function(windowId) {
            return new GLWindowActor(this._stage, this._server, windowId, this._gl);
        },
    });
    CompositingManager.GLCompositingManager = GLCompositingManager;

    exports.CompositingManager = CompositingManager;

})(window);
