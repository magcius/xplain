(function(exports) {

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

    function setCursorStylesheet(sheet, cursor) {
        var cssText =  '.xserver.js .inputWindow { cursor: ' + cursor + ' !important; }';
        sheet.innerHTML = cssText;
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

    function getEventCoordsInDomElementSpace(event, elem) {
        var box = elem.getBoundingClientRect();
        return { x: event.clientX - box.left,
                 y: event.clientY - box.top };
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

            this.inputWindow = document.createElement("div");
            this.inputWindow.classList.add("inputWindow");
            this.inputWindow._serverWindow = this;

            this._backgroundColor = DEFAULT_BACKGROUND_COLOR;

            // The region of the window that needs to be redrawn, in window coordinates.
            this._damagedRegion = new Region();

            // The region of the screen that the window occupies, in parent coordinates.
            this.shapeRegion = new Region();

            this._ctxWrapper = new ContextWrapper(this, ctx);

            this._properties = {};

            // All child windows, sorted with the top-most window *first*.
            this.children = [];

            this.mapped = false;
        },
        finalize: function() {
            this.shapeRegion.finalize();
            this.shapeRegion = null;

            this._damagedRegion.finalize();
            this._damagedRegion = null;
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

            var region = this._damagedRegion;
            pathFromRegion(ctx, region);
            ctx.clip();
        },
        clearDamage: function() {
            // Don't bother trashing our region here as
            // we'll clear it below.
            var txform = this.calculateAbsoluteOffset(true);
            this._damagedRegion.translate(txform.x, txform.y);
            this._server.subtractDamage(this._damagedRegion);
            this._damagedRegion.clear();
        },
        _drawBackground: function(ctx) {
            ctx.fillStyle = this._backgroundColor;
            ctx.fillRect(0, 0, this.width, this.height);
        },
        damage: function(region, ctx) {
            this._damagedRegion.union(this._damagedRegion, region);

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

            positionElement(this.inputWindow, x, y, width, height);

            this._server.sendEvent({ type: "ConfigureNotify",
                                     windowId: this.windowId,
                                     x: x, y: y, width: width, height: height });
        },
        _syncPointerEvents: function() {
            var shouldHavePointerEvents = this.mapped && this._hasInput;
            if (shouldHavePointerEvents)
                this.inputWindow.style.pointerEvents = 'auto';
            else
                this.inputWindow.style.pointerEvents = 'none';
        },
        changeAttributes: function(attributes) {
            if (attributes.hasInput !== undefined && this._hasInput != attributes.hasInput) {
                this._hasInput = !!attributes.hasInput;
                this._syncPointerEvents();
            }

            if (attributes.backgroundColor !== undefined && this._backgroundColor != attributes.backgroundColor) {
                this._backgroundColor = attributes.backgroundColor || DEFAULT_BACKGROUND_COLOR;
            }
        },
        changeProperty: function(name, value) {
            this._properties[name] = value;
            this._server.sendEvent({ type: "PropertyChanged",
                                     windowId: this.windowId,
                                     name: name, value: value });
        },
        defineCursor: function(cursor) {
            this.inputWindow.style.cursor = cursor;
        },
        map: function() {
            if (this.mapped)
                return;

            this.mapped = true;
            this._syncPointerEvents();
            this._server.sendEvent({ type: "MapNotify",
                                     windowId: this.windowId });
            this._server.damageWindow(this);
        },
        unmap: function() {
            if (!this.mapped)
                return;

            this.mapped = false;
            this._syncPointerEvents();
            this._server.sendEvent({ type: "UnmapNotify",
                                     windowId: this.windowId });
            this._server.damageWindow(this);
        },
        unparentWindow: function() {
            // Damage the region that will be exposed when the
            // window is destroyed.
            this._server.damageWindow(this);

            this.parentServerWindow.inputWindow.removeChild(this.inputWindow);
            this.parentServerWindow.children.erase(this);
        },
        parentWindow: function(parentServerWindow) {
            this.parentServerWindow = parentServerWindow;
            this.parentServerWindow.children.unshift(this);
            this.parentServerWindow.inputWindow.appendChild(this.inputWindow);
            this._server.damageWindow(this);
        },
        raise: function() {
            this.parentServerWindow.children.erase(this);
            this.parentServerWindow.children.unshift(this);
            this.parentServerWindow.inputWindow.removeChild(this.inputWindow);
            this.parentServerWindow.inputWindow.appendChild(this.inputWindow);
            this._server.damageWindow(this);
        },
        lower: function() {
            // Damage the region that will be exposed when the
            // window is lowered to the bottom.
            this._server.damageWindow(this);

            var parentServerWindow = serverWindow.parentServerWindow;
            this.parentServerWindow.children.erase(serverWindow);
            this.parentServerWindow.children.push(serverWindow);
            this.parentServerWindow.inputWindow.removeChild(this.inputWindow);
            this.parentServerWindow.inputWindow.insertBefore(this.inputWindow, this.parentServerWindow.inputWindow.firstChild);
        },
    });

    var ServerClient = new Class({
        initialize: function(server, client) {
            this._server = server;
            this.client = client;

            // window id => list of event types
            this._eventWindows = {};
        },

        _isInterestedInWindowEvent: function(windowId, eventType) {
            var listeningFor = this._eventWindows[windowId];
            return listeningFor && listeningFor.indexOf(eventType) >= 0;
        },
        isInterestedInEvent: function(event) {
            var windowId = event.windowId;
            if (this._isInterestedInWindowEvent(windowId, event.type))
                return true;

            if (isEventSubstructureRedirect(event)) {
                while (windowId != 0) {
                    if (this._isInterestedInWindowEvent(windowId, "SubstructureRedirect"))
                        return true;
                    windowId = this._server.getWindowParent(windowId);
                }
            }

            return false;
        },
        sendEvent: function(event) {
            this.client.handleEvent(event);
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

        initialize: function(server, serverClient, grabWindow, ownerEvents, events) {
            // this.client is the client which has sendEvent and friends.
            // this.serverClient is the serverClient for client that we're
            // wrapping, which we use isInterestedInEvent for the ownerEvents
            // implementation.

            // serverClient can be null, which signifies that the
            // server itself took an implicit grab.
            var client = serverClient ? serverClient.client : null;

            this.parent(server, client);
            this.serverClient = serverClient;

            this.isImplicitGrab = serverClient === null;

            this.grabWindow = grabWindow;

            // events is an additional list of event types on grabWindowId to
            // be used during the grab.
            // If ownerEvents is false, only events inside this events list
            // are delivered to the grab window.
            // If ownerEvents is true, both events inside this events list
            // and any selected events that are defined on grabWindowId are
            // respected.
            this._events = events;
            this._ownerEvents = ownerEvents;
        },
        isInterestedInEvent: function(event) {
            // Implicit grab -- we should never get here.
            if (!this.serverClient)
                throw new Error("Server grab -- should be unreachable");

            // This can happen for Enter/Leave events.
            if (event.windowId !== this.grabWindow.windowId)
                return false;

            // Since we are guaranteed that the event is on the grab window,
            // we can simply ask the grabbing client if it wants to take this
            // event for the ownerEvents implementation.
            if (this._ownerEvents && this.serverClient.isInterestedInEvent(event))
                return true;

            return this._events.indexOf(event.type) >= 0;
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
        'raiseWindow',
        'lowerWindow',
        'configureRequest',
        'changeAttributes',
        'changeProperty',
        'defineCursor',
        'grabPointer',
        'ungrabPointer',

        // JS extension -- simplifies the case of drawing
        // by letting someone use an existing expose handler.
        // This is the model used by GDK internally.
        'invalidateWindow',
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
            this._rootWindow = this._createRootWindow();
            this.rootWindowId = this._rootWindow.windowId;
            this._container.appendChild(this._rootWindow.inputWindow);

            this._cursorStyleSheet = newStyleSheet();

            // Queue a full-stage redraw so that the root window shows.
            this.queueFullRedraw();

            this.publicServer = new PublicServer(this);
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
            var rootWindow = this._createWindowInternal();
            rootWindow.changeAttributes({ backgroundColor: this._backgroundColor });
            rootWindow.parentServerWindow = null;
            this._configureWindow(rootWindow, 0, 0, this.width, this.height);
            rootWindow.map();
            return rootWindow;
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
                var transformedShapeRegion = aboveWindow.calculateTransformedShapeRegion();
                region.subtract(region, transformedShapeRegion);
                transformedShapeRegion.finalize();
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
            var region = serverWindow.calculateTransformedShapeRegion();
            this._clipRegionToVisibleCoords(region);
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
                if (!serverWindow.mapped)
                    return;

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
        sendEvent: function(event, except) {
            // Send input events to grabs if we have one, except in the case
            // of implicit grabs -- they should have normal delivery.
            if (isEventInputEvent(event) && this._grabClient && !this._grabClient.isImplicitGrab) {
                this._grabClient.sendEvent(event);
            } else {
                return this._clients.some(function(serverClient) {
                    if (serverClient.client == except)
                        return false;

                    if (!serverClient.isInterestedInEvent(event))
                        return false;

                    serverClient.sendEvent(event);
                    return true;
                });
            }
        },

        _setupInputHandlers: function() {
            this._container.addEventListener("mousemove", this._handleInputSimple.bind(this));

            // Implicit grabs need special support.
            this._container.addEventListener("mousedown", this._handleInputButtonPress.bind(this));
            this._container.addEventListener("mouseup", this._handleInputButtonRelease.bind(this));

            // As a crossing event will be generated for both mouseover
            // and mouseout, simply use mouseenter. Leaving the stage
            // won't quite work, but we can special case that later.
            this._container.addEventListener("mouseover", this._handleInputEnterLeave.bind(this));
        },
        _getServerWindowFromDOMEvent: function(domEvent) {
            var domInputWindow = domEvent.target;
            var serverWindow = domInputWindow._serverWindow;
            if (!serverWindow)
                return null;

            return serverWindow;
        },
        _handleInputBase: function(domEvent) {
            // X does not have event bubbling, so stop it now.
            domEvent.preventDefault();
            domEvent.stopPropagation();

            var serverWindow = this._getServerWindowFromDOMEvent(domEvent);

            // If we have a grab, all events go to the grab window.
            // XXX - are windowId and the coordinates on the event the same?
            if (this._grabClient)
                serverWindow = this._grabClient.grabWindow;
            else if (!serverWindow)
                return null;

            var rootCoords = getEventCoordsInDomElementSpace(domEvent, this._container);
            var winCoords = getEventCoordsInDomElementSpace(domEvent, serverWindow.inputWindow);

            var event = { rootWindowId: this._rootWindow.windowId,
                          windowId: serverWindow.windowId,
                          rootX: rootCoords.x,
                          rootY: rootCoords.y,
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

            this.sendEvent(event);
        },
        _handleInputButtonPress: function(domEvent) {
            if (!this._handleInputSimple(domEvent))
                return;

            // If there's no active explicit pointer grab, take an implicit one.
            // Do this after event delivery for a slight perf gain in case a
            // client takes their own grab.
            if (this._grabClient === null) {
                var serverWindow = this._getServerWindowFromDOMEvent(domEvent);
                this._grabPointer(null, serverWindow, false, []);
            }
        },
        _handleInputButtonRelease: function(domEvent) {
            if (!this._handleInputSimple(domEvent))
                return;

            // Only release if we have an implicit grab.
            if (this._grabClient.isImplicitGrab)
                this._ungrabPointer(null);
        },
        _handleInputEnterLeave: function(domEvent) {
            var eventBase = this._handleInputBase(domEvent);
            if (!eventBase)
                return;

            var fromElem, toElem;

            if (domEvent.type === 'mouseover') {
                fromElem = domEvent.fromElement || domEvent.relatedTarget;
                toElem = domEvent.target;
            } else if (domEvent.type === 'mouseout') {
                fomElem = domEvent.target;
                toElem = domEvent.toElement || domEvent.relatedTarget;
            }

            // It's possible for fromElem to be null in the case where
            // we're going from browser chrome to the container element.
            // In this case, we don't want to generate an Enter on the
            // root window, so quit early.
            if (!fromElem)
                return;

            var fromWin = fromElem._serverWindow;
            var toWin = toElem._serverWindow;
            if (!fromWin || !toWin)
                return;

            // Adapted from Xorg server, a pre-MPX version of dix/enterleave.c
            // Under MIT license

            var server = this;

            // TODO: NotifyGrab/NotifyUngrab
            function EnterLeaveEvent(type, detail, window, child) {
                var event = Object.create(eventBase);
                event.type = type;
                event.windowId = window.windowId;
                event.subwindowId = child ? child.windowId : null;
                event.detail = detail;
                server.sendEvent(event);
            }

            // Send to all parent windows up to ancestor.
            function RecurseSendEvent(type, ancestor, child, detail) {
                if (ancestor == child)
                    return;

                var parent = child.parentServerWindow;
                if (ancestor == parent)
                    return;

                RecurseSendEvent(type, ancestor, parent, detail);
                EnterLeaveEvent(type, detail, parent, child);
            }

            function EnterNotifies(ancestor, child, detail) {
                RecurseSendEvent("Enter", ancestor, child, detail);
            }

            function LeaveNotifies(child, ancestor, detail) {
                RecurseSendEvent("Leave", ancestor, child, detail);
            }

            if (isWindowDescendentOf(fromWin, toWin)) {
                EnterLeaveEvent("Leave", "NotifyInterior", fromWin, null);
                EnterNotifies(fromWin, toWin, "NotifyVirtual");
                EnterLeaveEvent("Enter", "NotifyAncestor", toWin, null);
            } else if (isWindowDescendentOf(toWin, fromWin)) {
                EnterLeaveEvent("Leave", "NotifyAncestor", fromWin, null);
                LeaveNotifies(fromWin, toWin, "NotifyVirtual");
                EnterLeaveEvent("Enter", "NotifyInferior", toWin, null);
            } else {
                var common = commonAncestor(toWin, fromWin);
                EnterLeaveEvent("Leave", "NotifyNonlinear", fromWin, null);
                LeaveNotifies(fromWin, common, "NotifyNonlinearVirtual");
                EnterNotifies(common, toWin, "NotifyNonlinearVirtual");
                EnterLeaveEvent("Enter", "NotifyNonlinear", toWin, null);
            }
        },

        _configureWindow: function(serverWindow, x, y, width, height) {
            // If the server window isn't mapped, just reconfigure
            // the window without doing any damage region stuff.
            if (!serverWindow.mapped) {
                serverWindow.reconfigure(x, y, width, height);
                return;
            }

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

            // 1. (We need to do this first, as the other steps manipulate
            //     oldRegion and the global damaged region in ways that would
            //     cause us to damage more than necessary.)
            //    Pixels that were marked as damaged on the old window need
            //    to be translated to pixels on the global damaged region.
            damagedRegion.intersect(this._damagedRegion, oldRegion);
            damagedRegion.translate(newX - oldX, newY - oldY);
            this._clipRegionToVisibleCoords(damagedRegion);
            this._damagedRegion.union(this._damagedRegion, damagedRegion);

            // 2. Pixels need to be exposed under the window in places where the
            //    old region is, but the new region isn't.
            damagedRegion.subtract(oldRegion, newRegion);
            this._damagedRegion.union(this._damagedRegion, damagedRegion);
            this._debugDrawRegion(damagedRegion, 'yellow');

            damagedRegion.clear();

            // If X/Y change, we copy the old area, so we need to translate into
            // the coordinate space of the new window's position to know what needs
            // to be redrawn after the copy.
            oldRegion.translate(newX - oldX, newY - oldY);

            // 3. Pixels need to be exposed on the window in places where the
            //    new region is, but the old region isn't.
            damagedRegion.subtract(newRegion, oldRegion);
            this._damagedRegion.union(this._damagedRegion, damagedRegion);
            this._debugDrawRegion(damagedRegion, 'green');

            // Copy the old image contents over, masked to the region.
            var ctx = this._ctx;
            ctx.beginPath();
            ctx.save();
            pathFromRegion(ctx, newRegion);
            ctx.clip();
            copyArea(ctx, oldX, oldY, newX, newY, oldW, oldH);
            ctx.restore();
            this._queueRedraw();

            oldRegion.finalize();
            newRegion.finalize();
            damagedRegion.finalize();
        },

        _grabPointer: function(serverClient, grabWindow, ownerEvents, events) {
            this._grabClient = new ServerGrabClient(this, serverClient, grabWindow, ownerEvents, events);
        },
        _ungrabPointer: function() {
            this._grabClient = null;
            setCursorStylesheet(this._cursorStyleSheet, '');
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
            this.damageRegion(region);
            region.finalize();
        },
        getWindowParent: function(windowId) {
            var serverWindow = this._windowsById[windowId];
            if (serverWindow && serverWindow.parentServerWindow)
                return serverWindow.parentServerWindow.windowId;
            else
                return 0;
        },

        //
        // Public API for clients.
        //
        clientConnected: function(client) {
            var serverClient = new ServerClient(this, client);
            client._serverClient = serverClient;
            this._clients.push(serverClient);
        },
        selectInput: function(client, windowId, eventTypes) {
            var serverClient = client._serverClient;
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
            var event = { type: "MapRequest",
                          windowId: windowId };
            if (!this.sendEvent(event, client)) {
                // Only actually map the window if we unsuccessfully
                // managed to send a MapRequest.
                serverWindow.map();
            }
        },
        unmapWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.unmap();
        },
        raiseWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.raise();
        },
        lowerWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.lower();
        },
        configureRequest: function(client, windowId, x, y, width, height) {
            var serverWindow = this._windowsById[windowId];
            this._configureWindow(serverWindow, x, y, width, height);
        },
        changeAttributes: function(client, windowId, attributes) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.changeAttributes(attributes);
        },
        changeProperty: function(client, windowId, name, value) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.changeProperty(name, value);
        },
        defineCursor: function(client, windowId, cursor) {
            var serverWindow = this._windowsById[windowId];
            serverWindow.defineCursor(cursor);
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
            this._grabPointer(serverClient, grabWindow, ownerEvents, events);

            setCursorStylesheet(this._cursorStyleSheet, cursor);
        },
        ungrabPointer: function(client) {
            // Clients can't ungrab an implicit grab.
            if (this._grabClient.isImplicitGrab)
                return;

            if (client != this._grabClient.client)
                return;

            this._ungrabPointer();
        },
    });

    exports.Server = Server;

})(window);
