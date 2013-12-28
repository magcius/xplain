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
        initialize: function(server, windowId) {
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
        },

        // Make it move.
        _sync: function() {
            var newX = this._rootMouseX - this._winMouseX;
            var newY = this._rootMouseY - this._winMouseY;
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

    exports.DemoCommon = DemoCommon;

})(window);
