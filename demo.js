(function(exports) {

    var Window = new Class({
        initialize: function() {
            this.hasInput = true;
            this.backgroundColor = null;
        },
        connect: function(server) {
            this._server = server;
            this._server.clientConnected(this);
            this._windowId = this._server.createWindow(this);
            this._server.changeAttributes(this, this._windowId, { hasInput: this.hasInput, backgroundColor: this.backgroundColor });
            this._server.selectInput(this,  this._windowId, ["Expose", "ConfigureNotify"]);
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ConfigureNotify":
                return this.configureNotify(event);
            case "Expose":
                return this.expose(event.ctx);
            }
        },
        configureNotify: function(event) {
            this.x = event.x;
            this.y = event.y;
            this.width = event.width;
            this.height = event.height;
        },
        reparent: function(newParent) {
            this._server.reparentWindow(this, this._windowId, newParent._windowId);
        },
        expose: function() {
        },
        raise: function() {
            this._server.raiseWindow(this, this._windowId);
        },
        lower: function() {
            this._server.lowerWindow(this, this._windowId);
        },
        destroy: function() {
            this._server.destroyWindow(this, this._windowId);
        },
        map: function() {
            this._server.mapWindow(this, this._windowId);
        },
        unmap: function() {
            this._server.unmapWindow(this, this._windowId);
        },
        moveResize: function(x, y, width, height) {
            var coords = this.getRootCoords();
            x = x === undefined ? coords.x : x;
            y = y === undefined ? coords.y : y;

            width = width === undefined ? this.width : width;
            height = height === undefined ? this.height : height;
            this._server.moveResizeWindow(this, this._windowId, x | 0, y | 0, width | 0, height | 0);
        },

        getRootCoords: function() {
            var clientGeom = this._server.getGeometry(this, this._windowId);
            var totalGeom = this._server.translateCoordinates(this, this._windowId, this._server.rootWindowId, 0, 0);
            return { x: totalGeom.x - clientGeom.x, y: totalGeom.y - clientGeom.y };
        },
    });

    var BackgroundWindow = new Class({
        Extends: Window,
        initialize: function() {
            this.parent();
            this._image = new Image();
            this._image.src = "WoodBackground.jpg";
            this.hasInput = false;
        },
        connect: function(server) {
            this.parent(server);
            this.moveResize(0, 0, server.width, server.height);
            this._server.changeAttributes(this, this._windowId, { overrideRedirect: true });
        },
        expose: function(wrapper) {
            wrapper.drawWithContext(function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            wrapper.clearDamage();
        },
    });

    var FakeWindow = new Class({
        Extends: Window,
        initialize: function(imageSrc) {
            this.parent();
            this._image = new Image();
            this._image.src = imageSrc;
        },
        connect: function(server) {
            this.parent(server);
            this.moveResize(0, 0, this._image.width, this._image.height);
            this._server.selectInput(this,  this._windowId, ["ButtonPress"]);
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonPress":
                return this.raise();
            default:
                return this.parent(event);
            }
        },
        expose: function(wrapper) {
            wrapper.drawWithContext(function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            wrapper.clearDamage();
        },
    });

    var SimpleButton = new Class({
        Extends: Window,
        initialize: function(standardColor, hoverColor, extraEvents) {
            this.parent();
            this._standardColor = standardColor;
            this._hoverColor = hoverColor;
            this._extraEvents = extraEvents || ["ButtonRelease"];
        },
        connect: function(server) {
            this.parent(server);
            this._server.selectInput(this, this._windowId, ["Enter", "Leave"].concat(this, this._extraEvents));
            this._server.defineCursor(this, this._windowId, "pointer");
            this._server.changeAttributes(this, this._windowId, { overrideRedirect: true });
            this._setHover(false);
        },
        _setHover: function(hover) {
            if (this._isHovering == hover)
                return;

            this._isHovering = hover;

            if (this._server) {
                var color = hover ? this._hoverColor : this._standardColor;
                this._server.changeAttributes(this, this._windowId, { backgroundColor: color });
                this._server.invalidateWindow(this, this._windowId);
            }
        },
        handleEvent: function(event) {
            if (this.eventHook(event))
                return;

            switch(event.type) {
            case "Enter":
                return this._setHover(true);
            case "Leave":
                return this._setHover(false);
            default:
                return this.parent(event);
            }
        },
        eventHook: function(event) {
            // Provide a nice, simple interface for basic buttons.
            if (event.type === "ButtonRelease" && this.clickCallback) {
                this.clickCallback(event);
                return true;
            }
            return false;
        },
        expose: function(wrapper) {
            // Don't draw anything -- the backgroundColor will take
            // care of it for us.
            wrapper.clearDamage();
        },
    });

    // Don't extend Window as this needs to be in the
    // WM client, not its own client.
    var WindowFrame = new Class({
        Extends: Window,
        initialize: function(wm, server, windowId) {
            this._wm = wm;
            this._server = server;
            this.clientWindowId = windowId;
        },

        _syncGeometry: function(geom, forceClientConfigure) {
            // A real WM would cache this, as it would cause a round-trip.
            var clientGeom = this._server.getGeometry(this._wm, this.clientWindowId);

            // Hardcoded 10px border for now.

            // The top-left of the frame is the top-left of the window, and we'll
            // put the client 10px in. That means we should only touch the width
            // and height.
            this._server.moveResizeWindow(this._wm, this.frameWindowId, geom.x, geom.y, geom.width + 20, geom.height + 20);

            if (forceClientConfigure || clientGeom.width != geom.width || clientGeom.height != geom.height) {
                this._server.moveResizeWindow(this._wm, this.clientWindowId, 10, 10, geom.width, geom.height);
            }
        },

        construct: function() {
            var geom = this._server.getGeometry(this._wm, this.clientWindowId);

            this.frameWindowId = this._server.createWindow(this._wm);
            this._server.selectInput(this._wm, this.frameWindowId, ["Expose"]);
            this._server.changeAttributes(this._wm, this.frameWindowId, { backgroundColor: 'red' }); // for now
            this._server.reparentWindow(this._wm, this.clientWindowId, this.frameWindowId);

            // Map the frame window.
            this._server.mapWindow(this._wm, this.frameWindowId);

            this._syncGeometry(geom, true);
        },
        configureRequest: function(event) {
            // ICCCM 4.1.5

            // The coordinate system of the ConfigureRequest is that of the root;
            // that is, the X/Y in the ConfigureNotify are of the top-left of the
            // outer frame window. Note that the width/height are of the client
            // window.

            // We don't generate synthetic events quite yet.
            this._syncGeometry(event, false);
        },
        expose: function(wrapper) {
            // background color takes care of it for now
            wrapper.clearDamage();
        },
    });

    var WindowManager = new Class({
        connect: function(server) {
            this._server = server;
            this._server.clientConnected(this);
            this._server.selectInput(this, this._server.rootWindowId, ["SubstructureRedirect", "UnmapNotify"]);

            // client window => window frame
            this._windowFrames = {};

            // frame window => window frame
            this._windowFramesById = {};
        },

        handleEvent: function(event) {
            switch (event.type) {
            case "MapRequest":
                return this.mapRequest(event);
            case "ConfigureRequest":
                return this.configureRequest(event);
            case "Expose":
                // This should only happen for frame windows.
                return this.exposeFrame(event);
            }
        },
        exposeFrame: function(event) {
            var frame = this._windowFramesById[event.windowId];
            frame.expose(event.ctx);
        },
        configureRequest: function(event) {
            var frame = this._windowFrames[event.windowId];

            // If we don't have a frame for a window, it was never
            // mapped, simply re-configure the window with whatever
            // it requested.
            if (!frame) {
                this._server.moveResizeWindow(this, event.windowId,
                                              event.x, event.y,
                                              event.width, event.height);
            } else {
                // The frame will move/resize the window to its
                // client coordinates.
                frame.configureRequest(event);
            }
        },
        mapRequest: function(event) {
            var frame = new WindowFrame(this, this._server, event.windowId);
            this._windowFrames[event.windowId] = frame;

            // Reparent the original window and map the frame.
            frame.construct();

            this._windowFramesById[frame.frameWindowId] = frame;

            // Map the original window, now that we've reparented it
            // back into the frame.
            this._server.mapWindow(this, event.windowId);
        },
        unmapNotify: function(event) {
            var frame = this._windowFrames[event.windowId];
            frame.destroy();
            delete this._windowFrames[event.windowId];
        },
    });

    var _server = new Server(1024, 768);
    var server = _server.publicServer;
    document.querySelector(".server").appendChild(_server.elem);

    var wm = new WindowManager();
    wm.connect(server);

    var w = new BackgroundWindow();
    w.connect(server);
    w.map();

    function animWindow(window, freq, amplitude) {
        var delay = 50;
        var stepsPerSec = 1000 / delay;

        var time = 0;
        var origX = window.x;

        var step = freq * (Math.PI * 2 / stepsPerSec);

        function animate() {
            var offs = Math.sin(time) * amplitude;
            var x = origX + offs;
            window.moveResize(x, undefined, undefined, undefined);
            time += step;
            return true;
        }
        var task = new Task(animate, delay);
        return task;
    }

    var cascade = 40;
    var windowNumber = 1;

    function newWindow() {
        ++windowNumber;

        var w = new FakeWindow("TerminalScreenshot.png");
        w.connect(server);
        w.moveResize(windowNumber * cascade, windowNumber * cascade, undefined, undefined);
        w.map();

        var button;

        var isRaised = false;

        button = new SimpleButton('#ff0000', '#ff6666');
        button.connect(server);
        button.moveResize(700, 10, 20, 20);
        button.reparent(w);
        button.map();
        button.clickCallback = function(event) {
            w.destroy();
        };

        var buttonX = 10;
        function setupButton(button) {
            button.connect(server);
            button.reparent(w);
            button.moveResize(buttonX, 10, 20, 20);
            button.map();
            buttonX += 30;
        }

        var freq = (windowNumber - 1) * 0.25 + 0.5;
        var animTask = animWindow(w, freq, 40);
        button = new SimpleButton('#ffaa00', '#ffcc00');
        setupButton(button);
        button.clickCallback = function(event) {
            animTask.toggle();
        };

        button = new SimpleButton('#ffff00', '#ffffcc');
        setupButton(button);
        button.clickCallback = function(event) {
            newWindow();
        };

        var omp, owp; // orig mouse pos, orig window pos
        var isGrabbed = false;
        button = new SimpleButton('#33ff33', '#99ff99', ["ButtonPress"]);
        setupButton(button);
        button.eventHook = function(event) {
            switch (event.type) {
            case "ButtonPress":
                isGrabbed = !isGrabbed;
                if (isGrabbed) {
                    omp = { x: event.rootX, y: event.rootY };
                    owp = w.getRootCoords();
                    this._server.grabPointer(this, this._windowId, true, ["Motion"], "crosshair");
                } else {
                    this._server.ungrabPointer(this);
                }
                return true;
            case "Motion":
                w.moveResize(owp.x + event.rootX - omp.x,
                             owp.y + event.rootY - omp.y,
                             undefined, undefined);
            }
            return false;
        };
    }

    newWindow();

    window.addEventListener("keydown", function(evt) {
        var letter = String.fromCharCode(evt.keyCode);
        if (letter === 'D')
            _server.toggleDebug();
        if (letter === 'R')
            _server.queueFullRedraw();
    });

})(window);
