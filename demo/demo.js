(function(exports) {
    "use strict";

    var Window = new Class({
        initialize: function() {
            this.x = 0;
            this.y = 0;
            this.width = 1;
            this.height = 1;
        },
        connect: function(server) {
            this._privateServer = server;
            var connection = this._privateServer.clientConnected(this);
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this.handleEvent(messageEvent.data);
            }.bind(this));
            this._server = connection.server;
            this.windowId = this._server.createWindow({ x: this.x, y: this.y,
                                                        width: this.width, height: this.height });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["Expose", "ConfigureNotify"] });
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ConfigureNotify":
                return this.configureNotify(event);
            case "Expose":
                return this.expose(event);
            }
        },
        configureNotify: function(event) {
            if (event.windowId !== this.windowId)
                return;

            if (event.x !== undefined)
                this.x = event.x;
            if (event.y !== undefined)
                this.y = event.y;
            if (event.width !== undefined)
                this.width = event.width;
            if (event.height !== undefined)
                this.height = event.height;
        },
        invalidate: function() {
            this._server.invalidateWindow({ windowId: this.windowId });
        },
        _drawBackground: function(event) {
            this._server.drawWithContext(this.windowId, function(ctx) {
                ctx.fillStyle = event.backgroundColor;
                ctx.fillRect(0, 0, this.width, this.height);
            }.bind(this));
        },
        expose: function(event) {
            this._drawBackground(event);
            this.clearDamage();
        },
        map: function() {
            this._server.mapWindow({ windowId: this.windowId });
        },
        moveResize: function(x, y, width, height) {
            this._server.configureWindow({ windowId: this.windowId, x: x, y: y, width: width, height: height });
        },
        changeProperty: function(name, value) {
            this._server.changeProperty({ windowId: this.windowId, name: name, value: value });
        },
        clearDamage: function() {
            var region = new Region();
            region.init_rect(0, 0, this.width, this.height);
            this._server.clearDamage({ windowId: this.windowId,
                                       region: region });
            region.finalize();
        },
    });

    var ImageWindow = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._image = new Image();
            this._image.addEventListener("load", function() {
                this._loaded = true;
                this.moveResize(undefined, undefined, this._image.width, this._image.height);
            }.bind(this));
        },
        _setImage: function(src) {
            this._loaded = false;
            this._image.src = src;
        },
        configureNotify: function(event) {
            this.parent(event);
            this.invalidate();
        },
        expose: function(event) {
            this._drawBackground(event);

            if (!this._loaded)
                return;

            this._server.drawWithContext(this.windowId, function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            this.clearDamage();
        },
    });

    var BackgroundWindow = new Class({
        Extends: ImageWindow,
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes({ windowId: this.windowId, overrideRedirect: true });
            this._setImage("demo/data/background.jpg");
        },
    });

    var Panel = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._launchers = [];
            this.moveResize(undefined, undefined, this._server.width, 30);
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: "#eeeeec" });
            this.changeProperty("_NET_WM_WINDOW_TYPE", "_NET_WM_WINDOW_TYPE_DOCK");
        },
        _relayout: function() {
            var padding = 4;
            var x = padding;
            this._launchers.forEach(function(launcher) {
                launcher.moveResize(x, padding, undefined, undefined);
                x += launcher.width + padding;
            });
        },
        configureNotify: function(event) {
            this.parent(event);
            if (event.windowId !== this.windowId && event.width !== undefined)
                this._relayout();
        },
        addLauncher: function(launcher) {
            this._launchers.push(launcher);
            this._server.selectInput({ windowId: launcher.windowId,
                                       events: ["ConfigureNotify"] });
            this._server.reparentWindow({ windowId: launcher.windowId,
                                          newParentId: this.windowId });
            this._relayout();
        },
        removeLauncher: function(launcher) {
            var idx = this._launchers.indexOf(launcher);
            // XXX -- way to unselect for input
            this._server.reparentWindow({ windowId: launcher.windowId,
                                          newParentId: this._server.rootWindowId });
            this._launchers.splice(idx, 1);
        },
        expose: function(event) {
            this._drawBackground(event);

            this._server.drawWithContext(this.windowId, function(ctx) {
                ctx.strokeStyle = '#aaaaaa';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.rect(-1, 0, this.width + 2, this.height);
                ctx.stroke();
            }.bind(this));
        },
    });

    var Launcher = new Class({
        Extends: ImageWindow,
        initialize: function(imageSrc, constructor) {
            this.parent(imageSrc);
            this._imageSrc = imageSrc;
            this._constructor = constructor;
        },
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: "#eeeeec",
                                            cursor: "pointer" });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["ButtonPress"] });
            this._setImage(this._imageSrc);
        },
        _launchApp: function() {
            var client = new this._constructor();
            client.connect(this._privateServer);
            client.map();
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonPress":
                return this._launchApp();
            default:
                return this.parent(event);
            }
        },
    });

    var FakeTerminalWindow = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._focused = false;
            this._buffer = "";
            this._server.configureWindow({ windowId: this.windowId,
                                           width: 700, height: 400 });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["KeyPress"] });
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: "#121212" });
            this.changeProperty("WM_NAME", "Fake Terminal");
        },
        handleEvent: function(event) {
            switch(event.type) {
            case "KeyPress":
                return this._handleKeyPress(event);
            default:
                return this.parent(event);
            }
        },
        expose: function(event) {
            this._drawBackground(event);

            this._server.drawWithContext(this.windowId, function(ctx) {
                ctx.font = 'bold 10pt "Droid Sans Mono Dotted"';

                var x = 4, y = 16;
                function drawText(text) {
                    var metrics = ctx.measureText(text);
                    ctx.fillText(text, x, y);
                    x += metrics.width;
                }

                ctx.fillStyle = '#8ae234';
                drawText("jstpierre@jstpierre-lappy");

                ctx.fillStyle = '#729fcf';
                drawText(" ~ $ ");

                ctx.fillStyle = '#eeeeec';
                drawText(this._buffer);
            }.bind(this));
            this.clearDamage();
        },
        _handleKeyPress: function(event) {
            this._buffer += String.fromCharCode(event.charCode);
            this.invalidate();
        },
    });

    function ellipse(ctx, x, y, rx, ry) {
        x -= rx;
        y -= ry;

        var kappa = .5522848;
        var ox = rx * kappa;
        var oy = ry * kappa;
        var xe = x + rx * 2;
        var ye = y + ry * 2;
        var xm = x + rx;
        var ym = y + ry;

        ctx.beginPath();
        ctx.moveTo(x, ym);
        ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
        ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
        ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
        ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
        ctx.closePath();
    }

    var Xeyes = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);

            this._pixmapId = 0;

            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: "#eeeeec" });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["MapNotify", "UnmapNotify"] });
            this.moveResize(undefined, undefined, 200, 150);
            this.changeProperty("WM_NAME", "xeyes.js");
        },
        _start: function() {
            this._intervalId = setInterval(function() {
                this.invalidate();
            }.bind(this), 50);
        },
        _stop: function() {
            clearInterval(this._intervalId);
            this._intervalId = 0;
        },
        _destroyPixmap: function() {
            this._server.freePixmap({ pixmapId: this._pixmapId });
            this._pixmapId = 0;
        },
        _ensurePixmap: function() {
            if (this._pixmapId)
                return;

            this._pixmapId = this._server.createPixmap({ width: this.width,
                                                         height: this.height });


            var eyeRX = this.width / 4 - 6;
            var eyeRY = this.height / 2 - 6;
            var eyeCenterLX = this.width * (1/4);
            var eyeCenterRX = this.width * (3/4);
            var eyeCenterY = this.height / 2;

            this._server.drawWithContext(this._pixmapId, function(ctx) {
                ctx.clearRect(0, 0, this.width, this.height);

                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 4;
                ctx.fillStyle = '#ffffff';

                // scleras
                ellipse(ctx, eyeCenterLX, eyeCenterY, eyeRX, eyeRY);
                ctx.fill();
                ctx.stroke();

                ellipse(ctx, eyeCenterRX, eyeCenterY, eyeRX, eyeRY);
                ctx.fill();
                ctx.stroke();
            }.bind(this));
        },
        configureNotify: function(event) {
            this.parent(event);
            this._destroyPixmap();
            this.invalidate();
        },
        handleEvent: function(event) {
            switch(event.type) {
            case "MapNotify":
                return this._start();
            case "UnmapNotify":
                return this._stop();
            default:
                return this.parent(event);
            }
        },
        expose: function(event) {
            this._drawBackground(event);

            this._ensurePixmap();

            var eyeRX = this.width / 4 - 6;
            var eyeRY = this.height / 2 - 6;
            var eyeCenterLX = this.width * (1/4);
            var eyeCenterRX = this.width * (3/4);
            var eyeCenterY = this.height / 2;

            var pupilRX = eyeRX / 2;
            var pupilRY = eyeRY / 2;

            var pointer = this._server.queryPointer();
            var pointerCoords = this._server.translateCoordinates({ srcWindowId: this._server.rootWindowId,
                                                                    destWindowId: this.windowId,
                                                                    x: pointer.rootX, y: pointer.rootY });

            function hypot(x, y) {
                return Math.sqrt(x*x + y*y);
            }

            function getPupilPosition(eyeCenterX) {
                // The max distance away from the center the pupil
                // is allowed to be.
                var maxDistX = eyeRX - pupilRX;
                var maxDistY = eyeRY - pupilRY;

                // Normalize to center of eye.
                var pointerX = pointerCoords.x - eyeCenterX;
                var pointerY = pointerCoords.y - eyeCenterY;

                var distance = hypot(pointerX / maxDistX, pointerY / maxDistY);
                if (distance > 1)
                    distance = 1;

                var angle = Math.atan2(pointerY, pointerX);

                // Pupil position relative to center of eye.
                var pupilX = Math.cos(angle) * distance * maxDistX;
                var pupilY = Math.sin(angle) * distance * maxDistY;

                return { x: pupilX, y: pupilY };
            }

            this._server.copyArea({ srcDrawableId: this._pixmapId,
                                    destDrawableId: this.windowId,
                                    oldX: 0, oldY: 0, newX: 0, newY: 0,
                                    width: this.width, height: this.height });
            this._server.drawWithContext(this.windowId, function(ctx) {
                // pupils
                ctx.fillStyle = '#000000';

                var pos;

                pos = getPupilPosition(eyeCenterLX);
                ellipse(ctx, eyeCenterLX + pos.x, eyeCenterY + pos.y, pupilRX, pupilRY);
                ctx.fill();

                pos = getPupilPosition(eyeCenterRX);
                ellipse(ctx, eyeCenterRX + pos.x, eyeCenterY + pos.y, pupilRX, pupilRY);
                ctx.fill();
            });
            this.clearDamage();
        },
    });

    var server = new Server(1024, 768);
    document.querySelector(".server").appendChild(server.elem);

    var wm = new WindowManager();
    wm.connect(server);

    var w = new BackgroundWindow();
    w.connect(server);
    w.map();

    var panel = new Panel();
    panel.connect(server);
    panel.map();

    var launcher;

    launcher = new Launcher("demo/data/launcher-terminal.png", FakeTerminalWindow);
    launcher.connect(server);
    panel.addLauncher(launcher);
    launcher.map();

    launcher = new Launcher("demo/data/launcher-xeyes.png", Xeyes);
    launcher.connect(server);
    panel.addLauncher(launcher);
    launcher.map();

    window.server = server;

})(window);
