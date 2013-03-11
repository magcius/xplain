(function(exports) {
    "use strict";

    function pathFromRegion(ctx, region) {
        region.iter_rectangles(function(rect) {
            ctx.rect(rect.x, rect.y, rect.width, rect.height);
        });
    }

    function newStyleSheet() {
        var sheet = document.createElement("style");
        sheet.css = "text/css";
        document.body.appendChild(sheet);
        return sheet;
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

    function copyArea(ctx, oldX, oldY, newX, newY, w, h) {
        if (newX < 0) {
            w += newX;
            oldX -= newX;
            newX = 0;
        }

        if (oldX < 0) {
            newX -= oldX;
            w += oldX;
            oldX = 0;
        }

        if (newY < 0) {
            h += newY;
            oldY -= newY;
            newY = 0;
        }

        if (oldY < 0) {
            newY -= oldY;
            h += oldY;
            oldY = 0;
        }

        var mX = Math.max(oldX, newX);
        if (mX >= ctx.canvas.width)
            return;

        if (mX + w > ctx.canvas.width)
            w = ctx.canvas.width - mX;

        var mY = Math.max(oldY, newY);
        if (mY >= ctx.canvas.height)
            return;

        if (mY + h > ctx.canvas.height)
            h = ctx.canvas.height - mY;

        ctx.drawImage(ctx.canvas, oldX, oldY, w, h, newX, newY, w, h);
    }

    function isEventSubstructureRedirect(event) {
        switch (event.type) {
        case "MapRequest":
        case "ConfigureRequest":
            return true;
        }
        return false;
    }

    function isEventSubstructureNotify(event) {
        switch (event.type) {
        case "MapNotify":
        case "UnmapNotify":
        case "ConfigureNotify":
            return true;
        }
        return false;
    }

    function isEventInputEvent(event) {
        switch (event.type) {
        case "Enter":
        case "Leave":
        case "ButtonPress":
        case "ButtonRelease":
        case "Motion":
            return true;
        }
        return false;
    }

    function valueUpdated(a, b) {
        return a !== undefined && a !== b;
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

    var DEFAULT_BACKGROUND_COLOR = '#ddd';

    var ServerWindow = new Class({
        initialize: function(windowId, server, ctx) {
            this._server = server;
            this.windowId = windowId;

            this._backgroundColor = DEFAULT_BACKGROUND_COLOR;

            // The region of the window that needs to be redrawn, in window coordinates.
            this._damagedRegion = new Region();

            // The bounding region, as defined by the SHAPE extension, in window coordinates.
            this.boundingRegion = new Region();
            this._hasCustomBoundingRegion = false;

            this._ctxWrapper = new ContextWrapper(this, ctx);

            this._properties = {};
            this._passiveGrabs = {};

            // All child windows, sorted with the top-most window *first*.
            this.children = [];

            this.cursor = '';
            this.mapped = false;

            this.x = 0;
            this.y = 0;
            this.width = 1;
            this.height = 1;
        },
        finalize: function() {
            this.boundingRegion.finalize();
            this.boundingRegion = null;

            this._damagedRegion.finalize();
            this._damagedRegion = null;
        },
        _iterParents: function(callback) {
            var serverWindow = this;
            while (serverWindow != null) {
                callback(serverWindow);
                serverWindow = serverWindow.parentServerWindow;
            }
        },
        calculateAbsoluteOffset: function() {
            var x = 0, y = 0;
            this._iterParents(function(serverWindow) {
                x += serverWindow.x;
                y += serverWindow.y;
            });
            return { x: x, y: y };
        },
        calculateTransformedBoundingRegion: function() {
            var region = new Region();
            var txform = this.calculateAbsoluteOffset();
            region.copy(this.boundingRegion);
            region.translate(txform.x, txform.y);
            return region;
        },
        prepareContext: function(ctx) {
            var txform = this.calculateAbsoluteOffset();
            ctx.translate(txform.x, txform.y);

            var region = this._damagedRegion;
            pathFromRegion(ctx, region);
            ctx.clip();
        },
        clearDamage: function() {
            // Don't bother trashing our region here as
            // we'll clear it below.
            var txform = this.calculateAbsoluteOffset();
            this._damagedRegion.translate(txform.x, txform.y);
            this._server.subtractDamage(this._damagedRegion);
            this._damagedRegion.clear();
        },
        _drawBackground: function(ctx) {
            ctx.fillStyle = this._backgroundColor;
            ctx.fillRect(0, 0, this.width, this.height);
        },
        damage: function(region) {
            this._damagedRegion.union(this._damagedRegion, region);

            this._ctxWrapper.drawWithContext(this._drawBackground.bind(this));
            if (!this._server.sendEvent({ type: "Expose",
                                          windowId: this.windowId,
                                          ctx: this._ctxWrapper }))
                this.clearDamage();
        },
        changeAttributes: function(attributes) {
            if (valueUpdated(attributes.backgroundColor, this._backgroundColor)) {
                this._backgroundColor = attributes.backgroundColor || DEFAULT_BACKGROUND_COLOR;
            }

            if (valueUpdated(attributes.overrideRedirect, this._overrideRedirect)) {
                this._overrideRedirect = attributes.overrideRedirect;
            }

            if (valueUpdated(attributes.cursor, this.cursor)) {
                this.cursor = attributes.cursor;
                this._server.syncCursor();
            }
        },
        getProperty: function(name, value) {
            return this._properties[name];
        },
        changeProperty: function(name, value) {
            this._properties[name] = value;
            this._server.sendEvent({ type: "PropertyChanged",
                                     windowId: this.windowId,
                                     name: name, value: value });
        },
        map: function(client) {
            if (this.mapped)
                return;

            var eventBase = { windowId: this.windowId };
            var event;

            event = Object.create(eventBase);
            event.type = "MapRequest";

            if (!this._server.sendEvent(event, client)) {
                // Only actually map the window if we unsuccessfully
                // managed to send a MapRequest.
                event = Object.create(eventBase);
                event.type = "MapNotify";

                this.mapped = true;
                this._server.sendEvent({ type: "MapNotify",
                                         windowId: this.windowId });
                this._server.damageWindow(this);
                this._server.syncCurrentWindow();
            }
        },
        unmap: function() {
            if (!this.mapped)
                return;

            this._server.damageWindow(this);
            this.mapped = false;
            this._server.sendEvent({ type: "UnmapNotify",
                                     windowId: this.windowId });
            this._server.syncCurrentWindow();
        },
        unparentWindow: function() {
            this._server.damageWindow(this);
            this.parentServerWindow.children.erase(this);
            this._server.syncCurrentWindow();
        },
        parentWindow: function(parentServerWindow) {
            this.parentServerWindow = parentServerWindow;
            this.parentServerWindow.children.unshift(this);
            this._server.damageWindow(this);
            this._server.syncCurrentWindow();
        },

        findDeepestChildAtPoint: function(x, y) {
            x -= this.x;
            y -= this.y;

            if (!this.boundingRegion.contains_point(x, y))
                return null;

            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                var deepestChild = child.findDeepestChildAtPoint(x, y);
                if (deepestChild)
                    return deepestChild;
            }

            return this;
        },

        _siblingIndex: function(sibling) {
            return sibling.parentServerWindow.children.indexOf(sibling);
        },
        // Return the index that we should be inserted to, given
        // sibling and mode.
        _insertIntoStack: function(sibling, mode) {
            var parent = this.parentServerWindow;
            parent.children.erase(this);
            switch (mode) {
            case "Above":
                if (sibling) {
                    var siblingIndex = this._siblingIndex(sibling);
                    parent.children.splice(siblingIndex, 0, this);
                } else {
                    parent.children.unshift(this);
                }
                break;
            case "Below":
                if (sibling) {
                    var siblingIndex = this._siblingIndex(sibling);
                    parent.children.splice(siblingIndex + 1, 0, this);
                } else {
                    parent.children.push(this);
                }
                break;
                // TODO: TopIf, BottomIf, Opposite. Ever seen in practice?
            }
            this._server.damageWindow(this);
        },

        configureWindow: function(client, props) {
            var eventBase = { windowId: this.windowId,
                              x: props.x, y: props.y, width: props.width, height: props.height,
                              sibling: props.sibling, detail: props.stackMode };
            var event;

            event = Object.create(eventBase);
            event.type = "ConfigureRequest";
            if (!this._server.sendEvent(event, client)) {
                if (props.x !== undefined)
                    this.x = props.x | 0;
                if (props.y !== undefined)
                    this.y = props.y | 0;
                if (props.width !== undefined)
                    this.width = props.width | 0;
                if (props.height !== undefined)
                    this.height = props.height | 0;

                // Update the bounding region if we didn't already have a custom one.
                if (!this._hasCustomBoundingRegion)
                    this.setWindowShapeRegion("Bounding", null);

                if (props.stackMode)
                    this._insertIntoStack(this._server.getServerWindow(props.sibling), props.stackMode);

                event = Object.create(eventBase);
                event.type = "ConfigureNotify";
                this._server.sendEvent(event);

                return true;
            }
            return false;
        },
        filterEvent: function(event) {
            // If we're an override redirect window and the event is a MapRequest
            // or a ConfigureRequest, make sure it doesn't go to any selected clients.
            if (this._overrideRedirect && isEventSubstructureRedirect(event))
                return false;
            return true;
        },
        getGeometry: function() {
            return { x: this.x, y: this.y, width: this.width, height: this.height };
        },

        setWindowShapeRegion: function(shapeType, region) {
            if (shapeType === "Bounding") {
                this.boundingRegion.clear();

                if (region) {
                    this.boundingRegion.copy(region);
                    this._hasCustomBoundingRegion = true;
                } else {
                    this.boundingRegion.init_rect(0, 0, this.width, this.height);
                    this._hasCustomBoundingRegion = false;
                }
            }
        },

        grabButton: function(button, grabInfo) {
            this._passiveGrabs[button] = grabInfo;
        },
        ungrabButton: function(button) {
            delete this._passiveGrabs[button];
        },
        getGrab: function(button) {
            return this._passiveGrabs[button];
        },
    });

    var ServerClient = new Class({
        initialize: function(server, client) {
            this._server = server;
            this.client = client;

            // window id => list of event types
            this._eventWindows = {};
        },

        isInterestedInWindowEvent: function(windowId, eventType) {
            var listeningFor = this._eventWindows[windowId];
            return listeningFor && listeningFor.indexOf(eventType) >= 0;
        },
        isInterestedInEvent: function(event) {
            var windowId = event.windowId;
            if (this.isInterestedInWindowEvent(windowId, event.type))
                return true;

            var serverWindow = this._server.getServerWindow(windowId);
            var substructureRedirect = isEventSubstructureRedirect(event);
            var substructureNotify = isEventSubstructureNotify(event);
            if (substructureNotify || substructureRedirect) {
                while (serverWindow) {
                    if (substructureRedirect && this.isInterestedInWindowEvent(serverWindow.windowId, "SubstructureRedirect"))
                        return true;
                    if (substructureNotify && this.isInterestedInWindowEvent(serverWindow.windowId, "SubstructureNotify"))
                        return true;
                    serverWindow = serverWindow.parentServerWindow;
                }
            }

            return false;
        },
        sendEvent: function(event) {
            if (this.isInterestedInEvent(event)) {
                this.client.handleEvent(event);
                return true;
            } else {
                return false;
            }
        },
        selectInput: function(windowId, eventTypes) {
            var listeningFor = this._eventWindows[windowId];
            if (!listeningFor)
                listeningFor = this._eventWindows[windowId] = [];

            listeningFor.push.apply(listeningFor, eventTypes);
        },
    });

    // A ServerGrabClient is a fake ServerClient that handles
    // details if the pointer is grabbed to make event delivery
    // and other things easier.
    var ServerGrabClient = new Class({
        Extends: ServerClient,

        initialize: function(server, grabInfo) {
            // this.client is the client which has handleEvent and friends.
            // this.serverClient is the serverClient for client that we're
            // wrapping, which we use isInterestedInEvent for the ownerEvents
            // implementation.

            // serverClient can be null, which signifies that the
            // server itself took an implicit grab.
            var serverClient = grabInfo.serverClient;
            var client = serverClient ? serverClient.client : null;

            this.parent(server, client);
            this.serverClient = serverClient;
            this.grabWindow = grabInfo.grabWindow;
            this._ownerEvents = grabInfo.ownerEvents;
            this._events = grabInfo.events;
            this.cursor = grabInfo.cursor;

            this.isImplicitGrab = serverClient === null;
        },
        sendEvent: function(event) {
            // Implicit grab -- we should never get here.
            if (!this.serverClient)
                throw new Error("Server grab -- should be unreachable");

            // If ownerEvents is true, that means that any events that would
            // normally be reported to the client are reported, without any
            // modification. So, if a client with two windows, window A and
            // window B, and takes a grab on window A, events should still be
            // delivered for window B if they come in.
            if (this._ownerEvents && this.serverClient.isInterestedInEvent(event))
                this.client.handleEvent(event);

            // Else, if we should report this event, report it with respect
            // to the grab window.
            if (this._events.indexOf(event.type) >= 0) {
                var newEvent = Object.create(event);
                newEvent.windowId = this.grabWindow.windowId;
                this.client.handleEvent(newEvent);
            }
        },
        selectInput: function() {
            throw new Error("selectInput() called on the fake grab client. Should not happen.");
        },
    });

    var PublicServer = new Class({
        initialize: function(server) {
            this._server = server;
            this.width = this._server.width;
            this.height = this._server.height;
            this.rootWindowId = this._server.rootWindowId;
        }
    });

    var publicMethods = [
        'clientConnected',
        'selectInput',
        'createWindow',
        'destroyWindow',
        'reparentWindow',
        'mapWindow',
        'unmapWindow',
        'configureWindow',
        'getGeometry',
        'translateCoordinates',
        'changeAttributes',
        'getProperty',
        'changeProperty',
        'grabPointer',
        'ungrabPointer',
        'grabButton',
        'ungrabButton',

        // JS extension -- simplifies the case of drawing
        // by letting someone use an existing expose handler.
        // This is the model used by GDK internally.
        'invalidateWindow',

        // SHAPE / XFixes
        'setWindowShapeRegion',
    ];

    publicMethods.forEach(function(methodName) {
        PublicServer.prototype[methodName] = function() {
            return this._server[methodName].apply(this._server, arguments);
        };
    });

    var simpleInputEventMap = {
        "mousedown": "ButtonPress",
        "mouseup": "ButtonRelease",
        "mousemove": "Motion"
    };

    // Is b a descendent of a?
    function isWindowDescendentOf(a, b) {
        for (b = b.parentServerWindow; b; b = b.parentServerWindow) {
            if (b === a)
                return true;
        }
        return false;
    }

    function commonAncestor(a, b) {
        for (b = b.parentServerWindow; b; b = b.parentServerWindow) {
            if (isWindowDescendentOf(b, a))
                return b;
        }
        return null;
    }

    var Server = new Class({
        initialize: function(width, height) {
            this.width = width;
            this.height = height;

            this._setupDOM();
            this.elem = this._container;

            this._setupInputHandlers();

            this._backgroundColor = 'rgb(51, 110, 165)';
            this._clients = [];
            this._grabClient = null;

            this._nextWindowId = 0;
            this._windowsById = {};

            // The region of the screen that needs to be updated.
            this._damagedRegion = new Region();
            this._queueRedraw = new Task(this._redraw.bind(this));

            // This needs to be done after we set up everything else
            // as it uses the standard redraw and windowing machinery.
            this._createRootWindow();

            this._cursorStyleSheet = newStyleSheet();

            // Queue a full-stage redraw so that the root window shows.
            this.queueFullRedraw();

            this.publicServer = new PublicServer(this);

            this._cursorX = -1;
            this._cursorY = -1;
            this._currentServerWindow = null;
        },

        _setupDOM: function() {
            this._container = document.createElement("div");

            // Allow querying with .xserver.js
            this._container.classList.add("xserver");
            this._container.classList.add("js");

            sizeElement(this._container, this.width, this.height);

            this._canvas = document.createElement("canvas");
            this._canvas.width = this.width;
            this._canvas.height = this.height;
            this._container.appendChild(this._canvas);

            this._ctx = this._canvas.getContext('2d');
        },

        _createRootWindow: function() {
            this._rootWindow = this._createWindowInternal();
            this.rootWindowId = this._rootWindow.windowId;
            this._rootWindow.changeAttributes({ backgroundColor: this._backgroundColor });
            this._rootWindow.parentServerWindow = null;
            this._configureWindow(this, this._rootWindow, { x: 0, y: 0, width: this.width, height: this.height });
            this._rootWindow.map();
        },

        setDebugEnabled: function(value) {
            this._debugEnabled = value;

            if (this._debugEnabled && !this._debugCanvas) {
                this._debugCanvas = document.createElement("canvas");
                this._debugCanvas.classList.add("debugCanvas");
                this._debugCanvas.width = this.width;
                this._debugCanvas.height = this.height;
                this._debugCtx = this._debugCanvas.getContext("2d");
                this._container.appendChild(this._debugCanvas);
            }

            if (this._debugEnabled) {
                this._container.classList.add("debug");
            } else {
                this._container.classList.remove("debug");
                this._debugDrawClear();
            }
        },
        toggleDebug: function() {
            this.setDebugEnabled(!this._debugEnabled);
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
        _debugDrawClear: function() {
            if (!this._debugEnabled)
                return;

            this._debugCtx.clearRect(0, 0, this._debugCtx.canvas.width, this._debugCtx.canvas.height);
        },

        queueFullRedraw: function() {
            var fullRegion = new Region();
            fullRegion.init_rect(0, 0, this.width, this.height);
            this.damageRegion(fullRegion);
            fullRegion.finalize();
        },

        _translateCoordinates: function(srcServerWindow, destServerWindow, x, y) {
            var offs;
            offs = srcServerWindow.calculateAbsoluteOffset();
            x += offs.x;
            y += offs.y;

            offs = destServerWindow.calculateAbsoluteOffset();
            x -= offs.x;
            y -= offs.y;

            return { x: x, y: y };
        },

        _iterWindowsAboveWindow: function(serverWindow, callback) {
            while (serverWindow != null && serverWindow.parentServerWindow != null) {
                var parent = serverWindow.parentServerWindow;
                var idx = parent.children.indexOf(serverWindow);
                var windowsOnTop = parent.children.slice(0, idx);
                windowsOnTop.filter(function(serverWindow) {
                    return serverWindow.mapped;
                }).forEach(callback);
                serverWindow = parent;
            }
        },

        _subtractAboveWindowsFromRegion: function(serverWindow, region) {
            this._iterWindowsAboveWindow(serverWindow, function(aboveWindow) {
                var transformedBoundingRegion = aboveWindow.calculateTransformedBoundingRegion();
                region.subtract(region, transformedBoundingRegion);
                transformedBoundingRegion.finalize();
            });
        },

        _clipRegionToVisibleCoords: function(region) {
            region.intersect_rect(region, 0, 0, this.width, this.height);
        },

        // For a given window, return the region that would be
        // immediately damaged if the window was removed. That is,
        // the window's shape region clipped to the areas that are
        // visible.
        _calculateEffectiveRegionForWindow: function(serverWindow) {
            var region = serverWindow.calculateTransformedBoundingRegion();
            this._subtractAboveWindowsFromRegion(serverWindow, region);
            return region;
        },

        syncCursor: function() {
            var cursor;

            if (this._grabClient && this._grabClient.cursor)
                cursor = this._grabClient.cursor;
            else if (this._currentServerWindow)
                cursor = this._currentServerWindow.cursor;
            else
                cursor = '';

            this._container.style.cursor = cursor;
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
                if (!serverWindow.mapped)
                    return;

                if (calculatedDamageRegion.is_empty())
                    return;

                // Transform into the child's space.
                calculatedDamageRegion.translate(-serverWindow.x, -serverWindow.y);

                // Child windows need to be damaged first.
                serverWindow.children.forEach(iterateWindow);

                intersection.intersect(calculatedDamageRegion, serverWindow.boundingRegion);

                if (intersection.not_empty()) {
                    calculatedDamageRegion.subtract(calculatedDamageRegion, intersection);
                    serverWindow.damage(intersection);
                }

                calculatedDamageRegion.translate(serverWindow.x, serverWindow.y);
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
        sendEvent: function(event, except) {
            // Send input events to grabs if we have one, except in the case
            // of implicit grabs -- they should have normal delivery.
            if (isEventInputEvent(event) && this._grabClient && !this._grabClient.isImplicitGrab) {
                this._grabClient.sendEvent(event);
            } else {
                var serverWindow = this._windowsById[event.windowId];
                var foundOneClient = false;
                for (var i = 0; i < this._clients.length; i++) {
                    var serverClient = this._clients[i];
                    if (serverClient.client == except)
                        continue;

                    if (!serverWindow.filterEvent(event))
                        continue;

                    if (!serverClient.sendEvent(event))
                        continue;

                    foundOneClient = true;
                }
                return foundOneClient;
            }
        },

        _setupInputHandlers: function() {
            this._container.addEventListener("mousemove", this._handleInputMouseMove.bind(this));
            this._container.addEventListener("mousedown", this._handleInputButtonPress.bind(this));
            this._container.addEventListener("mouseup", this._handleInputButtonRelease.bind(this));
        },

        syncCurrentWindow: function() {
            var serverWindow = this._rootWindow.findDeepestChildAtPoint(this._cursorX, this._cursorY);
            var event = { rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY };

            if (serverWindow != this._currentServerWindow) {
                this._handleInputEnterLeave(event, this._currentServerWindow, serverWindow);
                this._currentServerWindow = serverWindow;
                this.syncCursor();
            }
        },
        _handleInputBase: function(domEvent) {
            // X does not have event bubbling, so stop it now.
            domEvent.preventDefault();
            domEvent.stopPropagation();

            var box = this._container.getBoundingClientRect();
            var rootCoords = { x: domEvent.clientX - box.left,
                               y: domEvent.clientY - box.top };
            this._cursorX = rootCoords.x;
            this._cursorY = rootCoords.y;

            this.syncCurrentWindow();

            var serverWindow = this._currentServerWindow;

            // If we have a grab, all events go to the grab window.
            // XXX - are windowId and the coordinates on the event the same?
            if (!serverWindow)
                return null;

            var winCoords = this._translateCoordinates(this._rootWindow, serverWindow, rootCoords.x, rootCoords.y);

            var event = { rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY,
                          windowId: serverWindow.windowId,
                          winX: winCoords.x,
                          winY: winCoords.y };
            return event;
        },
        _handleInputSimple: function(domEvent) {
            var event = this._handleInputBase(domEvent);
            if (!event)
                return;

            var eventType = simpleInputEventMap[domEvent.type];
            event.type = eventType;

            switch (eventType) {
            case "ButtonPress":
            case "ButtonRelease":
                event.button = domEvent.which;
                break;
            }
            return event;
        },
        _handleInputMouseMove: function(domEvent) {
            var event = this._handleInputSimple(domEvent);
            this.sendEvent(event);
        },
        _handleInputButtonPress: function(domEvent) {
            var event = this._handleInputSimple(domEvent);

            function checkGrabRecursively(serverWindow) {
                if (!serverWindow)
                    return null;

                var grabInfo = checkGrabRecursively(serverWindow.parentServerWindow);
                if (grabInfo)
                    return grabInfo;

                return serverWindow.getGrab(event.button);
            }

            var grabInfo;
            grabInfo = checkGrabRecursively(this._currentServerWindow);
            if (grabInfo)
                this._grabPointer(grabInfo);

            this.sendEvent(event);

            // If there's no active explicit pointer grab, take an implicit one.
            // Do this after event delivery for a slight perf gain in case a
            // client takes their own grab.
            if (this._grabClient === null) {
                grabInfo = { serverClient: null,
                             grabWindow: this._currentServerWindow,
                             ownerEvents: false,
                             events: [],
                             cursor: null };
                this._grabPointer(grabInfo);
            }
        },
        _handleInputButtonRelease: function(domEvent) {
            var event = this._handleInputSimple(domEvent);
            this.sendEvent(event);

            // Only release if we have an implicit grab.
            if (this._grabClient && this._grabClient.isImplicitGrab)
                this._ungrabPointer(null);
        },
        _handleInputEnterLeave: function(eventBase, fromWin, toWin) {
            // Adapted from Xorg server, a pre-MPX version of dix/enterleave.c
            // Under MIT license

            var server = this;

            if (!fromWin)
                fromWin = this._rootWindow;

            // TODO: NotifyGrab/NotifyUngrab
            function EnterLeaveEvent(type, detail, window, child) {
                var event = Object.create(eventBase);
                event.type = type;
                event.windowId = window.windowId;
                event.subwindowId = child ? child.windowId : null;
                event.detail = detail;
                server.sendEvent(event);
            }

            function EnterNotifies(ancestor, child, detail) {
                var parent = child.parentServerWindow;
                if (ancestor == parent)
                    return;

                EnterNotifies(ancestor, parent, detail);
                EnterLeaveEvent("Enter", detail, parent, child);
            }

            function LeaveNotifies(child, ancestor, detail) {
                var parent = child.parentServerWindow;
                if (ancestor == parent)
                    return;

                EnterLeaveEvent("Leave", detail, parent, child);
                LeaveNotifies(parent, ancestor, detail);
            }

            if (isWindowDescendentOf(fromWin, toWin)) {
                EnterLeaveEvent("Leave", "Interior", fromWin, null);
                EnterNotifies(fromWin, toWin, "Virtual");
                EnterLeaveEvent("Enter", "Ancestor", toWin, null);
            } else if (isWindowDescendentOf(toWin, fromWin)) {
                EnterLeaveEvent("Leave", "Ancestor", fromWin, null);
                LeaveNotifies(fromWin, toWin, "Virtual");
                EnterLeaveEvent("Enter", "Inferior", toWin, null);
            } else {
                var common = commonAncestor(toWin, fromWin);
                EnterLeaveEvent("Leave", "Nonlinear", fromWin, null);
                LeaveNotifies(fromWin, common, "NonlinearVirtual");
                EnterNotifies(common, toWin, "NonlinearVirtual");
                EnterLeaveEvent("Enter", "Nonlinear", toWin, null);
            }
        },

        // This function copies the front buffer around to move/resize windows.
        _manipulateGraphicsForWindowMoveResize: function(oldRegion, newRegion, oldX, oldY, newX, newY) {
            // This is a bit fancy. We need to accomplish a few things:
            //
            //   1. If the area on top of the window was damaged before
            //      the reconfigure, we need to ensure we move that
            //      damaged region to the new coordinates.
            //
            //   2. If the window was resized, we need to ensure we mark
            //      the newly exposed region on the window itself as
            //      damaged.
            //
            //   3. If the window was moved, we need to ensure we mark
            //      the newly exposed region under the old position of
            //      the window as damaged.
            //
            //   4. Make sure we prevent exposing as much as possible.
            //      If a window, completely obscured, moves somewhere,
            //      we shouldn't expose any pixels. Similar sensible
            //      behavior should happen for cases the window is
            //      partially obscured.

            // 1., 2., and 3. are documented where the corresponding code is done.
            // 4. is done by making sure we call _calculateEffectiveRegionForWindow,
            //    which excludes the region where windows visually obscure the window.

            var oldExtents = oldRegion.extents();
            var oldW = oldExtents.width, oldH = oldExtents.height;

            var damagedRegion = new Region();

            this._clipRegionToVisibleCoords(oldRegion);
            this._clipRegionToVisibleCoords(newRegion);

            // 1. (We need to do this first, as the other steps manipulate
            //     oldRegion and the global damaged region in ways that would
            //     cause us to damage more than necessary.)
            //    Pixels that were marked as damaged on the old window need
            //    to be translated to pixels on the global damaged region.
            damagedRegion.intersect(this._damagedRegion, oldRegion);
            damagedRegion.translate(newX - oldX, newY - oldY);
            this._clipRegionToVisibleCoords(damagedRegion);
            this.damageRegion(damagedRegion);

            // 2. Pixels need to be exposed under the window in places where the
            //    old region is, but the new region isn't.
            damagedRegion.subtract(oldRegion, newRegion);
            this.damageRegion(damagedRegion);
            this._debugDrawRegion(damagedRegion, 'yellow');

            var positionChanged = newX != oldX || newY != oldY;

            // If X/Y change, we copy the old area, so we need to translate into
            // the coordinate space of the new window's position to know what needs
            // to be redrawn after the copy.
            if (positionChanged)
                oldRegion.translate(newX - oldX, newY - oldY);

            // 3. Pixels need to be exposed on the window in places where the
            //    new region is, but the old region isn't.
            damagedRegion.subtract(newRegion, oldRegion);
            this.damageRegion(damagedRegion);
            this._debugDrawRegion(damagedRegion, 'green');

            // Copy the old image contents over, masked to the region.
            if (oldRegion.not_empty() && positionChanged) {
                var ctx = this._ctx;
                ctx.beginPath();
                ctx.save();
                pathFromRegion(ctx, newRegion);
                ctx.clip();
                copyArea(ctx, oldX, oldY, newX, newY, oldW, oldH);
                ctx.restore();
            }

            damagedRegion.finalize();
        },

        _configureWindow: function(client, serverWindow, props) {
            // If the server window isn't mapped, just reconfigure
            // the window without doing any damage region stuff.
            if (!serverWindow.mapped) {
                serverWindow.configureWindow(client, props);
                return;
            }

            var oldRegion = this._calculateEffectiveRegionForWindow(serverWindow);
            var oldPos = serverWindow.calculateAbsoluteOffset();

            // Reconfigure the window -- this will modify the shape region.
            if (!serverWindow.configureWindow(client, props)) {
                // If we didn't actually reconfigure the window, don't redraw
                // anything. It shouldn't actually affect anything in this case,
                // but better safe than sorry.
                return;
            }

            var newRegion = this._calculateEffectiveRegionForWindow(serverWindow);
            var newPos = serverWindow.calculateAbsoluteOffset();

            this._manipulateGraphicsForWindowMoveResize(oldRegion, newRegion, oldPos.x, oldPos.y, newPos.x, newPos.y);

            oldRegion.finalize();
            newRegion.finalize();

            this.syncCurrentWindow();
        },

        _grabPointer: function(grabInfo) {
            this._grabClient = new ServerGrabClient(this, grabInfo);
            this.syncCursor();
        },
        _ungrabPointer: function() {
            this._grabClient = null;
            this.syncCursor();
        },

        // Used by _createRootWindow and createWindow.
        _createWindowInternal: function() {
            var windowId = ++this._nextWindowId;
            var serverWindow = new ServerWindow(windowId, this, this._ctx);
            this._windowsById[windowId] = serverWindow;
            return serverWindow;
        },
        damageWindow: function(serverWindow) {
            if (!serverWindow.mapped)
                return;

            var region = this._calculateEffectiveRegionForWindow(serverWindow);
            this._clipRegionToVisibleCoords(region);
            this.damageRegion(region);
            region.finalize();
        },
        getServerWindow: function(windowId) {
            return this._windowsById[windowId];
        },

        //
        // Public API for clients.
        //
        clientConnected: function(client) {
            var serverClient = new ServerClient(this, client);
            client._serverClient = serverClient;
            this._clients.push(serverClient);
        },
        _checkOtherClientsForEvent: function(windowId, eventType, except) {
            return this._clients.some(function(otherClient) {
                if (otherClient === except)
                    return false;

                return otherClient.isInterestedInWindowEvent(windowId, eventType);
            });
        },
        selectInput: function(client, windowId, eventTypes) {
            var serverClient = client._serverClient;

            var checkEvent = (function checkEvent(eventType) {
                if (eventTypes.indexOf(eventType) >= 0)
                    if (this._checkOtherClientsForEvent(windowId, eventType, serverClient))
                        throw new Error("BadAccess");
            }).bind(this);
            checkEvent("SubstructureRedirect");
            checkEvent("ButtonPress");

            serverClient.selectInput(windowId, eventTypes);
        },
        createWindow: function(client) {
            var serverWindow = this._createWindowInternal();
            serverWindow.parentWindow(this._rootWindow);
            return serverWindow.windowId;
        },
        destroyWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];

            if (this._grabClient !== null && this._grabClient.grabWindow)
                this._ungrabPointer();

            serverWindow.unmap();
            serverWindow.unparentWindow();
            serverWindow.finalize();
            this._windowsById[windowId] = null;
        },
        reparentWindow: function(client, windowId, newParentId) {
            var serverWindow = this._windowsById[windowId];
            var newServerParentWindow = this._windowsById[newParentId];
            serverWindow.unparentWindow();
            serverWindow.parentWindow(newServerParentWindow);
        },
        mapWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.map(client);
        },
        unmapWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.unmap();
        },
        configureWindow: function(client, windowId, props) {
            var serverWindow = this._windowsById[windowId];
            this._configureWindow(client, serverWindow, props);
        },
        getGeometry: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            return serverWindow.getGeometry();
        },
        translateCoordinates: function(client, srcWindowId, destWindowId, x, y) {
            var srcServerWindow = this._windowsById[srcWindowId];
            var destServerWindow = this._windowsById[destWindowId];
            return this._translateCoordinates(srcServerWindow, destServerWindow, x, y);
        },
        changeAttributes: function(client, windowId, attributes) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.changeAttributes(attributes);
        },
        getProperty: function(client, windowId, name) {
            var serverWindow = this._windowsById[windowId];
            return serverWindow.getProperty(name);
        },
        changeProperty: function(client, windowId, name, value) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.changeProperty(name, value);
        },
        invalidateWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            this.damageWindow(serverWindow);
        },
        grabPointer: function(client, grabWindowId, ownerEvents, events, cursor) {
            // TODO: pointerMode, keyboardMode
            // Investigate HTML5 APIs for confineTo

            if (this._grabClient) {
                // Allow overwriting an implicit server grab.
                if (this._grabClient.isImplicitGrab)
                    this._ungrabPointer();
                else
                    throw new Error("AlreadyGrabbed");
            }

            var grabWindow = this._windowsById[grabWindowId];
            var serverClient = client._serverClient;
            var grabInfo = { serverClient: serverClient,
                             grabWindow: grabWindow,
                             ownerEvents: ownerEvents,
                             events: events,
                             cursor: cursor };
            this._grabPointer(grabInfo);
        },
        ungrabPointer: function(client) {
            // Clients can't ungrab an implicit grab.
            if (this._grabClient.isImplicitGrab)
                return;

            if (client != this._grabClient.client)
                return;

            this._ungrabPointer();
        },
        grabButton: function(client, grabWindowId, button, ownerEvents, events, cursor) {
            var grabWindow = this._windowsById[grabWindowId];
            var serverClient = client._serverClient;
            var grabInfo = { serverClient: serverClient,
                             grabWindow: grabWindow,
                             ownerEvents: ownerEvents,
                             events: events,
                             cursor: cursor };
            grabWindow.grabButton(button, grabInfo);
        }, 
        ungrabButton: function(client, grabWindowId, button) {
            var grabWindow = this._windowsById[grabWindowId];
            grabWindow.ungrabButton(button);
        },

        setWindowShapeRegion: function(client, windowId, shapeType, region) {
            var serverWindow = this._windowsById[windowId];

            var oldRegion = this._calculateEffectiveRegionForWindow(serverWindow);
            serverWindow.setWindowShapeRegion(shapeType, region);
            var newRegion = this._calculateEffectiveRegionForWindow(serverWindow);

            var damagedRegion = new Region();
            damagedRegion.subtract(oldRegion, newRegion);
            this.damageRegion(damagedRegion);
            damagedRegion.subtract(newRegion, oldRegion);
            this.damageRegion(damagedRegion);

            damagedRegion.finalize();
            oldRegion.finalize();
            newRegion.finalize();
        },
    });

    exports.Server = Server;

})(window);
