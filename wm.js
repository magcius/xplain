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

            if (positionUpdated || sizeUpdated) {
                var props = Object.create(this._frameGeometry);
                props.windowId = this._frameWindowId;
                this._server.configureWindow(props);
            }

            if (sizeUpdated) {
                // Update the client window
                var props = Object.create(this._clientGeometry);
                props.windowId = this._clientWindowId;
                this._server.configureWindow(props);

                this._server.configureWindow({ windowId: this._closeWindowId,
                                               x: border.left + this._clientGeometry.width - 20,
                                               y: 8 });

                // Invalidate the frame that's already been partially painted.
                this._server.invalidateWindow({ windowId: this._frameWindowId });
            }

            var shapeRegion = roundedRectRegion(this._frameGeometry, { topLeft: 10, topRight: 10 });
            this._server.setWindowShapeRegion({ windowId: this._frameWindowId,
                                                shapeType: "Bounding",
                                                region: shapeRegion });
            shapeRegion.finalize();
        },

        _makeButton: function() {
            var size = 15;
            var geom = { x: 0, y: 0, width: size, height: size };
            var buttonWindowId = this._server.createWindow(geom);
            this._wm.register(buttonWindowId, this);
            this._server.selectInput({ windowId: buttonWindowId, events: ["ButtonRelease"] });
            this._server.changeAttributes({ windowId: buttonWindowId, cursor: "pointer" });
            var radius = size / 2;
            var corners = { topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius };
            var shapeRegion = roundedRectRegion(geom, corners);
            this._server.setWindowShapeRegion({ windowId: buttonWindowId,
                                                shapeType: "Bounding",
                                                region: shapeRegion });
            this._server.reparentWindow({ windowId: buttonWindowId,
                                          newParentId: this._frameWindowId });
            this._server.mapWindow({ windowId: buttonWindowId });
            return buttonWindowId;
        },

        construct: function() {
            var geom = this._server.getGeometry({ windowId: this._clientWindowId });

            this._wm.register(this._clientWindowId, this);
            this._server.grabButton({ windowId: this._clientWindowId,
                                      button: 1,
                                      ownerEvents: false,
                                      events: ["ButtonPress", "ButtonRelease"],
                                      pointerMode: "Sync",
                                      cursor: "" });

            this._frameWindowId = this._server.createWindow(geom);
            this._wm.register(this._frameWindowId, this);
            this._server.selectInput({ windowId: this._frameWindowId,
                                       events: ["SubstructureRedirect", "SubstructureNotify", "Expose", "ButtonPress", "FocusIn", "FocusOut"] });
            this._server.changeAttributes({ windowId: this._frameWindowId, hasInput: true, backgroundColor: 'orange' });

            this._closeWindowId = this._makeButton();
            this._server.changeAttributes({ windowId: this._closeWindowId, backgroundColor: 'red' });

            this._server.reparentWindow({ windowId: this._clientWindowId,
                                          newParentId: this._frameWindowId });
            this._server.mapWindow({ windowId: this._frameWindowId });

            this._updateGeometry(geom);
        },
        destroy: function() {
            this._server.destroyWindow({ windowId: this._frameWindowId });
        },
        unregister: function() {
            this._wm.unregister(this._frameWindowId);
            this._wm.unregister(this._clientWindowId);
            this._wm.unregister(this._closeWindowId);
        },
        frameWasReceiver: function(event) {
            // The frame has several internal helper windows for buttons, etc.
            // that we want to respond to. Just check if it's the client window
            // ID or not.
            return event.windowId != this._clientWindowId;
        },

        _configureRequestStack: function(event) {
            this._server.configureWindow({ windowId: this._frameWindowId,
                                           stackMode: event.detail });
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
            case "FocusIn":
                return this._frameFocusIn(event);
            case "FocusOut":
                return this._frameFocusOut(event);
            case "Expose":
                return this._frameExpose(event.ctx);
            }
        },
        _frameButtonPress: function(event) {
            this._origMousePos = { x: event.rootX, y: event.rootY };
            var frameCoords = this._server.getGeometry({ windowId: this._frameWindowId });
            this._origWindowPos = { x: frameCoords.x, y: frameCoords.y };
            this._server.grabPointer({ windowId: this._frameWindowId,
                                       ownerEvents: true,
                                       events: ["ButtonRelease", "Motion"],
                                       pointerMode: "Async",
                                       cursor: "-moz-grabbing" });
        },
        _frameButtonRelease: function(event) {
            this._server.ungrabPointer({ windowId: this._frameWindowId });

            this._origMousePos = null;
            this._origWindowPos = null;
        },
        _frameMotion: function(event) {
            var newX = this._origWindowPos.x + event.rootX - this._origMousePos.x;
            var newY = this._origWindowPos.y + event.rootY - this._origMousePos.y;
            this._updateGeometry({ x: newX, y: newY });
        },
        _frameFocusIn: function(event) {
            try {
                this._server.changeAttributes({ windowId: this._frameWindowId, backgroundColor: 'yellow' });
                this._server.invalidateWindow({ windowId: this._frameWindowId });
            } catch(e) {
                // Clicking on the close button will destroy the client window,
                // causing the focus to revert to PointerRoot. The frame isn't
                // destroyed yet -- the UnmapNotify is still in the queue. Thus,
                // we get a FocusIn on the button window, as that's where the
                // pointer is. We'll process the UnmapNotify, destroy the window,
                // and then go to process the FocusIn, but fail with a BadWindow.
                // Ignore it.
            }
        },
        _frameFocusOut: function(event) {
            if (event.detail == "Inferior")
                return;

            try {
                this._server.changeAttributes({ windowId: this._frameWindowId, backgroundColor: 'orange' });
                this._server.invalidateWindow({ windowId: this._frameWindowId });
            } catch(e) {
                // It's possible for us to get a FocusOut event after the frame
                // has been destroyed on the server side. In this case, just ignore
                // the BadWindow that comes back.
            }
        },
        _frameExpose: function() {
            // background color takes care of the base

            // Draw title.
            var title = this._server.getProperty({ windowId: this._clientWindowId,
                                                   name: "WM_NAME" });
            if (title) {
                var geom = this._server.getGeometry({ windowId: this._clientWindowId });
                this._server.drawWithContext(this._frameWindowId, function(ctx) {
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.font = '12pt sans-serif';
                    ctx.fillText(title, geom.width / 2, 21);
                });
            }

            this._server.clearDamage({ windowId: this._frameWindowId, region: "Full" });
        },
        _handleButtonEvent: function(event) {
            if (event.windowId == this._closeWindowId && event.type == "ButtonRelease")
                this._server.destroyWindow({ windowId: this._clientWindowId });
        },
        handleEvent: function(event) {
            if (event.windowId == this._closeWindowId)
                return this._handleButtonEvent(event);
            if (event.windowId == this._frameWindowId)
                return this._handleFrameEvent(event);
        },
        raise: function() {
            this._server.configureWindow({ windowId: this._frameWindowId, stackMode: "Above" });
        },
        focus: function() {
            this._server.setInputFocus({ windowId: this._clientWindowId, revert: "PointerRoot" });
        },
    });

    var WindowManager = new Class({
        connect: function(server) {
            this._privateServer = server;
            var connection = this._privateServer.clientConnected(this);
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this.handleEvent(messageEvent.data);
            }.bind(this));
            this._server = connection.server;
            this._server.selectInput({ windowId: this._server.rootWindowId,
                                       events: ["SubstructureRedirect", "SubstructureNotify"] });

            // window ID => WindowFrame
            this._windowFrames = {};
        },

        handleEvent: function(event) {
            var frame = this._windowFrames[event.windowId];
            var frameWasReceiver = frame && frame.frameWasReceiver(event);

            switch (event.type) {
            case "MapRequest":
                return this.mapRequest(event);
            case "ConfigureRequest":
                return this.configureRequest(event, frame);
            case "UnmapNotify":
                if (!frameWasReceiver)
                    return frame.destroy();
                break;
            case "DestroyNotify":
                if (!frameWasReceiver)
                    return frame.unregister();
                break;
            case "ButtonPress":
                // Raise on click.
                frame.raise();
                frame.focus();
                if (frameWasReceiver)
                    return frame.handleEvent(event);
                else
                    this._server.allowEvents("Replay");
                break;

                // These should only happen for frame windows.
            case "ButtonRelease":
            case "Motion":
            case "Expose":
            case "FocusIn":
            case "FocusOut":
                return frame.handleEvent(event);
            }
        },
        configureRequest: function(event, frame) {
            // If we don't have a frame for a window, it was never
            // mapped, simply re-configure the window with whatever
            // it requested.
            if (!frame) {
                this._server.configureWindow({ windowId: event.windowId, 
                                               x: event.x, y: event.y,
                                               width: event.width, height: event.height });
            } else {
                // The frame will move/resize the window to its
                // client coordinates.
                frame.configureRequest(event);
            }
        },
        mapRequest: function(event) {
            var frame = new WindowFrame(this, this._server, event.windowId);

            // Reparent the original window and map the frame.
            frame.construct();

            // Map the original window, now that we've reparented it
            // back into the frame.
            this._server.mapWindow({ windowId: event.windowId });

            frame.focus();
        },
        register: function(windowId, frame) {
            this._windowFrames[windowId] = frame;
        },
        unregister: function(windowId) {
            this._windowFrames[windowId] = null;
        },
    });

    exports.WindowManager = WindowManager;

})(window);
