// Contains the demo in the "Exposing Historical Baggage" section, with a
// few moving windows, showing off how the Expose model of drawing works.

(function(exports) {
    "use strict";

    var BaseImage = new Class({
        initialize: function(server, imgSrc) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 125, height: 125 });

            // Set a background color, as without it, the X server won't fill in the exposed
            // areas, and we're left with old contents that are hard to recognize in a demo.
            this._display.changeAttributes({ windowId: this.windowId, backgroundColor: '#ffffff' });

            this._display.changeProperty({ windowId: this.windowId, name: 'WM_NAME', value: imgSrc });
            this._display.selectInput({ windowId: this.windowId, events: ['Expose'] });

            this._pixmapId = 0;
            ClientUtil.loadImageAsPixmap(this._display, imgSrc, function(pixmapId) {
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
                    return this._handleExpose(event);
            }
        },
    });

    // SimpleImage draws whenever it gets an expose. We could use the
    // ExposeProcessor to prevent repeated redraws, but since we know that
    // in this demo the window will always be on top, I think we're OK.
    var SimpleImage = new Class({
        Extends: BaseImage,

        _handleExpose: function(event) {
            this._draw();
        },
    });

    ArticleDemos.registerDemo("two-kittens", function(res) {
        var server = res.server;
        var display = res.display;

        // The window on the left.
        var kitten1 = new SimpleImage(server, "kitten1.png");
        DemoCommon.centerWindow(display, kitten1.windowId, { x: -125, y: 0 });
        display.mapWindow({ windowId: kitten1.windowId });

        // The window on the right.
        var kitten2 = new SimpleImage(server, "kitten2.png");
        DemoCommon.centerWindow(display, kitten2.windowId, { x: +125, y: 0 });
        display.mapWindow({ windowId: kitten2.windowId });
    });

    // DelayedExposeImage waits a bit before processing expose events, to
    // emulate a "hung" or "slow" app and show off how expose processing works.
    var DelayedExposeImage = new Class({
        Extends: BaseImage,

        _scheduledDraw: function() {
            this._draw();
            this._drawTimeoutId = 0;
        },

        _handleExpose: function(event) {
            if (this._drawTimeoutId)
                return;

            this._drawTimeoutId = setTimeout(this._scheduledDraw.bind(this), 200);
        },
    });

    // A simple helper to manage repeated timed events for WindowShaker below.
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
            }.bind(this), this._delay);
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

    // The number of times to update, per second.
    var TICKS_PER_SEC = 30;
    var TICK_MSEC = (1000 / TICKS_PER_SEC);

    // http://tauday.com/
    var TAU = Math.PI * 2;

    // The time, in seconds, to complete a full movement.
    var PERIOD = 6;

    // The number of pixels to sway to either side.
    var SWAY_AMOUNT = 75;

    // Shakes a window
    var WindowShaker = new Class({
        initialize: function(server, windowId) {
            var connection = server.connect();
            this._display = connection.display;

            this._windowId = windowId;

            this._timer = new Timer(TICK_MSEC, this._tick.bind(this));
            this._tickCount = 0;
            this._startX = 0;
        },

        start: function() {
            var geometry = this._display.getGeometry({ drawableId: this._windowId });
            this._startX = geometry.x;
            this._timer.start();
        },

        // Make it move.
        _sync: function() {
            var theta = TAU * (this._tickCount / TICKS_PER_SEC / PERIOD);
            var x = this._startX + SWAY_AMOUNT * Math.sin(theta);
            this._display.configureWindow({ windowId: this._windowId, x: x });
        },

        _tick: function() {
            this._tickCount++;
            this._sync();
        },
    });

    ArticleDemos.registerDemo("expose", function(res) {
        var server = res.server;
        var display = res.display;

        // The shaking window that's behind.
        var kitten2 = new DelayedExposeImage(server, "kitten2.png");
        DemoCommon.centerWindow(display, kitten2.windowId, { x: -20, y: -40 });
        display.mapWindow({ windowId: kitten2.windowId });

        // The window on top that's obscuring the window behind it.
        var kitten1 = new SimpleImage(server, "kitten1.png");
        DemoCommon.centerWindow(display, kitten1.windowId);
        display.mapWindow({ windowId: kitten1.windowId });

        var dragger = new DemoCommon.WindowDragger(server, kitten1.windowId);

        var shaker = new WindowShaker(server, kitten2.windowId);
        shaker.start();
    });

    // Constructs a region containing the area where there are visible
    // pixels, where "visible pixels" have any alpha value other than 0.
    function scanImageDataForVisibleRegion(imgData) {
        var w = imgData.width, h = imgData.height;

        var region = new Region();

        // Scan through the alpha values of the image, looking for solid
        // pixels in rectangular bands, and make a region from these.

        function alphaAt(x, y) {
            var pixelIndex = (y * w) + x;
            // imgData is laid out in an RGBA manner, so to get the alpha
            // component of the 7th pixel, we need to get the 31th number.
            var dataIndex = pixelIndex * 4 + 3;
            return imgData.data[dataIndex];
        }

        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var x2 = x;

                while (alphaAt(x2, y) && x2 < w)
                    x2++;

                if (x2 > x) {
                    region.union_rect(region, x, y, x2 - x, 1);
                    x = x2;
                }
            }
        }

        return region;
    }

    // A simple image with a shape region.
    var ShapedImage = new Class({
        initialize: function(server, imgSrc) {
            var connection = server.connect();
            this._display = connection.display;

            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 125, height: 125 });

            this._display.changeProperty({ windowId: this.windowId, name: 'WM_NAME', value: imgSrc });

            ClientUtil.loadImageAsPixmap(this._display, imgSrc, function(pixmapId) {
                this._setShape(pixmapId);
                this._display.changeAttributes({ windowId: this.windowId, backgroundPixmap: pixmapId });
                this._display.invalidateWindow({ windowId: this.windowId });
            }.bind(this));
        },

        _setShape: function(pixmapId) {
            var image = this._display.getPixmapImage({ pixmapId: pixmapId });
            var ctx = image.getContext('2d');
            var imgData = ctx.getImageData(0, 0, image.width, image.height);

            var region = scanImageDataForVisibleRegion(imgData);
            this._display.setWindowShapeRegion({ windowId: this.windowId,
                                                 shapeType: "Bounding",
                                                 region: region });
            region.finalize();
        },
    });

    ArticleDemos.registerDemo('shape', function(res) {
        var server = res.server;
        var display = res.display;

        // The shaking window that's behind.
        var kitten2 = new DelayedExposeImage(server, "kitten2.png");
        DemoCommon.centerWindow(display, kitten2.windowId, { x: -20, y: -40 });
        display.mapWindow({ windowId: kitten2.windowId });

        // The circle window that's on top.
        var kittencircle = new ShapedImage(server, 'kittencircle.png');
        DemoCommon.centerWindow(display, kittencircle.windowId);
        display.mapWindow({ windowId: kittencircle.windowId });

        var dragger = new DemoCommon.WindowDragger(server, kittencircle.windowId);

        var shaker = new WindowShaker(server, kitten2.windowId);
        shaker.start();
    });

})(window);
