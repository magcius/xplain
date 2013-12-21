// Contains the demo in the "Exposing Historical Baggage" section, with a
// few moving windows, showing off how the Expose model of drawing works.

(function(exports) {
    "use strict";

    // A simple helper to manage timed events, for moving the window below.
    // Perhaps we should consider using requestAnimationFrame for this?
    var Timer = new Class({
        initialize: function(delay, func) {
            this._delay = delay;
            this._func = func;
            this._timeoutId = 0;
        },

        _schedule: function() {
            this._timeoutId = setTimeout(function() {
                this._func();
                this._schedule();
            }, this._delay);
        },

        stop: function() {
            if (this._timeoutId) {
                clearTimeout(this._timeoutId);
                this._timeoutId = 0;
            }
        },

        start: function() {
            if (this._timeoutId)
                this.stop();

            this._schedule();
        },
    });

    // This demo is supposed to demonstrate how the Expose event works,
    // so it displays an image by processing Expose events, rather than
    // setting the background-pixmap or background-color.
    var SimpleImage = new Class({
        initialize: function(server, imgSrc) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
            this._display.changeProperty({ windowId: this.windowId, name: 'WM_NAME', value: "Image Window" });
            this._display.selectInput({ windowId: this.windowId, events: ['Expose'] });

            this._pixmapId = 0;
            Util.loadImageAsPixmap(this._display, imgSrc, function(pixmapId) {
                this._pixmapId = pixmapId;
                this._display.invalidateWindow({ windowId: this.windowId });
            }.bind(this));
        },

        _draw: function() {
            if (!this._pixmapId)
                return;

            var image = this._display.getPixmapImage({ pixmapId: this._pixmapId });
            this._display.drawTo(this.windowId, function(ctx) {
                ctx.drawImage(image, 0, 0);
            }.bind(this));
        },

        _handleEvent: function(event) {
            switch (event.type) {
                case "Expose":
                    this._draw();
                    break;
            }
        },
    });

    // The number of times to update, per second.
    var TICKS_PER_SEC = 30;
    var TICK_MSEC = (1000 / TICKS_PER_SEC);

    // http://tauday.com/
    var TAU = Math.PI * 2;

    // The time, in seconds, to complete a full movement.
    var PERIOD = 2;

    // The number of pixels to sway to either side.
    var SWAY_AMOUNT = 100;

    // A simple moving window.
    var ExposeDemo = new Class({
        Extends: SimpleImage,

        initialize: function(server, imgSrc) {
            this.parent(server, imgSrc);

            this._timer = new Timer(TICK_MSEC, this._tick.bind(this));
            this._tickCount = 0;
            this._startX = 0;
        },

        start: function() {
            var geometry = this._display.getGeometry({ drawableId: this.windowId });
            this._startX = geometry.x;

            this._timer.start();
        },

        // Make it move.
        _sync: function() {
            var theta = TAU * (this._tickCount / TICKS_PER_SEC * PERIOD);
            var x = this._startX + SWAY_AMOUNT * Math.sin(theta);
            this._display.configureWindow({ windowId: this.windowId, x: x });
        },

        _tick: function() {
            this._tickCount++;
            this._sync();
        },
    });

    ArticleDemos.registerDemo("expose", function(res) {
        var server = res.server;
        var display = res.display;
        var kitten = new ExposeDemo(server, "kitten1.png");
        Util.centerWindow(display, kitten.windowId, { x: 15, y: 15 });
        display.mapWindow({ windowId: kitten.windowId });
    });

})(window);
