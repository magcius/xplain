(function(exports) {
    "use strict";

    var Stage = new Class({
        initialize: function(redrawFunc) {
            this._redrawFunc = redrawFunc;
            this._needsRedraw = new Region();
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
            this._needsRedraw.union_rect(this._needsRedraw, geometry.x, geometry.y, geometry.width, geometry.height);
            if (!this._triggeredRedraw) {
                this._redrawFunc();
                this._triggeredRedraw = true;
            }
        },

        draw: function(ctx) {
            if (this._triggeredRedraw) {
                CanvasUtil.pathFromRegion(ctx, this._needsRedraw);
                ctx.clip();
                ctx.beginPath();
            }

            this._actors.forEach(function(actor) {
                actor.draw(ctx);
            });

            this._needsRedraw.clear();
            this._triggeredRedraw = false;
        },
    });

    var WindowActor = new Class({
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

        _handleEvent: function(event) {
            if (event.windowId != this._windowId)
                return;

            switch (event.type) {
            case "Damage":
                return this._stage.queueRedraw(this._geometry);
            case "ConfigureNotify":
                return this._setNewGeometry(event);
            case "UnmapNotify":
                return this._destroy();
            }
        },

        draw: function(ctx) {
            var pixmapId = this._display.nameWindowPixmap({ windowId: this._windowId });
            var image = this._display.getPixmapImage({ pixmapId: pixmapId });
            ctx.save();
            ctx.translate(this._geometry.x, this._geometry.y);

            var bg = this._display.getProperty({ windowId: this._windowId, name: 'BACKGROUND' });
            if (!bg)
                ctx.globalAlpha = 0.5;

            ctx.drawImage(image, 0, 0);
            ctx.restore();
            this._display.freePixmap({ drawableId: pixmapId });
        },
    });

    var CompositingManager = new Class({
        initialize: function(server) {
            this._server = server;

            var connection = server.connect();
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));
            this._display = connection.display;

            this._stage = new Stage(this._onRedraw.bind(this));

            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ["SubstructureNotify", "Expose"] });
            var query = this._display.queryTree({ windowId: this._display.rootWindowId });
            query.children.forEach(this._addWindow.bind(this));
        },

        _onRedraw: function() {
            this._display.invalidateWindow({ windowId: this._display.rootWindowId,
                                             includeChildren: true });
        },

        _addWindow: function(windowId) {
            var attrs = this._display.getAttributes({ windowId: windowId });
            if (attrs.mapState != "Viewable")
                return;

            this._display.redirectWindow({ windowId: windowId, mode: "manual" });
            var actor = new WindowActor(this._stage, this._server, windowId);
        },

        _mapNotify: function(event) {
            var windowId = event.windowId;
            this._addWindow(windowId);
        },

        _draw: function() {
            this._display.drawTo(this._display.rootWindowId, function(ctx) {
                this._stage.draw(ctx);
            }.bind(this));
        },

        _handleEvent: function(event) {
            switch (event.type) {
            case "MapNotify":
                return this._mapNotify(event);
            case "Expose":
                if (event.count == 0)
                    return this._draw();
            }
        },
    });

    exports.CompositingManager = CompositingManager;

})(window);
