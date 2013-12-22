// Contains common demo utilities.

(function(exports) {
    "use strict";

    var DemoCommon = {};

    // Allows the user to drag and drop a window with the standard
    // "press left-click", "move mouse", "release left-click" motions.
    var WindowDragger = new Class({
        initialize: function(server, windowId) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._windowId = windowId;

            this._display.selectInput({ windowId: this._windowId,
                                        events: ['ButtonPress'] });

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

    DemoCommon.WindowDragger = WindowDragger;

    exports.DemoCommon = DemoCommon;

})(window);
