(function(exports) {

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
        var coords = window.getRootCoords();
        var origX = coords.x;

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
