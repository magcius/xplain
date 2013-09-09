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

    var Pixmap = new Class({
        initialize: function() {
            this.canvas = document.createElement("canvas");
            this._ctx = this.canvas.getContext('2d');
        },
        destroy: function() {
            this.canvas.width = 0;
            this.canvas.height = 0;
        },
        drawTo: function(func) {
            this._ctx.beginPath();
            this._ctx.save();
            func(this._ctx);
            this._ctx.restore();
        },
        resize: function(width, height) {
            if (this.canvas.width == width && this.canvas.height == height)
                return;

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
            tmpCanvas.width = 0;
            tmpCanvas.height = 0;
        }
    });

    var ServerPixmap = new Class({
        initialize: function(xid, server, props) {
            this.xid = xid;
            this._server = server;
            this._pixmap = new Pixmap();
            this._pixmap.resize(props.width, props.height);
        },
        destroy: function() {
            this._pixmap.destroy();
            this._server.xidDestroyed(this.xid);
        },
        canDraw: function() {
            return true;
        },
        drawTo: function(func) {
            this._pixmap.drawTo(func);
        },
        getGeometry: function() {
            return { width: this._pixmap.canvas.width,
                     height: this._pixmap.canvas.height };
        },

        getImage: function() {
            return this._pixmap.canvas;
        },
        getPattern: function() {
            return tmpCtx.createPattern(this._pixmap.canvas, 'repeat');
        },
    });

    // A draw tree manages a subtree of windows where the root owns
    // its own backing pixmap. By default, the only draw tree is
    // the one for the root window.
    //
    // When a window is redirected, it gets a new draw tree where
    // it is the root. Subwindows, instead of painting to the front
    // buffer pixmap, paint to this redirected pixmap instead using
    // the standard clipping semantics.
    var ServerWindowDrawTree = new Class({
        initialize: function(server, rootWindow) {
            this._server = server;
            this._rootWindow = rootWindow;

            this.pixmap = new Pixmap();
            this.rootReconfigured();
        },

        rootReconfigured: function() {
            this.pixmap.resize(this._rootWindow.width, this._rootWindow.height);
        },

        exposeWindow: function(serverWindow, force, includeChildren) {
            if (!serverWindow.viewable && !force)
                return;

            var region = this.calculateEffectiveRegionForWindow(serverWindow, includeChildren);
            this.exposeRegion(region);
            region.finalize();
        },

        exposeRegion: function(region) {
            var recursivelyExpose = function(serverWindow, inputRegion) {
                if (!serverWindow.mapped)
                    return;
                if (serverWindow.drawTree != this)
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
            }.bind(this);

            // The caller owns the exposed region, so make sure
            // none of our subtractions take effect.
            var exposedRegion = new Region();
            exposedRegion.copy(region);
            recursivelyExpose(this._rootWindow, exposedRegion);
            exposedRegion.finalize();
        },

        // For a given window, return the region that would be
        // immediately exposed if the window was removed. That is,
        // the window's shape region clipped to the areas that are
        // visible.
        calculateEffectiveRegionForWindow: function(serverWindow, includeChildren) {
            var region = serverWindow.calculateTransformedBoundingRegion();

            var subtractWindow = function(aboveWindow) {
                if (!aboveWindow.viewable)
                    return;
                if (serverWindow.drawTree != this)
                    return;

                var transformedBoundingRegion = aboveWindow.calculateTransformedBoundingRegion();
                region.subtract(region, transformedBoundingRegion);
                transformedBoundingRegion.finalize();
            }.bind(this);

            if (!includeChildren)
                serverWindow.children.forEach(subtractWindow);

            while (serverWindow != null && serverWindow.drawTreeParent != null) {
                var parent = serverWindow.drawTreeParent;
                var idx = parent.children.indexOf(serverWindow);
                var windowsOnTop = parent.children.slice(0, idx);
                windowsOnTop.forEach(subtractWindow);
                serverWindow = parent;
            }
            return region;
        }
    });

    var ServerWindow = new Class({
        initialize: function(xid, server, props) {
            this.xid = xid;
            this._server = server;

            this._backgroundColor = null;
            this._backgroundPixmap = null;
            this._backgroundPattern = null;

            this._unshapedBoundingRegion = new Region();
            this._shapedBoundingRegion = null;
            this._shapedInputRegion = null;

            this.drawTree = null;
            // The draw tree parent is the same as the window tree parent if
            // we share the same draw tree. If our window tree parent doesn't
            // share the same draw tree, then that means we are the root window
            // of our own draw tree.
            this.drawTreeParent = null;

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

        _syncDrawTree: function() {
            if (this.windowTreeParent) {
                this.drawTree = this.windowTreeParent.drawTree;
                this.drawTreeParent = this.windowTreeParent;
            } else {
                // We are an unparented window or the root window;
                // we have no draw tree.
                this.drawTree = null;
            }
        },

        calculateAbsoluteOffset: function() {
            var x = 0, y = 0;
            var serverWindow = this;
            while (serverWindow != null) {
                x += serverWindow.x;
                y += serverWindow.y;
                serverWindow = serverWindow.windowTreeParent;
            }
            return { x: x, y: y };
        },
        _getDrawOffset: function() {
            var x = 0, y = 0;
            var serverWindow = this;
            while (serverWindow != null) {
                x += serverWindow.x;
                y += serverWindow.y;
                serverWindow = serverWindow.drawTreeParent;
            }
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
            var serverWindow = this;
            while (serverWindow != null) {
                var bounding = serverWindow.getBoundingRegion();
                region.intersect(region, bounding);
                region.translate(serverWindow.x, serverWindow.y);
                bounding.finalize();
                serverWindow = serverWindow.drawTreeParent;
            }
            return region;
        },

        canDraw: function() {
            return this.viewable;
        },
        _drawClippedToRegion: function(region, func) {
            this.drawTree.pixmap.drawTo(function(ctx) {
                pathFromRegion(ctx, region);
                ctx.clip();
                func(ctx);
            }.bind(this));
        },
        _drawBackground: function(ctx) {
            if (!this._backgroundPattern)
                return;

            var pos = this._getDrawOffset();
            ctx.translate(pos.x, pos.y);
            ctx.fillStyle = this._backgroundPattern;
            ctx.fillRect(0, 0, this.width, this.height);
        },
        drawTo: function(func) {
            var region = this.drawTree.calculateEffectiveRegionForWindow(this, false);
            this._drawClippedToRegion(region, function(ctx) {
                var pos = this._getDrawOffset();
                ctx.translate(pos.x, pos.y);
                func(ctx);
            }.bind(this));
            region.finalize();
        },
        sendExpose: function(region) {
            if (region.is_empty())
                return;

            var extents = region.extents();
            this._server.sendEvent({ type: "Expose",
                                     windowId: this.xid,
                                     x: extents.x, y: extents.y,
                                     width: extents.width, height: extents.height });

            var pos = this._getDrawOffset();
            region.translate(pos.x, pos.y);
            this._drawClippedToRegion(region, this._drawBackground.bind(this));
        },
        _syncBackgroundPattern: function(client) {
            var pattern;
            if (this._backgroundColor) {
                pattern = this._backgroundColor;
            } else if (this._backgroundPixmap) {
                var pixmap = this._server.getServerPixmap(client, this._backgroundPixmap);
                pattern = pixmap.getPattern();
            } else {
                pattern = null;
            }
            this._backgroundPattern = pattern;
            this.drawTree.exposeWindow(this, false, false);
        },
        changeAttributes: function(client, attributes) {
            var newBackground = false;
            if (valueUpdated(attributes.backgroundColor, this._backgroundColor)) {
                this._backgroundColor = attributes.backgroundColor || null;
                newBackground = true;
            }

            if (valueUpdated(attributes.backgroundPixmap, this._backgroundPixmap)) {
                this._backgroundPixmap = attributes.backgroundPixmap || null;
                newBackground = true;
            }

            if (newBackground)
                this._syncBackgroundPattern(client);

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
                if (this.windowTreeParent)
                    viewable = this.windowTreeParent.viewable;
                else
                    viewable = true;
            }

            if (!valueUpdated(viewable, this.viewable))
                return;

            this.viewable = viewable;

            // If the window became viewable, expose it.
            if (this.viewable)
                this.drawTree.exposeWindow(this, false, false);

            this._server.viewabilityChanged(this);
            this.children.forEach(function(child) {
                child.recalculateViewability();
            });
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
            this.drawTree.exposeWindow(this, true, true);
            this._server.sendEvent({ type: "UnmapNotify",
                                     windowId: this.xid });
            this._server.syncCursorWindow();
            this.recalculateViewability();
            return true;
        },
        _unparentWindowInternal: function() {
            var children = this.windowTreeParent.children;
            children.splice(children.indexOf(this), 1);
            this.windowTreeParent = null;
            this._syncDrawTree();
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
        parentWindow: function(parent) {
            var wasMapped = this.unmap();

            if (this.windowTreeParent)
                this._unparentWindowInternal();

            this.windowTreeParent = parent;
            this.windowTreeParent.children.unshift(this);
            this._syncDrawTree();

            if (wasMapped)
                this.map();
        },

        _getInputRegion: function() {
            var inputRegion = new Region();
            if (this._shapedInputRegion)
                inputRegion.intersect(this._shapedInputRegion, this._unshapedBoundingRegion);
            else
                inputRegion.copy(this._unshapedBoundingRegion);

            return inputRegion;
        },
        pickInput: function(x, y) {
            x -= this.x;
            y -= this.y;

            var inputRegion = this._getInputRegion();
            var containsPoint = inputRegion.contains_point(x, y);
            inputRegion.finalize();

            if (!containsPoint)
                return null;

            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                if (!child.mapped)
                    continue;

                var deepestChild = child.pickInput(x, y);
                if (deepestChild)
                    return deepestChild;
            }

            return this;
        },

        _wrapWindowChange: function(func) {
            if (!this.viewable) {
                func();
                return;
            }

            // Get the old state.
            var oldRegion = this.drawTree.calculateEffectiveRegionForWindow(this, true);
            var oldPos = this._getDrawOffset();
            var oldW = this.width, oldH = this.height;

            func();

            var newRegion = this.drawTree.calculateEffectiveRegionForWindow(this, true);
            var newPos = this._getDrawOffset();

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

                tmp.intersect(newRegion, oldRegion);
                this._drawClippedToRegion(tmp, function(ctx) {
                    copyArea(ctx, ctx, oldPos.x, oldPos.y, newPos.x, newPos.y, oldW, oldH);
                });
            }

            // Pixels need to be exposed on the window in places where the
            // new region is, but the old region isn't.
            tmp.subtract(newRegion, oldRegion);
            exposedRegion.union(exposedRegion, tmp);

            this.drawTree.exposeRegion(exposedRegion);
            this._server.syncCursorWindow();

            tmp.finalize();
            exposedRegion.finalize();

            oldRegion.finalize();
            newRegion.finalize();
        },

        _siblingIndex: function(sibling) {
            return sibling.windowTreeParent.children.indexOf(sibling);
        },
        _insertIntoStack: function(sibling, mode) {
            var children = this.windowTreeParent.children;
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

            if (props.stackMode) {
                var sibling = props.sibling ? this._server.getServerWindow(client, props.sibling) : null;
                this._insertIntoStack(sibling, props.stackMode);
            }
        },

        configureWindow: function(client, props) {
            var eventBase = { windowId: this.xid,
                              x: props.x, y: props.y, width: props.width, height: props.height,
                              sibling: props.sibling, detail: props.stackMode };
            var event;

            event = Object.create(eventBase);
            event.type = "ConfigureRequest";
            if (!this._server.sendEvent(event, client)) {
                this._wrapWindowChange(function() {
                    this._configureWindow(props);
                }.bind(this));

                if (this.drawTree && !this.drawTreeParent)
                    this.drawTree.rootReconfigured();

                event = Object.create(eventBase);
                event.type = "ConfigureNotify";
                this._server.sendEvent(event);
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

        setWindowShapeRegion: function(shapeType, region) {
            if (shapeType === "Bounding") {
                this._wrapWindowChange(function() {
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
                }.bind(this));
            } else if (shapeType == "Input") {
                if (region) {
                    if (!this._shapedInputRegion)
                        this._shapedInputRegion = new Region();
                    this._shapedInputRegion.copy(region);
                } else {
                    if (this._shapedInputRegion) {
                        this._shapedInputRegion.finalize();
                        this._shapedInputRegion = null;
                    }
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

    var ClientConnection = new Class({
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

        // JS extension -- simplifies the case of drawing
        // by letting someone use an existing expose handler.
        // This is the model used by GDK internally.
        'invalidateWindow',

        // JS extension -- allows manipulating pixmaps when
        // drawing them, like transforms or similar.
        'getPixmapImage',

        // SHAPE / XFixes
        'setWindowShapeRegion',
    ];

    publicRequests.forEach(function(requestName) {
        ClientConnection.prototype[requestName] = function(props) {
            return this._server.handleRequest(this._serverClient, requestName, props);
        };
    });

    ClientConnection.prototype.drawTo = function(windowId, func) {
        return this._server.drawTo(this._serverClient, windowId, func);
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
            this.display = new ClientConnection(this, server);
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
            var parent = serverWindow.windowTreeParent;
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
        for (b = b.windowTreeParent; b; b = b.windowTreeParent) {
            if (b === a)
                return true;
        }
        return false;
    }

    function commonAncestor(a, b) {
        for (b = b.windowTreeParent; b; b = b.windowTreeParent) {
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

            this._createRootDrawTree();

            this.syncCursorWindow();
        },

        _setupDOM: function() {
            this._container = document.createElement("div");
            this._container.tabIndex = 0;

            // Allow querying with ".xserver.js"
            this._container.classList.add("xserver");
            this._container.classList.add("js");
        },

        _createRootDrawTree: function() {
            this._rootWindow = this._createWindowInternal({ x: 0, y: 0, width: 1, height: 1 });
            this.rootWindowId = this._rootWindow.xid;

            this._rootDrawTree = new ServerWindowDrawTree(this, this._rootWindow);
            this._container.appendChild(this._rootDrawTree.pixmap.canvas);
            this._rootWindow.drawTree = this._rootDrawTree;
            this._rootWindow.map();
        },
        resize: function(width, height) {
            this._container.style.width = width + "px";
            this._container.style.height = height + "px";
            this._rootWindow.configureWindow(null, { width: width, height: height });
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

        syncCursor: function() {
            var cursor;

            if (this._grabClient && this._grabClient.cursor)
                cursor = this._grabClient.cursor;
            else
                cursor = this._cursorServerWindow.cursor;

            this._container.dataset.cursor = cursor;
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
            var serverWindow = this._rootWindow.pickInput(this._cursorX, this._cursorY);
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
                    window = window.windowTreeParent;
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

                var grabInfo = checkGrabRecursively(serverWindow.windowTreeParent);
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
                var parent = child.windowTreeParent;
                if (ancestor == parent)
                    return;

                EnterNotifies(ancestor, parent, detail);
                EnterLeaveEvent("Enter", detail, parent, child);
            }

            function LeaveNotifies(child, ancestor, detail) {
                var parent = child.windowTreeParent;
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
                } else if (FocusInEvents(ancestor, child.windowTreeParent, detail, doAncestor, skipChild)) {
                    if (child != skipChild)
                        FocusEvent("FocusIn", detail, child);
                    return true;
                }
                return false;
            }

            function FocusOutEvents(child, ancestor, detail, doAncestor) {
                while (child != ancestor) {
                    FocusEvent("FocusOut", detail, child);
                    child = child.windowTreeParent;
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
                    FocusOutEvents(fromWin.windowTreeParent, null, "NonlinearVirtual", false);
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

                    if (toWin.windowTreeParent != null)
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
                if (fromWin.windowTreeParent != null)
                    FocusOutEvents(fromWin.windowTreeParent, common, "NonlinearVirtual", false);
                if (toWin.windowTreeParent != null)
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
                this._setInputFocus(null, this._focusServerWindow.windowTreeParent.xid, null);
            else if (this._focusRevertTo === "PointerRoot")
                this._setInputFocus(null, "PointerRoot", "PointerRoot");
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
        viewabilityChanged: function(serverWindow) {
            if (!serverWindow.viewable) {
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
        _getXidObjectInternal: function(client, xid, error, types) {
            var obj = this._xidToObject[xid];

            var valid = obj && types.some(function(T) { return obj instanceof T; });

            if (valid) {
                return obj;
            } else {
                if (client)
                    throw clientError(error);
                else
                    throw new Error("Internal " + error + " - should not happen");
            }
        },
        xidDestroyed: function(xid) {
            this._xidToObject[xid] = null;
        },
        getServerWindow: function(client, windowId) {
            return this._getXidObjectInternal(client, windowId, "BadWindow", [ServerWindow]);
        },
        getServerPixmap: function(client, pixmapId) {
            return this._getXidObjectInternal(client, pixmapId, "BadPixmap", [ServerPixmap]);
        },
        getDrawable: function(client, drawableId) {
            return this._getXidObjectInternal(client, drawableId, "BadDrawable", [ServerWindow, ServerPixmap]);
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
            var serverPixmap = this.getServerPixmap(client, props.drawableId);
            serverPixmap.destroy();
        },
        _handle_createWindow: function(client, props) {
            var serverWindow = this._createWindowInternal(props);
            serverWindow.parentWindow(this._rootWindow);
            return serverWindow.xid;
        },
        _handle_destroyWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            serverWindow.destroy();
        },
        _handle_reparentWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            var newServerParentWindow = this.getServerWindow(client, props.newParentId);
            serverWindow.parentWindow(newServerParentWindow);
        },
        _handle_mapWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            serverWindow.map(client);
        },
        _handle_unmapWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            serverWindow.unmap();
        },
        _handle_configureWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            serverWindow.configureWindow(client, props);
        },
        _handle_queryTree: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            var reply = {};
            reply.root = this.rootWindowId;
            reply.parent = serverWindow.windowTreeParent ? serverWindow.windowTreeParent.xid : null;
            reply.children = serverWindow.children.map(function(w) {
                return w.xid;
            }).reverse();
            return reply;
        },
        _handle_getGeometry: function(client, props) {
            var drawable = this.getDrawable(client, props.drawableId);
            return drawable.getGeometry();
        },
        _handle_translateCoordinates: function(client, props) {
            var srcServerWindow = this.getServerWindow(client, props.srcWindowId);
            var destServerWindow = this.getServerWindow(client, props.destWindowId);
            return this._translateCoordinates(srcServerWindow, destServerWindow, props.x, props.y);
        },
        _handle_changeAttributes: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            delete props.windowId;
            serverWindow.changeAttributes(client, props);
        },
        _handle_getProperty: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            return serverWindow.getProperty(props.name);
        },
        _handle_changeProperty: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
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

        _handle_getPixmapImage: function(client, props) {
            var pixmap = this.getServerPixmap(client, props.pixmapId);
            return pixmap.getImage();
        },

        _handle_invalidateWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            var includeChildren = !!props.includeChildren;
            serverWindow.drawTree.exposeWindow(serverWindow, false, includeChildren);
        },
        _handle_setWindowShapeRegion: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
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
                     display: serverClient.display };
        },

        // Not a request, as it requires custom marshalling.
        drawTo: function(client, drawableId, func) {
            var drawable = this.getDrawable(client, drawableId);
            if (!drawable.canDraw())
                throw clientError("BadDrawable");

            drawable.drawTo(func);
        },
    });

    exports.Server = Server;

})(window);
