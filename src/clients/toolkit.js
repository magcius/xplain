(function(exports) {
    "use strict";

    var Util = {};
    Util.pathFromRegion = function(ctx, region) {
        region.iter_rectangles(function(rect) {
            ctx.rect(rect.x, rect.y, rect.width, rect.height);
        });
    };

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

    Util.centerWindow = function(display, windowId) {
        var rootGeom = display.getGeometry({ drawableId: display.rootWindowId });
        var winGeom = display.getGeometry({ drawableId: windowId });

        var x = (rootGeom.width - winGeom.width) / 2;
        var y = (rootGeom.height - winGeom.height) / 2;

        display.configureWindow({ windowId: windowId, x: x, y: y });
    };

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

    var Window = new Class({
        initialize: function() {
            this.x = 0;
            this.y = 0;
            this.width = 1;
            this.height = 1;
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
                return this.expose(event);
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
        expose: function(event) {
        },
    });

    exports.Util = Util;
    exports.EventRegistry = EventRegistry;
    exports.Window = Window;

})(window);
