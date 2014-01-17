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
                if (newX > 0)
                    newX = 0;
                if (newY > 0)
                    newY = 0;

                var geom = this._display.getGeometry({ drawableId: this._windowId });
                var parentGeom = this._display.getGeometry({ drawableId: query.parent });
                var minX = (parentGeom.width - geom.width);
                if (newX < minX)
                    newX = minX;
                var minY = (parentGeom.height - geom.height);
                if (newY < minY)
                    newY = minY;
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
