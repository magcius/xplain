(function(exports) {

    // Don't extend Window as this needs to be in the
    // WM client, not its own client.
    var WindowFrame = new Class({
        Extends: Window,
        initialize: function(wm, server, windowId) {
            this._wm = wm;
            this._server = server;
            this.clientWindowId = windowId;
        },

        _syncGeometry: function(geom, forceClientConfigure) {
            // A real WM would cache this, as it would cause a round-trip.
            var clientGeom = this._server.getGeometry(this._wm, this.clientWindowId);

            var border = { top: 30, left: 5, right: 5, bottom: 5 };

            // The top-left of the frame is the top-left of the window, and we'll
            // put the client 10px in. That means we should only touch the width
            // and height.
            this._server.configureWindow(this._wm, this.frameWindowId, { x: geom.x, y: geom.y,
                                                                         width: geom.width + border.left + border.right,
                                                                         height: geom.height + border.top + border.bottom });

            if (forceClientConfigure || clientGeom.width != geom.width || clientGeom.height != geom.height) {
                this._server.configureWindow(this._wm, this.clientWindowId, { x: border.left, y: border.top, width: geom.width, height: geom.height });
            }
        },

        construct: function() {
            var geom = this._server.getGeometry(this._wm, this.clientWindowId);

            this.frameWindowId = this._server.createWindow(this._wm);
            this._server.selectInput(this._wm, this.frameWindowId, ["Expose"]);
            this._server.changeAttributes(this._wm, this.frameWindowId, { backgroundColor: 'red' }); // for now
            this._server.reparentWindow(this._wm, this.clientWindowId, this.frameWindowId);

            // Map the frame window.
            this._server.mapWindow(this._wm, this.frameWindowId);

            this._syncGeometry(geom, true);
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

            // We don't generate synthetic events quite yet.
            this._syncGeometry(event, false);

            if (event.hasStack)
                this._configureRequestStack(event);
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "Expose":
                return this.expose(event.ctx);
            }
        },
        expose: function(wrapper) {
            // background color takes care of it for now
            wrapper.clearDamage();
        },
    });

    var WindowManager = new Class({
        connect: function(server) {
            this._server = server;
            this._server.clientConnected(this);
            this._server.selectInput(this, this._server.rootWindowId, ["SubstructureRedirect", "UnmapNotify"]);

            // client window => window frame
            this._windowFrames = {};

            // frame window => window frame
            this._windowFramesById = {};
        },

        handleEvent: function(event) {
            switch (event.type) {
            case "MapRequest":
                return this.mapRequest(event);
            case "ConfigureRequest":
                return this.configureRequest(event);
            // These should only happen for frame windows.
            case "Expose":
                var frame = this._windowFramesById[event.windowId];
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
        mapRequest: function(event) {
            var frame = new WindowFrame(this, this._server, event.windowId);
            this._windowFrames[event.windowId] = frame;

            // Reparent the original window and map the frame.
            frame.construct();

            this._windowFramesById[frame.frameWindowId] = frame;

            // Map the original window, now that we've reparented it
            // back into the frame.
            this._server.mapWindow(this, event.windowId);
        },
        unmapNotify: function(event) {
            var frame = this._windowFrames[event.windowId];
            frame.destroy();
            delete this._windowFrames[event.windowId];
        },
    });

    exports.WindowManager = WindowManager;

})(window);
