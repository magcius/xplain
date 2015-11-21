// Contains a clone of the classic "xclock" demos.

(function(exports) {
    "use strict";

    var Xclock = new Class({
        initialize: function(server) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._pointerRootX = -1;
            this._pointerRootY = -1;

            this.windowId = this._display.createWindow({ x: 300, y: 50, width: 150, height: 150 });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ConfigureNotify", "MapNotify", "UnmapNotify"] });
            this._display.changeProperty({ windowId: this.windowId, name: "WM_NAME", value: "xclock.js" });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        },
        _start: function() {
            this._intervalId = setInterval(function() {
                this._display.invalidateWindow({ windowId: this.windowId });
            }.bind(this), 1000);
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

            var TAU = Math.PI * 2;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);

                var hw = width / 2, hh = height / 2;
                ctx.translate(hw, hh);
                ctx.lineWidth = 2;

                var radius = Math.min(width, height) / 2 - 5;

                ctx.beginPath();
                for (var i = 0; i < 60; i++) {
                    var angle = i * TAU / 60;
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.moveTo(radius, 0);
                    var length = (i % 5) == 0 ? 10 : 4;
                    ctx.lineTo(radius - length, 0);
                    ctx.restore();
                }
                ctx.stroke();

                ctx.fillStyle = 'black';

                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, TAU);
                ctx.fill();

                var now = new Date();

                ctx.save();
                ctx.rotate(now.getMinutes() * TAU / 60);
                ctx.beginPath();
                ctx.moveTo(0, -5);
                ctx.lineTo(radius - 20, 0);
                ctx.lineTo(0, 5);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.rotate(now.getHours() * TAU / 12);
                ctx.beginPath();
                ctx.moveTo(0, -5);
                ctx.lineTo(radius / 2 - 10, 0);
                ctx.lineTo(0, 5);
                ctx.fill();
                ctx.restore();

                ctx.save();
                ctx.rotate(now.getSeconds() * TAU / 60);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, radius - 20);
                ctx.stroke();
                ctx.restore();
            }.bind(this));
        },
    });

    exports.Xclock = Xclock;

})(window);
