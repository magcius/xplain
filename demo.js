(function(exports) {

    var Window = new Class({
        initialize: function() {
            this.hasInput = true;
            this.backgroundColor = null;
        },
        connect: function(server) {
            this._server = server;
            this._server.clientConnected(this);
            this._windowId = this._server.createWindow();
            this._server.changeAttributes(this._windowId, { hasInput: this.hasInput, backgroundColor: this.backgroundColor });
            this._server.selectInput(this, this._windowId, ["Expose", "ConfigureNotify"]);
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ConfigureNotify":
                return this.configureNotify(event.x, event.y, event.width, event.height);
            case "Expose":
                return this.expose(event.ctx);
            }
        },
        configureNotify: function(x, y, width, height) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        },
        reparent: function(newParent) {
            this._server.reparentWindow(this._windowId, newParent._windowId);
        },
        expose: function() {
        },
        configure: function(x, y, width, height) {
            x = x === undefined ? this.x : x;
            y = y === undefined ? this.y : y;
            width = width === undefined ? this.width : width;
            height = height === undefined ? this.height : height;
            this._server.configureRequest(this._windowId, x | 0, y | 0, width | 0, height | 0);
        }
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
            this.configure(0, 0, server.width, server.height);
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
        expose: function(wrapper) {
            wrapper.drawWithContext(function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            wrapper.clearDamage();
        },
    });

    var SimpleButton = new Class({
        Extends: Window,
        initialize: function(standardColor, hoverColor) {
            this.parent();
            this._standardColor = standardColor;
            this._hoverColor = hoverColor;
        },
        connect: function(server) {
            this.parent(server);
            this._server.selectInput(this, this._windowId, ["Enter", "Leave", "ButtonRelease"]);
            this._server.defineCursor(this._windowId, "pointer");
            this._setHover(false);
        },
        _setHover: function(hover) {
            if (this._isHovering == hover)
                return;

            this._isHovering = hover;

            if (this._server) {
                var color = hover ? this._hoverColor : this._standardColor;
                this._server.changeAttributes(this._windowId, { backgroundColor: color });
                this._server.invalidateWindow(this._windowId);
            }
        },
        handleEvent: function(event) {
            switch(event.type) {
                case "Enter":
                return this._setHover(true);
                case "Leave":
                return this._setHover(false);
                case "ButtonRelease":
                if (this.clickCallback)
                    this.clickCallback(event);
                default:
                return this.parent(event);
            }
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

    var w = new BackgroundWindow();
    w.connect(server);

    var colors = [['#ff0000', '#ff6666'],
                  ['#ffaa00', '#ffcc00'],
                  ['#ffff00', '#ffffcc'],
                  ['#33ff33', '#99ff99'],
                  ['#00ffff', '#99ffff']];
    for (var i = 0; i < 5; i++) {
        var cascade = 40;
        var windowNumber = i + 1;
        var w = new FakeWindow("TerminalScreenshot.png");
        w.connect(server);
        w.configure(windowNumber * cascade, windowNumber * cascade, 735, 461);
        var freq = i * 0.25 + 0.5;

        var colorSet = colors[i];

        var button = new SimpleButton(colorSet[0], colorSet[1]);
        button.connect(server);
        button.configure(50, 20, 100, 50);
        button.reparent(w);

        button.clickCallback = function(event) {
            if (event.button === 1)
                console.log("Button clicked!");
        };
    }

    window.addEventListener("keydown", function(evt) {
        var letter = String.fromCharCode(evt.keyCode);
        if (letter === 'D')
            _server.toggleDebug();
        if (letter === 'R')
            _server.queueFullRedraw();
    });

})(window);
