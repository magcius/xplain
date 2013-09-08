(function(exports) {
    "use strict";

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

            this._pointerRootX = -1;
            this._pointerRootY = -1;

            this._server.selectInput({ windowId: this.windowId,
                                       events: ["MapNotify", "UnmapNotify"] });
            this._server.configureWindow({ windowId: this.windowId,
                                           width: 200, height: 150 });
            this._server.changeProperty({ windowId: this.windowId,
                                          name: "WM_NAME",
                                          value: "xeyes.js" });
            this._server.mapWindow({ windowId: this.windowId });
        },
        _start: function() {
            this._intervalId = setInterval(function() {
                var pointer = this._server.queryPointer();
                if (pointer.rootX == this._pointerRootX &&
                    pointer.rootY == this._pointerRootY)
                    return;

                this._pointerRootX = pointer.rootX;
                this._pointerRootY = pointer.rootY;
                this._server.invalidateWindow({ windowId: this.windowId });
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

            this._server.drawTo(this._pixmapId, function(ctx) {
                ctx.fillStyle = '#eeeeec';
                ctx.fillRect(0, 0, this.width, this.height);

                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 10;
                ctx.fillStyle = '#ffffff';

                // scleras
                ellipse(ctx, eyeCenterLX, eyeCenterY, eyeRX, eyeRY);
                ctx.fill();
                ctx.stroke();

                ellipse(ctx, eyeCenterRX, eyeCenterY, eyeRX, eyeRY);
                ctx.fill();
                ctx.stroke();
            }.bind(this));
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundPixmap: this._pixmapId });
        },
        configureNotify: function(event) {
            this.parent(event);
            this._destroyPixmap();
            this._server.invalidateWindow({ windowId: this.windowId });
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
            this._ensurePixmap();

            var eyeRX = this.width / 4 - 6;
            var eyeRY = this.height / 2 - 6;
            var eyeCenterLX = this.width * (1/4);
            var eyeCenterRX = this.width * (3/4);
            var eyeCenterY = this.height / 2;

            var pupilRX = eyeRX / 4;
            var pupilRY = eyeRY / 4;

            var pointerCoords = this._server.translateCoordinates({ srcWindowId: this._server.rootWindowId,
                                                                    destWindowId: this.windowId,
                                                                    x: this._pointerRootX,
                                                                    y: this._pointerRootY });

            function hypot(x, y) {
                return Math.sqrt(x*x + y*y);
            }

            function getPupilPosition(eyeCenterX) {
                // The max distance away from the center the pupil
                // is allowed to be.
                var maxDistX = eyeRX - pupilRX - 20;
                var maxDistY = eyeRY - pupilRY - 20;

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

            this._server.drawTo(this.windowId, function(ctx) {
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
        },
    });

    exports.Xeyes = Xeyes;

})(window);
