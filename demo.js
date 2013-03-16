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

    var cascade = 40;
    var windowNumber = 0;

    function newWindow() {
        ++windowNumber;

        var w = new FakeTerminalWindow();
        w.connect(server);
        w.moveResize(windowNumber * cascade, windowNumber * cascade, undefined, undefined);
        w.changeProperty("WM_NAME", "Terminal Window " + windowNumber);
        w.map();
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
