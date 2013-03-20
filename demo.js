(function(exports) {
    "use strict";

    var ImageWindow = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._image = new Image();
            this._image.addEventListener("load", function() {
                try {
                    this._loaded = true;
                    this.moveResize(undefined, undefined, this._image.width, this._image.height);
                    this.invalidate();
                } catch(e) {
                    // The window might be destroyed, but we won't know about it.
                    // We'll get a FocusOut in that case, which will eventually
                    // cause a "load" here. Ignore the BadWindow here.
                }
            }.bind(this));
        },
        _setImage: function(src) {
            this._loaded = false;
            this._image.src = src;
        },
        expose: function() {
            if (!this._loaded)
                return;

            this._server.drawWithContext(this._windowId, function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            this._server.clearDamage(this._windowId);
        },
    });

    var BackgroundWindow = new Class({
        Extends: ImageWindow,
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes(this._windowId, { overrideRedirect: true });
            this._setImage("WoodBackground.jpg");
        },
    });

    var Launcher = new Class({
        Extends: ImageWindow,
        initialize: function(imageSrc, callback) {
            this.parent(imageSrc);
            this._imageSrc = imageSrc;
            this._callback = callback;
        },
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes(this._windowId, { overrideRedirect: true, cursor: "pointer" });
            this._server.selectInput(this._windowId, ["ButtonPress"]);
            this._setImage(this._imageSrc);
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
        Extends: ImageWindow,
        connect: function(server) {
            this.parent(server);
            this._server.selectInput(this._windowId, ["FocusIn", "FocusOut"]);
            this._handleFocusOut();
        },
        handleEvent: function(event) {
            switch(event.type) {
            case "FocusIn":
                return this._handleFocusIn();
            case "FocusOut":
                return this._handleFocusOut();
            default:
                return this.parent(event);
            }
        },
        _handleFocusIn: function() {
            this._setImage("TerminalScreenshotFocused.png");
        },
        _handleFocusOut: function() {
            this._setImage("TerminalScreenshotUnfocused.png");
        },
    });

    var server = new Server(1024, 768);
    document.querySelector(".server").appendChild(server.elem);

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
        if (letter === 'R')
            server.queueFullRedraw();
    });

    window.server = server;

})(window);
