// Contains various canvas utility methods.

(function(exports) {

    var CanvasUtil = {};

    // Constructs a path on a <canvas>, given a Region.
    CanvasUtil.pathFromRegion = function(ctx, region) {
        region.iter_rectangles(function(x, y, width, height) {
            ctx.rect(x, y, width, height);
        });
    };

    // Workaround for browser bugs in drawImage when the source and
    // destination <canvas> images are the same:
    //
    //   https://bugzilla.mozilla.org/show_bug.cgi?id=842110
    //   https://code.google.com/p/chromium/issues/detail?id=176714
    CanvasUtil.copyArea = function(ctx, srcX, srcY, destX, destY, w, h) {
        if (srcX + w < 0 || srcX > ctx.canvas.width)
            return;

        if (destX + w < 0 || destX > ctx.canvas.width)
            return;

        if (srcY + h < 0 || srcY > ctx.canvas.height)
            return;

        if (destY + h < 0 || destY > ctx.canvas.height)
            return;

        if (destX < 0) {
            w += destX;
            srcX -= destX;
            destX = 0;
        }

        if (srcX < 0) {
            destX -= srcX;
            w += srcX;
            srcX = 0;
        }

        if (destY < 0) {
            h += destY;
            srcY -= destY;
            destY = 0;
        }

        if (srcY < 0) {
            destY -= srcY;
            h += srcY;
            srcY = 0;
        }

        var mX = Math.max(srcX, destX);
        if (mX >= ctx.canvas.width)
            return;

        if (mX + w > ctx.canvas.width)
            w = ctx.canvas.width - mX;

        var mY = Math.max(srcY, destY);
        if (mY >= ctx.canvas.height)
            return;

        if (mY + h > ctx.canvas.height)
            h = ctx.canvas.height - mY;

        ctx.drawImage(ctx.canvas, srcX, srcY, w, h, destX, destY, w, h);
    };

    exports.CanvasUtil = CanvasUtil;

})(window);
