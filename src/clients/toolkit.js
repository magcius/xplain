// Contains a basic dummy toolkit, along with various utility functions
// that might come in handy when building demos.

(function(exports) {
    "use strict";

    var Util = {};

    // Loads an a remote image URL as a server-side pixmap.
    Util.loadImageAsPixmap = function(display, src, callback) {
        var image = new Image();
        image.addEventListener("load", function() {
            var width = image.width;
            var height = image.height;

            var pixmapId = display.createPixmap({ width: width, height: height });
            display.drawTo(pixmapId, function(ctx) {
                ctx.drawImage(image, 0, 0);
            });

            callback(pixmapId);
        });
        image.src = src;
    };

    // Centers the given window on the server, plus or minus an offset.
    Util.centerWindow = function(display, windowId, offset) {
        var rootGeom = display.getGeometry({ drawableId: display.rootWindowId });
        var winGeom = display.getGeometry({ drawableId: windowId });

        var x = (rootGeom.width - winGeom.width) / 2 + (offset ? offset.x : 0);
        var y = (rootGeom.height - winGeom.height) / 2 + (offset ? offset.y : 0);

        display.configureWindow({ windowId: windowId, x: x, y: y });
    };

    // Creates a "rounded" pixman region.
    Util.roundedRectRegion = function(geom, corners) {
        var shapeRegion = new Region();
        shapeRegion.init_rect(0, 0, geom.width, geom.height);

        var cornerRegion = new Region();

        function widthForRadiusSegment(radius, i) {
            var r = radius-i-0.5;
            return (0.5 + radius - Math.sqrt(radius*radius - r*r)) | 0;
        }

        if (corners.topRight) {
            for (var i = 0; i < corners.topLeft; i++) {
                var width = widthForRadiusSegment(corners.topLeft, i);
                cornerRegion.union_rect(cornerRegion, 0, i, width, 1);
            }
        }

        if (corners.topRight) {
            for (var i = 0; i < corners.topRight; i++) {
                var width = widthForRadiusSegment(corners.topRight, i);
                cornerRegion.union_rect(cornerRegion, geom.width - width, i, width, 1);
            }
        }

        if (corners.bottomLeft) {
            for (var i = 0; i < corners.bottomLeft; i++) {
                var width = widthForRadiusSegment(corners.bottomLeft, i);
                cornerRegion.union_rect(cornerRegion, 0, geom.height - i - 1, width, 1);
            }
        }

        if (corners.bottomRight) {
            for (var i = 0; i < corners.bottomRight; i++) {
                var width = widthForRadiusSegment(corners.bottomRight, i);
                cornerRegion.union_rect(cornerRegion, geom.width - width, geom.height - i - 1, width, 1);
            }
        }

        shapeRegion.subtract(shapeRegion, cornerRegion);
        cornerRegion.finalize();

        return shapeRegion;
    };

    // A simple helper object that deals with the more-complicated
    // aspects of Expose event handling, like accumulating an exposed
    // region to redraw, and calling the draw function when we've
    // processed all the Expose events in the current chain.
    var ExposeHandler = new Class({
        initialize: function(drawFn) {
            this._exposedRegion = new Region();
            this._draw = drawFn;
        },
        clip: function(ctx) {
            CanvasUtil.pathFromRegion(ctx, this._exposedRegion);
            ctx.clip();
            ctx.beginPath();
            this._exposedRegion.clear();
        },
        handleExpose: function(event) {
            this._exposedRegion.union_rect(this._exposedRegion, event.x, event.y, event.width, event.height);
            if (event.count == 0)
                this._draw();
        },
    });

    // A simple helper utility to help manage event processing in general.
    // Used for the Calculator demo, not sure I like it in general...
    var EventRegistry = new Class({
        initialize: function() {
            this._registry = {};
        },
        _handlerKey: function(windowId, eventType) {
            return windowId + ':' + eventType;
        },
        registerHandler: function(windowId, eventType, handler) {
            var key = this._handlerKey(windowId, eventType);
            this._registry[key] = handler;
        },
        handleEvent: function(event) {
            var key = this._handlerKey(event.windowId, event.type);
            var handler = this._registry[key];
            if (handler)
                handler(event);
        },
    });

    // A simple "Window" that manages a server-side window and provides
    // various helpers. Quite simplistic, not sure I like it much anymore...
    var Window = new Class({
        initialize: function() {
            this.x = 0;
            this.y = 0;
            this.width = 1;
            this.height = 1;

            this._exposeHandler = new ExposeHandler(this._draw.bind(this));
        },
        connect: function(server) {
            this._privateServer = server;
            var connection = this._privateServer.connect();
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this.handleEvent(messageEvent.data);
            }.bind(this));
            this._display = connection.display;
            this.windowId = this._display.createWindow({ x: this.x, y: this.y,
                                                         width: this.width, height: this.height });
            this._display.selectInput({ windowId: this.windowId,
                                        events: ["Expose", "ConfigureNotify"] });
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ConfigureNotify":
                return this.configureNotify(event);
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            }
        },
        configureNotify: function(event) {
            if (event.windowId !== this.windowId)
                return;

            if (event.x !== undefined)
                this.x = event.x;
            if (event.y !== undefined)
                this.y = event.y;
            if (event.width !== undefined)
                this.width = event.width;
            if (event.height !== undefined)
                this.height = event.height;
        },
    });

    exports.Util = Util;
    exports.ExposeHandler = ExposeHandler;
    exports.EventRegistry = EventRegistry;
    exports.Window = Window;

})(window);
