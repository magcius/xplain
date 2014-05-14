(function(exports) {
    "use strict";

    function valueUpdated(a, b) {
        return a !== undefined && a !== b;
    }

    var FRAME_BORDER = { top: 30, left: 4, right: 4, bottom: 4 };

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

            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        },

        _constrainNewSize: function(clientGeometry) {
            var defaultMinSize = 50; // Reasonable size

            var minWidth = this._display.getProperty({ windowId: this._clientWindowId, name: 'MIN_WIDTH' });
            if (!minWidth)
                minWidth = defaultMinSize;
            if (clientGeometry.width < minWidth)
                clientGeometry.width = minWidth;

            var minHeight = this._display.getProperty({ windowId: this._clientWindowId, name: 'MIN_HEIGHT' });
            if (!minHeight)
                minHeight = defaultMinSize;
            if (clientGeometry.height < minHeight)
                clientGeometry.height = minHeight;
        },

        _updateGeometry: function(clientGeometry) {
            var border = FRAME_BORDER;
            var positionUpdated = false;
            var sizeUpdated = false;

            if (valueUpdated(clientGeometry.x, this._frameGeometry.x)) {
                this._frameGeometry.x = clientGeometry.x;
                positionUpdated = true;
            }

            if (valueUpdated(clientGeometry.y, this._frameGeometry.y)) {
                this._frameGeometry.y = clientGeometry.y;
                positionUpdated = true;
            }

            this._constrainNewSize(clientGeometry);

            if (valueUpdated(clientGeometry.width, this._clientGeometry.width)) {
                this._clientGeometry.width = clientGeometry.width;
                this._frameGeometry.width = clientGeometry.width + border.left + border.right;
                sizeUpdated = true;
            }

            if (valueUpdated(clientGeometry.height, this._clientGeometry.height)) {
                this._clientGeometry.height = clientGeometry.height;
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
            }
        },

        _makeButton: function() {
            var size = 16;
            var geom = { x: 0, y: 0, width: size, height: size };
            var buttonWindowId = this._display.createWindow(geom);
            this._wm.register(buttonWindowId, this);
            this._display.selectInput({ windowId: buttonWindowId, events: ["ButtonPress", "ButtonRelease"] });
            this._display.changeAttributes({ windowId: buttonWindowId, cursor: "pointer" });
            this._display.reparentWindow({ windowId: buttonWindowId,
                                           newParentId: this._frameWindowId });
            this._display.mapWindow({ windowId: buttonWindowId });
            return buttonWindowId;
        },

        construct: function() {
            var geom = this._display.getGeometry({ drawableId: this._clientWindowId });
            geom.x -= FRAME_BORDER.left;
            geom.y -= FRAME_BORDER.top;

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
                                        events: ["SubstructureRedirect", "SubstructureNotify", "Expose", "ButtonPress", "FocusIn", "FocusOut", "Motion"] });

            var title = this._display.getProperty({ windowId: this._clientWindowId, name: "WM_NAME" });
            this._display.changeProperty({ windowId: this._frameWindowId, name: 'WM_NAME', value: 'Frame for "' + title + '"' });

            this._closeWindowId = this._makeButton();
            ClientUtil.loadImageAsPixmap(this._display, 'frame-close-button.png', function(pixmapId) {
                this._display.changeAttributes({ windowId: this._closeWindowId, backgroundPixmap: pixmapId });
                this._display.invalidateWindow({ windowId: this._closeWindowId });
            }.bind(this));
            this._display.changeProperty({ windowId: this._closeWindowId, name: 'WM_NAME', value: 'Close Button' });

            this._display.reparentWindow({ windowId: this._clientWindowId,
                                           newParentId: this._frameWindowId });
            this._display.mapWindow({ windowId: this._frameWindowId });

            this._updateGeometry(geom);
        },
        _unregister: function() {
            this._wm.unregister(this._frameWindowId);
            this._wm.unregister(this._clientWindowId);
            this._wm.unregister(this._closeWindowId);
        },
        destroy: function() {
            this._display.destroyWindow({ windowId: this._frameWindowId });
            this._wm.focusDefaultWindow();
            this._unregister();
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
        _getControl: function(x, y) {
            var topBorder = 4;
            var xDirection, yDirection;

            if (x < this._clientGeometry.x)
                xDirection = "left";
            else if (x < this._clientGeometry.x + this._clientGeometry.width)
                xDirection = "";
            else
                xDirection = "right";

            if (y < topBorder)
                yDirection = "top";
            else if (y < this._clientGeometry.y)
                yDirection = "titlebar";
            else if (y < this._clientGeometry.y + this._clientGeometry.height)
                yDirection = "";
            else
                yDirection = "bottom";

            // Special-case: treat titlebar-left as the same as left
            if (yDirection == "titlebar" && xDirection)
                return xDirection;

            // top-left, top-right, bottom-left, bottom-right
            if (xDirection && yDirection)
                return yDirection + "-" + xDirection;

            // left, right
            if (xDirection)
                return xDirection;

            // top, bottom
            if (yDirection)
                return yDirection;

            // client area, shouldn't ever happen
            return "";
        },
        _frameButtonPress: function(event) {
            if (event.button != 1)
                return;

            // If a client window doesn't select for ButtonPress / ButtonRelease,
            // then it will bubble up to us. Make sure that we don't start a grab
            // in that case.
            if (event.childWindowId != this._frameWindowId)
                return;

            this._grabControl = this._getControl(event.winX, event.winY);

            this._origMousePos = { x: event.rootX, y: event.rootY };

            var frameGeom = this._display.getGeometry({ drawableId: this._frameWindowId });
            var clientGeom = this._display.getGeometry({ drawableId: this._clientWindowId });
            this._origWindowGeom = { x: frameGeom.x, y: frameGeom.y, width: clientGeom.width, height: clientGeom.height };

            var cursor;
            if (this._grabControl == "titlebar")
                cursor = "grabbing";
            else
                cursor = this._grabControl;

            this._display.grabPointer({ windowId: this._frameWindowId,
                                        ownerEvents: false,
                                        events: ["ButtonRelease", "Motion"],
                                        pointerMode: "Async",
                                        cursor: cursor });
        },
        _frameButtonRelease: function(event) {
            if (event.button != 1)
                return;

            this._display.ungrabPointer({ windowId: this._frameWindowId });

            this._grabControl = null;
            this._origMousePos = null;
            this._origWindowGeom = null;
        },
        _grabbedMotion: function(event) {
            if (!this._grabControl) {
                var cursor;
                var control = this._getControl(event.winX, event.winY);
            }

            var x, y, w, h;

            var dx = event.rootX - this._origMousePos.x;
            var dy = event.rootY - this._origMousePos.y;

            switch (this._grabControl) {
                case "titlebar":
                case "left":
                case "top-left":
                case "bottom-left":
                    x = this._origWindowGeom.x + dx;
                    break;
            }

            switch (this._grabControl) {
                case "titlebar":
                case "top":
                case "top-left":
                case "top-right":
                    y = this._origWindowGeom.y + dy;
                    break;
            }

            switch (this._grabControl) {
                case "left":
                case "top-left":
                case "bottom-left":
                    w = this._origWindowGeom.width - dx;
                    break;
                case "right":
                case "top-right":
                case "bottom-right":
                    w = this._origWindowGeom.width + dx;
                    break;
            }

            switch (this._grabControl) {
                case "top":
                case "top-left":
                case "top-right":
                    h = this._origWindowGeom.height - dy;
                    break;
                case "bottom":
                case "bottom-left":
                case "bottom-right":
                    h = this._origWindowGeom.height + dy;
                    break;
            }

            this._updateGeometry({ x: x, y: y, width: w, height: h });
        },
        _notGrabbedMotion: function(event) {
            var cursor;
            var control = this._getControl(event.winX, event.winY);
            if (control == "titlebar")
                cursor = "";
            else
                cursor = control;

            this._display.changeAttributes({ windowId: this._frameWindowId, cursor: cursor });
        },
        _frameMotion: function(event) {
            if (this._grabControl)
                return this._grabbedMotion(event);
            else
                return this._notGrabbedMotion(event);
        },
        _frameFocusIn: function(event) {
            this._frameHasFocus = true;
            this._display.invalidateWindow({ windowId: this._frameWindowId });
        },
        _frameFocusOut: function(event) {
            // Don't lose focus when it's simply going to a child window.
            if (event.detail == "Inferior")
                return;

            this._frameHasFocus = false;
            this._display.invalidateWindow({ windowId: this._frameWindowId });
        },
        _draw: function() {
            this._display.drawTo(this._frameWindowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                // Background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, this._frameGeometry.width, this._frameGeometry.height);

                // Border
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black';
                ctx.strokeRect(0, 0, this._frameGeometry.width, this._frameGeometry.height);

                // Title text
                var title = this._display.getProperty({ windowId: this._clientWindowId, name: "WM_NAME" });
                if (title) {
                    ctx.fillStyle = this._frameHasFocus ? '#000' : '#aaa';
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
                this.destroy();
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
        initialize: function(server) {
            var connection = server.connect();
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));
            this._display = connection.display;
            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ["SubstructureRedirect", "SubstructureNotify"] });

            // window ID => WindowFrame
            this._windowFrames = {};
        },

        _handleEvent: function(event) {
            var frame = this._windowFrames[event.windowId];
            var frameWasReceiver = frame && frame.frameWasReceiver(event);

            switch (event.type) {
            case "MapRequest":
                return this._mapRequest(event);
            case "ConfigureRequest":
                return this._configureRequest(event, frame);
            case "UnmapNotify":
                if (frame && !frameWasReceiver)
                    return frame.destroy();
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
                if (frame)
                    return frame.handleEvent(event);
            }
        },
        _configureRequest: function(event, frame) {
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
        _mapRequest: function(event) {
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
