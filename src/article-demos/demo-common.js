// Contains common demo utilities.

(function(exports) {
    "use strict";

    var DemoCommon = {};

    DemoCommon.makeStipple = function(display, windowId) {
        var stipple = display.createPixmap({ width: 2, height: 2 });
        display.drawTo(stipple, function(ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 2, 2);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1, 1);
            ctx.fillRect(1, 1, 1, 1);
        });
        return stipple;
    };

    DemoCommon.setBackground = function(display, pixmapId) {
    	display.changeAttributes({ windowId: display.rootWindowId, backgroundPixmap: pixmapId });
        display.invalidateWindow({ windowId: display.rootWindowId });
    };

    // Centers the given window on the server, plus or minus an offset.
    DemoCommon.centerWindow = function(display, windowId, offset) {
        var rootGeom = display.getGeometry({ drawableId: display.rootWindowId });
        var winGeom = display.getGeometry({ drawableId: windowId });

        var x = (rootGeom.width - winGeom.width) / 2 + (offset ? offset.x : 0);
        var y = (rootGeom.height - winGeom.height) / 2 + (offset ? offset.y : 0);

        display.configureWindow({ windowId: windowId, x: x, y: y });
    };

    // Allows the user to drag and drop a window with the standard
    // "press left-click", "move mouse", "release left-click" motions.
    DemoCommon.WindowDragger = new Class({
        initialize: function(server, windowId, bounded) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._windowId = windowId;

            this._display.selectInput({ windowId: this._windowId, events: ['ButtonPress'] });

            this._rootMouseX = -1;
            this._rootMouseY = -1;

            this._winMouseX = -1;
            this._winMouseY = -1;

            this._bounded = bounded;
        },

        // Make it move.
        _sync: function() {
            var query = this._display.queryTree({ windowId: this._windowId });
            var newCoords = this._display.translateCoordinates({ srcWindowId: this._display.rootWindowId, 
                                                                 destWindowId: query.parent,
                                                                 x: this._rootMouseX - this._winMouseX,
                                                                 y: this._rootMouseY - this._winMouseY });
            var newX = newCoords.x;
            var newY = newCoords.y;

            if (this._bounded) {
                var geom = this._display.getGeometry({ drawableId: this._windowId });
                var parentGeom = this._display.getGeometry({ drawableId: query.parent });

                var minX = Math.min(parentGeom.width - geom.width, 0);
                var maxX = Math.max(parentGeom.width - geom.width, 0);
                if (newX < minX)
                    newX = minX;
                if (newX > maxX)
                    newX = maxX;

                var minY = Math.min(parentGeom.height - geom.height, 0);
                var maxY = Math.max(parentGeom.height - geom.height, 0);
                if (newY < minY)
                    newY = minY;
                if (newY > maxY)
                    newY = maxY;
            }

            this._display.configureWindow({ windowId: this._windowId, x: newX, y: newY });
        },

        _updateWindowFromEvent: function(event) {
            this._rootMouseX = event.rootX;
            this._rootMouseY = event.rootY;
            this._sync();
        },

        _handleButtonPress: function(event) {
            // Only allow dragging with left-click
            if (event.button != 1)
                return;

            this._winMouseX = event.winX;
            this._winMouseY = event.winY;
            this._updateWindowFromEvent(event);

            this._display.grabPointer({ windowId: this._windowId,
                                        ownerEvents: true,
                                        events: ["ButtonRelease", "Motion"],
                                        pointerMode: "Async",
                                        cursor: "grabbing" });
        },

        _handleButtonRelease: function(event) {
            if (event.button != 1)
                return;

            this._updateWindowFromEvent(event);
            this._display.ungrabPointer({ windowId: this._windowId });
        },

        _handleMotion: function(event) {
            this._updateWindowFromEvent(event);
        },

        _handleEvent: function(event) {
            switch (event.type) {
                case 'ButtonPress':
                    return this._handleButtonPress(event);
                case 'ButtonRelease':
                    return this._handleButtonRelease(event);
                case 'Motion':
                    return this._handleMotion(event);
            }
        },
    });

    // A simple helper to manage repeated timed events for WindowShaker below.
    // Perhaps we should consider using requestAnimationFrame for this?
    var Timer = new Class({
        initialize: function(delay, func) {
            this._delay = delay;
            this._func = func;
            this._timeoutId = 0;
        },

        _schedule: function() {
            this._timeoutId = setTimeout(function() {
                this._func();
                this._schedule();
            }.bind(this), this._delay);
        },

        stop: function() {
            if (this._timeoutId) {
                clearTimeout(this._timeoutId);
                this._timeoutId = 0;
            }
        },

        start: function() {
            if (this._timeoutId)
                this.stop();

            this._schedule();
        },
    });

    // The number of times to update, per second.
    var TICKS_PER_SEC = 30;
    var TICK_MSEC = (1000 / TICKS_PER_SEC);

    // http://tauday.com/
    var TAU = Math.PI * 2;

    // The time, in seconds, to complete a full movement.
    var PERIOD = 6;

    // The number of pixels to sway to either side.
    var SWAY_AMOUNT = 75;

    // Shakes a window
    DemoCommon.WindowShaker = new Class({
        initialize: function(server, windowId) {
            var connection = server.connect();
            this._display = connection.display;

            this._windowId = windowId;

            this._timer = new Timer(TICK_MSEC, this._tick.bind(this));
            this._tickCount = 0;
            this._startX = 0;
        },

        start: function() {
            var geometry = this._display.getGeometry({ drawableId: this._windowId });
            this._startX = geometry.x;
            this._timer.start();
        },

        // Make it move.
        _sync: function() {
            var theta = TAU * (this._tickCount / TICKS_PER_SEC / PERIOD);
            var x = this._startX + SWAY_AMOUNT * Math.sin(theta);
            this._display.configureWindow({ windowId: this._windowId, x: x });
        },

        _tick: function() {
            this._tickCount++;
            this._sync();
        },
    });

    // Constructs a region containing the area where there are visible
    // pixels, where "visible pixels" have any alpha value other than 0.
    DemoCommon.scanImageDataForVisibleRegion = function(imgData) {
        var w = imgData.width, h = imgData.height;

        var region = new Region();

        // Scan through the alpha values of the image, looking for solid
        // pixels in rectangular bands, and make a region from these.

        function alphaAt(x, y) {
            var pixelIndex = (y * w) + x;
            // imgData is laid out in an RGBA manner, so to get the alpha
            // component of the 7th pixel, we need to get the 31th number.
            var dataIndex = pixelIndex * 4 + 3;
            return imgData.data[dataIndex];
        }

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var x2 = x;

                while (alphaAt(x2, y) && x2 < w)
                    x2++;

                if (x2 > x) {
                    region.union_rect(region, x, y, x2 - x, 1);
                    x = x2;
                }
            }
        }

        return region;
    };

    // A simple window that opens/closes the inspector when clicking on it.
    var InspectorButton = new Class({
        initialize: function(server, inspector) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._inspector = inspector;

            this._windowId = this._display.createWindow({ x: 0, y: 0, width: 32, height: 32 });
            this._display.changeAttributes({ windowId: this._windowId, cursor: 'pointer', overrideRedirect: true });
            this._display.changeProperty({ windowId: this._windowId, name: 'DEBUG_NAME', value: "Inspector Button" });
            this._display.selectInput({ windowId: this._windowId, events: ["ButtonRelease", "Expose", "ConfigureNotify"] });
            this._display.selectInput({ windowId: this._display.rootWindowId, events: ["ConfigureNotify"] });

            this._showing = false;

            this._placeButton();
            this._syncShowing();

            this._display.mapWindow({ windowId: this._windowId });

            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        },

        _syncShowing: function() {
            var color = this._showing ? '#000000' : '#ffffff';
            this._display.changeAttributes({ windowId: this._windowId, backgroundColor: color });
            this._display.invalidateWindow({ windowId: this._windowId });
        },
        setShowing: function(showing) {
            if (this._showing == showing)
                return;

            this._showing = showing;
            this._syncShowing();
        },

        _placeButton: function() {
            var rootGeom = this._display.getGeometry({ drawableId: this._display.rootWindowId });
            var selfGeom = this._display.getGeometry({ drawableId: this._windowId });

            // Place in the top-right of the root window.
            var padding = 10;
            var x = rootGeom.width - selfGeom.width - padding;
            var y = padding;
            this._display.configureWindow({ windowId: this._windowId, x: x, y: y });
        },

        _clicked: function() {
            this._inspector.toggle();
        },
        _configureNotify: function(event) {
            if (event.windowId == this._display.rootWindowId) {
                this._placeButton();
                this._display.invalidateWindow({ windowId: this._windowId });
            } else {
                this._display.invalidateWindow({ windowId: this._windowId });
            }
        },
        _draw: function() {
            this._display.drawTo(this._windowId, function(ctx) {
                this._exposeHandler.clip(ctx);
                var geom = this._display.getGeometry({ drawableId: this._windowId });
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000000';
                ctx.strokeRect(0, 0, geom.width, geom.height);

                ctx.font = 'bold 12pt monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = this._showing ? '#ffffff' : '#000000';
                ctx.fillText('i', geom.width / 2, 8);
            }.bind(this));
        },
        _handleEvent: function(event) {
            switch (event.type) {
            case "ButtonRelease":
                return this._clicked(event);
            case "ConfigureNotify":
                return this._configureNotify(event);
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            }
        },
    });

    DemoCommon.addInspector = function(res) {
        var server = res.server;
        var elem = res.elem;

        var inspector = new Inspector(server);
        elem.appendChild(inspector.elem);

        var button = new InspectorButton(server, inspector);
        inspector.addButton(button);
    };

    exports.DemoCommon = DemoCommon;

})(window);
