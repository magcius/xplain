// Contains the demo code for rast1.

(function(exports) {
    "use strict";

    // We use one common representation of colors: 

    // Given bounds [a, b], tell me the "time" of value "v"
    // between those two values, where 0 is a, and 1 is b. 
    function findt(a, b, v) {
        return (v - a) / (b - a);
    }

    // Set a buffer to a specific value.
    function memset(buffer, value, count) {
        while (count--)
            buffer[count] = value; 
    }

    var RastEngine = {};

    RastEngine.newImageData = function(width, height) {
        var imageData = new ImageData(width, height);
        // Fill with white.
        memset(imageData.data, 255, imageData.data.length);
        return imageData;
    };

    // A red/green/blue color triplet, where each is between 0 and 1.
    // The common interface for colors in our engine.
    // Colors are premultiplied.
    RastEngine.newRGBA_Premult = function(r, g, b, a) {
        return { r: r, g: g, b: b, a: a };
    };

    // As a convenience to the specified, we allow specifying
    // colors in unpremultified forms.
    RastEngine.newRGBA = function(r, g, b, a) {
        r *= a; g *= a; b *= a;
        return RastEngine.newRGBA_Premult(r, g, b, a);
    };

    RastEngine.newRGB = function(r, g, b) {
        return RastEngine.newRGBA_Premult(r, g, b, 1);
    };

    // Mix colors "a" and "b" together at time value "t",
    // where 0 is "a" and 1 is "b".
    function mixRGBA(a, b, t) {
        var newR = (a.r * (1.0 - t)) + (b.r * t);
        var newG = (a.g * (1.0 - t)) + (b.g * t);
        var newB = (a.b * (1.0 - t)) + (b.b * t);
        var newA = (a.a * (1.0 - t)) + (b.a * t);
        return RastEngine.newRGBA_Premult(newR, newG, newB, newA);
    }

    // Perform alpha blending of src over dst.
    function blendRGBA(src, dst) {
        var newR = src.r + dst.r * (1 - src.a);
        var newG = src.g + dst.g * (1 - src.a);
        var newB = src.b + dst.b * (1 - src.a);
        var newA = src.a + dst.a * (1 - src.a);
        return RastEngine.newRGBA_Premult(newR, newG, newB, newA);
    }

    function coverageRGBA(src, a) {
        var newR = src.r * a;
        var newG = src.g * a;
        var newB = src.b * a;
        var newA = src.a * a;
        return RastEngine.newRGBA_Premult(newR, newG, newB, newA);
    }

    function blendRGBAIntoImageData(imageData, x, y, rgba) {
        var idx = (y * imageData.width + x) * 4;
        var buffer = imageData.data;
        // ImageData uses premultiplied alpha, so use newRGBA_Premult. 
        var dst = RastEngine.newRGBA_Premult(buffer[idx + 0] / 255, buffer[idx + 1] / 255, buffer[idx + 2] / 255, buffer[idx + 3] / 255);
        // Blend the new color atop the color already in the buffer.
        var out = blendRGBA(rgba, dst);
        // Punt back to the buffer.
        buffer[idx + 0] = out.r * 255;
        buffer[idx + 1] = out.g * 255;
        buffer[idx + 2] = out.b * 255;
        buffer[idx + 3] = out.a * 255;
    }

    RastEngine.newFillStyleSolid = function(rgba) {
        return function(imageData, x, y, coverage) {
            return blendRGBAIntoImageData(imageData, x, y, coverageRGBA(rgba, coverage));
        };
    };

    RastEngine.newGradientStop = function(position, rgba) {
        return { position: position, rgba: rgba };
    };

    // Given a set of stops, and a position "pos" between 0 and 1,
    // evaluate the color at the position using the list of stops.
    function evaluateStopsAtPos(stops, pos) {
        // If we're to the "left" of the first stop, then simply use its
        // color. If we're to the right, use the last color. In this way,
        // the colors at the ends of the gradient extend to the rest of space.
        if (pos <= stops[0].position)
            return stops[0].rgba;
        if (pos >= stops[stops.length - 1].position)
            return stops[stops.length - 1].rgba;

        for (var i = 1; i < stops.length; i++) {
            var stopA = stops[i - 1];
            var stopB = stops[i];

            // If we're between these two stops, then linearly blend
            // between those two colors at the time T between the two positions. 
            if (pos >= stopA.position && pos <= stopB.position) {
                var t = findt(stopA.position, stopB.position, pos);
                return mixRGBA(stopA.rgba, stopB.rgba, t);
            }
        }

        // Should not happen.
        throw new Error("Could not find stop; should not happen");
    }

    // Radial gradients are specified with a center, radius, and set of stops.
    RastEngine.newFillStyleRadialGradient = function(xc, yc, radius, stops) {
        return function(imageData, x, y, coverage) {
            // This is relatively simple. The distance from the center, compared
            // against the overall radius, gives us our position into the stops.
            var dx = x - xc;
            var dy = y - yc;
            var dist = Math.sqrt(dx*dx + dy*dy);
            // How far along is the distance into the range 0-radius?
            var pos = findt(0, radius, dist);
            // Now look up the position against the gradient stops to get a final color.
            var rgba = evaluateStopsAtPos(stops, pos);
            return blendRGBAIntoImageData(imageData, x, y, coverageRGBA(rgba, coverage));
        };
    };

    // You specify a linear gradient by specifying a line to follow,
    // and a series of stops along that line.
    RastEngine.newFillStyleLinearGradient = function(x1, y1, x2, y2, stops) {
        return function(buffer, idx, x, y, coverage) {
            // Basic bit of linear algebra. The gradient is specified along the line
            // x1,y1 - x2,y2. Every line perpendicular to this contains a single color
            // "band" where the color is determined by "how far" we're along the line.
            // We need to figure out which of the color bands the point x,y lies in. 
            // To do this, we set the origin to be x1,y1, giving us gradX/Y and bufX/Y.
            // Then, we project bufX/Y onto gradX/Y. This gives us the magnitude of a
            // vector somewhere between 0,0 and gradX/Y. "How far along" that magnitude
            // is between 0 and gradLength is the "position" into the stops for that
            // gradient.

            // "Set the origin at x1,y1"
            var gradX = x2 - x1;
            var gradY = y2 - y1;
            var bufX = x - x1;
            var bufY = y - y1;

            // Project bufX/Y. Normalize gradX/Y first since we only care about its
            // angle during the projection.
            var gradLength = Math.sqrt(gradX*gradX + gradY*gradY);
            gradX /= gradLength;
            gradY /= gradLength;
            // Now project using the dot product.
            var magnitude = gradX*bufX + gradY*bufY;
            // How far along is magnitude in the range 0-gradLength?
            var pos = findt(0, gradLength, magnitude);
            var rgba = evaluateStopsAtPos(stops, pos);
            return blendRGBAIntoImageData(imageData, x, y, coverageRGBA(rgba, coverage));
        };
    };

/*
    function fillSpanRect(imageData, fillStyle, x1, x2, y, vertCoverage) {
        function fillPixel(x, horzCoverage) {
            if (x < 0) return;
            if (x > imageData.width) return;

            var idx = (y * imageData.width + x) * 4;
            var coverage = horzCoverage * vertCoverage;
            fillStyle(imageData.data, idx, x, y, coverage);
        }

        // Coverage; see below for more details.
        var x1Floor = Math.floor(x1);
        var x1Coverage = 1.0 - (x1 - x1Floor);

        fillPixel(x1Floor, x1Coverage);

        var x2Floor = Math.floor(x2);
        var x2Coverage = x2 - x2Floor;

        for (var x = x1Floor + 1; x < x2Floor; x++)
            fillPixel(x, 1);

        fillPixel(x2Floor, x2Coverage);
    }

    RastEngine.fillRect = function(imageData, fillStyle, x1, y1, width, height) {
        function fillSpan(y, vertCoverage) {
            return fillSpanRect(imageData, fillStyle, x1, x2, y, vertCoverage);
        }

        var x2 = x1 + width;
        var y2 = y1 + height;

        // Compute vertical coverage for the top / bottom spans.
        var y1Floor = Math.floor(y1);
        var y1Coverage = 1.0 - (y1 - y1Floor);

        // The first scanline.
        fillSpan(y1Floor, y1Coverage);

        var y2Floor = Math.floor(y2);
        var y2Coverage = y2 - y2Floor;

        // The middle bits; they all have full vertical coverage.
        for (var y = y1Floor + 1; y < y2Floor; y++)
            fillSpan(y, 1);

        // The last scanline.
        fillSpan(y2Floor, y2Coverage);
    };

    function fillSpanTrap(imageData, fillStyle, x1, x2, y, vertCoverages) {
        function fillPixel(x) {
            if (x < 0) return;
            if (x > imageData.width) return;

            // Compute coverage by this pixel.

            var idx = (y * imageData.width + x) * 4;
            var coverage = horzCoverage * vertCoverage;
            fillStyle(imageData.data, idx, x, y, coverage);
        }

        // Coverage; see below for more details.
        var x1Floor = Math.floor(x1);
        var x1Coverage = 1.0 - (x1 - x1Floor);

        fillPixel(x1Floor, x1Coverage);

        var x2Floor = Math.floor(x2);
        var x2Coverage = x2 - x2Floor;

        for (var x = x1Floor + 1; x < x2Floor; x++)
            fillPixel(x, 1);

        fillPixel(x2Floor, x2Coverage);
    }

    RastEngine.fillTrap = function(imageData, fillStyle, x1y1, x2y1, y1, x1y2, x2y2, y2) {
        function fillSpan(x1, x2, y, vertCoverage) {
            return fillSpanRect(imageData, fillStyle, x1, x2, y, vertCoverage); 
        }

        // Compute vertical coverage for the top / bottom spans.
        var y1Floor = Math.floor(y1);
        var y1Coverage = 1.0 - (y1 - y1Floor);

        var x1Slope = (x1y2 - x1y1) / (y2 - y1);
        var x2Slope = (x2y2 - x2y1) / (y2 - y1);
        var x1 = x1y1, x2 = x2y1;

        var span = {}

        // The first scanline.
        fillSpan(x1y1, x2y1, y1Floor, y1Coverage);
        x1 += x1Slope;
        x2 += x2Slope;

        var y2Floor = Math.floor(y2);
        var y2Coverage = y2 - y2Floor;

        for (var y = y1Floor + 1; y < y2Floor; y++) {
            fillSpan(x1, x2, y, 1);
            x1 += x1Slope;
            x2 += x2Slope;
        }

        // The last scanline.
        fillSpan(x1y2, x2y2, y2Floor, y2Coverage);
    };
*/

    function iterateBBox(x1, y1, x2, y2, callback) {
        for (var y = y1; y < y2; y++)
            for (var x = x1; x < x2; x++)
                callback(x, y);
    }

    function collectCoverage(x1, y1, callback) {
        var coverage = 0;
 
        var subpixelX = 8;
        var subpixelY = 8;

        for (var y = y1; y < y1+1; y += 1/subpixelY)
            for (var x = x1; x < x1+1; x += 1/subpixelX)
                coverage += callback(x, y);

        coverage /= subpixelX * subpixelY;
        return coverage;
    }

    RastEngine.fillRect = function(imageData, fillStyle, x1, y1, width, height) {
        var x2 = x1 + width;
        var y2 = y1 + height;

        function computeCoverage(x, y) {
            if (x < x1) return 0;
            if (y < y1) return 0;
            if (x > x2) return 0;
            if (y > y2) return 0;
            return 1;
        }

        var bboxX1 = Math.floor(x1);
        var bboxY1 = Math.floor(y1);
        var bboxX2 = Math.ceil(x2);
        var bboxY2 = Math.ceil(y2);

        iterateBBox(bboxX1, bboxY1, bboxX2, bboxY2, function(x, y) {
            var coverage = collectCoverage(x, y, computeCoverage);
            fillStyle(imageData, x, y, coverage);
        });
    };

    RastEngine.fillTri = function(imageData, fillStyle, x1, y1, x2, y2, x3, y3) {
        // Returns whether point px,py is on the "right" or "left" of line x1,y1 - x2,y2.
        function edgeFunction(x1, y1, x2, y2, px, py) {
            // Put everything in the space of x1,y1.
            px -= x1; py -= y1; x2 -= x1; y2 -= y1;

            // Use the sign of the determinant of the vector x2,y2 -> px,py relative to
            // origin x1,y1.
            var determinant = (px * y2) - (py * x2);

            // The point is "on the right" of the line if the area is positive. 
            return determinant > 0;
        }

        function computeCoverage(x, y) {
            var inside = (edgeFunction(x1, y1, x2, y2, x, y) &&
                          edgeFunction(x2, y2, x3, y3, x, y) &&
                          edgeFunction(x3, y3, x1, y1, x, y));
            return inside ? 1 : 0;
        }

        var bboxX1 = Math.floor(Math.min(x1, x2, x3));
        var bboxY1 = Math.floor(Math.min(y1, y2, y3));
        var bboxX2 = Math.ceil(Math.max(x1, x2, x3));
        var bboxY2 = Math.ceil(Math.max(y1, y2, y3));

        iterateBBox(bboxX1, bboxY1, bboxX2, bboxY2, function(x, y) {
            var coverage = collectCoverage(x, y, computeCoverage);
            fillStyle(imageData, x, y, coverage);
        });
    };

    exports.RastEngine = RastEngine;

})(window);

