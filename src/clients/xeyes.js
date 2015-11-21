// Contains a clone of the classic "xeyes" demos.

(function(exports) {
    "use strict";

    function ellipse(ctx, rx, ry) {
        var kappa = .5522848;
        var ox = rx * kappa;
        var oy = ry * kappa;

        ctx.beginPath();
        ctx.moveTo(-rx, 0);
        ctx.bezierCurveTo(-rx, -oy, -ox, -ry, 0, -ry);
        ctx.bezierCurveTo(ox, -ry, rx, -oy, rx, 0);
        ctx.bezierCurveTo(rx, oy, ox, ry, 0, ry);
        ctx.bezierCurveTo(-ox, ry, -rx, oy, -rx, 0);
        ctx.closePath();
    }

    var Xeyes = new Class({
        initialize: function(server) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._pointerRootX = -1;
            this._pointerRootY = -1;

            this.windowId = this._display.createWindow({ x: 50, y: 50, width: 200, height: 150 });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ConfigureNotify", "MapNotify", "UnmapNotify"] });
            this._display.changeProperty({ windowId: this.windowId, name: "WM_NAME", value: "xeyes.js" });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        },
        _start: function() {
            this._intervalId = setInterval(function() {
                var pointer = this._display.queryPointer();
                if (pointer.rootX == this._pointerRootX &&
                    pointer.rootY == this._pointerRootY)
                    return;

                this._pointerRootX = pointer.rootX;
                this._pointerRootY = pointer.rootY;
                this._display.invalidateWindow({ windowId: this.windowId });
            }.bind(this), 50);
        },
        _stop: function() {
            clearInterval(this._intervalId);
            this._intervalId = 0;
        },
        _configureNotify: function(event) {
            // Invalidate the entire window when we get resized, as we need
            // to repaint all contents to fit the new size.
            if (event.width !== undefined || event.height !== undefined)
                this._display.invalidateWindow({ windowId: this.windowId });
        },
        _handleEvent: function(event) {
            switch(event.type) {
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            case "ConfigureNotify":
                return this._configureNotify(event);
            case "MapNotify":
                return this._start();
            case "UnmapNotify":
                return this._stop();
            }
        },

        _draw: function() {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            var eyeRX = width / 4 - 6;
            var eyeRY = height / 2 - 6;
            var eyeCenterLX = width * (1/4);
            var eyeCenterRX = width * (3/4);
            var eyeCenterY = height / 2;

            var pupilRX = eyeRX / 4;
            var pupilRY = eyeRY / 4;

            var pointerCoords = this._display.translateCoordinates({ srcWindowId: this._display.rootWindowId,
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

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);

                ctx.strokeStyle = 'black';
                ctx.lineWidth = 6;

                // scleras
                ctx.save();
                ctx.translate(eyeCenterLX, eyeCenterY);
                ellipse(ctx, eyeRX, eyeRY);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                ctx.save();
                ctx.translate(eyeCenterRX, eyeCenterY);
                ellipse(ctx, eyeRX, eyeRY);
                ctx.fill();
                ctx.stroke();
                ctx.restore();

                // pupils
                ctx.fillStyle = 'black';

                var pos;

                pos = getPupilPosition(eyeCenterLX);
                ctx.save();
                ctx.translate(eyeCenterLX + pos.x, eyeCenterY + pos.y);
                ellipse(ctx, pupilRX, pupilRY);
                ctx.restore();
                ctx.fill();

                pos = getPupilPosition(eyeCenterRX);
                ctx.save();
                ctx.translate(eyeCenterRX + pos.x, eyeCenterY + pos.y);
                ellipse(ctx, pupilRX, pupilRY);
                ctx.restore();
                ctx.fill();
            }.bind(this));
        },
    });

    exports.Xeyes = Xeyes;

})(window);
