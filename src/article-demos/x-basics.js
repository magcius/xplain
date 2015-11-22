// Contains the demo in the "Exposing Historical Baggage" section, with a
// few moving windows, showing off how the Expose model of drawing works.

(function(exports) {
    "use strict";

    ArticleDemos.registerDemo("two-kittens", "height: 200px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        DemoCommon.setBackground(display, DemoCommon.makeStipple(display));

        // The window on the left.
        var kitten1 = new DemoCommon.SimpleImage(server, "kitten1.png");
        DemoCommon.centerWindow(display, kitten1.windowId, { x: -125, y: 0 });
        display.mapWindow({ windowId: kitten1.windowId });

        // The window on the right.
        var kitten2 = new DemoCommon.SimpleImage(server, "kitten2.png");
        DemoCommon.centerWindow(display, kitten2.windowId, { x: +125, y: 0 });
        display.mapWindow({ windowId: kitten2.windowId });
    });

    ArticleDemos.registerDemo("expose", "height: 250px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        DemoCommon.setBackground(display, DemoCommon.makeStipple(display));

        // The shaking window that's behind.
        var kitten2 = new DemoCommon.DelayedExposeImage(server, "kitten2.png");
        DemoCommon.centerWindow(display, kitten2.windowId, { x: -20, y: 40 });
        display.mapWindow({ windowId: kitten2.windowId });

        // The window on top that's obscuring the window behind it.
        var kitten1 = new DemoCommon.SimpleImage(server, "kitten1.png");
        DemoCommon.centerWindow(display, kitten1.windowId);
        display.mapWindow({ windowId: kitten1.windowId });

        var dragger = new DemoCommon.WindowDragger(server, kitten1.windowId);
        var shaker = new DemoCommon.WindowShaker(server, kitten2.windowId);
    });

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

            var region = DemoCommon.scanImageDataForVisibleRegion(imgData);
            this._display.setWindowShapeRegion({ windowId: this.windowId,
                                                 shapeType: "Bounding",
                                                 region: region });
            region.finalize();
        },
    });

    ArticleDemos.registerDemo('shape', "height: 250px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        DemoCommon.setBackground(display, DemoCommon.makeStipple(display));

        // The shaking window that's behind.
        var kitten2 = new DelayedExposeImage(server, "kitten2.png");
        DemoCommon.centerWindow(display, kitten2.windowId, { x: -20, y: 40 });
        display.mapWindow({ windowId: kitten2.windowId });

        // The circle window that's on top.
        var kittencircle = new ShapedImage(server, 'kittencircle.png');
        DemoCommon.centerWindow(display, kittencircle.windowId);
        display.mapWindow({ windowId: kittencircle.windowId });

        var dragger = new DemoCommon.WindowDragger(server, kittencircle.windowId);
        var shaker = new DemoCommon.WindowShaker(server, kitten2.windowId);
    });

})(window);
