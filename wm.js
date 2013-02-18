(function(exports) {
    "use strict";

    // Don't extend Window as this needs to be in the
    // WM client, not its own client.
    var WindowFrame = new Class({
        Extends: Window,
        initialize: function(wm, server, windowId) {
            this._wm = wm;
            this._server = server;
            this.clientWindowId = windowId;

            // Client geometry relative to the parent frame
            this._clientGeometry = {};

            // Frame geometry relative to the root
            this._frameGeometry = {};
        },

        _syncGeometry: function(clientGeometry) {
            var border = { top: 30, left: 5, right: 5, bottom: 5 };

            // The top-left of the frame is the top-left of the window, and we'll
            // put the client 30px in.
            this._frameGeometry.x = clientGeometry.x;
            this._frameGeometry.y = clientGeometry.y;
            this._frameGeometry.width = clientGeometry.width + border.left + border.right;
            this._frameGeometry.height = clientGeometry.height + border.top + border.bottom;

            this._server.configureWindow(this._wm, this.frameWindowId, this._frameGeometry);

            if (clientGeometry.width != this._clientGeometry.width ||
                clientGeometry.height != this._clientGeometry.height) {

                this._clientGeometry.x = border.left;
                this._clientGeometry.y = border.top;
                this._clientGeometry.width = clientGeometry.width;
                this._clientGeometry.height = clientGeometry.height;

                this._server.configureWindow(this._wm, this.clientWindowId, this._clientGeometry);
            }

            // Invalidate the frame that's already been partially painted.
            this._server.invalidateWindow(this._wm, this.frameWindowId);
        },

        construct: function() {
            var geom = this._server.getGeometry(this._wm, this.clientWindowId);

            this.frameWindowId = this._server.createWindow(this._wm);
            this._server.selectInput(this._wm, this.frameWindowId, ["Expose", "ButtonPress"]);
            this._server.selectInput(this._wm, this.clientWindowId, ["ButtonPress"]);
            this._server.changeAttributes(this._wm, this.frameWindowId, { hasInput: true, backgroundColor: 'red' }); // for now
            this._server.reparentWindow(this._wm, this.clientWindowId, this.frameWindowId);

            // Map the frame window.
            this._server.mapWindow(this._wm, this.frameWindowId);

            this._syncGeometry(geom);
        },
        destroy: function() {
            this._server.destroyWindow(this._wm, this.frameWindowId);
        },

        _configureRequestStack: function(event) {
            this._server.configureWindow(this._wm, this.frameWindowId, { stackMode: event.detail });
        },
        configureRequest: function(event) {
            // ICCCM 4.1.5

            // The coordinate system of the ConfigureRequest is that of the root;
            // that is, the X/Y in the ConfigureNotify are of the top-left of the
            // outer frame window. Note that the width/height are of the client
            // window.

            var geom = {};

            geom.x = event.x === undefined ? this._frameGeometry.x : event.x;
            geom.y = event.y === undefined ? this._frameGeometry.y : event.y;
            geom.width = event.width === undefined ? this._clientGeometry.width : event.width;
            geom.height = event.height === undefined ? this._clientGeometry.height : event.height;

            // We don't generate synthetic events quite yet.
            this._syncGeometry(geom);

            if (event.detail !== undefined)
                this._configureRequestStack(event);
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonPress":
                return this.buttonPress(event);
            case "ButtonRelease":
                return this.buttonRelease(event);
            case "Motion":
                return this.motion(event);
            case "Expose":
                return this.expose(event.ctx);
            }
        },
        buttonPress: function(event) {
            this._origMousePos = { x: event.rootX, y: event.rootY };
            var frameCoords = this._server.getGeometry(this, this.frameWindowId);
            this._origWindowPos = { x: frameCoords.x, y: frameCoords.y };
            this._server.grabPointer(this._wm, this.frameWindowId, true, ["ButtonRelease", "Motion"], "-moz-grabbing");
        },
        buttonRelease: function(event) {
            this._server.ungrabPointer(this._wm, this.frameWindowId);

            this._origMousePos = null;
            this._origWindowPos = null;
        },
        motion: function(event) {
            var newX = this._origWindowPos.x + event.rootX - this._origMousePos.x;
            var newY = this._origWindowPos.y + event.rootY - this._origMousePos.y;
            this._server.configureWindow(this._wm, this.frameWindowId, { x: newX, y: newY });
        },
        expose: function(wrapper) {
            // background color takes care of the base

            // Draw title.
            var title = this._server.getProperty(this._wm, this.clientWindowId, "WM_NAME");
            if (title) {
                var geom = this._server.getGeometry(this._wm, this.clientWindowId);
                wrapper.drawWithContext(function(ctx) {
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.font = '12pt sans-serif';
                    ctx.fillText(title, geom.width / 2, 21);
                });
            }

            wrapper.clearDamage();
        },
    });

    var WindowManager = new Class({
        connect: function(server) {
            this._server = server;
            this._server.clientConnected(this);
            this._server.selectInput(this, this._server.rootWindowId, ["SubstructureRedirect", "SubstructureNotify"]);

            // window ID => WindowFrame
            this._windowFrames = {};
        },

        handleEvent: function(event) {
            var frame = this._windowFrames[event.windowId];
            var frameWasReceiver = !!(frame && frame.frameWindowId == event.windowId);

            switch (event.type) {
            case "MapRequest":
                return this.mapRequest(event);
            case "UnmapNotify":
                return this.unmapNotify(event);
            case "ConfigureRequest":
                return this.configureRequest(event);
            case "ButtonPress":
                // Raise on click.
                this._server.configureWindow(this, frame.frameWindowId, { stackMode: "Above" });
                if (frameWasReceiver)
                    return frame.handleEvent(event);
                break;

            // These should only happen for frame windows.
            case "ButtonRelease":
            case "Motion":
            case "Expose":
                return frame.handleEvent(event);
            }
        },
        configureRequest: function(event) {
            var frame = this._windowFrames[event.windowId];

            // If we don't have a frame for a window, it was never
            // mapped, simply re-configure the window with whatever
            // it requested.
            if (!frame) {
                this._server.configureWindow(this, event.windowId,
                                             { x: event.x, y: event.y, width: event.width, height: event.height });
            } else {
                // The frame will move/resize the window to its
                // client coordinates.
                frame.configureRequest(event);
            }
        },
        unmapNotify: function(event) {
            var frame = this._windowFrames[event.windowId];

            if (!frame || event.windowId == frame.frameWindowId)
                return;

            frame.destroy();
        },
        mapRequest: function(event) {
            var frame = new WindowFrame(this, this._server, event.windowId);

            // Reparent the original window and map the frame.
            frame.construct();

            this._windowFrames[frame.frameWindowId] = frame;
            this._windowFrames[frame.clientWindowId] = frame;

            // Map the original window, now that we've reparented it
            // back into the frame.
            this._server.mapWindow(this, event.windowId);
        },
    });

    exports.WindowManager = WindowManager;

})(window);
