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

    // Don't extend Window as this needs to be in the
    // WM client, not its own client.
    var WindowFrame = new Class({
        initialize: function(wm, display, windowId) {
            this._wm = wm;
            this._display = display;
            this._clientWindowId = windowId;

            // Client geometry relative to the parent frame
            this._clientGeometry = {};

            // Frame geometry relative to the root
            this._frameGeometry = {};

            this._exposeHandler = new ExposeHandler(this._draw.bind(this));
        },

        _updateGeometry: function(clientGeometry) {
            var border = { top: 30, left: 1, right: 1, bottom: 1 };
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
                this._display.configureWindow(props);
            }

            if (sizeUpdated) {
                // Update the client window
                var props = Object.create(this._clientGeometry);
                props.windowId = this._clientWindowId;
                this._display.configureWindow(props);

                this._display.configureWindow({ windowId: this._closeWindowId,
                                                x: border.left + this._clientGeometry.width - 20,
                                                y: 8 });

                // Invalidate the frame that's already been partially painted.
                this._display.invalidateWindow({ windowId: this._frameWindowId });

                var shapeRegion = Util.roundedRectRegion(this._frameGeometry, { topLeft: 10, topRight: 10 });
                this._display.setWindowShapeRegion({ windowId: this._frameWindowId,
                                                     shapeType: "Bounding",
                                                     region: shapeRegion });
                shapeRegion.finalize();
            }
        },

        _makeButton: function() {
            var size = 15;
            var geom = { x: 0, y: 0, width: size, height: size };
            var buttonWindowId = this._display.createWindow(geom);
            this._wm.register(buttonWindowId, this);
            this._display.selectInput({ windowId: buttonWindowId, events: ["ButtonPress", "ButtonRelease"] });
            this._display.changeAttributes({ windowId: buttonWindowId, cursor: "pointer" });
            var radius = size / 2;
            var corners = { topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius };
            var shapeRegion = Util.roundedRectRegion(geom, corners);
            this._display.setWindowShapeRegion({ windowId: buttonWindowId,
                                                 shapeType: "Bounding",
                                                 region: shapeRegion });
            shapeRegion.finalize();
            this._display.reparentWindow({ windowId: buttonWindowId,
                                           newParentId: this._frameWindowId });
            this._display.mapWindow({ windowId: buttonWindowId });
            return buttonWindowId;
        },

        construct: function() {
            var geom = this._display.getGeometry({ drawableId: this._clientWindowId });

            this._wm.register(this._clientWindowId, this);
            this._display.grabButton({ windowId: this._clientWindowId,
                                       button: 1,
                                       ownerEvents: false,
                                       events: ["ButtonPress", "ButtonRelease"],
                                       pointerMode: "Sync",
                                       cursor: "" });

            this._frameWindowId = this._display.createWindow(geom);
            this._wm.register(this._frameWindowId, this);
            this._display.selectInput({ windowId: this._frameWindowId,
                                        events: ["SubstructureRedirect", "SubstructureNotify", "Expose", "ButtonPress", "FocusIn", "FocusOut"] });
            this._display.changeAttributes({ windowId: this._frameWindowId, hasInput: true, backgroundColor: 'orange' });

            this._closeWindowId = this._makeButton();
            this._display.changeAttributes({ windowId: this._closeWindowId, backgroundColor: 'red' });

            this._display.reparentWindow({ windowId: this._clientWindowId,
                                           newParentId: this._frameWindowId });
            this._display.mapWindow({ windowId: this._frameWindowId });

            this._updateGeometry(geom);
        },
        destroy: function() {
            this._display.destroyWindow({ windowId: this._frameWindowId });
            this._wm.focusDefaultWindow();
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
            this._display.configureWindow({ windowId: this._frameWindowId,
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
                return this._frameExpose(event);
            }
        },
        _frameButtonPress: function(event) {
            if (event.button != 1)
                return;

            // If a client window doesn't select for ButtonPress / ButtonRelease,
            // then it will bubble up to us. Make sure that we don't start a grab
            // in that case.
            if (event.childWindowId != this._frameWindowId)
                return;

            this._origMousePos = { x: event.rootX, y: event.rootY };
            var frameCoords = this._display.getGeometry({ drawableId: this._frameWindowId });
            this._origWindowPos = { x: frameCoords.x, y: frameCoords.y };
            this._display.grabPointer({ windowId: this._frameWindowId,
                                        ownerEvents: true,
                                        events: ["ButtonRelease", "Motion"],
                                        pointerMode: "Async",
                                        cursor: "grabbing" });
        },
        _frameButtonRelease: function(event) {
            if (event.button != 1)
                return;

            // See above.
            if (event.childWindowId != this._frameWindowId)
                return;

            this._display.ungrabPointer({ windowId: this._frameWindowId });

            this._origMousePos = null;
            this._origWindowPos = null;
        },
        _frameMotion: function(event) {
            if (!this._origMousePos)
                return;

            var newX = this._origWindowPos.x + event.rootX - this._origMousePos.x;
            var newY = this._origWindowPos.y + event.rootY - this._origMousePos.y;
            this._updateGeometry({ x: newX, y: newY });
        },
        _frameFocusIn: function(event) {
            this._display.changeAttributes({ windowId: this._frameWindowId, backgroundColor: 'yellow' });
            this._display.invalidateWindow({ windowId: this._frameWindowId });
        },
        _frameFocusOut: function(event) {
            if (event.detail == "Inferior")
                return;

            this._display.changeAttributes({ windowId: this._frameWindowId, backgroundColor: 'orange' });
            this._display.invalidateWindow({ windowId: this._frameWindowId });
        },
        _draw: function() {
            this._display.drawTo(this._frameWindowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                var title = this._display.getProperty({ windowId: this._clientWindowId,
                                                        name: "WM_NAME" });
                if (title) {
                    ctx.fillStyle = '#000';
                    ctx.textAlign = 'center';
                    ctx.font = '12pt sans-serif';
                    ctx.fillText(title, this._frameGeometry.width / 2, 21);
                }
            }.bind(this));
        },
        _frameExpose: function(event) {
            this._exposeHandler.handleExpose(event);
        },
        _handleButtonEvent: function(event) {
            if (event.windowId == this._closeWindowId && event.type == "ButtonRelease")
                this._display.destroyWindow({ windowId: this._clientWindowId });
        },
        handleEvent: function(event) {
            if (event.windowId == this._closeWindowId)
                return this._handleButtonEvent(event);
            if (event.windowId == this._frameWindowId)
                return this._handleFrameEvent(event);
        },
        raise: function() {
            this._display.configureWindow({ windowId: this._frameWindowId, stackMode: "Above" });
        },
        focus: function() {
            this._display.setInputFocus({ windowId: this._clientWindowId, revert: "PointerRoot" });
        },
    });

    var WindowManager = new Class({
        connect: function(server) {
            this._privateServer = server;
            var connection = this._privateServer.connect();
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this.handleEvent(messageEvent.data);
            }.bind(this));
            this._display = connection.display;
            this._display.selectInput({ windowId: this._display.rootWindowId,
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
                if (frame && !frameWasReceiver)
                    return frame.destroy();
                break;
            case "DestroyNotify":
                if (frame && !frameWasReceiver)
                    return frame.unregister();
                break;
            case "ButtonPress":
                // Raise on click.
                frame.raise();
                frame.focus();
                if (frameWasReceiver)
                    return frame.handleEvent(event);
                else
                    this._display.allowEvents({ pointerMode: "Replay" });
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
                this._display.configureWindow({ windowId: event.windowId, 
                                                x: event.x, y: event.y,
                                                width: event.width, height: event.height });
            } else {
                // The frame will move/resize the window to its
                // client coordinates.
                frame.configureRequest(event);
            }
        },
        _wantsFrame: function(windowId) {
            var windowType = this._display.getProperty({ windowId: windowId,
                                                         name: "_NET_WM_WINDOW_TYPE" });

            if (!windowType)
                windowType = "_NET_WM_WINDOW_TYPE_NORMAL";

            // XXX -- support all window types
            switch (windowType) {
            case "_NET_WM_WINDOW_TYPE_DOCK":
                return false;
            case "_NET_WM_WINDOW_TYPE_NORMAL":
                return true;
            }
        },
        mapRequest: function(event) {
            if (this._wantsFrame(event.windowId)) {
                var frame = new WindowFrame(this, this._display, event.windowId);

                // Reparent the original window and map the frame.
                frame.construct();

                // Map the original window, now that we've reparented it
                // back into the frame.
                this._display.mapWindow({ windowId: event.windowId });

                frame.focus();
            } else {
                // XXX -- we should have a Window abstraction like we do
                // for frames.
                this._display.mapWindow({ windowId: event.windowId });
                this.focusDefaultWindow();
            }
        },
        register: function(windowId, frame) {
            this._windowFrames[windowId] = frame;
        },
        unregister: function(windowId) {
            this._windowFrames[windowId] = null;
        },

        _getDefaultWindow: function() {
            var tree = this._display.queryTree({ windowId: this._display.rootWindowId });
            var children = tree.children;
            if (!children.length)
                return null;
            var windowId = children.slice(-1)[0];
            var frame = this._windowFrames[windowId];
            if (!frame)
                return null;
            return frame;
        },
        focusDefaultWindow: function() {
            var frame = this._getDefaultWindow();
            if (!frame)
                return;
            frame.focus();
        },
    });

    exports.WindowManager = WindowManager;

})(window);
