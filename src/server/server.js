// Contains most of the display server. Deals with input and output management.
// Doesn't do much without clients to drive it.

(function(exports) {
    "use strict";

    // Several APIs take a bag of properties. If a property is missing
    // from the bag, it's assumed to mean "keep the same value as before".
    // Thus, a value is updated if it's not undefined and not the same
    // as the existing value.
    function valueUpdated(newValue, existingValue) {
        return newValue !== undefined && newValue !== existingValue;
    }

    // A canvas to save data on during resizes.
    var tmpCanvas = document.createElement('canvas');
    var tmpCtx = tmpCanvas.getContext('2d');

    // A Pixmap is essentially a wrapper around a <canvas>, as
    // that's the closest we have to an actual pixel buffer in
    // HTML5.
    var Pixmap = new Class({
        initialize: function() {
            this.canvas = document.createElement('canvas');
            this._ctx = this.canvas.getContext('2d');
            this._refCount = 0;
        },
        _destroy: function() {
            this.canvas.width = 0;
            this.canvas.height = 0;
        },
        ref: function() {
            this._refCount++;
            return this;
        },
        unref: function() {
            if (--this._refCount == 0)
                this._destroy();
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

    // The "wire" object for a Pixmap. Pixmaps are used internally in the
    // X server (for e.g. the root window contents), even when they don't
    // have XIDs and aren't exposed on the wire.
    //
    // Thus, a ServerPixmap manages the wire form of a "Pixmap", which means
    // that it keeps track of XIDs, and also exposes helper methods that
    // implement the "Drawable" interface.
    var ServerPixmap = new Class({
        initialize: function(server, pixmap) {
            this._server = server;
            this.xid = this._server.registerXidObject(this);
            this._pixmap = pixmap.ref();
            this._server.pixmapCreated(this);
        },
        destroy: function() {
            this._pixmap.unref();
            this._server.pixmapDestroyed(this);
            this._server.xidDestroyed(this.xid);
        },
        canDraw: function() {
            return true;
        },
        drawTo: function(func) {
            this._pixmap.drawTo(func);
            this._server.pixmapUpdated(this);
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

            this.pixmap = (new Pixmap()).ref();
            this.rootReconfigured();
        },
        destroy: function() {
            this.pixmap.unref();
            this.pixmap = null;
        },

        rootReconfigured: function() {
            this.pixmap.resize(this._rootWindow.width, this._rootWindow.height);
        },

        // A helper method to send an Expose to a window's effective region.
        exposeWindow: function(serverWindow, force, includeChildren) {
            if (!serverWindow.viewable && !force)
                return;

            var region = this.calculateVisibleRegionForWindow(serverWindow, includeChildren);
            this.exposeRegion(region);
            region.finalize();
        },

        // Given a region, walk through the window tree and try to send
        // Expose events to all the windows that are in that region.
        exposeRegion: function(exposedRegion) {
            // inRegion is a modification of inRegion that's translated into
            // serverWindow's parent's space, and clipped to the bounding
            // region of serverWindow's parent.
            var recursivelyExpose = function(serverWindow, inRegion) {
                // Skip mapped windows.
                if (!serverWindow.mapped)
                    return;
                // Skip redirected windows.
                if (serverWindow.drawTree != this)
                    return;

                // The obscuringRegion is the intersection of inRegion that
                // serverWindow will eventually draw to.
                var obscuringRegion = new Region();

                // Translate into serverWindow's space.
                inRegion.translate(-serverWindow.drawTreeX, -serverWindow.drawTreeY);

                // Clip inRegion to the bounding region of our region to get
                // the part of the exposed region that our window tree "owns".
                var bounding = serverWindow.getBoundingRegion();
                obscuringRegion.intersect(inRegion, bounding);
                bounding.finalize();

                // Either us or one of our inferiors is going to handle this
                // region, so subtract it out of inRegion first.
                inRegion.subtract(inRegion, obscuringRegion);

                // Our child windows need to be exposed first -- they'll
                // subtract out parts of inRegion that they're handling and
                // that we should not send exposes to.
                serverWindow.children.forEach(function(serverWindow) {
                    recursivelyExpose(serverWindow, obscuringRegion);
                });

                serverWindow.exposeRegion(obscuringRegion);
                obscuringRegion.finalize();

                // And translate back.
                inRegion.translate(serverWindow.drawTreeX, serverWindow.drawTreeY);
            }.bind(this);

            recursivelyExpose(this._rootWindow, exposedRegion);
        },

        // For a given window, return the region of the draw tree that the
        // window can display pixels on. In the Xorg server parlance, this
        // is known as a window's "clip list".
        //
        // It's the window's bounding region, minus the bounding region of
        // any windows that are occluding this one.
        //
        // If includeChildren is false, the returned region also excludes
        // parts of serverWindow that children are occluding.
        calculateVisibleRegionForWindow: function(serverWindow, includeChildren) {
            var region = serverWindow.calculateTransformedBoundingRegion();

            var subtractWindow = function(aboveWindow) {
                if (!aboveWindow.viewable)
                    return;
                if (aboveWindow.drawTree != this)
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

    // Is this event something that's included in SubstructureRedirect?
    function isEventSubstructureRedirect(event) {
        switch (event.type) {
        case "MapRequest":
        case "ConfigureRequest":
            return true;
        }
        return false;
    }

    // Is this event something that's included in StructureNotify / SubstructureNotify?
    function isEventStructureNotify(event) {
        switch (event.type) {
        case "MapNotify":
        case "UnmapNotify":
        case "DestroyNotify":
        case "ConfigureNotify":
            return true;
        }
        return false;
    }

    // Is this event a pointer input event? Used for the purposes of
    // routing events when somebody has a pointer grab.
    function isEventPointerInputEvent(event) {
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

    // The server-side form of a Window. There's no split like Pixmap, since
    // the X server doesn't maintain any windows that aren't also exposed on the
    // wire in some form.
    var ServerWindow = new Class({
        initialize: function(server, props) {
            this._server = server;
            this.xid = this._server.registerXidObject(this);

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
                region.translate(serverWindow.drawTreeX, serverWindow.drawTreeY);
                bounding.finalize();
                serverWindow = serverWindow.drawTreeParent;
            }
            return region;
        },

        _syncDrawTreePosition: function() {
            if (this.drawTreeParent == null) {
                this.drawTreeX = 0;
                this.drawTreeY = 0;
            } else {
                this.drawTreeX = this.x;
                this.drawTreeY = this.y;
            }
        },
        syncDrawTree: function() {
            var newDrawTree;

            if (this._redirectedDrawTree) {
                newDrawTree = this._redirectedDrawTree;
            } else if (this.windowTreeParent) {
                newDrawTree = this.windowTreeParent.drawTree;
            } else {
                // We are an unparented window or the root window;
                // we have no draw tree.
                newDrawTree = null;
            }

            if (newDrawTree == this.drawTree)
                return;

            this.drawTree = newDrawTree;

            if (this.windowTreeParent && newDrawTree == this.windowTreeParent.drawTree)
                this.drawTreeParent = this.windowTreeParent;
            else
                this.drawTreeParent = null;

            this._syncDrawTreePosition();

            this.children.forEach(function(child) {
                child.syncDrawTree();
            });
        },

        canDraw: function() {
            return this.viewable;
        },
        _getDrawOffset: function() {
            var x = 0, y = 0;
            var serverWindow = this;
            while (serverWindow != null) {
                x += serverWindow.drawTreeX;
                y += serverWindow.drawTreeY;
                serverWindow = serverWindow.drawTreeParent;
            }
            return { x: x, y: y };
        },
        _drawClippedToRegion: function(region, func) {
            this.drawTree.pixmap.drawTo(function(ctx) {
                CanvasUtil.pathFromRegion(ctx, region);
                ctx.clip();
                ctx.beginPath();
                func(ctx);
            }.bind(this));

            this._sendDamageEvents();
        },
        _sendDamageEvents: function() {
            var serverWindow = this;
            while (serverWindow != null) {
                this._server.sendEvent({ type: "Damage", windowId: serverWindow.xid });
                serverWindow = serverWindow.drawTreeParent;
            }
        },
        drawTo: function(func) {
            var region = this.drawTree.calculateVisibleRegionForWindow(this, false);
            this._drawClippedToRegion(region, function(ctx) {
                var pos = this._getDrawOffset();
                ctx.translate(pos.x, pos.y);
                func(ctx);
            }.bind(this));
            region.finalize();
        },
        _drawBackground: function(region) {
            if (!this._backgroundPattern)
                return;

            var pos = this._getDrawOffset();
            region.translate(pos.x, pos.y);
            this._drawClippedToRegion(region, function(ctx) {
                ctx.translate(pos.x, pos.y);
                ctx.fillStyle = this._backgroundPattern;
                ctx.fillRect(0, 0, this.width, this.height);
            }.bind(this));
        },
        exposeRegion: function(region) {
            if (region.is_empty())
                return;

            var nRects = region.n_rects();
            region.iter_rectangles(function(x, y, width, height) {
                this._server.sendEvent({ type: "Expose", windowId: this.xid,
                                         x: x, y: y, width: width, height: height,
                                         count: --nRects });
            }.bind(this));

            // Sending an Expose event for a region is a guarantee that we always
            // draw the background for the window.
            this._drawBackground(region);
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
        },
        getAttributes: function(client) {
            var mapState = (this.viewable ? "Viewable" :
                            this.mapped ? "Unviewable" : "Unmapped");
            return {
                backgroundColor: this._backgroundColor,
                backgroundPixmap: this._backgroundPixmap,
                overrideRedirect: this._overrideRedirect,
                cursor: this.cursor,
                mapState: mapState,
            };
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
        _shouldBeViewable: function() {
            // Unmapped windows are unviewable.
            if (!this.mapped)
                return false;

            if (this.windowTreeParent) {
                // Windows with a parent are tied to their parent's viewability.
                return this.windowTreeParent.viewable;
            } else {
                // Windows without a parent are directly viewable.
                return true;
            }
        },
        recalculateViewability: function() {
            var viewable = this._shouldBeViewable();

            if (!valueUpdated(viewable, this.viewable))
                return;

            this.viewable = viewable;

            this._server.viewabilityChanged(this);
            this.children.forEach(function(child) {
                child.recalculateViewability();
            });
            this.drawTree.exposeWindow(this, true, false);
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
            this.syncDrawTree();
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
            this.syncDrawTree();

            if (wasMapped)
                this.map();
        },

        filterEvent: function(event) {
            // If we're an override redirect window and the event is a MapRequest
            // or a ConfigureRequest, make sure it doesn't go to any selected clients.
            if (this._overrideRedirect && isEventSubstructureRedirect(event))
                return false;
            return true;
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
        listProperties: function() {
            return Object.keys(this._properties);
        },

        _getInputRegion: function() {
            var inputRegion = new Region();
            if (this._shapedInputRegion)
                inputRegion.intersect(this._shapedInputRegion, this._unshapedBoundingRegion);
            else if (this._shapedBoundingRegion)
                inputRegion.copy(this._shapedBoundingRegion);
            else
                inputRegion.copy(this._unshapedBoundingRegion);

            return inputRegion;
        },

        // Recursively tries to find the window at the position given,
        // assuming we need to test for input (e.g. a mouse click).
        // That means we should ignore unmapped windows, and test against
        // the input region, not the bounding region.
        pickInput: function(x, y) {
            // Translate the passed-in coordinates to our own space.
            x -= this.x;
            y -= this.y;

            var inputRegion = this._getInputRegion();
            var containsPoint = inputRegion.contains_point(x, y);
            inputRegion.finalize();

            // If we don't contain the given point, return "null", which
            // indicates that the coordinates are outside our input region.
            if (!containsPoint)
                return null;

            for (var i = 0; i < this.children.length; i++) {
                var child = this.children[i];
                // Ignore unmapped children.
                if (!child.mapped)
                    continue;

                // Try recursing into the child itself. If it returns null,
                // that means the coordinates weren't inside the window, and
                // we should move onto the next child.
                var deepestChild = child.pickInput(x, y);
                if (deepestChild)
                    return deepestChild;
            }

            // We couldn't find any children which covered the passed-in
            // coordinates, but the position was inside our input region,
            // so that means we are the child window.
            return this;
        },

        // When the window reconfigures or changes its bounding region, we
        // need to send Expose events to any windows that might need to be
        // redrawn as as a result.
        //
        // Additionally, if the window moves at all, we can copy over the
        // old parts of the front buffer, rather than require that we redraw
        // the client from scratch.
        //
        // This function takes care of figuring out the changes in the
        // bounding region, copying the appropriate parts of the front buffer
        // from one place to another, and sending Expose events for windows
        // that need to be redrawn.
        _wrapBoundingRegionChange: function(func) {
            // If we're not viewable, we still need to make sure we do the
            // change, but we won't send any exposes or need to resync the
            // cursor window.
            if (!this.viewable) {
                func();
                return;
            }

            // Get the old state.
            var oldRegion = this.drawTree.calculateVisibleRegionForWindow(this, true);
            var oldPos = this._getDrawOffset();
            var oldW = this.width, oldH = this.height;

            // Do the change.
            func();

            // Determine the new state.
            var newRegion = this.drawTree.calculateVisibleRegionForWindow(this, true);
            var newPos = this._getDrawOffset();

            var tmp = new Region();
            var exposedRegion = new Region();

            // There are three things we need to do:
            // 1) Send expose events to previously obscured windows
            // 2) If the window moved, copy the old pixel contents of the
            //    window over.
            // 3) If the window resized, send expose events to the newly
            //    exposed parts of the window.

            // 1)
            // Send Expose events for places where the window was before, but
            // isn't now, or the old region minus the new region.
            tmp.subtract(oldRegion, newRegion);
            exposedRegion.union(exposedRegion, tmp);

            var dx = newPos.x - oldPos.x;
            var dy = newPos.y - oldPos.y;

            // 2)
            if (oldRegion.not_empty() && (dx != 0 || dy != 0)) {
                // Copying the pixel contents effectively "nullifies" the move.
                // The only case left, 3), cares about the newly exposed places,
                // so we put the old region in the coordinate space of the
                // new region.
                oldRegion.translate(dx, dy);

                tmp.intersect(newRegion, oldRegion);
                this._drawClippedToRegion(tmp, function(ctx) {
                    CanvasUtil.copyArea(ctx, oldPos.x, oldPos.y, newPos.x, newPos.y, oldW, oldH);
                });
            }

            // 3)
            // Send Expose events for places where the window is now, but
            // wasn't before, or the new region minus the old region.
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
                this.x = props.x;
            if (props.y !== undefined)
                this.y = props.y;
            if (props.width !== undefined)
                this.width = props.width;
            if (props.height !== undefined)
                this.height = props.height;

            this._syncDrawTreePosition();
            this._unshapedBoundingRegion.init_rect(0, 0, this.width, this.height);

            if (props.stackMode) {
                var sibling = props.sibling ? this._server.getServerWindow(null, props.sibling) : null;
                this._insertIntoStack(sibling, props.stackMode);
            }
        },
        configureWindow: function(client, props) {
            function configureValue(newValue, existingValue) {
                if (!valueUpdated(newValue, existingValue))
                    return undefined;

                return (newValue | 0);
            }

            var eventBase = { windowId: this.xid, sibling: props.sibling, detail: props.stackMode };
            eventBase.x = configureValue(props.x, this.x);
            eventBase.y = configureValue(props.y, this.y);
            eventBase.width = configureValue(props.width, this.width);
            eventBase.height = configureValue(props.height, this.height);

            var event;
            event = Object.create(eventBase);
            event.type = "ConfigureRequest";
            if (!this._server.sendEvent(event, client)) {
                event = Object.create(eventBase);
                event.type = "ConfigureNotify";
                this._server.sendEvent(event);

                this._wrapBoundingRegionChange(function() {
                    this._configureWindow(eventBase);
                }.bind(this));

                if (this.drawTree && !this.drawTreeParent)
                    this.drawTree.rootReconfigured();
            }
        },
        getGeometry: function() {
            return { x: this.x, y: this.y, width: this.width, height: this.height };
        },

        _sendShapeNotify: function(shapeType) {
            this._server.sendEvent({ windowId: this.xid,
                                     type: "ShapeNotify",
                                     shapeType: shapeType });
        },
        _setInputRegion: function(region) {
            if (region) {
                if (!this._shapedInputRegion)
                    this._shapedInputRegion = new Region();
                this._shapedInputRegion.copy(region);
            } else {
                if (this._shapedInputRegion)
                    this._shapedInputRegion.finalize();
                this._shapedInputRegion = null;
            }
            this._sendShapeNotify("Input");
        },
        _setBoundingRegion: function(region) {
            if (region) {
                if (!this._shapedBoundingRegion)
                    this._shapedBoundingRegion = new Region();
                this._shapedBoundingRegion.copy(region);
            } else {
                if (this._shapedBoundingRegion)
                    this._shapedBoundingRegion.finalize();
                this._shapedBoundingRegion = null;
            }
            this._sendShapeNotify("Bounding");
        },
        setWindowShapeRegion: function(shapeType, region) {
            if (shapeType === "Bounding") {
                this._wrapBoundingRegionChange(function() {
                    this._setBoundingRegion(region);
                }.bind(this));
            } else if (shapeType === "Input") {
                this._setInputRegion(region);
            }
        },
        getWindowShapeRegion: function(shapeType) {
            if (shapeType === "Bounding") {
                if (this._shapedBoundingRegion) {
                    var region = new Region();
                    region.copy(this._shapedBoundingRegion);
                    return region;
                }
            } else if (shapeType === "Input") {
                if (this._shapedInputRegion) {
                    var region = new Region();
                    region.copy(this._shapedInputRegion);
                    return region;
                }
            } else {
                throw clientError("Invalid shapeType");
            }
        },

        redirect: function() {
            if (this._redirectedDrawTree)
                return;

            this._redirectedDrawTree = new ServerWindowDrawTree(this._server, this);
            this.syncDrawTree();

            // Immediately expose the window on the new draw tree.
            this.drawTree.exposeWindow(this, false, false);
        },
        unredirect: function() {
            if (!this._redirectedDrawTree)
                return;

            this._redirectedDrawTree.destroy();
            this._redirectedDrawTree = null;
            this.syncDrawTree();
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

    // This is the object returned to the client when it calls "connect",
    // so this contains the user-facing Xlib-like API. These marshalling
    // methods are installed below.
    var ClientConnection = new Class({
        initialize: function(serverClient, server) {
            this._serverClient = serverClient;
            this._server = server;
            this.rootWindowId = this._server.rootWindowId;
        },

        disconnect: function() {
            this._server.disconnect(this._serverClient);
            this._server = null;
            this._serverClient = null;
        },
    });

    var publicRequests = [
        'createWindow',
        'changeAttributes',
        'getAttributes',
        'destroyWindow',
        'reparentWindow',
        'mapWindow',
        'unmapWindow',
        'configureWindow',
        'getGeometry',
        'queryTree',
        'changeProperty',
        'getProperty',
        'listProperties',
        'grabPointer',
        'ungrabPointer',
        'grabButton',
        'ungrabButton',
        'allowEvents',
        'queryPointer',
        'translateCoordinates',
        'setInputFocus',
        'createPixmap',
        'freePixmap',
        'sendEvent',

        // This is technically not a request -- the event-mask
        // is actually part of the window attributes, but this
        // is absolute insane as it's the only window attribute
        // that's client-specific. We just make it a request to
        // the server.
        'selectInput',

        // My extension -- simplifies the case of drawing
        // by letting someone use an existing expose handler.
        // This is the model used by GDK internally.
        'invalidateWindow',

        // My extension -- lets users see the visible region
        // for a window. Used by the inspector.
        'getVisibleRegion',

        // My extension -- allows manipulating pixmaps when
        // drawing them, like transforms or similar.
        'getPixmapImage',

        // My extension -- list all pixmaps for the inspector
        'listPixmaps',

        // SHAPE / XFixes
        'setWindowShapeRegion',
        'getWindowShapeRegion',

        // COMPOSITE
        'redirectWindow',
        'nameWindowPixmap',
    ];

    // Install the API method for every request.
    publicRequests.forEach(function(requestName) {
        ClientConnection.prototype[requestName] = function(props) {
            return this._server.handleRequest(this._serverClient, requestName, props);
        };
    });

    // drawTo takes a callback that receives a Canvas2DRenderingContext.
    // At one point in time, I had the idea of making clients live in
    // separate WebWorker instances, but this was the big issue:
    // callbacks and Canvas2DRenderingContext can't withstand through a
    // web worker.
    //
    // As such, drawTo has "custom marshalling", and isn't considered a
    // request as above.
    ClientConnection.prototype.drawTo = function(drawableId, func) {
        return this._server.drawTo(this._serverClient, drawableId, func);
    };

    // A simple MessageChannel equivalent (since Firefox is missing it) by
    // using a bunch of <iframe>s for each port opened. Events are sent back
    // to each client by calling postMessage on these.
    var createMessagePort = (function() {
        // A simple container for MessagePorts so we don't litter the DOM.
        var iframeContainer = document.createElement("message-ports");
        iframeContainer.style.display = 'none';
        document.body.appendChild(iframeContainer);

        return function createMessagePort() {
            var iframe = document.createElement("iframe");
            iframeContainer.appendChild(iframe);
            return iframe.contentWindow;
        };
    })();

    // We often use Object.create() when passing objects to postMessage,
    // but the structured cloning algorithm can't deal with prototype
    // inheritance for whatever reason, so we need to flatten objects
    // before we send them.
    function flattenObject(obj) {
        var flat = {};
        // Flatten the prototype chain.
        for (var prop in obj)
            flat[prop] = obj[prop];
        return flat;
    }

    // A ServerClient manages the server's internal state for every client.
    // Mostly contains things about events.
    var ServerClient = new Class({
        initialize: function(server) {
            this._server = server;

            // window id => list of event types
            this._eventWindows = {};

            this.clientPort = createMessagePort();
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
            var structureNotify = isEventStructureNotify(event);

            if (structureNotify && this.isInterestedInWindowEvent(windowId, "StructureNotify"))
                return true;

            if (structureNotify && this.isInterestedInWindowEvent(this._server.rootWindowId, "X-WindowTreeChanged"))
                return true;

            var parent = serverWindow.windowTreeParent;
            if (parent) {
                var substructureRedirect = isEventSubstructureRedirect(event);
                if (substructureRedirect && this.isInterestedInWindowEvent(parent.xid, "SubstructureRedirect"))
                    return true;

                if (structureNotify && this.isInterestedInWindowEvent(parent.xid, "SubstructureNotify"))
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

            eventTypes.forEach(function(eventType) {
                // If we have "!ButtonPress", remove it from the list.
                if (eventType[0] == "!") {
                    var idx = listeningFor.indexOf(eventType.slice(1));
                    if (idx < 0)
                        return;
                    listeningFor.splice(idx, 1);
                } else {
                    listeningFor.push(eventType);
                }
            });
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

    // A ServerGrabClient manages what happens when somebody takes
    // a pointer or keyboard grab. It contains the frozen event queue
    // and associated logic for Sync grabs, as well as lots of other
    // fun grab-related things.
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
                // Replay the rest.
                this._flushFrozenEventQueue();
                break;
            case "Sync":
                // Send the next one over without unthawing.
                var event = this._frozenEventQueue.shift();
                if (event)
                    this._deliverEvent(event);
                else
                    this._clientEvent = null;
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
            if (this._ownerEvents && this.serverClient.filterEvent(event)) {
                this.serverClient.sendEvent(event);

            // Else, if we should report this event, report it with respect
            // to the grab window.
            } else if (this._events.indexOf(event.type) >= 0) {
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

    // Do a and b have a common ancestor?
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

    // The main part of the server.
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

            this._grabClient = null;

            this._createRootDrawTree();

            this._focusServerWindow = this._rootWindow;
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
            this._rootWindow.changeProperty('DEBUG_NAME', "Root Window");
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
            var serverWindow;

            serverWindow = srcServerWindow;
            while (serverWindow != null) {
                x += serverWindow.x;
                y += serverWindow.y;
                serverWindow = serverWindow.windowTreeParent;
            }

            serverWindow = destServerWindow;
            while (serverWindow != null) {
                x -= serverWindow.x;
                y -= serverWindow.y;
                serverWindow = serverWindow.windowTreeParent;
            }

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
        sendEvent: function(event, except) {
            if (isEventPointerInputEvent(event) && this._grabClient) {
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

                // An extension for the inspector
                this.sendEvent({ type: "X-CursorWindowChanged",
                                 windowId: this.rootWindowId,
                                 oldCursorWindow: this._cursorServerWindow ? this._cursorServerWindow.xid : null,
                                 newCursorWindow: serverWindow.xid });

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

                // If nobody has selected for ButtonPress, nobody gets
                // any grab, and we don't take one.
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

            function FocusInEvents(ancestor, child, detail) {
                var parent = child.windowTreeParent;
                if (ancestor == parent)
                    return;

                FocusInEvents(ancestor, parent, detail);
                FocusEvent("FocusIn", detail, child);
            }

            function FocusOutEvents(child, ancestor, detail) {
                var parent = child.windowTreeParent;
                if (ancestor == parent)
                    return;

                FocusEvent("FocusOut", detail, child);
                FocusOutEvents(parent, ancestor, detail);
            }

            if (isWindowDescendentOf(fromWin, toWin)) {
                FocusEvent("FocusOut", "Interior", fromWin, null);
                FocusInEvents(fromWin, toWin, "Virtual");
                FocusEvent("FocusIn", "Ancestor", toWin, null);
            } else if (isWindowDescendentOf(toWin, fromWin)) {
                FocusEvent("FocusOut", "Ancestor", fromWin, null);
                FocusOutEvents(fromWin, toWin, "Virtual", false);
                FocusEvent("FocusIn", "Inferior", toWin, null);
            } else {
                var common = commonAncestor(toWin, fromWin);
                FocusEvent("FocusOut", "Nonlinear", fromWin);
                FocusOutEvents(fromWin, common, "NonlinearVirtual");
                FocusInEvents(common, toWin, "NonlinearVirtual");
                FocusEvent("FocusIn", "Nonlinear", toWin);
            }
        },
        _setInputFocus: function(focusWindow) {
            var event = { rootWindowId: this.rootWindowId,
                          rootX: this._cursorX,
                          rootY: this._cursorY };

            if (focusWindow != this._focusServerWindow) {
                this._sendFocusEvents(event, this._focusServerWindow, focusWindow);
                this._focusServerWindow = focusWindow;
            }
        },
        _revertInputFocus: function() {
            // Always revert to the parent window, like RevertToParent does.
            this._setInputFocus(this._focusServerWindow.windowTreeParent.xid);
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
        registerXidObject: function(obj) {
            var xid = ++this._nextXid;
            this._xidToObject[xid] = obj;
            return xid;
        },
        _createWindowInternal: function(props) {
            return new ServerWindow(this, props);
        },
        _createPixmapInternal: function(props) {
            var pixmap = new Pixmap();
            pixmap.resize(props.width, props.height);

            return new ServerPixmap(this, pixmap);
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

        // The inspector uses these events to update its list of pixmaps.
        pixmapCreated: function(pixmap) {
            this.sendEvent({ windowId: this.rootWindowId, type: "X-PixmapCreated", xid: pixmap.xid });
        },
        pixmapDestroyed: function(pixmap) {
            this.sendEvent({ windowId: this.rootWindowId, type: "X-PixmapDestroyed", xid: pixmap.xid });
        },
        pixmapUpdated: function(pixmap) {
            this.sendEvent({ windowId: this.rootWindowId, type: "X-PixmapUpdated", xid: pixmap.xid });
        },

        // Everything that starts with "_handle_" is a client request handler.
        // Most of these should be fairly simple and only call internal methods.
        _handle_createWindow: function(client, props) {
            var serverWindow = this._createWindowInternal(props);
            serverWindow.parentWindow(this._rootWindow);
            return serverWindow.xid;
        },
        _handle_changeAttributes: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            delete props.windowId;
            serverWindow.changeAttributes(client, props);
        },
        _handle_getAttributes: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            return serverWindow.getAttributes();
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
        _handle_getGeometry: function(client, props) {
            var drawable = this.getDrawable(client, props.drawableId);
            return drawable.getGeometry();
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
        _handle_changeProperty: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            serverWindow.changeProperty(props.name, props.value);
        },
        _handle_getProperty: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            return serverWindow.getProperty(props.name);
        },
        _handle_listProperties: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            return serverWindow.listProperties();
        },

        _handle_grabPointer: function(client, props) {
            var grabWindow = this.getServerWindow(client, props.windowId);

            // TODO: keyboardMode
            // Investigate HTML5 APIs for confineTo

            if (this._grabClient) {
                var allowOverwrite = false;

                // Clients can override passive grabs at any time, if it's by
                // their client or not.
                if (this._grabClient.isPassive)
                    allowOverwrite = true;

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
                    allowOverwrite = true;

                if (allowOverwrite)
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
        _handle_allowEvents: function(client, props) {
            this._grabClient.allowEvents(props.pointerMode);
        },
        _handle_queryPointer: function(client, props) {
            var coords = this._translateCoordinates(this._rootWindow, this._cursorServerWindow,
                                                    this._cursorX, this._cursorY);
            return {
                root: this.rootWindowId,
                rootX: this._cursorX,
                rootY: this._cursorY,
                child: this._cursorServerWindow.xid,
                winX: coords.x,
                winY: coords.y,
                buttons: this._buttonsDown
            };
        },
        _handle_translateCoordinates: function(client, props) {
            var srcServerWindow = this.getServerWindow(client, props.srcWindowId);
            var destServerWindow = this.getServerWindow(client, props.destWindowId);
            return this._translateCoordinates(srcServerWindow, destServerWindow, props.x, props.y);
        },
        _handle_setInputFocus: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            this._setInputFocus(serverWindow);
        },

        _handle_createPixmap: function(client, props) {
            var serverPixmap = this._createPixmapInternal(props);
            return serverPixmap.xid;
        },
        _handle_freePixmap: function(client, props) {
            var serverPixmap = this.getServerPixmap(client, props.drawableId);
            serverPixmap.destroy();
        },
        _handle_sendEvent: function(client, props) {
            var destinationId = props.destinationId;
            var destination;

            if (destinationId === 'PointerFocus')
                destination = this._cursorServerWindow;
            else if (destinationId === 'InputFocus')
                destination = this._focusServerWindow;
            else
                destination = this.getServerWindow(client, destinationId);

            // TODO: Support "propagate". Does anything use this garbage?
            var event = props.event;

            // XXX: We send events based on the windowId field inside the event.
            // Does anything validly use a separate windowId than what's passed
            // to SendEvent?
            event.windowId = destination.xid;
            this.sendEvent(event);
        },

        _handle_selectInput: function(client, props) {
            var windowId = props.windowId;
            var events = props.events;
            var checkEvent = (function checkEvent(eventType) {
                if (events.indexOf(eventType) >= 0)
                    if (this._checkOtherClientsForEvent(windowId, eventType, client))
                        throw clientError(eventType);
            }).bind(this);
            checkEvent("SubstructureRedirect");
            checkEvent("ButtonPress");

            client.selectInput(windowId, events);
        },

        _handle_invalidateWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            var includeChildren = !!props.includeChildren;
            serverWindow.drawTree.exposeWindow(serverWindow, false, includeChildren);
        },
        _handle_getVisibleRegion: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            var includeChildren = !!props.includeChildren;
            return serverWindow.drawTree.calculateVisibleRegionForWindow(serverWindow, includeChildren);
        },
        _handle_getPixmapImage: function(client, props) {
            var pixmap = this.getServerPixmap(client, props.pixmapId);
            return pixmap.getImage();
        },
        _handle_listPixmaps: function(client, props) {
            var pixmapXids = [];
            for (var xid in this._xidToObject) {
                var obj = this._xidToObject[xid];
                if (obj instanceof ServerPixmap)
                    pixmapXids.push(xid);
            }
            return pixmapXids;
        },
        _handle_setWindowShapeRegion: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            serverWindow.setWindowShapeRegion(props.shapeType, props.region);
        },
        _handle_getWindowShapeRegion: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            return serverWindow.getWindowShapeRegion(props.shapeType);
        },

        _handle_redirectWindow: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);
            if (props.mode == 'none') {
                serverWindow.unredirect();
            } else if (props.mode == 'manual') {
                serverWindow.redirect();
            } else {
                // There's really no point to supporting 'automatic'.
                throw clientError("BadMatch");
            }
        },
        _handle_nameWindowPixmap: function(client, props) {
            var serverWindow = this.getServerWindow(client, props.windowId);

            // NameWindowPixmap is only allowed on redirected windows,
            // and if the window has a draw tree parent, it's not redirected.
            if (serverWindow.drawTreeParent != null)
                throw clientError("BadMatch");

            var pixmap = serverWindow.drawTree.pixmap;
            var serverPixmap = new ServerPixmap(this, pixmap);
            return serverPixmap.xid;
        },

        // This is called by ClientConnection above for each of its generated
        // requests, which marshalls and wraps each of the request handlers
        // above.
        handleRequest: function(client, requestName, props) {
            var handler = this['_handle_' + requestName];
            return handler.call(this, client, props);
        },

        // Called by the client to get a socket connection.
        connect: function() {
            var serverClient = new ServerClient(this);
            this._clients.push(serverClient);
            return { clientPort: serverClient.clientPort,
                     display: serverClient.display };
        },

        disconnect: function(serverClient) {
            var idx = this._clients.indexOf(serverClient);
            this._clients.splice(idx, 1);
        },

        // See the note about this above in ClientConnection.prototype.drawTo.
        drawTo: function(client, drawableId, func) {
            var drawable = this.getDrawable(client, drawableId);
            if (!drawable.canDraw())
                throw clientError("BadDrawable");

            drawable.drawTo(func);
        },
    });

    exports.Server = Server;

})(window);
