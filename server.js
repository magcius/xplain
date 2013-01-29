(function(exports) {

    var DEBUG = false;

    function pathFromRegion(ctx, region) {
        region.iter_rectangles(function(rect) {
            ctx.rect(rect.x, rect.y, rect.width, rect.height);
        });
    }

    function sizeElement(elem, w, h) {
        elem.style.width = w + "px";
        elem.style.height = h + "px";
    }

    function positionElement(elem, x, y, w, h) {
        elem.style.position = "absolute";
        elem.style.left = x + "px";
        elem.style.top = y + "px";
        sizeElement(elem, w, h);
    }

    var ContextWrapper = new Class({
        initialize: function(serverWindow, ctx) {
            this._serverWindow = serverWindow;
            this._ctx = ctx;
        },

        drawWithContext: function(func) {
            var ctx = this._ctx;
            ctx.beginPath();
            ctx.save();
            this._serverWindow.prepareContext(ctx);
            func(ctx);
            ctx.restore();
        },

        clearDamage: function() {
            this._serverWindow.clearDamage();
        },
    });

    var ServerWindow = new Class({
        initialize: function(windowAttributes, windowId, server, ctx) {
            this._server = server;
            this.windowId = windowId;

            if (windowAttributes.hasInput) {
                this.inputWindow = document.createElement("div");
                this.inputWindow.classList.add("inputWindow");
            }

            this._backgroundColor = windowAttributes.backgroundColor || '#ddd';

            // The region of the window that needs to be redrawn, in window coordinates.
            this.damagedRegion = new Region();

            // The region of the screen that the window occupies, in parent coordinates.
            this.shapeRegion = new Region();

            this._ctxWrapper = new ContextWrapper(this, ctx);

            this._properties = {};

            // All child windows, sorted with the top-most window *first*.
            this.children = [];
        },
        finalize: function() {
            this.shapeRegion.finalize();
            this.shapeRegion = null;

            this.damagedRegion.finalize();
            this.damagedRegion = null;
        },
        _iterParents: function(includeSelf, callback) {
            var serverWindow = this;
            if (!includeSelf)
                serverWindow = serverWindow.parentServerWindow;

            while (serverWindow != null) {
                callback(serverWindow);
                serverWindow = serverWindow.parentServerWindow;
            }
        },
        calculateAbsoluteOffset: function(includeSelf) {
            var x = 0, y = 0;
            this._iterParents(includeSelf, function(serverWindow) {
                x += serverWindow.x;
                y += serverWindow.y;
            });
            return { x: x, y: y };
        },
        calculateTransformedShapeRegion: function() {
            var region = new Region();
            var txform = this.calculateAbsoluteOffset(false);
            region.copy(this.shapeRegion);
            region.translate(txform.x, txform.y);
            return region;
        },
        prepareContext: function(ctx) {
            var txform = this.calculateAbsoluteOffset(true);
            ctx.translate(txform.x, txform.y);

            var region = this.damagedRegion;
            pathFromRegion(ctx, region);
            ctx.clip();
        },
        clearDamage: function() {
            // Don't bother trashing our region here as
            // we'll clear it below.
            var txform = this.calculateAbsoluteOffset(true);
            this.damagedRegion.translate(txform.x, txform.y);
            this._server.subtractDamage(this.damagedRegion);
            this.damagedRegion.clear();
        },
        _drawBackground: function(ctx) {
            ctx.fillStyle = this._backgroundColor;
            ctx.fillRect(0, 0, this.width, this.height);
        },
        damage: function(region, ctx) {
            this.damagedRegion.union(this.damagedRegion, region);

            this._ctxWrapper.drawWithContext(this._drawBackground.bind(this));
            this._server.sendEvent({ type: "Expose",
                                     windowId: this.windowId,
                                     ctx: this._ctxWrapper });
        },

        reconfigure: function(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;

            this.shapeRegion.clear();
            this.shapeRegion.init_rect(x, y, width, height);

            if (this.inputWindow) 
                positionElement(this.inputWindow, x, y, width, height);

            this._server.sendEvent({ type: "ConfigureNotify",
                                     windowId: this.windowId,
                                     x: x, y: y, width: width, height: height });
        },

        changeProperty: function(name, value) {
            this._properties[name] = value;
            this._server.sendEvent({ type: "PropertyChanged",
                                     windowId: this.windowId,
                                     name: name, value: value });
        },
    });

    var ServerClient = new Class({
        initialize: function(client, server) {
            this._server = server;
            this._client = client;

            // window id => list of event types
            this._eventWindows = {};
        },

        _isInterestedInEvent: function(event) {
            var listeningFor = this._eventWindows[event.windowId];
            return listeningFor && listeningFor.indexOf(event.type) >= 0;
        },

        sendEvent: function(event) {
            this._client.handleEvent(event);
        },
        potentiallySendEvent: function(event) {
            if (this._isInterestedInEvent(event))
                return this.sendEvent(event);
        },

        selectInput: function(windowId, eventTypes) {
            var listeningFor = this._eventWindows[windowId];
            if (!listeningFor)
                listeningFor = this._eventWindows[windowId] = [];

            listeningFor.push.apply(listeningFor, eventTypes);
        },
    });

    var Server = new Class({
        initialize: function(width, height) {
            this._container = document.createElement("div");
            this._container.classList.add("crtc");
            sizeElement(this._container, width, height);
            this.elem = this._container;

            this._backgroundColor = 'rgb(51, 110, 165)';
            this.width = width;
            this.height = height;

            this._canvas = document.createElement("canvas");
            this._canvas.width = this.width;
            this._canvas.height = this.height;

            this._ctx = this._canvas.getContext('2d');
            this._container.appendChild(this._canvas);

            this._clients = [];

            this._nextWindowId = 0;
            this._windowsById = {};

            this._queueRedraw = new Task(this._redraw.bind(this));

            // The region of the screen that needs to be updated.
            this._damagedRegion = new Region();

            this._rootWindow = this._createRootWindow();
            this._container.appendChild(this._rootWindow.inputWindow);

            this._debugCanvas = document.createElement("canvas");
            this._debugCanvas.classList.add("debugCanvas");
            this._debugCanvas.width = this.width;
            this._debugCanvas.height = this.height;
            this._container.appendChild(this._debugCanvas);

            this._debugCtx = this._debugCanvas.getContext("2d");
            this._debugEnabled = DEBUG;
        },

        _createRootWindow: function() {
            var rootWindow = this._createWindowInternal({ hasInput: true, backgroundColor: this._backgroundColor });
            rootWindow.parentServerWindow = null;
            this.configureRequest(rootWindow.windowId, 0, 0, this.width, this.height);
            return rootWindow;
        },

        toggleDebug: function() {
            this._debugEnabled = !this._debugEnabled;
            if (!this._debugEnabled)
                this._debugDrawClear();
            this._container.classList.toggle("debug");
        },
        _debugDrawClear: function() {
            this._debugCtx.clearRect(0, 0, this._debugCtx.canvas.width, this._debugCtx.canvas.height);
        },

        queueFullRedraw: function() {
            var fullRegion = new Region();
            fullRegion.init_rect(0, 0, this.width, this.height);
            this.damageRegion(fullRegion);
            fullRegion.finalize();
        },

        _debugDrawRegion: function(region, style) {
            if (!this._debugEnabled)
                return;

            this._debugCtx.beginPath();
            this._debugCtx.save();
            pathFromRegion(this._debugCtx, region);
            this._debugCtx.fillStyle = style;
            this._debugCtx.globalAlpha = 0.4;
            this._debugCtx.fill();
            this._debugCtx.restore();
        },

        _iterWindowsAboveWindow: function(serverWindow, callback) {
            while (serverWindow != null && serverWindow.parentServerWindow != null) {
                var parent = serverWindow.parentServerWindow;
                var idx = parent.children.indexOf(serverWindow);
                var windowsOnTop = parent.children.slice(0, idx);
                windowsOnTop.forEach(callback);
                serverWindow = parent;
            }
        },

        _subtractAboveWindowsFromRegion: function(serverWindow, region) {
            this._iterWindowsAboveWindow(serverWindow, function(aboveWindow) {
                var transformedShapeRegion = aboveWindow.calculateTransformedShapeRegion();
                region.subtract(region, transformedShapeRegion);
                transformedShapeRegion.finalize();
            });
        },

        // For a given window, return the region that would be
        // immediately damaged if the window was removed. That is,
        // the window's shape region clipped to the areas that are
        // visible.
        _calculateEffectiveRegionForWindow: function(serverWindow) {
            var region = serverWindow.calculateTransformedShapeRegion();
            this._subtractAboveWindowsFromRegion(serverWindow, region);
            return region;
        },

        calculateDamagedRegionForWindow: function(serverWindow) {
            var region = serverWindow.calculateTransformedShapeRegion();
            region.intersect(region, this._damagedRegion);
            this._subtractAboveWindowsFromRegion(serverWindow, region);
            return region;
        },

        _redraw: function() {
            // The damaged region is global, not per-window. This function
            // walks all windows, computing the intersection of the global
            // damage and the window region, and translates it into window-
            // local coordinates.

            var intersection = new Region();

            // This is a copy of the damage region for calculating
            // the effective damage at every step. We don't want
            // to subtract damage until the client draws and clears
            // the damage.
            var calculatedDamageRegion = new Region();
            calculatedDamageRegion.copy(this._damagedRegion);

            if (this._debugEnabled)
                this._debugDrawClear();

            this._debugDrawRegion(calculatedDamageRegion, 'red');

            function iterateWindow(serverWindow) {
                // When we iterate over children, transform the damage region into the
                // child's parent space, which is the coordinate space of the shape region.
                calculatedDamageRegion.translate(-serverWindow.x, -serverWindow.y);
                serverWindow.children.forEach(iterateWindow);
                calculatedDamageRegion.translate(serverWindow.x, serverWindow.y);

                intersection.clear();
                intersection.intersect(calculatedDamageRegion, serverWindow.shapeRegion);

                if (intersection.not_empty()) {
                    calculatedDamageRegion.subtract(calculatedDamageRegion, intersection);

                    // The damage region is in window space, so we need to translate
                    // from parent space to window space. Don't bother translating
                    // back as the intersection will just be cleared next iteration.
                    intersection.translate(-serverWindow.x, -serverWindow.y);
                    serverWindow.damage(intersection);
                }
            }

            iterateWindow(this._rootWindow);

            intersection.finalize();
            calculatedDamageRegion.finalize();

            return false;
        },
        damageRegion: function(region) {
            this._damagedRegion.union(this._damagedRegion, region);
            this._queueRedraw();
        },
        subtractDamage: function(region) {
            this._damagedRegion.subtract(this._damagedRegion, region);
            // This is expected to be called after the client has painted,
            // so don't queue a repaint.
        },

        clientConnected: function(client) {
            var serverClient = new ServerClient(client, this);
            client._serverClient = serverClient;
            this._clients.push(serverClient);
        },
        selectInput: function(client, windowId, eventTypes) {
            var serverClient = client._serverClient;
            serverClient.selectInput(windowId, eventTypes);
        },
        sendEvent: function(event) {
            this._clients.forEach(function(client) {
                client.potentiallySendEvent(event);
            });
        },

        // Used by _createRootWindow and createWindow.
        _createWindowInternal: function(properties) {
            var windowId = ++this._nextWindowId;
            var serverWindow = new ServerWindow(properties, windowId, this, this._ctx);
            this._windowsById[windowId] = serverWindow;

            return serverWindow;
        },

        _unparentWindow: function(serverWindow) {
            var parentServerWindow = serverWindow.parentServerWindow;
            if (parentServerWindow.inputWindow && serverWindow.inputWindow)
                parentServerWindow.inputWindow.removeChild(serverWindow.inputWindow);
            if (parentServerWindow)
                parentServerWindow.children.erase(serverWindow);
        },

        _parentWindow: function(serverWindow, parentServerWindow) {
            serverWindow.parentServerWindow = parentServerWindow;
            parentServerWindow.children.unshift(serverWindow);

            // XXX -- handle input windows inside output-only windows
            if (parentServerWindow.inputWindow && serverWindow.inputWindow)
                parentServerWindow.inputWindow.appendChild(serverWindow.inputWindow);
        },

        createWindow: function(properties) {
            var serverWindow = this._createWindowInternal(properties);
            this._parentWindow(serverWindow, this._rootWindow);
            return serverWindow.windowId;
        },

        destroyWindow: function(windowId) {
            var serverWindow = this._windowsById[windowId];

            this._unparentWindow(serverWindow);

            var region = this._calculateEffectiveRegionForWindow(serverWindow);
            this.damageRegion(region);
            region.finalize();

            serverWindow.finalize();
        },

        reparentWindow: function(windowId, newParentId) {
            var serverWindow = this._windowsById[windowId];
            var newServerParentWindow = this._windowsById[newParentId];
            this._unparentWindow(serverWindow);
            this._parentWindow(serverWindow, newServerParentWindow);
        },

        configureRequest: function(windowId, x, y, width, height) {
            var serverWindow = this._windowsById[windowId];

            // This is a bit fancy. We need to accomplish a few things:
            //
            //   * If the window was resized, we need to ensure we mark
            //     the newly exposed region on the window itself as
            //     damaged.
            //
            //   * If the window was moved, we need to ensure we mark
            //     the newly exposed region under the old position of
            //     the window as damaged.
            //
            //   * If the area on top of the window was damaged before
            //     the reconfigure, we need to ensure we move that
            //     damaged region to the new coordinates.
            //
            //   * Make sure we prevent exposing as much as possible.
            //     If a window somewhere below the stack moves behind
            //     another window completely, we should only mark the
            //     newly exposed region.

            var oldRegion = this._calculateEffectiveRegionForWindow(serverWindow);
            var oldTxform = serverWindow.calculateAbsoluteOffset(true);
            var oldX = oldTxform.x, oldY = oldTxform.y;
            var oldW = serverWindow.width, oldH = serverWindow.height;

            // Reconfigure the window -- this will modify the shape region.
            serverWindow.reconfigure(x, y, width, height);

            var newRegion = this._calculateEffectiveRegionForWindow(serverWindow);
            var newTxform = serverWindow.calculateAbsoluteOffset(true);
            var newX = newTxform.x, newY = newTxform.y;

            var damagedRegion = new Region();

            // Pixels need to be exposed under the window in places where the
            // old region is, but the new region isn't.
            damagedRegion.subtract(oldRegion, newRegion);
            this._damagedRegion.union(this._damagedRegion, damagedRegion);

            this._debugDrawRegion(damagedRegion, 'yellow');

            // Pixels also need to be exposed on the window itself where the
            // new region is, and the old one isn't.
            damagedRegion.clear();
            damagedRegion.subtract(newRegion, oldRegion);
            this._damagedRegion.union(this._damagedRegion, damagedRegion);

            this._debugDrawRegion(damagedRegion, 'blue');

            // If X/Y change, we copy the old area, so we need to translate into
            // the coordinate space of the new window's position to know what needs
            // to be redrawn after the copy.
            oldRegion.translate(newX - oldX, newY - oldY);
            damagedRegion.clear();
            damagedRegion.subtract(newRegion, oldRegion);
            this._damagedRegion.union(this._damagedRegion, damagedRegion);

            this._debugDrawRegion(damagedRegion, 'green');

            // Copy the old image contents over, masked to the region.
            var ctx = this._ctx;
            ctx.beginPath();
            ctx.save();
            pathFromRegion(ctx, newRegion);
            ctx.clip();
            ctx.drawImage(ctx.canvas, oldX, oldY, oldW, oldH, newX, newY, oldW, oldH);
            ctx.restore();
            this._queueRedraw();

            oldRegion.finalize();
            newRegion.finalize();
            damagedRegion.finalize();
        },

        changeProperty: function(windowId, name, value) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.changeProperty(name, value);
        },
    });

    exports.Server = Server;

})(window);
