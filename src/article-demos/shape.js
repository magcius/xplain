// Contains the demo in the "Windows of all shapes and sizes" section, with a
// shaped kitten window to explain XSHAPE, regions and the clip list.

(function(exports) {
    "use strict";

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

    var ShapedImage = new Class({
        initialize: function(server, imgSrc) {
            var connection = server.connect();
            this._display = connection.display;

            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 125, height: 125 });

            this._display.changeProperty({ windowId: this.windowId, name: 'WM_NAME', value: imgSrc });

            Util.loadImageAsPixmap(this._display, imgSrc, function(pixmapId) {
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

        var kittencircle = new ShapedImage(server, 'kittencircle.png');
        Util.centerWindow(display, kittencircle.windowId);
        display.mapWindow({ windowId: kittencircle.windowId });

        var dragger = new DemoCommon.WindowDragger(server, kittencircle.windowId);
    });

})(window);
