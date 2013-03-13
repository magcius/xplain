(function(exports) {
    "use strict";

    function valueUpdated(a, b) {
        return a !== undefined && a !== b;
    }

    function isFloating(a) {
        return a !== (a | 0);
    }

    function checkGeometry(a) {
        if (isFloating(a))
            throw new Error("sub-pixel geometry");
        return a;
    }

    function roundedRectRegion(geom, corners) {
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
    }

    // Don't extend Window as this needs to be in the
    // WM client, not its own client.
    var WindowFrame = new Class({
        Extends: Window,
        initialize: function(wm, server, windowId) {
            this._wm = wm;
            this._server = server;
            this._clientWindowId = windowId;

            // Client geometry relative to the parent frame
            this._clientGeometry = {};

            // Frame geometry relative to the root
            this._frameGeometry = {};
        },

        _updateGeometry: function(clientGeometry) {
            var border = { top: 30, left: 5, right: 5, bottom: 5 };
            var positionUpdated = false;
            var sizeUpdated = false;

            if (valueUpdated(clientGeometry.x, this._frameGeometry.x)) {
                this._frameGeometry.x = checkGeometry(clientGeometry.x);
                positionUpdated = true;
            }

            if (valueUpdated(clientGeometry.y, this._frameGeometry.y)) {
                this._frameGeometry.y = checkGeometry(clientGeometry.y);
                positionUpdated = true;
            }

            if (valueUpdated(clientGeometry.width, this._clientGeometry.width)) {
                this._clientGeometry.width = checkGeometry(clientGeometry.width);
                this._frameGeometry.width = clientGeometry.width + border.left + border.right;
                sizeUpdated = true;
            }

            if (valueUpdated(clientGeometry.height, this._clientGeometry.height)) {
                this._clientGeometry.height = checkGeometry(clientGeometry.height);
                this._frameGeometry.height = clientGeometry.height + border.top + border.bottom;
                sizeUpdated = true;
            }

            this._clientGeometry.x = border.left;
            this._clientGeometry.y = border.top;

            if (positionUpdated || sizeUpdated)
                this._server.configureWindow(this._wm, this.frameWindowId, this._frameGeometry);

            if (sizeUpdated) {
                // Update the client window
                this._server.configureWindow(this._wm, this._clientWindowId, this._clientGeometry);

                this._server.configureWindow(this._wm, this._closeWindowId, { x: border.left + this._clientGeometry.width - 20,
                                                                              y: 8 });

                // Invalidate the frame that's already been partially painted.
                this._server.invalidateWindow(this._wm, this.frameWindowId);
            }

            var shapeRegion = roundedRectRegion(this._frameGeometry, { topLeft: 10, topRight: 10 });
            this._server.setWindowShapeRegion(this._wm, this.frameWindowId, "Bounding", shapeRegion);
            shapeRegion.finalize();
        },

        _makeButton: function() {
            var buttonWindowId = this._server.createWindow(this._wm);
            this._wm.register(buttonWindowId, this);
            this._server.selectInput(this._wm, buttonWindowId, ["ButtonRelease"]);
            this._server.changeAttributes(this._wm, buttonWindowId, { cursor: "pointer" });
            var size = 15;
            var geom = { width: size, height: size };
            this._server.configureWindow(this._wm, buttonWindowId, geom);
            var radius = size / 2;
            var corners = { topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius };
            var shapeRegion = roundedRectRegion(geom, corners);
            this._server.setWindowShapeRegion(this._wm, buttonWindowId, "Bounding", shapeRegion);
            this._server.reparentWindow(this._wm, buttonWindowId, this.frameWindowId);
            this._server.mapWindow(this._wm, buttonWindowId);
            return buttonWindowId;
        },

        construct: function() {
            var geom = this._server.getGeometry(this._wm, this._clientWindowId);

            this._wm.register(this._clientWindowId, this);
            this._server.grabButton(this._wm, this._clientWindowId, 1, false, ["ButtonPress", "ButtonRelease"], "Sync", "");

            this.frameWindowId = this._server.createWindow(this._wm);
            this._wm.register(this.frameWindowId, this);
            this._server.selectInput(this._wm, this.frameWindowId, ["Expose", "ButtonPress", "Enter", "Leave"]);
            this._server.changeAttributes(this._wm, this.frameWindowId, { hasInput: true, backgroundColor: 'orange' });

            this._closeWindowId = this._makeButton();
            this._server.changeAttributes(this._wm, this._closeWindowId, { backgroundColor: 'red' });

            this._server.reparentWindow(this._wm, this._clientWindowId, this.frameWindowId);
            this._server.mapWindow(this._wm, this.frameWindowId);

            this._updateGeometry(geom);
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

            // We don't generate synthetic events quite yet.
            this._updateGeometry(event);

            if (event.detail !== undefined)
                this._configureRequestStack(event);
        },
        _handleFrameEvent: function(event) {
            switch (event.type) {
            case "ButtonPress":
                return this._frameButtonPress(event);
            case "ButtonRelease":
                return this._frameButtonRelease(event);
            case "Motion":
                return this._frameMotion(event);
            case "Enter":
                return this._frameEnter(event);
            case "Leave":
                return this._frameLeave(event);
            case "Expose":
                return this._frameExpose(event.ctx);
            }
        },
        _frameButtonPress: function(event) {
            this._origMousePos = { x: event.rootX, y: event.rootY };
            var frameCoords = this._server.getGeometry(this, this.frameWindowId);
            this._origWindowPos = { x: frameCoords.x, y: frameCoords.y };
            this._server.grabPointer(this._wm, this.frameWindowId, true, ["ButtonRelease", "Motion"], "Async", "-moz-grabbing");
        },
        _frameButtonRelease: function(event) {
            this._server.ungrabPointer(this._wm, this.frameWindowId);

            this._origMousePos = null;
            this._origWindowPos = null;
        },
        _frameMotion: function(event) {
            var newX = this._origWindowPos.x + event.rootX - this._origMousePos.x;
            var newY = this._origWindowPos.y + event.rootY - this._origMousePos.y;
            this._updateGeometry({ x: newX, y: newY });
        },
        _frameEnter: function(event) {
            this._server.changeAttributes(this._wm, this.frameWindowId, { backgroundColor: 'yellow' });
            this._server.invalidateWindow(this._wm, this.frameWindowId);
        },
        _frameLeave: function(event) {
            if (event.detail == "Inferior")
                return;
            this._server.changeAttributes(this._wm, this.frameWindowId, { backgroundColor: 'orange' });
            this._server.invalidateWindow(this._wm, this.frameWindowId);
        },
        _frameExpose: function(wrapper) {
            // background color takes care of the base

            // Draw title.
            var title = this._server.getProperty(this._wm, this._clientWindowId, "WM_NAME");
            if (title) {
                var geom = this._server.getGeometry(this._wm, this._clientWindowId);
                wrapper.drawWithContext(function(ctx) {
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.font = '12pt sans-serif';
                    ctx.fillText(title, geom.width / 2, 21);
                });
            }

            wrapper.clearDamage();
        },
        _handleButtonEvent: function(event) {
            if (event.windowId == this._closeWindowId && event.type == "ButtonRelease")
                this._server.destroyWindow(this._wm, this._clientWindowId);
        },
        handleEvent: function(event) {
            if (event.windowId == this._closeWindowId)
                return this._handleButtonEvent(event);
            if (event.windowId == this.frameWindowId)
                return this._handleFrameEvent(event);
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
                else
                    this._server.allowEvents(this, "Replay");
                break;

            // These should only happen for frame windows.
            case "ButtonRelease":
            case "Motion":
            case "Expose":
            case "Enter":
            case "Leave":
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

            // Map the original window, now that we've reparented it
            // back into the frame.
            this._server.mapWindow(this, event.windowId);
        },
        register: function(windowId, frame) {
            this._windowFrames[windowId] = frame;
        },
    });

    exports.WindowManager = WindowManager;

})(window);
