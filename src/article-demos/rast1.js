// Contains the demo code for rast1.

(function(exports) {
    "use strict";

    // Hi there! This code is quite a bit different from what I had in the article,
    // since maintaining numerous "forks" as the article got updated got exhausting.
    // I also wanted to pull various tricks with the visualization and sometimes the
    // simplified code got in the way. That said, every line of code in the article
    // *should* work. Please let me know if it doesn't.

    // -- Rasterizer Engine --

    var BYTES_PER_PIXEL = 4;

    function indexForPixelLocation(imageData, x, y) {
        return (y * imageData.width + x) * BYTES_PER_PIXEL;   
    }

    function pixelLocationForIndex(imageData, idx) {
        var pixelIdx = Math.floor(idx / BYTES_PER_PIXEL);
        var y = Math.floor(pixelIdx / imageData.width);
        var x = pixelIdx % imageData.width;
        return { x: x, y: y };
    }

    function fillPixel(imageData, x, y, rgb) {
        if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height)
            return;

        var idx = indexForPixelLocation(imageData, x, y);
        imageData.data[idx + 0] = rgb.r;
        imageData.data[idx + 1] = rgb.g;
        imageData.data[idx + 2] = rgb.b;
        imageData.data[idx + 3] = 255; // Alpha
    }

    // This code appears in the article, but in an "alpha-less" form at first.
    function newRGB(r, g, b) {
        return { r: r, g: g, b: b, a: 1 };
    }

    function newRGBA(r, g, b, a) {
        return { r: r, g: g, b: b, a: a };
    }

    // "trick" HSL which is based on YUV space.
    // http://www.quasimondo.com/archives/000696.php
    function newHSL(hue, sat, lum) {
        var u = Math.cos(hue) * sat, v = Math.sin(hue) * sat;
        var r = lum + 1.139837 * v;
        var g = lum - 0.394651 * u - 0.580598 * v;
        var b = lum + 2.032110 * u;
        return newRGB(r * 255, g * 255, b * 255);
    }

    function lerp(a, b, t) {
        return (a * (1.0 - t)) + (b * t);
    }

    // Lerps between colors "color1" and "color2".
    function lerpRGBA(color1, color2, t) {
        var newR = lerp(color1.r, color2.r, t);
        var newG = lerp(color1.g, color2.g, t);
        var newB = lerp(color1.b, color2.b, t);
        var newA = lerp(color1.a, color2.a, t);
        return newRGBA(newR, newG, newB, newA);
    }

    // "Inverse lerp".
    // Given bounds [a, b], tell me the "time" of value "v"
    // between those two values, where 0 is a, and 1 is b. 
    function inverseLerp(a, b, v) {
        return (v - a) / (b - a);
    }

    // https://en.wikipedia.org/wiki/Smoothstep
    function smoothstep(t) {
        return t*t*(3 - t*2);
    }

    function getPixel(imageData, x, y) {
        var idx = indexForPixelLocation(imageData, x, y);
        return newRGB(imageData.data[idx + 0], imageData.data[idx + 1], imageData.data[idx + 2]);
    }

    function blendPixel(imageData, x, y, src) {
        // Construct an RGB of the pixel grid ("destination") for our lerp.
        var dst = getPixel(imageData, x, y);
        // Lerp using the src's alpha to blend.
        var blended = lerpRGBA(dst, src, src.a);
        fillPixel(imageData, x, y, blended);
    }

    function newSolidFill(rgba) {
        return function(x, y) {
            return rgba;
        }
    }

    // Complete gradient code featuring multiple stops. Will be expanded on in the next article.
    function newGradientStop(position, rgba) {
        return { position: position, rgba: rgba };
    };

    // Given a set of stops, and a position "pos" between 0 and 1,
    // evaluate the color at the position using the list of stops.
    function evaluateStopsAtPos(stops, pos) {
        // If pos is out of bounds, repeat the gradient.
        if (pos < 0)
            pos = 1 + (pos % 1);
        if (pos > 1)
            pos = pos % 1;

        // If we're to the "left" of the first stop, then simply use its
        // color. If we're to the right, use the last color. In this way,
        // the colors at the ends of the gradient extend to all of [0, 1].
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
                var t = inverseLerp(stopA.position, stopB.position, pos);
                return lerpRGBA(stopA.rgba, stopB.rgba, t);
            }
        }

        // Should not happen.
        throw new Error("Could not find stop; should not happen");
    }

    // Radial gradients are specified with a center, radius, and set of stops.
    function newRadialGradientFull(xc, yc, radius, stops) {
        return function(x, y) {
            // This is relatively simple. The distance from the center, compared
            // against the overall radius, gives us our position into the stops.
            var dx = x - xc;
            var dy = y - yc;
            var dist = Math.sqrt(dx*dx + dy*dy);
            // How far along is the distance into the range 0-radius?
            var pos = inverseLerp(0, radius, dist);
            // Now look up the position against the gradient stops to get a final color.
            var rgba = evaluateStopsAtPos(stops, pos);
            return rgba;
        };
    };

    // Simple form.
    function newRadialGradient(centerX, centerY, radius, centerRGB, edgeRGB) {
        return function(x, y) {
            // Calculate distance from the center point.
            var distX = x - centerX, distY = y - centerY;
            var distance = Math.sqrt(distX*distX + distY*distY);

            // If we're outside the circle, then just return the color at the edge.
            // This is a choice -- we could instead choose to repeat or ping-pong
            // between the colors.
            if (distance >= radius)
                return edgeRGB;

            // Translate the [0, radius] ranged value to a [0, 1] ranged value
            // so we can lerp the colors.
            var t = distance / radius;
            return lerpRGBA(centerRGB, edgeRGB, t);
        };
    }

    // You specify a linear gradient by specifying a line to follow,
    // and a series of stops along that line.
    function newLinearGradient(x1, y1, x2, y2, stops) {
        return function(x, y) {
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
            var pos = inverseLerp(0, gradLength, magnitude);
            var rgba = evaluateStopsAtPos(stops, pos);
            return rgba;
        };
    };

    // The actual code's shape drawing is a lot less "scatterbrained". The code in
    // the article should work 100% (an earlier version of this code was copied directly)
    // but to help make this source file more readable and less copy/paste-y, I've
    // decided to use a completely coverage-sampled engine from the start.
    //
    // The differences between the different "pixel center" variants is in our coverage
    // collection callbacks. AA on or off is how many subpixels we drive the coverage
    // collector with.

    function iterBoundingBox(x1, y1, x2, y2, callback) {
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        x2 = Math.ceil(x2);
        y2 = Math.ceil(y2);

        for (var y = y1; y < y2; y++) {
            for (var x = x1; x < x2; x++) {
                callback(x, y);
            }
        }
    }

    // This is equivalent to the "inner" loop in our AA fillCircle function.
    function collectCoverage(x1, y1, callback, numSubpixels, bias) {
        bias = bias !== undefined ? bias : true;

        // Antialias by default.
        numSubpixels = numSubpixels !== undefined ? numSubpixels : 8;
        var numSubpixelsX = numSubpixels;
        var numSubpixelsY = numSubpixels;

        var coverage = 0;
        for (var subpixelY = 0; subpixelY < numSubpixelsY; subpixelY++) {
            for (var subpixelX = 0; subpixelX < numSubpixelsX; subpixelX++) {
                // Sample the center of the subpixel.

                // We initially run this code in "no-bias mode" to demonstrate what a
                // very naive sampler would do.
                var sampleX, sampleY;
                if (bias) {
                    sampleX = x1 + (subpixelX + 0.5) / numSubpixelsX;
                    sampleY = y1 + (subpixelY + 0.5) / numSubpixelsY;
                } else {
                    sampleX = x1 + (subpixelX) / numSubpixelsX;
                    sampleY = y1 + (subpixelY) / numSubpixelsY;
                }

                coverage += callback(sampleX, sampleY);
            }
        }
        coverage /= numSubpixelsX * numSubpixelsY;

        return coverage;
    }

    // Generic helper function to help us fill in the fillStyle based on coverage.
    function fillCoverage(imageData, fillStyle, x, y, coverage) {
        // Quick optimization to prevent us from computing the fillStyle.
        if (coverage === 0)
           return;

        var rgba = fillStyle(x, y, coverage);
        rgba = newRGBA(rgba.r, rgba.g, rgba.b, rgba.a * coverage);
        blendPixel(imageData, x, y, rgba);
    }

    function fillRectangle(imageData, fillStyle, x1, y1, width, height, aa) {
        var x2 = x1 + width;
        var y2 = y1 + height;

        function rectangleCoverage(sampleX, sampleY) {
            // Why do I use <= instead of <= in one dimension? Because otherwise
            // two rectangles right up snug against each other wouldn't have the
            // edge they share filled. This is known as a "fill rule". Since we
            // fill the left edge and the top edge but not the bottom or right
            // ones, this means we're using a "top left" fill rule.

            if (sampleX <= x1) return 0;
            if (sampleX >  x2) return 0;
            if (sampleY <= y1) return 0;
            if (sampleY >  y2) return 0;
            return 1;
        }

        iterBoundingBox(x1, y1, x2, y2, function(x, y) {
            var coverage = collectCoverage(x, y, rectangleCoverage, aa ? 4 : 1);
            return fillCoverage(imageData, fillStyle, x, y, coverage);
        });
    }

    function fillCircle(imageData, fillStyle, centerX, centerY, radius, aa, bias) {
        function circleCoverage(sampleX, sampleY) {
            var distX = (sampleX - centerX), distY = (sampleY - centerY);
            var distance = Math.sqrt(distX*distX + distY*distY);
            return (distance <= radius) ? 1 : 0;
        }

        var x1 = centerX - radius, y1 = centerY - radius;
        var x2 = centerX + radius, y2 = centerY + radius;
        iterBoundingBox(x1, y1, x2, y2, function(x, y) {
            var coverage = collectCoverage(x, y, circleCoverage, aa ? 4 : 1, bias);
            return fillCoverage(imageData, fillStyle, x, y, coverage);
        });
    }

    function fillTri(imageData, fillStyle, x1, y1, x2, y2, x3, y3) {
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

        function triangleCoverage(x, y) {
            var inside = (edgeFunction(x1, y1, x2, y2, x, y) &&
                          edgeFunction(x2, y2, x3, y3, x, y) &&
                          edgeFunction(x3, y3, x1, y1, x, y));
            return inside ? 1 : 0;
        }

        var bboxX1 = Math.min(x1, x2, x3);
        var bboxY1 = Math.min(y1, y2, y3);
        var bboxX2 = Math.max(x1, x2, x3);
        var bboxY2 = Math.max(y1, y2, y3);

        iterBoundingBox(bboxX1, bboxY1, bboxX2, bboxY2, function(x, y) {
            var coverage = collectCoverage(x, y, triangleCoverage);
            return fillCoverage(imageData, fillStyle, x, y, coverage);
        });
    };

    // -- Demo Setup --

    var visibleRAF = CanvasUtil.visibleRAF;

    // Set a buffer to a specific value.
    function memset(buffer, value, count) {
        while (count--)
            buffer[count] = value; 
    }

    function newImageData(width, height) {
        var imageData = new ImageData(width, height);
        // Fill with white.
        memset(imageData.data, 255, imageData.data.length);
        return imageData;
    }

    // XXX: I need better names for these variables.

    // The size of our rasterized buffer.
    var BUFFER_WIDTH = 46, BUFFER_HEIGHT = 10;

    // This rasterized buffer gets rendered so that each "picture element"
    // in it gets a giant 16x16 "cell" for demonstration purposes.
    var CELL_SIZE = 16;

    var DISPLAY_YPAD = 2;

    // As such, the final size of the buffer, rendered on the canvas, is:
    var DISPLAY_WIDTH = BUFFER_WIDTH * CELL_SIZE;
    var DISPLAY_HEIGHT = BUFFER_HEIGHT * CELL_SIZE + DISPLAY_YPAD * 2;

    // The size of our "demo slot" is 800px, which means we need some padding
    // on the left and right sides.
    var DISPLAY_XPAD = (800 - DISPLAY_WIDTH) / 2;

    var STYLE = "height: " + (DISPLAY_HEIGHT + 1) + "px";

    // -- Demo Utilities --

    function bufferToDisplay(p) {
        p.x = p.x * CELL_SIZE + DISPLAY_XPAD;
        p.y = p.y * CELL_SIZE + DISPLAY_YPAD;
    }

    function displayToBuffer(p) {
        p.x = (p.x - DISPLAY_XPAD) / CELL_SIZE;
        p.y = (p.y - DISPLAY_YPAD) / CELL_SIZE;
    }

    // Path out a grid of strokes drawing a grid.
    function gridPath(ctx, width, height) {
        for (var x = 0; x <= width; x++) {
            var start = { x: x, y: 0 }, end = { x: x, y: height };
            bufferToDisplay(start); bufferToDisplay(end);
            // See article for why these 0.5s are here!
            ctx.moveTo(start.x + 0.5, start.y);
            ctx.lineTo(end.x + 0.5, end.y);
        }

        for (var y = 0; y <= height; y++) {
            var start = { x: 0, y: y }, end = { x: width, y: y };
            bufferToDisplay(start); bufferToDisplay(end);
            ctx.moveTo(start.x, start.y + 0.5);
            ctx.lineTo(end.x, end.y + 0.5);
        }
    }

    function drawGrid(ctx, width, height) {
        width = width !== undefined ? width : BUFFER_WIDTH;
        height = height !== undefined ? height : BUFFER_HEIGHT;
        ctx.beginPath();
        gridPath(ctx, width, height);
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

                var pos = { x: bufX, y: bufY };
                bufferToDisplay(pos);
                ctx.fillStyle = colorStyle(r, g, b);
                ctx.fillRect(pos.x, pos.y, CELL_SIZE, CELL_SIZE);
            }
        }

        ctx.restore();
    }

    // Draw an imageData to our "zoomed-in" demo, along with a grid.
    function rastDemoDraw(ctx, imageData) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        drawImageData(ctx, imageData);
        drawGrid(ctx);
    }

    function drawSamplePoint(ctx, x, y, hasContents) {
        var ctxX = DISPLAY_XPAD + (x * CELL_SIZE) + 0.5;
        var ctxY = DISPLAY_YPAD + (y * CELL_SIZE) + 0.5;

        ctx.save();
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(ctxX, ctxY, 2, 0, Math.PI * 2);

        if (hasContents) {
            ctx.fillStyle = 'rgba(255, 200, 0, 1)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    // Helper function which draws the little "sample dots" that indicate
    // when a sample is filled or not. Scans an imageData to determine coverage.
    function scanAndDrawSamples(ctx, imageData, x1, y1, x2, y2, pixOffs) {
        for (var y = y1; y < y2; y++) {
            for (var x = x1; x < x2; x++) {
                var idx = indexForPixelLocation(imageData, x, y);
                var hasContents = (imageData.data[idx + 0] < 255 &&
                                   imageData.data[idx + 1] < 255 && 
                                   imageData.data[idx + 2] < 255);
                var pX = x + (pixOffs ? 0.5 : 0);
                var pY = y + (pixOffs ? 0.5 : 0);
                drawSamplePoint(ctx, pX, pY, hasContents);
            }
        }
    }

    function drawCoverageBlankGrid(ctx, x1, y1, x2, y2, pixOffs) {
        for (var y = y1; y < y2; y++) {
            for (var x = x1; x < x2; x++) {
                var pX = x + (pixOffs ? 0.5 : 0);
                var pY = y + (pixOffs ? 0.5 : 0);
                drawSamplePoint(ctx, pX, pY, false);
            }
        }
    }

    function drawCoverageSamplesFillStyle(ctx, pixOffs) {
        return function(x, y, coverage) {
            if (coverage === 0)
                return;

            var pX = x + (pixOffs ? 0.5 : 0);
            var pY = y + (pixOffs ? 0.5 : 0);
            drawSamplePoint(ctx, pX, pY, true);
            return newRGBA(0, 0, 0, 0);
        };
    }

    // XXX: Should not be called when I'm done here!
    function demoMissing(ctx) {
        var canvas = ctx.canvas;

        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = '72px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillText("DEMO MISSING", canvas.width/2, canvas.height/2);
    }

    // -- Demos! --

    ArticleDemos.registerDemo("rast1-demo", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var TAU = Math.PI * 2;
            var tcx = 7, tcy = 5 + Math.cos(t / 1600) * 2;
            var tsz = Math.cos(t / 600) * 2 + 8;
            var t1x = Math.cos((t / 600) - 0/3 * TAU) * tsz + tcx;
            var t1y = Math.sin((t / 600) - 0/3 * TAU) * tsz + tcy;
            var t2x = Math.cos((t / 600) - 1/3 * TAU) * tsz + tcx;
            var t2y = Math.sin((t / 600) - 1/3 * TAU) * tsz + tcy;
            var t3x = Math.cos((t / 600) - 2/3 * TAU) * tsz + tcx;
            var t3y = Math.sin((t / 600) - 2/3 * TAU) * tsz + tcy;
            var tricolor = newSolidFill(newHSL(t / 1000, .3, .4));
            fillTri(imageData, tricolor, t1x, t1y, t2x, t2y, t3x, t3y);

            var cx = 23 + Math.cos(t / 700) * 20;
            var cy = 5;
            var sz = Math.cos(t / 430) * 2 + 5;
            var grad1 = newRadialGradient(cx - 0.5, cy - 0.5, sz, newRGBA(0, 0, 255, 0), newRGBA(0, 0, 255, 1));
            fillCircle(imageData, grad1, cx, cy, sz, true, true);

            var grad2t = -(t / 100) % 30;
            var grad2 = newLinearGradient(1, grad2t - 30, 2, grad2t, [
                newGradientStop(0.0, newRGBA(255, 0, 0, 0.8)),
                newGradientStop(0.2, newRGBA(255, 255, 0, 0.8)),
                newGradientStop(0.4, newRGBA(0, 255, 0, 0.8)),
                newGradientStop(0.6, newRGBA(0, 255, 255, 0.8)),
                newGradientStop(0.8, newRGBA(0, 0, 255, 0.8)),
                newGradientStop(0.9, newRGBA(255, 0, 255, 0.8)),
                newGradientStop(1.0, newRGBA(255, 0, 0, 0.8)),
            ]);
            var rx = 22 + Math.cos(t / 1200) * 3;
            var rw = 12 + Math.sin(t / 800) * 8;
            fillRectangle(imageData, grad2, rx, 1, rw, 8, true);

            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, draw);
    });

    var SamplerControl = new Class({
        initialize: function(canvas, boxSize, width, height) {
            this._boxSize = boxSize;
            this._width = width;
            this._height = height;
            this._canvas = canvas;
            this._canvas.addEventListener('mousemove', this._onCanvasMouseMove.bind(this));
            this._canvas.addEventListener('mouseout', this._onCanvasMouseOut.bind(this));
            this._canvas.addEventListener('click', this._onCanvasClick.bind(this));

            this._selectedBox = null;
            this._hoverBox = null;
        },

        getActiveBox: function() {
            return this._selectedBox !== null ? this._selectedBox : this._hoverBox;
        },

        _onCanvasMouseMove: function(e) {
            var pos = { x: e.offsetX, y: e.offsetY };
            displayToBuffer(pos);

            var boxSize = this._boxSize;
            var x1 = Math.round(Math.min(Math.max(pos.x - boxSize / 2, 0), this._width - boxSize));
            var y1 = Math.round(Math.min(Math.max(pos.y - boxSize / 2, 0), this._height - boxSize));

            this._hoverBox = { x1: x1, y1: y1, x2: x1 + boxSize, y2: y1 + boxSize };
        },

        _onCanvasMouseOut: function(e) {
            this._hoverBox = null;
        },

        _onCanvasClick: function(e) {
            e.preventDefault();

            if (this._selectedBox && this._hoverBox.x1 === this._selectedBox.x1 && this._hoverBox.y1 === this._selectedBox.y1) {
                this._selectedBox = null;
            } else {
                this._selectedBox = this._hoverBox;
            }
        },

        draw: function() {
            var ctx = this._canvas.getContext('2d');
            ctx.save();

            function transformBox(box) {
                var boxSize = box.size;
                var tl = { x: box.x1, y: box.y1 };
                var br = { x: box.x2, y: box.y2 };
                bufferToDisplay(tl);
                bufferToDisplay(br);
                return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
            }

            if (this._hoverBox) {
                ctx.strokeStyle = this._selectedBox ? '#666666' : '#000000';
                ctx.lineWidth = 2;
                var h = transformBox(this._hoverBox);
                ctx.strokeRect(h.x + 1, h.y + 1, h.w - 1, h.h - 1);
            }

            if (this._selectedBox) {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                var s = transformBox(this._selectedBox);
                ctx.strokeRect(s.x - 1, s.y - 1, s.w + 3, s.h + 3);
            }

            ctx.restore();
        },
    });

    ArticleDemos.registerDemo("rast1-imagedata-pixel-format", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var samplerControl = new SamplerControl(canvas, 2, 10, 10);

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var TAU = Math.PI * 2;
            var tcx = 7, tcy = 5 + Math.cos(t / 1600) * 2;
            var tsz = Math.cos(t / 600) * 2 + 8;
            var t1x = Math.cos((t / 600) - 0/3 * TAU) * tsz + tcx;
            var t1y = Math.sin((t / 600) - 0/3 * TAU) * tsz + tcy;
            var t2x = Math.cos((t / 600) - 1/3 * TAU) * tsz + tcx;
            var t2y = Math.sin((t / 600) - 1/3 * TAU) * tsz + tcy;
            var t3x = Math.cos((t / 600) - 2/3 * TAU) * tsz + tcx;
            var t3y = Math.sin((t / 600) - 2/3 * TAU) * tsz + tcy;
            var tricolor = newSolidFill(newHSL(t / 1000, .3, .4));
            fillTri(imageData, tricolor, t1x, t1y, t2x, t2y, t3x, t3y);

            var cx = 23 + Math.cos(t / 700) * 20;
            var cy = 5;
            var sz = Math.cos(t / 430) * 2 + 5;
            var grad1 = newRadialGradient(cx - 0.5, cy - 0.5, sz, newRGBA(0, 0, 255, 0), newRGBA(0, 0, 255, 1));
            fillCircle(imageData, grad1, cx, cy, sz, true, true);

            var grad2t = -(t / 100) % 30;
            var grad2 = newLinearGradient(1, grad2t - 30, 2, grad2t, [
                newGradientStop(0.0, newRGBA(255, 0, 0, 0.8)),
                newGradientStop(0.2, newRGBA(255, 255, 0, 0.8)),
                newGradientStop(0.4, newRGBA(0, 255, 0, 0.8)),
                newGradientStop(0.6, newRGBA(0, 255, 255, 0.8)),
                newGradientStop(0.8, newRGBA(0, 0, 255, 0.8)),
                newGradientStop(0.9, newRGBA(255, 0, 255, 0.8)),
                newGradientStop(1.0, newRGBA(255, 0, 0, 0.8)),
            ]);
            var rx = 22 + Math.cos(t / 1200) * 3;
            var rw = 12 + Math.sin(t / 800) * 8;
            fillRectangle(imageData, grad2, rx, 1, rw, 8, true);

            rastDemoDraw(ctx, imageData);
        }

        /*
        function draw(t) {
            var imageData = newImageData(10, 10);

            var fillStyle = newSolidFill(newHSL(t / 1000, 0.7, 0.5));
            fillRectangle(imageData, fillStyle, 1, 1, 8, 8);

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            drawImageData(ctx, imageData);
            drawGrid(ctx, 10, 10);

            samplerControl.draw();

            function drawPixelDetail(x, y, rgb) {
                var w = CELL_SIZE;
                var h = CELL_SIZE * 2;
                var pad = 2;
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';

                var dx = x;
                ctx.beginPath();
                ctx.fillStyle = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
                ctx.rect(dx + 0.5, y + 0.5, h, h);
                ctx.fill();
                ctx.stroke();
                dx += h + w;

                ctx.beginPath();
                ctx.fillStyle = 'rgb(' + rgb.r + ', 0, 0)';
                ctx.rect(dx + 0.5, y + 0.5, w, h);
                ctx.fill();
                ctx.stroke();
                dx += w + pad;

                ctx.beginPath();
                ctx.fillStyle = 'rgb(0, ' + rgb.g + ', 0)';
                ctx.rect(dx + 0.5, y + 0.5, w, h);
                ctx.fill();
                ctx.stroke();
                dx += w + pad;

                ctx.beginPath();
                ctx.fillStyle = 'rgb(0, 0, ' + rgb.b + ')';
                ctx.rect(dx + 0.5, y + 0.5, w, h);
                ctx.fill();
                ctx.stroke();
                dx += w + pad;
            }

            // Axes.
            var axesX = imageData.width * CELL_SIZE + DISPLAY_XPAD * 2;
            var axesY = DISPLAY_YPAD;
            var axesWidth = 400;
            var axesHeight = imageData.height * CELL_SIZE;

            ctx.beginPath();
            ctx.lineTo(axesX + 0.5, axesY + axesHeight - 3);
            ctx.lineTo(axesX + 0.5, axesY + 0.5);
            ctx.lineTo(axesX + axesWidth - 3, axesY + 0.5);
            ctx.strokeStyle = '#aaaaaa';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Axes arrows.
            // Y
            ctx.fillStyle = '#aaaaaa';

            var arrowWidth = 3, arrowHeight = 10;
            ctx.beginPath();
            ctx.lineTo(axesX + 0.5, axesY + axesHeight);
            ctx.lineTo(axesX + 0.5 - arrowWidth, axesY + axesHeight - arrowHeight);
            ctx.lineTo(axesX + 0.5 + arrowWidth, axesY + axesHeight - arrowHeight);
            ctx.fill();

            // X
            ctx.beginPath();
            ctx.lineTo(axesX + axesWidth,               axesY + 0.5);
            ctx.lineTo(axesX + axesWidth - arrowHeight, axesY + 0.5 + arrowWidth);
            ctx.lineTo(axesX + axesWidth - arrowHeight, axesY + 0.5 - arrowWidth);
            ctx.fill();

            var box = samplerControl.getActiveBox();
            if (box) {
                for (var y = box.y1; y < box.y2; y++) {
                    for (var x = box.x1; x < box.x2; x++) {
                        var rgb = getPixel(imageData, x, y);
                        var dy = y - box.y1, dx = x - box.x1;
                        drawPixelDetail(axesX + (dx * 180) + 32, axesY + (dy * 80) + 24, rgb);
                    }
                }
            }
        }
        */

        visibleRAF(canvas, draw);
    });

    ArticleDemos.registerDemo("rast1-fillrect-basic", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        // The simplest rasterizer that can only write black pixels.

        function fillPixel(imageData, x, y) {
            var idx = indexForPixelLocation(imageData, x, y);
            imageData.data[idx + 0] = 0; // Red
            imageData.data[idx + 1] = 0; // Green
            imageData.data[idx + 2] = 0; // Blue
            imageData.data[idx + 3] = 255; // Alpha
        }

        function fillRectangle(imageData, x1, y1, width, height) {
            for (var y = y1; y < y1 + height; y++)
                for (var x = x1; x < x1 + width; x++)
                    fillPixel(imageData, x, y);
        }

        function update(t) {
            var x = 20 + Math.floor(Math.cos(t / 500) * 16);
            var y = 1;

            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            fillRectangle(imageData, x, y, 8, 8);
            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, update);
    });

    ArticleDemos.registerDemo("rast1-fillrect-lerp", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(imageData, secs) {
            var startX = 1;
            var endX = 38;
            var x = Math.floor(lerp(startX, endX, secs));
            var y = 1;
            var black = newSolidFill(newRGB(0, 0, 0));
            fillRectangle(imageData, black, x, y, 8, 8);
        }

        function update(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            draw(imageData, (t / 1000) % 1);
            rastDemoDraw(ctx, imageData);
        }
        visibleRAF(canvas, update);
    });

    ArticleDemos.registerDemo("rast1-fillrect-lerp-smoothstep", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(imageData, secs) {
            var startX = 1;
            var endX = 38;
            var smoothSecs = smoothstep(secs);
            var x = Math.floor(lerp(startX, endX, smoothSecs));
            var y = 1;
            var black = newSolidFill(newRGB(0, 0, 0));
            fillRectangle(imageData, black, x, y, 8, 8);
        }

        function update(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            draw(imageData, (t / 2000) % 1);
            rastDemoDraw(ctx, imageData);
        }
        visibleRAF(canvas, update);
    });

    ArticleDemos.registerDemo("rast1-lerp-gradient", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(imageData) {
            var startX = 1;
            var endX = BUFFER_WIDTH - 1;

            var red = newRGB(255, 0, 0);
            var blue = newRGB(0, 0, 255);
            for (var x = startX; x < endX; x++) {
                var t = (x - startX) / (endX - startX);
                var rgb = newSolidFill(lerpRGBA(red, blue, t));
                fillRectangle(imageData, rgb, x, 1, 1, BUFFER_HEIGHT - 2);
            }
        }

        var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
        draw(imageData);
        rastDemoDraw(ctx, imageData);
    });

    ArticleDemos.registerDemo("rast1-gradients", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var x = 20 + Math.floor(Math.cos(t / 500) * 16);
            var y = 1;
            var grad = newRadialGradient(x + 4, y + 4, 6, newRGB(255, 0, 0), newRGB(0, 0, 255));
            fillRectangle(imageData, grad, x, y, 8, 8, false);

            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, draw);
    });

    ArticleDemos.registerDemo("rast1-circle", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var y = 5;
            var green = newSolidFill(newRGB(0, 180, 0));
            fillCircle(imageData, green, x, y, 4, false, false);

            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, draw);
    });

    ArticleDemos.registerDemo("rast1-circle-overlay", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var y = 5;
            var green = newSolidFill(newRGB(0, 180, 0));
            fillCircle(imageData, green, x, y, 4, false, false);

            rastDemoDraw(ctx, imageData);

            // Draw coverage visualization.
            drawCoverageBlankGrid(ctx, 1, 1, imageData.width, imageData.height, false);
            var coverageStyle = drawCoverageSamplesFillStyle(ctx, false);
            fillCircle(imageData, coverageStyle, x, y, 4, false, false);

            // Draw the circle over it.
            ctx.save();
            var ctxX = DISPLAY_XPAD + x * CELL_SIZE; 
            var ctxY = DISPLAY_YPAD + y * CELL_SIZE; 
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(ctxX, ctxY, 4 * CELL_SIZE, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        visibleRAF(canvas, draw);
    });

    // Same demo as above but uses the biased coverage sampler to correctly sample pixel centers.
    ArticleDemos.registerDemo("rast1-circle-overlay-fixed", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var y = 5;
            var green = newSolidFill(newRGB(0, 180, 0));
            fillCircle(imageData, green, x, y, 4, false, true);

            rastDemoDraw(ctx, imageData);

            drawCoverageBlankGrid(ctx, 0, 0, imageData.width, imageData.height, true);
            var coverageStyle = drawCoverageSamplesFillStyle(ctx, true);
            fillCircle(imageData, coverageStyle, x, y, 4, false, false);

            ctx.save();
            var ctxX = DISPLAY_XPAD + x * CELL_SIZE; 
            var ctxY = DISPLAY_YPAD + y * CELL_SIZE; 
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(ctxX, ctxY, 4 * CELL_SIZE, 0, Math.PI * 2);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        }

        visibleRAF(canvas, draw);
    });

    ArticleDemos.registerDemo("rast1-circle-simple-alpha", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var c1x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var c1y = 4;
            var red = newSolidFill(newRGBA(180, 0, 0, 0.7));
            fillCircle(imageData, red, c1x, c1y, 4, false, true);

            var c2x = 26 + Math.floor(Math.cos(t / 370) * 14);
            var c2y = 6;
            var blue = newSolidFill(newRGBA(0, 0, 180, 0.7));
            fillCircle(imageData, blue, c2x, c2y, 3, false, true);

            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, draw);
    });

    ArticleDemos.registerDemo("rast1-circle-aa", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var y = 5;

            var green = newSolidFill(newRGBA(0, 180, 0, 1));
            fillCircle(imageData, green, x, y, 4, true, true);
            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, draw);
    });

    ArticleDemos.registerDemo("rast1-circle-aa-smooth", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var viz = new SamplerControl(canvas);

        function draw(t) {
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);

            var x = 23 + Math.cos(t / 500) * 16;
            var y = 5;

            var green = newSolidFill(newRGBA(0, 180, 0, 1));
            fillCircle(imageData, green, x, y, 4, true, true);
            rastDemoDraw(ctx, imageData);

            viz.setBuffer(imageData);
            viz.draw();
        }

        visibleRAF(canvas, draw);
    });

})(window);