(function(exports) {
    "use strict";

    var visibleRAF = CanvasUtil.visibleRAF;

    // XXX: I need better names for these variables.

    // The size of our rasterized buffer.
    var BUFFER_WIDTH = 46, BUFFER_HEIGHT = 46;

    // This rasterized buffer gets rendered so that each "picture element"
    // in it gets a giant 16x16 "cell" for demonstration purposes.
    var CELL_SIZE = 16;

    // As such, the final size of the buffer, rendered on the canvas, is:
    var DISPLAY_WIDTH = BUFFER_WIDTH * CELL_SIZE;
    var DISPLAY_HEIGHT = BUFFER_HEIGHT * CELL_SIZE;

    // The size of our "demo slot" is 800px, which means we need some padding
    // on the left and right sides.
    var DISPLAY_XPAD = (800 - DISPLAY_WIDTH) / 2;
    // We have no padding on top/bottom.
    var DISPLAY_YPAD = 0;

    var STYLE = "height: " + (DISPLAY_HEIGHT + 1) + "px";

    function gridPath(ctx) {
        // Since <canvas> sites pixels on the lines between pixels, as is common,
        // we need a "fudge factor" of 0.5 to get 1px lines to stay sharp. This
        // is a general <canvas> technique, not something specific to us...

        for (var x = DISPLAY_XPAD; x <= DISPLAY_XPAD + DISPLAY_WIDTH; x += CELL_SIZE) {
            ctx.moveTo(x + 0.5, DISPLAY_YPAD);
            ctx.lineTo(x + 0.5, DISPLAY_YPAD + DISPLAY_HEIGHT);
        }

        for (var y = DISPLAY_YPAD; y <= DISPLAY_YPAD + DISPLAY_HEIGHT; y += CELL_SIZE) {
            ctx.moveTo(DISPLAY_XPAD, y + 0.5);
            ctx.lineTo(DISPLAY_XPAD + DISPLAY_WIDTH, y + 0.5);
        }
    }

    function drawGrid(ctx) {
        ctx.beginPath();
        gridPath(ctx);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.stroke();
    }

    function drawImageData(ctx, imageData) {
        // Constructs e.g. "rgb(0, 255, 0)" for the given input.
        function colorStyle(r, g, b) {
            return 'rgb(' + r + ', ' + g + ', ' + b + ')';
        }

        ctx.save();

        var i = 0;
        for (var bufY = 0; bufY < imageData.height; bufY++) {
            for (var bufX = 0; bufX < imageData.width; bufX++) {
                var r = imageData.data[i + 0];
                var g = imageData.data[i + 1];
                var b = imageData.data[i + 2];
                i += 4;

                var dpyX = DISPLAY_XPAD + (bufX * CELL_SIZE); 
                var dpyY = DISPLAY_YPAD + (bufY * CELL_SIZE); 

                ctx.fillStyle = colorStyle(r, g, b);
                ctx.fillRect(dpyX, dpyY, CELL_SIZE, CELL_SIZE);
            }
        }

        ctx.restore();
    }

    function rastDemoDraw(ctx, imageData) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        drawImageData(ctx, imageData);
        drawGrid(ctx);
    }

    ArticleDemos.registerDemo("rast1-grid-demo", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        /*
        function draw(t) {
            var x2 = 22 + Math.cos(t / 1000) * 12;
            var y2 = 7 + Math.sin(t / 1000) * 12;

            var imageData = RastEngine.newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            // var red = RastEngine.newFillStyleSolid(RastEngine.newRGB(1, 0, 0));
            var grad = RastEngine.newFillStyleLinearGradient(
                22, 6, x2, y2,
                [
                    RastEngine.newGradientStop(0, RastEngine.newRGB(1, 0, 0)),
                    RastEngine.newGradientStop(1, RastEngine.newRGB(0, 0, 1)),
                ]
            );
            RastEngine.fillRect(imageData, grad, 1, 1, 44, 12);

            rastDemoDraw(ctx, imageData);
        }
        */

        function draw(t) {
            var x = 6 + Math.cos(t / 500) * 4;
            var y = 6 + Math.sin(t / 500) * 4;

            var green = RastEngine.newFillStyleSolid(RastEngine.newRGB(0, 1, 0));

            var grad = RastEngine.newFillStyleRadialGradient(
                x+12, y+12, 8,
                [
                    RastEngine.newGradientStop(0.0, RastEngine.newRGBA(1, 0, 0, 1)),
                    RastEngine.newGradientStop(1.0, RastEngine.newRGBA(1, 0, 1, .5)),
                ]
            );

            var imageData = RastEngine.newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            RastEngine.fillTri(imageData, grad, x + 12, y, x, y + 20, x + 24, y + 20);
            // RastEngine.fillTrap(imageData, grad, x, x + 12, y, x - 6, x + 18, y + 12);

            rastDemoDraw(ctx, imageData);

            // ctx.strokeRect(DISPLAY_XPAD + x * CELL_SIZE, DISPLAY_YPAD + 1 * CELL_SIZE, 10 * CELL_SIZE, 10 * CELL_SIZE);
        }

        function update(t) {
            draw(t);
        }
        visibleRAF(canvas, update);
        // draw(1);
    });

})(window);
