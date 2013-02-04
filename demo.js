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
            this.parent();
            this._image = new Image();
            this._image.src = imageSrc;
            this._callback = callback;
        },
        connect: function(server) {
            this.parent(server);
            this.moveResize(0, 0, this._image.width, this._image.height);
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

    newWindow();

    window.addEventListener("keydown", function(evt) {
        var letter = String.fromCharCode(evt.keyCode);
        if (letter === 'D')
            _server.toggleDebug();
        if (letter === 'R')
            _server.queueFullRedraw();
    });

})(window);
