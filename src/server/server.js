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
    function copyArea(src, dest, srcX, srcY, destX, destY, w, h) {
        if (srcX + w < 0 || srcX > src.canvas.width)
            return;

        if (destX + w < 0 || destX > dest.canvas.width)
            return;

        if (srcY + h < 0 || srcY > src.canvas.height)
            return;

        if (destY + h < 0 || destY > src.canvas.height)
            return;

        if (src == dest) {
            if (destX < 0) {
                w += destX;
                srcX -= destX;
                destX = 0;
            }

            if (srcX < 0) {
                destX -= srcX;
                w += srcX;
                srcX = 0;
            }

            if (destY < 0) {
                h += destY;
                srcY -= destY;
                destY = 0;
            }

            if (srcY < 0) {
                destY -= srcY;
                h += srcY;
                srcY = 0;
            }

            var mX = Math.max(srcX, destX);
            if (mX >= dest.canvas.width)
                return;

            if (mX + w > dest.canvas.width)
                w = dest.canvas.width - mX;

            var mY = Math.max(srcY, destY);
            if (mY >= dest.canvas.height)
                return;

            if (mY + h > dest.canvas.height)
                h = dest.canvas.height - mY;
        }

        dest.drawImage(src.canvas, srcX, srcY, w, h, destX, destY, w, h);
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

    // A canvas to save data on during resizes.
    var tmpCanvas = document.createElement("canvas");
    var tmpCtx = tmpCanvas.getContext('2d');

    var ServerPixmap = new Class({
        initialize: function(xid, server, props) {
            this.xid = xid;
            this._server = server;

            this.canvas = document.createElement("canvas");
            this.canvas.width = props.width;
            this.canvas.height = props.height;
            this._ctx = this.canvas.getContext('2d');
        },
        destroy: function() {
            this.canvas.width = 0;
            this.canvas.height = 0;
            this._server.xidDestroyed(this.xid);
        },
        canDraw: function() {
            return true;
        },
        drawWithContext: function(func) {
            var ctx = this._ctx;

            ctx.beginPath();
            ctx.save();
            func(ctx);
            ctx.restore();
        },

        resize: function(width, height) {
            // Save the old pixmap contents
            tmpCanvas.width = this.canvas.width;
            tmpCanvas.height = this.canvas.height;
            tmpCtx.drawImage(this.canvas, 0, 0, this.canvas.width, this.canvas.height);

            // Resize the pixmap canvas
            this.canvas.width = width;
            this.canvas.height = height;

            // And then draw the old contents back on
            this._ctx.drawImage(tmpCanvas, 0, 0, tmpCanvas.width, tmpCanvas.height);

            // And then, to save memory, dump the old image contents
            tmpCanvas.width = 1;
            tmpCanvas.height = 1;
        }
    });

    var DEFAULT_BACKGROUND_COLOR = '#ddd';

    var ServerWindow = new Class({
        initialize: function(xid, server, props) {
            this.xid = xid;
            this._server = server;

            this._backgroundColor = null;

            // The bounding region, used if the window is unshaped.
            this._unshapedBoundingRegion = new Region();

            // The bounding region, as defined by the SHAPE extension, in window coordinates.
            this._shapedBoundingRegion = null;

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
            this._unshapedBoundingRegion.finalize();
            this._unshapedBoundingRegion = null;

            if (this._shapedBoundingRegion) {
                this._shapedBoundingRegion.finalize();
                this._shapedBoundingRegion = null;
            }
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
        getBoundingRegion: function() {
            var boundingRegion = new Region();

            if (this._shapedBoundingRegion)
                boundingRegion.intersect(this._shapedBoundingRegion, this._unshapedBoundingRegion);
            else
                boundingRegion.copy(this._unshapedBoundingRegion);

            return boundingRegion;
        },
        calculateTransformedBoundingRegion: function() {
            var region = this.getBoundingRegion();
            this._iterParents(function(serverWindow) {
                var bounding = serverWindow.getBoundingRegion()
                region.intersect(region, bounding);
                region.translate(serverWindow.x, serverWindow.y);
                bounding.finalize();
            });
            return region;
        },
        canDraw: function() {
            return this.viewable;
        },
        _drawClippedToRegion: function(region, func) {
            this._server.drawToFrontBuffer(function(ctx) {
                ctx.beginPath();
                ctx.save();

                pathFromRegion(ctx, region);
                ctx.clip();

                func(ctx);
                ctx.restore();
            }.bind(this));
        },
        _drawBackground: function(ctx) {
            var pos = this.calculateAbsoluteOffset();

            if (this._backgroundColor) {
                ctx.fillStyle = this._backgroundColor;
                ctx.fillRect(pos.x, pos.y, this.width, this.height);
            }
        },
        drawWithContext: function(func) {
            var region = this._server.calculateEffectiveRegionForWindow(this, false);
            this._drawClippedToRegion(region, function(ctx) {
                var pos = this.calculateAbsoluteOffset();
                ctx.translate(pos.x, pos.y);
                func(ctx);
            }.bind(this));
            region.finalize();
        },
        copyContents: function(oldRegion, newRegion, oldPos, newPos, width, height) {
            var region = new Region();
            region.intersect(newRegion, oldRegion);
            this._drawClippedToRegion(region, function(ctx) {
                copyArea(ctx, ctx, oldPos.x, oldPos.y, newPos.x, newPos.y, width, height);
            });
            region.finalize();
        },
        sendExpose: function(region) {
            if (region.is_empty())
                return;

            var extents = region.extents();

            var pos = this.calculateAbsoluteOffset();
            region.translate(pos.x, pos.y);
            this._drawClippedToRegion(region, this._drawBackground.bind(this));

            this._server.sendEvent({ type: "Expose",
                                     windowId: this.xid,
                                     x: extents.x, y: extents.y,
                                     width: extents.width, height: extents.height });
        },
        changeAttributes: function(attributes) {
            if (valueUpdated(attributes.backgroundColor, this._backgroundColor)) {
                this._backgroundColor = attributes.backgroundColor || DEFAULT_BACKGROUND_COLOR;
                this._server.exposeWindow(this, false, false);
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
                                     windowId: this.xid,
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

            var eventBase = { windowId: this.xid };
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
                                         windowId: this.xid });
                this.recalculateViewability();
                this._server.syncCursorWindow();
            }
        },
        unmap: function() {
            if (!this.mapped)
                return false;

            this.mapped = false;
            this._server.exposeWindow(this, true, true);
            this._server.sendEvent({ type: "UnmapNotify",
                                     windowId: this.xid });
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
                                     windowId: this.xid });

            this._unparentWindowInternal();
            this._server.xidDestroyed(this.xid);
            this.finalize();
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

            var bounding = this.getBoundingRegion();
            var containsPoint = bounding.contains_point(x, y);
            bounding.finalize();

            if (!containsPoint)
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

            this._unshapedBoundingRegion.init_rect(0, 0, this.width, this.height);
        },

        configureWindow: function(client, props) {
            var eventBase = { windowId: this.xid,
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
                if (region) {
                    if (!this._shapedBoundingRegion)
                        this._shapedBoundingRegion = new Region();
                    this._shapedBoundingRegion.copy(region);
                } else {
                    if (this._shapedBoundingRegion) {
                        this._shapedBoundingRegion.finalize();
                        this._shapedBoundingRegion = null;
                    }
                }
            }
        },
        setWindowShapeRegion: function(shapeType, region) {
            this._server.wrapWindowChange(this, function() {
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
            this.rootWindowId = this._server.rootWindowId;
        }
    });

    var publicRequests = [
        'clientConnected',
        'createPixmap',
        'freePixmap',
        'createWindow',
        'destroyWindow',
        'reparentWindow',
        'mapWindow',
        'unmapWindow',
        'configureWindow',
        'queryTree',
        'getGeometry',
        'translateCoordinates',
        'changeAttributes',
        'getProperty',
        'changeProperty',
        'selectInput',
        'grabPointer',
        'ungrabPointer',
        'grabButton',
        'ungrabButton',
        'queryPointer',
        'setInputFocus',
        'allowEvents',
        'copyArea',

        // JS extension -- simplifies the case of drawing
        // by letting someone use an existing expose handler.
        // This is the model used by GDK internally.
        'invalidateWindow',

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
            if (parent) {
                if (substructureRedirect && this.isInterestedInWindowEvent(parent.xid, "SubstructureRedirect"))
                    return true;
                if (substructureNotify && this.isInterestedInWindowEvent(parent.xid, "SubstructureNotify"))
                    return true;
            }

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

    // A ServerGrabClient is a helper class that handles some
    // details about grabs to make event delivery and other things
    // easier.
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
                newEvent.windowId = this.grabWindow.xid;
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

    function clientError(error) {
        var error = new Error(error);
        error.isClientError = true;
        return error;
    }

    var Server = new Class({
        initialize: function() {
            this._setupDOM();
            this._createFrontBuffer();
            this.elem = this._container;

            this._clients = [];

            this._nextXid = 0;
            this._xidToObject = {};

            // Input
            this._setupInputHandlers();
            this._cursorX = -1;
            this._cursorY = -1;
            this._cursorServerWindow = null;
            this._buttonsDown = [];

            this._focusRevertTo = null;
            this._focusServerWindow = null;
            this._grabClient = null;

            // This needs to be done after we set up everything else
            // as it uses the standard redraw and windowing machinery.
            this._createRootWindow();
            this.syncCursorWindow();
        },

        _setupDOM: function() {
            this._container = document.createElement("div");
            this._container.tabIndex = 0;

            // Allow querying with ".xserver.js"
            this._container.classList.add("xserver");
            this._container.classList.add("js");
        },

        drawToFrontBuffer: function(func) {
            this._frontBufferPixmap.drawWithContext(func);
        },
        _createFrontBuffer: function() {
            this._frontBufferPixmap = new ServerPixmap(-1, this, { width: 1, height: 1 });
            this._container.appendChild(this._frontBufferPixmap.canvas);
        },
        resize: function(width, height) {
            this._frontBufferPixmap.resize(width, height);

            this._container.style.width = width + "px";
            this._container.style.height = height + "px";
            this._rootWindow.configureWindow(null, { width: width, height: height });
        },
        _createRootWindow: function() {
            this._rootWindow = this._createWindowInternal({ x: 0, y: 0, width: 1, height: 1 });
            this.rootWindowId = this._rootWindow.xid;
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
        // immediately exposed if the window was removed. That is,
        // the window's shape region clipped to the areas that are
        // visible.
        calculateEffectiveRegionForWindow: function(serverWindow, includeChildren) {
            var region = serverWindow.calculateTransformedBoundingRegion();

            function subtractWindow(aboveWindow) {
                if (!aboveWindow.viewable)
                    return;

                var transformedBoundingRegion = aboveWindow.calculateTransformedBoundingRegion();
                region.subtract(region, transformedBoundingRegion);
                transformedBoundingRegion.finalize();
            }

            if (!includeChildren)
                serverWindow.children.forEach(subtractWindow);

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
            else
                cursor = this._cursorServerWindow.cursor;

            this._container.dataset.cursor = cursor;
        },

        _exposeRegion: function(region) {
            function recursivelyExpose(serverWindow, inputRegion) {
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

                // Clip the exposed region to the bounding region to get
                // the maximum area that's obscured.
                var bounding = serverWindow.getBoundingRegion();
                obscuringRegion.intersect(inputRegion, bounding);
                bounding.finalize();

                // We're guaranteed that the window plus children is covering
                // this area, so subtract it out of the input region first as
                // we're handling it.
                inputRegion.subtract(inputRegion, obscuringRegion);

                // Child windows need to be exposed first -- they'll subtract
                // out parts of inputRegion that we want to not be exposed for.
                serverWindow.children.forEach(function(serverWindow) {
                    recursivelyExpose(serverWindow, obscuringRegion);
                });

                serverWindow.sendExpose(obscuringRegion);
                obscuringRegion.finalize();

                // And transform back.
                inputRegion.translate(serverWindow.x, serverWindow.y);
                region.translate(serverWindow.x, serverWindow.y);
            }

            // The caller owns the exposed region, so make sure
            // none of our subtractions take effect.
            var exposedRegion = new Region();
            exposedRegion.copy(region);
            recursivelyExpose(this._rootWindow, exposedRegion);
            exposedRegion.finalize();
        },
        _hasServerClientInterestedInWindowEvent: function(windowId, eventType) {
            for (var i = 0; i < this._clients.length; i++) {
                var serverClient = this._clients[i];
                if (serverClient.isInterestedInWindowEvent(windowId, eventType))
                    return true;
            }
            return false;
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

        syncCursorWindow: function(mode) {
            var serverWindow = this._rootWindow.findDeepestChildAtPoint(this._cursorX, this._cursorY);
            if (!serverWindow)
                serverWindow = this._rootWindow;

            var event = { rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY,
                          mode: (mode || "Normal") };

            if (serverWindow != this._cursorServerWindow) {
                this._sendCrossingEvents(event, this._cursorServerWindow, serverWindow);
                this._cursorServerWindow = serverWindow;
                this.syncCursor();
            }
        },
        _findEventAndChildWindow: function(eventType) {
            var findInterestedWindow = (function findInterestedWindow(window, eventType, until) {
                while (window != until) {
                    if (this._hasServerClientInterestedInWindowEvent(window.xid, eventType))
                        return window;
                    window = window.parentServerWindow;
                }
                return null;
            }).bind(this);

            var childWindow = this._cursorServerWindow;
            var eventWindow;
            switch (eventType) {
                case "Motion":
                case "ButtonPress":
                case "ButtonRelease":
                    eventWindow = this._grabClient ? this._grabClient.grabWindow : findInterestedWindow(childWindow, eventType, null);
                break;
                case "KeyPress":
                case "KeyRelease":
                    if (isWindowDescendentOf(this._focusServerWindow, childWindow)) {
                        eventWindow = findInterestedWindow(childWindow, eventType, this._focusServerWindow);
                    } else {
                        eventWindow = this._focusServerWindow;
                        childWindow = null;
                    }
                break;
            }

            return { event: eventWindow,
                     child: childWindow };
        },
        _handleInputBase: function(eventType, domEvent) {
            // The X server should capture all input events.
            domEvent.preventDefault();
            domEvent.stopPropagation();

            var windows = this._findEventAndChildWindow(eventType);
            if (!windows.event)
                return null;

            var winCoords = this._translateCoordinates(this._rootWindow, windows.event, this._cursorX, this._cursorY);

            var event = { type: eventType,
                          rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY,
                          windowId: windows.event.xid,
                          childWindowId: windows.child ? windows.child.xid : null,
                          winX: winCoords.x,
                          winY: winCoords.y };
            return event;
        },
        _updateCursor: function(domEvent) {
            var box = this._container.getBoundingClientRect();
            var rootCoords = { x: domEvent.clientX - box.left,
                               y: domEvent.clientY - box.top };

            rootCoords.x = Math.min(Math.max(rootCoords.x, 0), this._rootWindow.width - 1);
            rootCoords.y = Math.min(Math.max(rootCoords.y, 0), this._rootWindow.height - 1);

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
            if (event)
                this.sendEvent(event);
        },
        _handleInputButtonPress: function(domEvent) {
            this._container.focus();

            this._updateCursor(domEvent);
            var event = this._handleInputBase("ButtonPress", domEvent);
            var button = domEvent.which;

            this._buttonsDown.push(button);

            function checkGrabRecursively(serverWindow) {
                if (!serverWindow)
                    return null;

                var grabInfo = checkGrabRecursively(serverWindow.parentServerWindow);
                if (grabInfo)
                    return grabInfo;

                return serverWindow.getGrab(button);
            }

            if (!this._grabClient) {
                var grabInfo;
                if (event) {
                    var grabWindow = this.getServerWindow(null, event.windowId);
                    var grabInfo = checkGrabRecursively(grabWindow);
                    if (!grabInfo) {
                        // Only one ButtonPress can be selected on the same window,
                        // so this should always have length=1.
                        var clients = this._getServerClientsForEvent(event);
                        var firstClient = clients[0];
                        if (firstClient)
                            grabInfo = firstClient.makeGrabInfo(event);
                    }
                }

                if (grabInfo)
                    this._grabPointer(grabInfo, true);
                else
                    // XXX -- protocol is unclear here -- who gets the grab?
                    // For now, don't take a grab and send just the event.
                    ;
            }

            if (event) {
                event.button = button;
                this.sendEvent(event);
            }
        },
        _handleInputButtonRelease: function(domEvent) {
            this._updateCursor(domEvent);
            var event = this._handleInputBase("ButtonRelease", domEvent);
            var button = domEvent.which;
            if (event) {
                event.button = button;
                this.sendEvent(event);
            }

            var idx = this._buttonsDown.indexOf(button);
            // This can happen if the user releases the button over the window, but
            // didn't initially press on it.
            if (idx < 0)
                return;

            this._buttonsDown.splice(idx, 1);

            if (this._grabClient && this._grabClient.isPassive && this._buttonsDown.length == 0)
                this.ungrabPointer();
        },
        _handleInputKeyPress: function(domEvent) {
            var event = this._handleInputBase("KeyPress", domEvent);
            if (event) {
                event.charCode = domEvent.charCode;
                this.sendEvent(event);
            }
        },
        _handleInputKeyRelease: function(domEvent) {
            var event = this._handleInputBase("KeyRelease", domEvent);
            if (event) {
                // XXX -- doesn't work for KeyRelease. What to do?
                event.charCode = domEvent.charCode;
                this.sendEvent(event);
            }
        },

        _sendCrossingEvents: function(eventBase, fromWin, toWin) {
            // Adapted from Xorg server, a pre-MPX version of dix/enterleave.c
            // Under MIT license

            var server = this;

            if (!fromWin)
                fromWin = this._rootWindow;

            function EnterLeaveEvent(type, detail, window, child) {
                var event = Object.create(eventBase);
                event.type = type;
                event.windowId = window.xid;
                event.subwindowId = child ? child.xid : null;
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
                event.windowId = window.xid;
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
                this._setInputFocus(null, this._focusServerWindow.parentServerWindow.xid, null);
            else if (this._focusRevertTo === "PointerRoot")
                this._setInputFocus(null, "PointerRoot", "PointerRoot");
        },

        wrapWindowChange: function(serverWindow, func) {
            if (!serverWindow.viewable) {
                func();
                return;
            }

            // Get the old state.
            var oldRegion = this.calculateEffectiveRegionForWindow(serverWindow, true);
            var oldPos = serverWindow.calculateAbsoluteOffset();
            var oldW = serverWindow.width, oldH = serverWindow.height;

            func();

            var newRegion = this.calculateEffectiveRegionForWindow(serverWindow, true);
            var newPos = serverWindow.calculateAbsoluteOffset();

            var tmp = new Region();
            var exposedRegion = new Region();

            // Pixels need to be exposed under the window in places where the
            // old region is, but the new region isn't.
            tmp.subtract(oldRegion, newRegion);
            exposedRegion.union(exposedRegion, tmp);

            function pointEqual(a, b) {
                return a.x == b.x && a.y == b.y;
            }

            if (oldRegion.not_empty() && !pointEqual(oldPos, newPos)) {
                // We're going to copy the contents of the old region into
                // the area of the new region, so translate the old region
                // into the coordinate space of the new region.
                oldRegion.translate(newPos.x - oldPos.x, newPos.y - oldPos.y);
                serverWindow.copyContents(oldRegion, newRegion, oldPos, newPos, oldW, oldH);
            }

            // Pixels need to be exposed on the window in places where the
            // new region is, but the old region isn't.
            tmp.subtract(newRegion, oldRegion);
            exposedRegion.union(exposedRegion, tmp);

            this._exposeRegion(exposedRegion);
            this.syncCursorWindow();

            tmp.finalize();
            exposedRegion.finalize();

            oldRegion.finalize();
            newRegion.finalize();
        },

        _grabPointer: function(grabInfo, isPassive) {
            this._grabClient = new ServerGrabClient(this, grabInfo, isPassive);
            this.syncCursorWindow("Grab");
            this.syncCursor();
        },
        ungrabPointer: function() {
            this._grabClient = null;
            this.syncCursorWindow("Ungrab");
            this.syncCursor();
        },
        exposeWindow: function(serverWindow, force, includeChildren) {
            if (!serverWindow.viewable && !force)
                return;

            var region = this.calculateEffectiveRegionForWindow(serverWindow, includeChildren);
            this._exposeRegion(region);
            region.finalize();
        },
        viewabilityChanged: function(serverWindow) {
            if (serverWindow.viewable) {
                // If a window is now viewable, expose it.
                this.exposeWindow(serverWindow, false, false);
            } else {
                // If a window is now unviewable and we have a grab on it,
                // drop the grab.
                if (this._grabClient && this._grabClient.grabWindow == serverWindow)
                    this.ungrabPointer();

                if (this._focusServerWindow == serverWindow)
                    this._revertInputFocus();
            }
        },
        _createXidObjectInternal: function(constructor, props) {
            var xid = ++this._nextXid;
            var obj = new constructor(xid, this, props);
            this._xidToObject[xid] = obj;
            return obj;
        },
        _createWindowInternal: function(props) {
            return this._createXidObjectInternal(ServerWindow, props);
        },
        _createPixmapInternal: function(props) {
            return this._createXidObjectInternal(ServerPixmap, props);
        },
        _getXidObjectInternal: function(client, xid, error) {
            var obj = this._xidToObject[xid];
            if (obj)
                return obj;
            else if (client)
                throw clientError(error);
            else
                throw new Error("Internal " + error + " - should not happen");
        },
        xidDestroyed: function(xid) {
            this._xidToObject[xid] = null;
        },
        getServerWindow: function(client, windowId) {
            return this._getXidObjectInternal(client, windowId, "BadWindow");
        },
        getDrawable: function(client, drawableId) {
            return this._getXidObjectInternal(client, drawableId, "BadDrawable");
        },
        _checkOtherClientsForEvent: function(windowId, eventType, except) {
            return this._clients.some(function(otherClient) {
                if (otherClient === except)
                    return false;

                return otherClient.isInterestedInWindowEvent(windowId, eventType);
            });
        },

        // Client request handlers.
        _handle_createPixmap: function(client, props) {
            var serverPixmap = this._createPixmapInternal(props);
            return serverPixmap.xid;
        },
        _handle_freePixmap: function(client, props) {
            var serverPixmap = this.getDrawable(client, props.drawableId);
            serverPixmap.destroy();
        },
        _handle_createWindow: function(client, props) {
            var serverWindow = this._createWindowInternal(props);
            serverWindow.parentWindow(this._rootWindow);
            return serverWindow.xid;
        },
        _handle_destroyWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.destroy();
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
        _handle_queryTree: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            var reply = {};
            reply.root = this.rootWindowId;
            reply.parent = serverWindow.parentServerWindow ? serverWindow.parentServerWindow.xid : null;
            reply.children = serverWindow.children.map(function(w) {
                return w.xid;
            }).reverse();
            return reply;
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
        _handle_selectInput: function(client, props) {
            var windowId = props.windowId;
            var events = props.events;
            var checkEvent = (function checkEvent(eventType) {
                if (events.indexOf(eventType) >= 0)
                    if (this._checkOtherClientsForEvent(windowId, eventType, client))
                        throw clientError(error);
            }).bind(this);
            checkEvent("SubstructureRedirect");
            checkEvent("ButtonPress");

            client.selectInput(windowId, events);
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
                    throw clientError("AlreadyGrabbed");
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
        _handle_queryPointer: function(client, props) {
            return { rootX: this._cursorX,
                     rootY: this._cursorY,
                     buttons: this._buttonsDown };
        },
        _handle_setInputFocus: function(client, props) {
            this._setInputFocus(client, props.windowId, props.revert);
        },
        _handle_allowEvents: function(client, props) {
            this._grabClient.allowEvents(props.pointerMode);
        },
        _handle_copyArea: function(client, props) {
            var srcDrawable = this.getDrawable(client, props.srcDrawableId);
            var destDrawable = this.getDrawable(client, props.destDrawableId);
            if (!destDrawable.canDraw())
                return;

            destDrawable.drawWithContext(function(dest) {
                srcDrawable.drawWithContext(function(src) {
                    copyArea(src, dest, props.srcX, props.srcY, props.destX, props.destY, props.width, props.height);
                });
            });
        },

        _handle_invalidateWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            var includeChildren = !!props.includeChildren;
            this.exposeWindow(serverWindow, false, includeChildren);
        },
        _handle_setWindowShapeRegion: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (!serverWindow)
                return;

            serverWindow.setWindowShapeRegion(props.shapeType, props.region);
        },

        handleRequest: function(client, requestName, props) {
            var handler = this['_handle_' + requestName];
            try {
                return handler.call(this, client, props);
            } catch (e) {
                if (e.isClientError)
                    this._sendError(client, e.error);
                else
                    throw e;
            }
        },

        // Called by the client to get a socket connection.
        clientConnected: function(client) {
            var serverClient = new ServerClient(this, client);
            this._clients.push(serverClient);
            return { clientPort: serverClient.clientPort,
                     server: serverClient.publicServer };
        },

        // Not a request, as it requires custom marshalling.
        drawWithContext: function(client, drawableId, func) {
            var drawable = this.getDrawable(client, drawableId);
            if (!drawable || !drawable.canDraw())
                return;

            drawable.drawWithContext(func);
        },
    });

    exports.Server = Server;

})(window);
