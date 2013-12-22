// Contains a basic dummy toolkit, along with various utility functions
// that might come in handy when building demos.

(function(exports) {
    "use strict";

    var Util = {};

    // Creates a "rounded" pixman region.
    Util.roundedRectRegion = function(geom, corners) {
        var shapeRegion = new Region();
        shapeRegion.init_rect(0, 0, geom.width, geom.height);

        var cornerRegion = new Region();

        function widthForRadiusSegment(radius, i) {
            var r = radius-i-0.5;
            return (0.5 + radius - Math.sqrt(radius*radius - r*r)) | 0;
        }

        if (corners.topRight) {
            for (var i = 0; i < corners.topLeft; i++) {
                var width = widthForRadiusSegment(corners.topLeft, i);
                cornerRegion.union_rect(cornerRegion, 0, i, width, 1);
            }
        }

        if (corners.topRight) {
            for (var i = 0; i < corners.topRight; i++) {
                var width = widthForRadiusSegment(corners.topRight, i);
                cornerRegion.union_rect(cornerRegion, geom.width - width, i, width, 1);
            }
        }

        if (corners.bottomLeft) {
            for (var i = 0; i < corners.bottomLeft; i++) {
                var width = widthForRadiusSegment(corners.bottomLeft, i);
                cornerRegion.union_rect(cornerRegion, 0, geom.height - i - 1, width, 1);
            }
        }

        if (corners.bottomRight) {
            for (var i = 0; i < corners.bottomRight; i++) {
                var width = widthForRadiusSegment(corners.bottomRight, i);
                cornerRegion.union_rect(cornerRegion, geom.width - width, geom.height - i - 1, width, 1);
            }
        }

        shapeRegion.subtract(shapeRegion, cornerRegion);
        cornerRegion.finalize();

        return shapeRegion;
    };

    // A simple helper object that deals with the more-complicated
    // aspects of Expose event handling, like accumulating an exposed
    // region to redraw, and calling the draw function when we've
    // processed all the Expose events in the current chain.
    var ExposeHandler = new Class({
        initialize: function(drawFn) {
            this._exposedRegion = new Region();
            this._draw = drawFn;
        },
        clip: function(ctx) {
            CanvasUtil.pathFromRegion(ctx, this._exposedRegion);
            ctx.clip();
            ctx.beginPath();
            this._exposedRegion.clear();
        },
        handleExpose: function(event) {
            this._exposedRegion.union_rect(this._exposedRegion, event.x, event.y, event.width, event.height);
            if (event.count == 0)
                this._draw();
        },
    });

    exports.Util = Util;
    exports.ExposeHandler = ExposeHandler;

})(window);
