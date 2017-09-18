// Contains various utility methods for dealing with Xlib and the X server,
// used by multiple components.

(function(exports) {
    "use strict";

    var ClientUtil = {};

    // A simple helper object that deals with the more-complicated
    // aspects of Expose event handling, like accumulating an exposed
    // region to redraw, and calling the draw function when we've
    // processed all the Expose events in the current chain.
    ClientUtil.ExposeHandler = class ExposeHandler {
        constructor(drawFn) {
            this._exposedRegion = new Region();
            this._draw = drawFn;
        }
        clip(ctx) {
            CanvasUtil.pathFromRegion(ctx, this._exposedRegion);
            ctx.clip();
            ctx.beginPath();
            this._exposedRegion.clear();
        }
        handleExpose(event) {
            this._exposedRegion.union_rect(this._exposedRegion, event.x, event.y, event.width, event.height);
            if (event.count == 0)
                this._draw();
        }
    };

    // Loads an a remote image URL as a server-side pixmap.
    ClientUtil.loadImageAsPixmap = function(display, src, callback) {
        var image = new Image();
        image.addEventListener("load", function() {
            var width = image.width;
            var height = image.height;

            var pixmapId = display.createPixmap({ width: width, height: height });
            display.drawTo(pixmapId, function(ctx) {
                ctx.drawImage(image, 0, 0);
            });

            callback(pixmapId);
        });
        image.src = src;
    };

    exports.ClientUtil = ClientUtil;

})(window);

