(function(exports) {
    "use strict";

    function pathFromRegion(ctx, region) {
        region.iter_rectangles(function(rect) {
            ctx.rect(rect.x, rect.y, rect.width, rect.height);
        });
    }

    // Workaround for browser bugs in drawImage:
    //   https://bugzilla.mozilla.org/show_bug.cgi?id=842110
    //   https://code.google.com/p/chromium/issues/detail?id=176714
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
        case "DestroyNotify":
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

    var DEFAULT_BACKGROUND_COLOR = '#ddd';

    var ServerWindow = new Class({
        initialize: function(windowId, server, props) {
            this._server = server;
            this.windowId = windowId;

            this._backgroundColor = DEFAULT_BACKGROUND_COLOR;

            // The region of the window that needs to be redrawn, in window coordinates.
            this.damagedRegion = new Region();

            // The bounding region, as defined by the SHAPE extension, in window coordinates.
            this.boundingRegion = new Region();
            this._hasCustomBoundingRegion = false;

            this._properties = {};
            this._passiveGrabs = {};

            // All child windows, sorted with the top-most window *first*.
            this.children = [];

            this.cursor = '';
            this.mapped = false;
            this.viewable = false;

            this._configureWindow(props);
        },
        finalize: function() {
            this.boundingRegion.finalize();
            this.boundingRegion = null;

            this.damagedRegion.finalize();
            this.damagedRegion = null;
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
            region.copy(this.boundingRegion);
            this._iterParents(function(serverWindow) {
                region.intersect(region, serverWindow.boundingRegion);
                region.translate(serverWindow.x, serverWindow.y);
            });
            return region;
        },
        prepareContext: function(ctx) {
            var txform = this.calculateAbsoluteOffset();
            ctx.translate(txform.x, txform.y);
            pathFromRegion(ctx, this.damagedRegion);
            ctx.clip();
        },
        clearDamage: function(region) {
            if (region === "Full")
                this.damagedRegion.clear();
            else
                this.damagedRegion.subtract(this.damagedRegion, region);
        },
        _drawBackground: function(ctx) {
            ctx.fillStyle = this._backgroundColor;
            ctx.fillRect(0, 0, this.width, this.height);
        },
        damage: function(region) {
            this._damagedRegion.union(this._damagedRegion, region);
        },
        sendExpose: function() {
            if (this.damagedRegion.is_empty())
                return;

            this._server.drawWithContext(this, this.windowId, this._drawBackground.bind(this));
            if (!this._server.sendEvent({ type: "Expose",
                                          windowId: this.windowId }))
                this.clearDamage("Full");
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
        recalculateViewability: function() {
            var viewable;
            // At the point that this is called, we always assume
            // that our parent's viewability is valid.
            if (!this.mapped && this.viewable) {
                // If a parent is becoming unviewable, it means
                // that we always are becoming unviewable.
                viewable = false;
            } else if (this.mapped && !this.viewable) {
                // Else, the viewabiliy of us is the viewability
                // of our parent, and if we don't have any, then
                // we're directly viewable.
                if (this.parentServerWindow)
                    viewable = this.parentServerWindow.viewable;
                else
                    viewable = true;
            }

            if (valueUpdated(viewable, this.viewable)) {
                this.viewable = viewable;
                this._server.viewabilityChanged(this);
                this.children.forEach(function(child) {
                    child.recalculateViewability();
                });
            }
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
                this._server.damageWindow(this, false);
                this.recalculateViewability();
                this._server.syncCursorWindow();
            }
        },
        unmap: function() {
            if (!this.mapped)
                return false;

            this.mapped = false;
            this._server.damageWindow(this, true);
            this._server.sendEvent({ type: "UnmapNotify",
                                     windowId: this.windowId });
            this._server.syncCursorWindow();
            this.recalculateViewability();
            return true;
        },
        _unparentWindowInternal: function() {
            var children = this.parentServerWindow.children;
            children.splice(children.indexOf(this), 1);
            this.parentServerWindow = null;
        },
        destroy: function() {
            this.unmap();

            this.children.forEach(function(child) {
                child.destroy();
            });

            this._server.sendEvent({ type: "DestroyNotify",
                                     windowId: this.windowId });

            this._unparentWindowInternal();
        },
        parentWindow: function(parentServerWindow) {
            var wasMapped = this.unmap();

            if (this.parentServerWindow)
                this._unparentWindowInternal();
            this.parentServerWindow = parentServerWindow;
            this.parentServerWindow.children.unshift(this);

            if (wasMapped)
                this.map();
        },

        findDeepestChildAtPoint: function(x, y) {
            x -= this.x;
            y -= this.y;

            if (!this.boundingRegion.contains_point(x, y))
                return null;

            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (!child.mapped)
                    continue;

                var deepestChild = child.findDeepestChildAtPoint(x, y);
                if (deepestChild)
                    return deepestChild;
            }

            return this;
        },

        _siblingIndex: function(sibling) {
            return sibling.parentServerWindow.children.indexOf(sibling);
        },
        _insertIntoStack: function(sibling, mode) {
            var children = this.parentServerWindow.children;
            children.splice(children.indexOf(this), 1);
            switch (mode) {
            case "Above":
                if (sibling) {
                    var siblingIndex = this._siblingIndex(sibling);
                    children.splice(siblingIndex, 0, this);
                } else {
                    children.unshift(this);
                }
                break;
            case "Below":
                if (sibling) {
                    var siblingIndex = this._siblingIndex(sibling);
                    children.splice(siblingIndex + 1, 0, this);
                } else {
                    children.push(this);
                }
                break;
                // TODO: TopIf, BottomIf, Opposite. Ever seen in practice?
            }
        },

        _configureWindow: function(props) {
            if (props.x !== undefined)
                this.x = props.x | 0;
            if (props.y !== undefined)
                this.y = props.y | 0;
            if (props.width !== undefined)
                this.width = props.width | 0;
            if (props.height !== undefined)
                this.height = props.height | 0;

            if (!this._hasCustomBoundingRegion)
                this._setWindowShapeRegion("Bounding", null);
        },

        configureWindow: function(client, props) {
            var eventBase = { windowId: this.windowId,
                              x: props.x, y: props.y, width: props.width, height: props.height,
                              sibling: props.sibling, detail: props.stackMode };
            var event;

            event = Object.create(eventBase);
            event.type = "ConfigureRequest";
            if (!this._server.sendEvent(event, client)) {
                this._server.wrapWindowChange(this, function() {
                    this._configureWindow(props);

                    if (props.stackMode) {
                        var sibling = props.sibling ? this._server.getServerWindow(client, props.sibling) : null;
                        this._insertIntoStack(sibling, props.stackMode);
                    }

                    event = Object.create(eventBase);
                    event.type = "ConfigureNotify";
                    this._server.sendEvent(event);
                }.bind(this));
            }
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

        _setWindowShapeRegion: function(shapeType, region) {
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
        setWindowShapeRegion: function(shapeType, region) {
            this._server.wrapWindowChange(this, function() {
                // We don't actually check if the two are the same. This
                // is assuming that this is so seldom called that the cost
                // doesn't really matter. It probably wouldn't be too hard
                // to check, though.
                this._setWindowShapeRegion(shapeType, region);
            }.bind(this));
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

    var PublicServer = new Class({
        initialize: function(serverClient, server) {
            this._serverClient = serverClient;
            this._server = server;
            this.width = this._server.width;
            this.height = this._server.height;
            this.rootWindowId = this._server.rootWindowId;
        }
    });

    var publicRequests = [
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
        'setInputFocus',
        'allowEvents',

        // JS extension -- simplifies the case of drawing
        // by letting someone use an existing expose handler.
        // This is the model used by GDK internally.
        'invalidateWindow',
        'clearDamage',

        // SHAPE / XFixes
        'setWindowShapeRegion',
    ];

    publicRequests.forEach(function(requestName) {
        PublicServer.prototype[requestName] = function(props) {
            return this._server.handleRequest(this._serverClient, requestName, props);
        };
    });

    PublicServer.prototype.drawWithContext = function(windowId, func) {
        return this._server.drawWithContext(this._serverClient, windowId, func);
    };

    // A simple container so we don't litter the DOM.
    var iframeContainer = document.createElement("message-ports");
    iframeContainer.style.display = 'none';
    document.body.appendChild(iframeContainer);

    function MessagePort() {
        var iframe = document.createElement("iframe");
        iframeContainer.appendChild(iframe);
        return iframe.contentWindow;
    }

    function flattenObject(obj) {
        var flat = {};
        // Flatten the prototype chain.
        for (var prop in obj)
            flat[prop] = obj[prop];
        return flat;
    }

    var ServerClient = new Class({
        initialize: function(server, client) {
            this._server = server;
            this.client = client;

            // window id => list of event types
            this._eventWindows = {};

            this.clientPort = new MessagePort();
            this.publicServer = new PublicServer(this, server);
        },

        isInterestedInWindowEvent: function(windowId, eventType) {
            var listeningFor = this._eventWindows[windowId];
            return listeningFor && listeningFor.indexOf(eventType) >= 0;
        },
        filterEvent: function(event) {
            var windowId = event.windowId;
            if (this.isInterestedInWindowEvent(windowId, event.type))
                return true;

            var serverWindow = this._server.getServerWindow(null, windowId);
            var substructureRedirect = isEventSubstructureRedirect(event);
            var substructureNotify = isEventSubstructureNotify(event);
            var parent = serverWindow.parentServerWindow;
            if (substructureRedirect && this.isInterestedInWindowEvent(parent.windowId, "SubstructureRedirect"))
                return true;
            if (substructureNotify && this.isInterestedInWindowEvent(parent.windowId, "SubstructureNotify"))
                return true;

            return false;
        },
        sendEvent: function(event) {
            var flatEvent = flattenObject(event);
            this.clientPort.postMessage(flatEvent, "*");
        },
        selectInput: function(windowId, eventTypes) {
            var listeningFor = this._eventWindows[windowId];
            if (!listeningFor)
                listeningFor = this._eventWindows[windowId] = [];

            listeningFor.push.apply(listeningFor, eventTypes);
        },
        makeGrabInfo: function(event) {
            return { serverClient: this,
                     grabWindow: this._server.getServerWindow(null, event.windowId),
                     ownerEvents: false, // implement OwnerGrabEvents
                     events: this._eventWindows[event.windowId],
                     pointerMode: "Async",
                     cursor: null };
        },
    });

    // A ServerGrabClient is a fake ServerClient that handles
    // details if the pointer is grabbed to make event delivery
    // and other things easier.
    var ServerGrabClient = new Class({
        initialize: function(server, grabInfo, isPassive) {
            this._server = server;

            this.serverClient = grabInfo.serverClient;
            this._ownerEvents = grabInfo.ownerEvents;
            this._events = grabInfo.events;
            this.grabWindow = grabInfo.grabWindow;
            this.cursor = grabInfo.cursor;
            this.isPassive = isPassive;

            // The event queue used when events are frozen during a sync grab.
            this._frozenEventQueue = [];
            this._clientEvent = null;

            this._pointerMode = grabInfo.pointerMode;
        },
        _isEventConsideredFrozen: function(event) {
            switch (event.type) {
            case "ButtonPress":
            case "ButtonRelease":
                return this._pointerMode == "Sync";
            }
            return false;
        },
        _flushFrozenEventQueue: function() {
            while (this._frozenEventQueue.length > 0) {
                var event = this._frozenEventQueue.shift();
                this._server.sendEvent(event);
            }
        },
        allowEvents: function(pointerMode) {
            this._pointerMode = pointerMode;

            // this._frozenEventQueue only has undelivered events. The last
            // event delivered to the client is in this._clientEvent.
            switch (pointerMode) {
            case "Async":
                // Unfreeze the pointer grab, and replay the rest.
                this._server.ungrabPointer();
                this._flushFrozenEventQueue();
                break;
            case "Sync":
                // Send the next one over without unthawing.
                var event = this._frozenEventQueue.shift();
                if (event)
                    this._deliverEvent(event);
                else
                    this._server.ungrabPointer();
                break;
            case "Replay":
                // Requeue the client event, unfreeze the pointer grab,
                // and replay the rest.
                this._frozenEventQueue.unshift(this._clientEvent);
                this._server.ungrabPointer();
                this._flushFrozenEventQueue();
                break;
            }
        },
        _deliverEvent: function(event) {
            this._clientEvent = event;

            // If ownerEvents is true, that means that any events that would
            // normally be reported to the client are reported, without any
            // modification. So, if a client with two windows, window A and
            // window B, and takes a grab on window A, events should still be
            // delivered for window B if they come in.
            if (this._ownerEvents && this.serverClient.filterEvent(event))
                this.serverClient.sendEvent(event);

            // Else, if we should report this event, report it with respect
            // to the grab window.
            if (this._events.indexOf(event.type) >= 0) {
                var newEvent = Object.create(event);
                newEvent.windowId = this.grabWindow.windowId;
                this.serverClient.sendEvent(newEvent);
            }
        },
        sendEvent: function(event) {
            // If we have a sync grab that's relevant to the current
            // event, and we already have an event in processing
            // by the client, save it for later.
            if (this._isEventConsideredFrozen(event) && this._clientEvent)
                this._frozenEventQueue.push(event);
            else
                this._deliverEvent(event);
        },
    });

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

            this._backgroundColor = 'rgb(51, 110, 165)';
            this._clients = [];

            this._nextWindowId = 0;
            this._windowsById = {};

            // The region of the screen that needs to be updated.
            this._damagedRegion = new Region();

            // Input
            this._setupInputHandlers();
            this._cursorX = -1;
            this._cursorY = -1;
            this._cursorServerWindow = null;

            this._focusRevertTo = null;
            this._focusServerWindow = null;
            this._grabClient = null;

            // This needs to be done after we set up everything else
            // as it uses the standard redraw and windowing machinery.
            this._createRootWindow();
        },

        _setupDOM: function() {
            this._container = document.createElement("div");
            this._container.tabIndex = 0;
            this._container.style.width = this.width + "px";
            this._container.style.height = this.height + "px";

            this._canvas = document.createElement("canvas");
            this._canvas.width = this.width;
            this._canvas.height = this.height;
            this._container.appendChild(this._canvas);

            this._ctx = this._canvas.getContext('2d');
        },

        _createRootWindow: function() {
            this._rootWindow = this._createWindowInternal({ x: 0, y: 0, width: this.width, height: this.height });
            this.rootWindowId = this._rootWindow.windowId;
            this._rootWindow.changeAttributes({ backgroundColor: this._backgroundColor });
            this._rootWindow.parentServerWindow = null;
            this._rootWindow.map();
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

        // For a given window, return the region that would be
        // immediately damaged if the window was removed. That is,
        // the window's shape region clipped to the areas that are
        // visible.
        _calculateEffectiveRegionForWindow: function(serverWindow) {
            var region = serverWindow.calculateTransformedBoundingRegion();

            function subtractWindow(aboveWindow) {
                if (!serverWindow.mapped)
                    return;

                var transformedBoundingRegion = aboveWindow.calculateTransformedBoundingRegion();
                region.subtract(region, transformedBoundingRegion);
                transformedBoundingRegion.finalize();
            }

            while (serverWindow != null && serverWindow.parentServerWindow != null) {
                var parent = serverWindow.parentServerWindow;
                var idx = parent.children.indexOf(serverWindow);
                var windowsOnTop = parent.children.slice(0, idx);
                windowsOnTop.forEach(subtractWindow);
                serverWindow = parent;
            }
            return region;
        },

        syncCursor: function() {
            var cursor;

            if (this._grabClient && this._grabClient.cursor)
                cursor = this._grabClient.cursor;
            else if (this._cursorServerWindow)
                cursor = this._cursorServerWindow.cursor;
            else
                cursor = '';

            this._container.style.cursor = cursor;
        },

        damageRegion: function(region) {
            function recursivelyDamage(serverWindow, inputRegion) {
                if (!serverWindow.mapped)
                    return;

                // The obscuring region is the part of @inputRegion that
                // will obscure other windows. It doesn't include its child
                // windows obscuring regions either, as the window shouldn't
                // draw into the region owned by its children.
                var obscuringRegion = new Region();

                // Transform into the child's space.
                inputRegion.translate(-serverWindow.x, -serverWindow.y);
                region.translate(-serverWindow.x, -serverWindow.y);

                // Clip the damaged region to the bounding region to get
                // the maximum area that's obscured.
                obscuringRegion.intersect(inputRegion, serverWindow.boundingRegion);

                // We're guaranteed that the window plus children is covering
                // this area, so subtract it out of the input region first as
                // we're handling it.
                inputRegion.subtract(inputRegion, obscuringRegion);

                // Child windows need to be damaged first -- they'll subtract
                // out parts of inputRegion that we want to not be damaged for.
                serverWindow.children.forEach(function(serverWindow) {
                    recursivelyDamage(serverWindow, obscuringRegion);
                });

                // We need to set the window's damaged region, clipped to
                // the region that's passed into damageRegion().
                // Do this by clearing out region, and then adding in
                // what we want to set.
                var windowDamage = serverWindow.damagedRegion;
                windowDamage.subtract(windowDamage, region);
                windowDamage.union(windowDamage, obscuringRegion);
                serverWindow.sendExpose();

                // And transform back.
                inputRegion.translate(serverWindow.x, serverWindow.y);
                region.translate(serverWindow.x, serverWindow.y);

                obscuringRegion.finalize();
            }

            // The caller owns the damaged region, so make sure
            // none of our subtractions take effect.
            var damagedRegion = new Region();
            damagedRegion.copy(region);
            recursivelyDamage(this._rootWindow, damagedRegion);
            damagedRegion.finalize();
        },
        _getServerClientsForEvent: function(event, except) {
            var serverWindow = this.getServerWindow(null, event.windowId);
            if (!serverWindow.filterEvent(event))
                return [];

            var clients = [];
            for (var i = 0; i < this._clients.length; i++) {
                var serverClient = this._clients[i];
                if (serverClient == except)
                    continue;

                if (!serverClient.filterEvent(event))
                    continue;

                clients.push(serverClient);
            }
            return clients;
        },
        _sendError: function(client, error) {
            client.sendEvent({
                type: "Error",
                name: error,
            });
        },
        sendEvent: function(event, except) {
            if (isEventInputEvent(event) && this._grabClient) {
                this._grabClient.sendEvent(event);
                return true;
            } else {
                var clients = this._getServerClientsForEvent(event, except);
                clients.forEach(function(serverClient) {
                    serverClient.sendEvent(event);
                });
                return clients.length > 0;
            }
        },

        _setupInputHandlers: function() {
            this._container.addEventListener("mousemove", this._handleInputMouseMove.bind(this));
            this._container.addEventListener("mousedown", this._handleInputButtonPress.bind(this));
            this._container.addEventListener("mouseup", this._handleInputButtonRelease.bind(this));
            this._container.addEventListener("keypress", this._handleInputKeyPress.bind(this));
            this._container.addEventListener("keyup", this._handleInputKeyRelease.bind(this));
            this._container.addEventListener("contextmenu", function(event) {
                event.preventDefault();
            })
        },

        syncCursorWindow: function() {
            var serverWindow = this._rootWindow.findDeepestChildAtPoint(this._cursorX, this._cursorY);
            var event = { rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY };

            if (serverWindow != this._cursorServerWindow) {
                this._sendCrossingEvents(event, this._cursorServerWindow, serverWindow);
                this._cursorServerWindow = serverWindow;
                this.syncCursor();
            }
        },
        _handleInputBase: function(eventType, domEvent) {
            // The X server should capture all input events.
            domEvent.preventDefault();
            domEvent.stopPropagation();

            // XXX -- actually find event window, that sort of thing.
            var serverWindow;
            switch (eventType) {
                case "Motion":
                case "ButtonPress":
                case "ButtonRelease":
                    serverWindow = this._cursorServerWindow;
                break;
                case "KeyPress":
                case "KeyRelease":
                    serverWindow = this._focusServerWindow;
            }

            if (!serverWindow)
                return null;

            var winCoords = this._translateCoordinates(this._rootWindow, serverWindow, this._cursorX, this._cursorY);

            var event = { type: eventType,
                          rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY,
                          windowId: serverWindow.windowId,
                          winX: winCoords.x,
                          winY: winCoords.y };
            return event;
        },
        _updateCursor: function(domEvent) {
            var box = this._container.getBoundingClientRect();
            var rootCoords = { x: domEvent.clientX - box.left,
                               y: domEvent.clientY - box.top };

            rootCoords.x = Math.min(Math.max(rootCoords.x, 0), this.width - 1);
            rootCoords.y = Math.min(Math.max(rootCoords.y, 0), this.height - 1);

            // This can sometimes happen after a mouseup.
            if (this._cursorX == rootCoords.x &&
                this._cursorY == rootCoords.y)
                return false;

            this._cursorX = rootCoords.x;
            this._cursorY = rootCoords.y;
            this.syncCursorWindow();
            return true;
        },
        _handleInputMouseMove: function(domEvent) {
            if (!this._updateCursor(domEvent))
                return;
            var event = this._handleInputBase("Motion", domEvent);
            this.sendEvent(event);
        },
        _handleInputButtonPress: function(domEvent) {
            this._container.focus();

            this._updateCursor(domEvent);
            var event = this._handleInputBase("ButtonPress", domEvent);
            event.button = domEvent.which;

            function checkGrabRecursively(serverWindow) {
                if (!serverWindow)
                    return null;

                var grabInfo = checkGrabRecursively(serverWindow.parentServerWindow);
                if (grabInfo)
                    return grabInfo;

                return serverWindow.getGrab(event.button);
            }

            if (!this._grabClient) {
                var grabWindow = this.getServerWindow(null, event.windowId);
                var grabInfo = checkGrabRecursively(grabWindow);
                if (!grabInfo) {
                    // Only one ButtonPress can be selected on the same window,
                    // so this should always have length=1.
                    var clients = this._getServerClientsForEvent(event);
                    var firstClient = clients[0];
                    if (firstClient)
                        grabInfo = firstClient.makeGrabInfo(event);
                    else
                        // XXX -- protocol is unclear here -- who gets the grab?
                        // For now, don't take a grab and send just the event.
                        ;
                }

                if (grabInfo)
                    this._grabPointer(grabInfo, true);
            }

            this.sendEvent(event);
        },
        _handleInputButtonRelease: function(domEvent) {
            this._updateCursor(domEvent);
            var event = this._handleInputBase("ButtonRelease", domEvent);
            event.button = domEvent.which;
            this.sendEvent(event);

            if (this._grabClient && this._grabClient.isPassive)
                this.ungrabPointer();
        },
        _handleInputKeyPress: function(domEvent) {
            var event = this._handleInputBase("KeyPress", domEvent);
            if (!event)
                return;

            event.charCode = domEvent.charCode;
            this.sendEvent(event);
        },
        _handleInputKeyRelease: function(domEvent) {
            var event = this._handleInputBase("KeyRelease", domEvent);
            if (!event)
                return;

            // XXX -- doesn't work for KeyRelease. What to do?
            event.charCode = domEvent.charCode;
            this.sendEvent(event);
        },

        _sendCrossingEvents: function(eventBase, fromWin, toWin) {
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
                EnterLeaveEvent("Leave", "Inferior", fromWin, null);
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
        _sendFocusEvents: function(eventBase, fromWin, toWin) {
            // Adapted from Xorg server, a pre-MPX version of dix/events.c
            // Under MIT license

            if (fromWin == toWin)
                return;

            var server = this;

            // TODO: NotifyGrab/NotifyUngrab
            function FocusEvent(type, detail, window) {
                var event = Object.create(eventBase);
                event.type = type;
                event.windowId = window.windowId;
                event.detail = detail;
                server.sendEvent(event);
            }

            function FocusInEvents(ancestor, child, detail, doAncestor, skipChild) {
                if (child == null)
                    return ancestor == null;

                if (ancestor == child) {
                    if (doAncestor)
                        FocusEvent("FocusIn", detail, child);
                    return true;
                } else if (FocusInEvents(ancestor, child.parentServerWindow, detail, doAncestor, skipChild)) {
                    if (child != skipChild)
                        FocusEvent("FocusIn", detail, child);
                    return true;
                }
                return false;
            }

            function FocusOutEvents(child, ancestor, detail, doAncestor) {
                while (child != ancestor) {
                    FocusEvent("FocusOut", detail, child);
                    child = child.parentServerWindow;
                }
                if (doAncestor)
                    FocusEvent("FocusOut", detail, ancestor);
            }

            var detailOut = (fromWin === null) ? "DetailNone" : "PointerRoot";
            var detailIn = (toWin === null) ? "DetailNone" : "PointerRoot";

            // ugh, this is sort of a bad API. We should have a constant
            // window ID for PointerRoot, probably.
            if (toWin === "PointerRoot" || toWin === null) {
                if (fromWin === "PointerRoot" || fromWin === null) {
                    if (fromWin === "PointerRoot")
                        FocusOutEvents(this._cursorServerWindow, this._rootWindow, "Pointer", true);

                    // Notify the root
                    FocusEvent("FocusOut", detailOut, this._rootWindow);
                } else {
                    if (isWindowDescendentOf(fromWin, this._cursorServerWindow))
                        FocusOutEvents(this._cursorServerWindow, fromWin, "Pointer", false);
                    FocusEvent("FocusOut", "Nonlinear", fromWin);
                    FocusOutEvents(fromWin.parentServerWindow, null, "NonlinearVirtual", false);
                }

                // Notify the root
                FocusEvent("FocusIn", detailIn, this._rootWindow);
                if (toWin == "PointerRoot")
                    FocusInEvents(this._rootWindow, this._cursorServerWindow, "Pointer", true, null);
            } else if (fromWin === "PointerRoot" || fromWin === null) {
                {
                    if (fromWin == "PointerRoot")
                        FocusOutEvents(this._cursorServerWindow, this._rootWindow, "Pointer", true);

                    // Notify the root
                    FocusEvent("FocusOut", detailOut, this._rootWindow);

                    if (toWin.parentServerWindow != null)
                        FocusInEvents(this._rootWindow, toWin, "NonlinearVirtual", true, toWin);
                    FocusEvent("FocusIn", "NonlinearVirtual", toWin);
                    if (isWindowDescendentOf(toWin, this._cursorServerWindow))
                        FocusInEvents(toWin, this._cursorServerWindow, "Pointer", false, null);
                }
            } else if (isWindowDescendentOf(fromWin, toWin)) {
                if (isWindowDescendentOf(fromWin, this._cursorServerWindow) &&
                    this._cursorServerWindow != fromWin &&
                    (!isWindowDescendentOf(toWin, this._cursorServerWindow)) &&
                    (!isWindowDescendentOf(this._cursorServerWindow, toWin)))
                    FocusOutEvents(this._cursorServerWindow, fromWin, "Pointer", false);

                FocusEvent("FocusOut", "Interior", fromWin, null);
                FocusInEvents(fromWin, toWin, "Virtual", false, toWin);
                FocusEvent("FocusIn", "Ancestor", toWin, null);
            } else if (isWindowDescendentOf(toWin, fromWin)) {
                FocusEvent("FocusOut", "Ancestor", fromWin, null);
                FocusOutEvents(fromWin, toWin, "Virtual", false);
                FocusEvent("FocusIn", "Inferior", toWin, null);

                if (isWindowDescendentOf(toWin, this._cursorServerWindow) &&
                    this._cursorServerWindow != fromWin &&
                    (!isWindowDescendentOf(fromWin, this._cursorServerWindow)) &&
                    (!isWindowDescendentOf(this._cursorServerWindow, fromWin)))
                    FocusInEvents(this._cursorServerWindow, toWin, "Pointer", false, null);
            } else {
                var common = commonAncestor(toWin, fromWin);
                if (isWindowDescendentOf(fromWin, this._cursorServerWindow))
                    FocusOutEvents(this._cursorServerWindow, fromWin, "Pointer", false);
                FocusEvent("FocusOut", "Nonlinear", fromWin);
                if (fromWin.parentServerWindow != null)
                    FocusOutEvents(fromWin.parentServerWindow, common, "NonlinearVirtual", false);
                if (toWin.parentServerWindow != null)
                    FocusInEvents(common, toWin, "NonlinearVirtual", true, toWin);
                FocusEvent("FocusIn", "Nonlinear", toWin);
                if (isWindowDescendentOf(toWin, this._cursorServerWindow))
                    FocusInEvents(toWin, this._cursorServerWindow, "Pointer", false, null);
            }
        },
        _setInputFocus: function(client, focusWindowId, revert) {
            var focusWindow;
            if (focusWindowId === null || focusWindowId === "PointerRoot") {
                focusWindow = focusWindowId;
            } else {
                focusWindow = this.getServerWindow(client, focusWindowId);
                if (!focusWindow)
                    return;
            }

            var event = { rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY };

            if (focusWindow != this._focusServerWindow || focusWindowId === "PointerRoot") {
                this._sendFocusEvents(event, this._focusServerWindow, focusWindow);
                this._focusServerWindow = focusWindow;
            }

            this._focusRevertTo = revert;
        },
        _revertInputFocus: function() {
            if (this._focusRevertTo === null)
                this._setInputFocus(null, null, null);
            else if (this._focusRevertTo === "Parent")
                this._setInputFocus(null, this._focusServerWindow.parentServerWindow.windowId, null);
            else if (this._focusRevertTo === "PointerRoot")
                this._setInputFocus(null, "PointerRoot", "PointerRoot");
        },

        wrapWindowChange: function(serverWindow, func) {
            if (!serverWindow.mapped) {
                func();
                return;
            }

            // Get the old state.
            var oldRegion = this._calculateEffectiveRegionForWindow(serverWindow);
            var oldPos = serverWindow.calculateAbsoluteOffset();
            var oldW = serverWindow.width, oldH = serverWindow.height;

            func();

            var newRegion = this._calculateEffectiveRegionForWindow(serverWindow);
            var newPos = serverWindow.calculateAbsoluteOffset();

            var tmp = new Region();
            var damagedRegion = new Region();

            // Pixels need to be exposed under the window in places where the
            // old region is, but the new region isn't.
            tmp.subtract(oldRegion, newRegion);
            damagedRegion.union(damagedRegion, tmp);

            function pointEqual(a, b) {
                return a.x == b.x && a.y == b.y;
            }

            if (oldRegion.not_empty() && !pointEqual(oldPos, newPos)) {
                // We're going to copy the contents of the old region into
                // the area of the new region, so translate the old region
                // into the coordinate space of the new region.
                oldRegion.translate(newPos.x - oldPos.x, newPos.y - oldPos.y);

                var ctx = this._ctx;
                ctx.beginPath();
                ctx.save();
                tmp.intersect(newRegion, oldRegion);
                pathFromRegion(ctx, tmp);
                ctx.clip();
                copyArea(ctx, oldPos.x, oldPos.y, newPos.x, newPos.y, oldW, oldH);
                ctx.restore();
            }

            // Pixels need to be exposed on the window in places where the
            // new region is, but the old region isn't.
            tmp.subtract(newRegion, oldRegion);
            damagedRegion.union(damagedRegion, tmp);

            this.damageRegion(damagedRegion);
            this.syncCursorWindow();

            tmp.finalize();
            damagedRegion.finalize();

            oldRegion.finalize();
            newRegion.finalize();
        },

        _grabPointer: function(grabInfo, isPassive) {
            this._grabClient = new ServerGrabClient(this, grabInfo, isPassive);
            this.syncCursor();
        },
        ungrabPointer: function() {
            this._grabClient = null;
            this.syncCursor();
        },

        // Used by _createRootWindow and createWindow.
        _createWindowInternal: function(props) {
            var windowId = ++this._nextWindowId;
            var serverWindow = new ServerWindow(windowId, this, props);
            this._windowsById[windowId] = serverWindow;
            return serverWindow;
        },
        damageWindow: function(serverWindow, force) {
            if (!serverWindow.mapped && !force)
                return;

            var region = this._calculateEffectiveRegionForWindow(serverWindow);
            this.damageRegion(region);
            region.finalize();
        },
        viewabilityChanged: function(serverWindow) {
            // If a window is becoming unviewable and we have a grab on it,
            // drop the grab.
            if (!serverWindow.viewable) {
                if (this._grabClient && this._grabClient.grabWindow == serverWindow)
                    this.ungrabPointer();

                if (this._focusServerWindow == serverWindow)
                    this._revertInputFocus();
            }
        },
        getServerWindow: function(client, windowId) {
            var serverWindow = this._windowsById[windowId];
            if (serverWindow) {
                return serverWindow;
            } else if (client) {
                this._sendError(client, "BadWindow");
                return null;
            } else {
                throw new Error("Internal BadWindow - should not happen");
            }
        },
        _checkOtherClientsForEvent: function(windowId, eventType, except) {
            return this._clients.some(function(otherClient) {
                if (otherClient === except)
                    return false;

                return otherClient.isInterestedInWindowEvent(windowId, eventType);
            });
        },

        // Client request handlers.
        _handle_selectInput: function(client, props) {
            var windowId = props.windowId;
            var events = props.events;
            var checkEvent = (function checkEvent(eventType) {
                if (events.indexOf(eventType) >= 0)
                    if (this._checkOtherClientsForEvent(windowId, eventType, client))
                        this._sendError(client, "BadAccess")
            }).bind(this);
            checkEvent("SubstructureRedirect");
            checkEvent("ButtonPress");

            client.selectInput(windowId, events);
        },
        _handle_createWindow: function(client, props) {
            var serverWindow = this._createWindowInternal(props);
            serverWindow.parentWindow(this._rootWindow);
            return serverWindow.windowId;
        },
        _handle_destroyWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.destroy();
            serverWindow.finalize();
            this._windowsById[props.windowId] = null;
        },
        _handle_reparentWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            var newServerParentWindow = this.getServerWindow(client, props.newParentId);
            if (!serverWindow || !newServerParentWindow)
                return;

            serverWindow.parentWindow(newServerParentWindow);
        },
        _handle_mapWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.map(client);
        },
        _handle_unmapWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.unmap();
        },
        _handle_configureWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.configureWindow(client, props);
        },
        _handle_getGeometry: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            return serverWindow.getGeometry();
        },
        _handle_translateCoordinates: function(client, props) {
            var srcServerWindow = this.getServerWindow(client, props.srcWindowId);
            var destServerWindow = this.getServerWindow(client, props.destWindowId);
            if (!srcServerWindow || !destServerWindow)
                return;

            return this._translateCoordinates(srcServerWindow, destServerWindow, props.x, props.y);
        },
        _handle_changeAttributes: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            delete props.windowId;
            serverWindow.changeAttributes(props);
        },
        _handle_getProperty: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            return serverWindow.getProperty(props.name);
        },
        _handle_changeProperty: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.changeProperty(props.name, props.value);
        },
        _handle_grabPointer: function(client, props) {
            var grabWindow = this.getServerWindow(client, props.windowId);
            if (!grabWindow)
                return;

            // TODO: keyboardMode
            // Investigate HTML5 APIs for confineTo

            if (this._grabClient) {
                // Allow overwriting a grab from the same client. By core event
                // protocol semantics, this should be ChangeActivePointerGrab,
                // but I like the XI2 semantics of just calling grabPointer again.
                // I think it's cleaner, and it cuts down on the amount of duplicate
                // code.
                //
                // Note that we also follow the XI2 semantics that when GrabPointer
                // is called when there's an passive pointer grab, we change it into
                // an active grab. This is different from ChangeActivePointerGrab.
                if (this._grabClient.serverClient == client)
                    this.ungrabPointer();
                else
                    this._sendError(client, "AlreadyGrabbed");
            }

            var grabInfo = { serverClient: client,
                             grabWindow: grabWindow,
                             ownerEvents: props.ownerEvents,
                             events: props.events,
                             pointerMode: props.pointerMode,
                             cursor: props.cursor };
            this._grabPointer(grabInfo, false);
        },
        _handle_ungrabPointer: function(client, props) {
            if (this._grabClient && this._grabClient.serverClient == client)
                this.ungrabPointer();
        },
        _handle_grabButton: function(client, props) {
            var grabWindow = this.getServerWindow(client, props.windowId);
            if (!grabWindow)
                return;

            var grabInfo = { serverClient: client,
                             grabWindow: grabWindow,
                             ownerEvents: props.ownerEvents,
                             events: props.events,
                             pointerMode: props.pointerMode,
                             cursor: props.cursor };
            grabWindow.grabButton(props.button, grabInfo);
        },
        _handle_ungrabButton: function(client, props) {
            var grabWindow = this.getServerWindow(client, props.windowId);
            if (!grabWindow)
                return;

            grabWindow.ungrabButton(props.button);
        },
        _handle_setInputFocus: function(client, props) {
            this._setInputFocus(client, props.windowId, props.revert);
        },
        _handle_allowEvents: function(client, props) {
            this._grabClient.allowEvents(props.pointerMode);
        },

        _handle_invalidateWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            this.damageWindow(serverWindow, false);
        },
        _handle_clearDamage: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.clearDamage(props.region);
        },
        _handle_setWindowShapeRegion: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.setWindowShapeRegion(props.shapeType, props.region);
        },

        handleRequest: function(client, requestName, props) {
            var handler = this['_handle_' + requestName];
            return handler.call(this, client, props);
        },

        // Called by the client to get a socket connection.
        clientConnected: function(client) {
            var serverClient = new ServerClient(this, client);
            this._clients.push(serverClient);
            return { clientPort: serverClient.clientPort,
                     server: serverClient.publicServer };
        },

        // Not a request, as it requires custom marshalling.
        drawWithContext: function(client, windowId, func) {
            var serverWindow = this.getServerWindow(client, windowId);
            if (!serverWindow || !serverWindow.mapped)
                return;

            var ctx = this._ctx;
            ctx.beginPath();
            ctx.save();
            serverWindow.prepareContext(ctx);
            func(ctx);
            ctx.restore();
        },
    });

    exports.Server = Server;

})(window);
