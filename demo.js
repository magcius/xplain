(function(exports) {
    "use strict";

    var BackgroundWindow = new Class({
        Extends: ImageWindow,
        initialize: function() {
            this.parent("WoodBackground.jpg");
        },
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes(this, this._windowId, { overrideRedirect: true });
        }
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
        Extends: ImageWindow,
        initialize: function(imageSrc, callback) {
            this.parent(imageSrc);
            this._callback = callback;
        },
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes(this, this._windowId, { overrideRedirect: true });
            this._server.defineCursor(this, this._windowId, "pointer");
            this._server.selectInput(this, this._windowId, ["ButtonPress"]);
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
            var x = origX + offs;
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

        var w = new ImageWindow("TerminalScreenshot.png");
        w.connect(server);
        w.moveResize(windowNumber * cascade, windowNumber * cascade, undefined, undefined);
        w.changeProperty("WM_NAME", "Terminal Window {i}".substitute({ i: windowNumber }));
        w.map();

        var button;

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
