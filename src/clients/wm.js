(function(exports) {
    "use strict";

    function valueUpdated(a, b) {
        return a !== undefined && a !== b;
    }

    var FRAME_BORDER = { top: 30, left: 4, right: 4, bottom: 4 };

    var WindowFrameButton = new Class({
        initialize: function(frame, display, onClick) {
            this._frame = frame;
            this._display = display;
            this._onClick = onClick;
            this.hover = false;
            this.visible = false;

            var size = 16;
            this.windowId = this._display.createWindow({ x: 0, y: 0, width: size, height: size, inputOnly: true });
            this._display.selectInput({ windowId: this.windowId, events: ['Enter', 'Leave', 'ButtonPress', 'ButtonRelease'] });
            this._display.changeAttributes({ windowId: this.windowId, cursor: 'pointer' });
        },
        setVisible: function(visible) {
            this.visible = visible;
            if (this.visible)
                this._display.mapWindow({ windowId: this.windowId });
            else
                this._display.unmapWindow({ windowId: this.windowId });
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "Enter":
                this.hover = true;
                return this._frame.redraw();
            case "Leave":
                this.hover = false;
                return this._frame.redraw();
            case "ButtonRelease":
                return this._onClick();
            }
        },
    });

    // Don't extend Window as this needs to be in the
    // WM client, not its own client.
    var WindowFrame = new Class({
        initialize: function(wm, display, windowId) {
            this._wm = wm;
            this._display = display;
            this._clientWindowId = windowId;
            this._destroyed = false;

            // Client geometry relative to the parent frame
            this._clientGeometry = {};

            // Frame geometry relative to the root
            this._frameGeometry = {};

            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        },

        _constrainNewSize: function(clientGeometry) {
            var normalHints = this._display.getProperty({ windowId: this._clientWindowId, name: 'WM_NORMAL_HINTS' });
            if (!normalHints)
                return;

            if (clientGeometry.width !== undefined && normalHints.minWidth !== undefined)
                clientGeometry.width = Math.max(clientGeometry.width, normalHints.minWidth);
            if (clientGeometry.height !== undefined && normalHints.minHeight !== undefined)
                clientGeometry.height = Math.max(clientGeometry.height, normalHints.minHeight);
            if (clientGeometry.width !== undefined && normalHints.maxWidth !== undefined)
                clientGeometry.width = Math.min(clientGeometry.width, normalHints.maxWidth);
            if (clientGeometry.height !== undefined && normalHints.maxHeight !== undefined)
                clientGeometry.height = Math.min(clientGeometry.height, normalHints.maxHeight);
        },

        _updateGeometry: function(clientGeometry) {
            var border = FRAME_BORDER;
            var positionUpdated = false;
            var sizeUpdated = false;

            // The passed in geometry is client geometry in root coordinates, which means
            // that the frame geometry is offset by the border...
            if (valueUpdated(clientGeometry.x, this._frameGeometry.x)) {
                this._frameGeometry.x = clientGeometry.x - border.left;
                positionUpdated = true;
            }

            if (valueUpdated(clientGeometry.y, this._frameGeometry.y)) {
                this._frameGeometry.y = clientGeometry.y - border.top;
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

            this._display.changeProperty({ windowId: this._clientWindowId, name: '_NET_WM_FRAME_EXTENTS', value: FRAME_BORDER });

            if (sizeUpdated) {
                // Update the client window
                var props = Object.create(this._clientGeometry);
                props.windowId = this._clientWindowId;
                this._display.configureWindow(props);

                this._display.configureWindow({ windowId: this._closeButton.windowId,
                                                x: border.left + this._clientGeometry.width - 20,
                                                y: 8 });

                // Invalidate the frame that's already been partially painted.
                this._display.invalidateWindow({ windowId: this._frameWindowId });
            }

            if (!sizeUpdated) {
                var configureEvent = {};
                configureEvent.type = 'ConfigureNotify';
                configureEvent.x = this._frameGeometry.x;
                configureEvent.y = this._frameGeometry.y;
                configureEvent.width = this._clientGeometry.width;
                configureEvent.height = this._clientGeometry.height;
                this._display.sendEvent({ destinationId: this._clientWindowId,
                                          event: configureEvent });
            }
        },

        _makeButton: function(onClick) {
            var size = 16;
            var button = new WindowFrameButton(this, this._display, onClick);
            this._display.reparentWindow({ windowId: button.windowId,
                                           newParentId: this._frameWindowId });
            this._wm.register(button.windowId, this);
            return button;
        },

        _syncButtonActions: function() {
            var actions = this._display.getProperty({ windowId: this._clientWindowId, name: '_XJS_ACTIONS' });
            var shouldShowClose = !actions || actions.hasClose === true;
            this._closeButton.setVisible(shouldShowClose);
        },
        _onCloseClicked: function() {
            return this.destroy();
        },

        _getGravity: function() {
            var normalHints = this._display.getProperty({ windowId: this._clientWindowId, name: 'WM_NORMAL_HINTS' });
            if (normalHints && normalHints.winGravity)
                return normalHints.winGravity;
            else
                return "NorthWest";
        },
        _adjustForGravity: function(geom, gravity) {
            // The input here is 
            // We're trying to calculate the position of the client window, in *root* coordinates.
            // This is exactly what StaticGravity is, so if we're asked to calculate StaticGravity,
            // then switch away...
            if (gravity === "Static")
                return;

            var borderX = FRAME_BORDER.left + FRAME_BORDER.right;
            var borderY = FRAME_BORDER.top + FRAME_BORDER.bottom;

            switch (gravity) {
                case "North":
                case "Center":
                case "South":
                    geom.x -= borderX / 2;
                    break;
                case "NorthEast":
                case "East":
                case "SouthEast":
                    geom.x -= borderX;
                default:
                    break;
            }

            switch (gravity) {
                case "West":
                case "Center":
                case "East":
                    geom.y -= borderY / 2;
                    break;
                case "SouthWest":
                case "South":
                case "SouthEast":
                    geom.y -= borderY;
                default:
                    break;
            }

            var childX = FRAME_BORDER.left;
            var childY = FRAME_BORDER.top;
            geom.x += childX;
            geom.y += childY;
        },

        construct: function() {
            var geom = this._display.getGeometry({ drawableId: this._clientWindowId });
            this._adjustForGravity(geom, this._getGravity());

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
            if (!title)
                title = this._display.getProperty({ windowId: this._clientWindowId, name: "DEBUG_NAME" });
            if (!title)
                title = "Window " + this._clientWindowId;

            this._display.changeProperty({ windowId: this._frameWindowId, name: 'DEBUG_NAME', value: 'Frame for "' + title + '"' });
            this._display.changeProperty({ windowId: this._frameWindowId, name: '_XJS_FRAME', value: true });

            this._closeButton = this._makeButton(this._onCloseClicked.bind(this));
            this._display.changeProperty({ windowId: this._closeButton.windowId, name: 'DEBUG_NAME', value: 'Close Button' });

            this._syncButtonActions();

            this._display.reparentWindow({ windowId: this._clientWindowId,
                                           newParentId: this._frameWindowId });
            this._display.mapWindow({ windowId: this._frameWindowId });

            this._updateGeometry(geom);
        },
        _unregister: function() {
            this._wm.unregister(this._frameWindowId);
            this._wm.unregister(this._clientWindowId);
            this._wm.unregister(this._closeButton.windowId);
        },
        destroy: function() {
            this._destroyed = true;

            // Force the window unmapped, and then reparent it to the root so
            // that we don't destroy it when we destroy the frame.
            this._display.unmapWindow({ windowId: this._clientWindowId });
            this._display.reparentWindow({ windowId: this._clientWindowId, newParentId: this._display.rootWindowId });

            this._display.destroyWindow({ windowId: this._frameWindowId });
            this._unregister();
            this._wm.focusDefaultWindow();
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
            this._adjustForGravity(event, this._getGravity());
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
        _getControlInner: function(x, y) {
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
        _getControl: function(x, y) {
            var control = this._getControlInner(x, y);
            var normalHints = this._display.getProperty({ windowId: this._clientWindowId, name: 'WM_NORMAL_HINTS' });

            var yConstrained = normalHints && normalHints.minHeight !== undefined && normalHints.minHeight === normalHints.maxHeight;
            if (yConstrained && (control.startsWith("top") || control.startsWith("bottom")))
                return "";

            var xConstrained = normalHints && normalHints.minWidth !== undefined && normalHints.minWidth === normalHints.maxWidth;
            if (xConstrained && (control.endsWith("left") || control.endsWith("right")))
                return "";

            return control;
        },
        _frameButtonPress: function(event) {
            if (event.button != 1)
                return false;

            // If a client window doesn't select for ButtonPress / ButtonRelease,
            // then it will bubble up to us. Make sure that we don't start a grab
            // in that case.
            if (event.childWindowId != this._frameWindowId)
                return false;

            this._grabControl = this._getControl(event.winX, event.winY);
            if (!this._grabControl)
                return false;

            this._origMousePos = { x: event.rootX, y: event.rootY };

            var clientRootPos = this._display.translateCoordinates({ srcWindowId: this._clientWindowId,
                                                                     destWindowId: this._display.rootWindowId,
                                                                     x: 0, y: 0 });
            var clientGeom = this._display.getGeometry({ drawableId: this._clientWindowId });

            this._origWindowGeom = { x: clientRootPos.x, y: clientRootPos.y, width: clientGeom.width, height: clientGeom.height };

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
            return true;
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
        redraw: function() {
            if (this._destroyed)
                return;
            this._display.invalidateWindow({ windowId: this._frameWindowId });
        },
        _frameFocusIn: function(event) {
            this._frameHasFocus = true;
            this.redraw();
        },
        _frameFocusOut: function(event) {
            // Don't lose focus when it's simply going to a child window.
            if (event.detail == "Inferior")
                return;

            this._frameHasFocus = false;
            this.redraw();
        },
        _draw: function() {
            this._display.drawTo(this._frameWindowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                // Background
                var gradient = ctx.createLinearGradient(0, 0, 0, FRAME_BORDER.top);
                gradient.addColorStop(0, '#eee');
                gradient.addColorStop(1, '#aaa');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, this._frameGeometry.width, this._frameGeometry.height);

                ctx.lineWidth = 6;
                if (this._frameHasFocus)
                    ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
                else
                    ctx.strokeStyle = 'rgba(255, 255, 255, .4)';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(this._frameGeometry.width, 0);
                ctx.stroke();

                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, .6)';
                ctx.shadowBlur = 4;
                ctx.fillRect(this._clientGeometry.x, this._clientGeometry.y, this._clientGeometry.width, this._clientGeometry.height);
                ctx.restore();

                // Border around client.
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.strokeRect(this._clientGeometry.x, this._clientGeometry.y, this._clientGeometry.width, this._clientGeometry.height);

                // Border around frame.
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.strokeRect(0, 0, this._frameGeometry.width, this._frameGeometry.height);

                // Title text
                var title = this._display.getProperty({ windowId: this._clientWindowId, name: "WM_NAME" });
                if (title) {
                    ctx.save();
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 12pt sans-serif';
                    if (this._frameHasFocus)
                        ctx.fillStyle = '#000';
                    else
                        ctx.fillStyle = '#666';
                    ctx.fillText(title, this._frameGeometry.width / 2, 21);
                    ctx.restore();
                }

                // Close button.
                if (this._closeButton.visible) {
                    var closeButtonGeom = this._display.getGeometry({ drawableId: this._closeButton.windowId });
                    if (this._closeButton.hover)
                        ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
                    else
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                    ctx.beginPath();
                    ctx.arc(closeButtonGeom.x + closeButtonGeom.width / 2, closeButtonGeom.y + closeButtonGeom.height / 2, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            }.bind(this));
        },
        _frameExpose: function(event) {
            this._exposeHandler.handleExpose(event);
        },
        handleEvent: function(event) {
            if (event.windowId == this._closeButton.windowId)
                return this._closeButton.handleEvent(event);
            if (event.windowId == this._frameWindowId)
                return this._handleFrameEvent(event);
        },
        raise: function() {
            this._display.configureWindow({ windowId: this._frameWindowId, stackMode: "Above" });
        },
        focus: function() {
            this._display.setInputFocus({ windowId: this._clientWindowId });
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
            case "Enter":
            case "Leave":
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
