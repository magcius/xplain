(function(exports) {
    "use strict";

    var BackgroundWindow = new Class({
        Extends: Window,
        initialize: function() {
            this.parent();
            this._image = new Image();
            this._image.src = "WoodBackground.jpg";
        },
        connect: function(server) {
            this.parent(server);
            this._image.addEventListener("load", function() {
                this.moveResize(undefined, undefined, this._image.width, this._image.height);
                this.invalidate();
            }.bind(this));
            this._server.changeAttributes(this, this._windowId, { overrideRedirect: true });
        },
        expose: function(wrapper) {
            wrapper.drawWithContext(function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            wrapper.clearDamage();
        },
    });

    var SimpleButton = new Class({
        Extends: Button,
        initialize: function(standardColor, hoverColor) {
            this.parent();
            this._standardColor = standardColor;
            this._hoverColor = hoverColor;
        },
        _syncButtonState: function() {
            this.parent();
            var color;
            if (this._state == "up" || this._state == "down")
                color = this._standardColor;
            else if (this._state == "over")
                color = this._hoverColor;
            this._server.changeAttributes(this, this._windowId, { backgroundColor: color });
        },
    });

    var Launcher = new Class({
        Extends: Window,
        initialize: function(imageSrc, callback) {
            this.parent(imageSrc);
            this._image = new Image();
            this._image.src = imageSrc;
            this._callback = callback;
        },
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes(this, this._windowId, { overrideRedirect: true, cursor: "pointer" });
            this._server.selectInput(this, this._windowId, ["ButtonPress"]);
            this._image.addEventListener("load", function() {
                this.moveResize(undefined, undefined, this._image.width, this._image.height);
                this.invalidate();
            }.bind(this));
        },
        expose: function(wrapper) {
            wrapper.drawWithContext(function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            wrapper.clearDamage();
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonPress":
                return this._callback.call(null);
            default:
                return this.parent(event);
            }
        },
    });

    var FakeTerminalWindow = new Class({
        Extends: Window,
        initialize: function() {
            this.parent();
            this._image = new Image();
        },
        connect: function(server) {
            this.parent(server);
            this._server.selectInput(this, this._windowId, ["FocusIn", "FocusOut"]);
            this._image.addEventListener("load", function() {
                this.moveResize(undefined, undefined, this._image.width, this._image.height);
                this.invalidate();
            }.bind(this));
        },
        handleEvent: function(event) {
            switch(event.type) {
                case "FocusIn":
                    return this._handleFocusIn(event);
                case "FocusOut":
                    return this._handleFocusOut(event);
                default:
                    return this.parent(event);
            }
        },
        _handleFocusIn: function(event) {
            this._image.src = "TerminalScreenshotFocused.png";
        },
        _handleFocusOut: function(event) {
            this._image.src = "TerminalScreenshotUnfocused.png";
        },
        expose: function(wrapper) {
            wrapper.drawWithContext(function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
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

    var launcher = new Launcher('TerminalIcon.png', newWindow);
    launcher.connect(server);
    launcher.moveResize(10, 10, undefined, undefined);
    launcher.map();

    function animWindow(window, freq, amplitude) {
        var delay = 50;
        var stepsPerSec = 1000 / delay;

        var time = 0;
        var coords = window.getRootCoords();
        var origX = coords.x;

        var step = freq * (Math.PI * 2 / stepsPerSec);

        function animate() {
            var offs = Math.sin(time) * amplitude;
            var x = (origX + offs) | 0;
            window.moveResize(x, undefined, undefined, undefined);
            time += step;
            return true;
        }
        var task = new Task(animate, delay);
        return task;
    }

    var cascade = 40;
    var windowNumber = 0;

    function newWindow() {
        ++windowNumber;

        var w = new FakeTerminalWindow();
        w.connect(server);
        w.moveResize(windowNumber * cascade, windowNumber * cascade, undefined, undefined);
        w.changeProperty("WM_NAME", "Terminal Window " + windowNumber);
        w.map();

        var button;

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
    }

    window.addEventListener("keydown", function(evt) {
        var letter = String.fromCharCode(evt.keyCode);
        if (letter === 'D')
            _server.toggleDebug();
        if (letter === 'R')
            _server.queueFullRedraw();
    });

    window._server = _server;

})(window);
