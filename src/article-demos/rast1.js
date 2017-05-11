// Contains the demo code for rast1.

(function(exports) {
    "use strict";

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

    // As such, the final size of the buffer, rendered on the canvas, is:
    var DISPLAY_WIDTH = BUFFER_WIDTH * CELL_SIZE;
    var DISPLAY_HEIGHT = BUFFER_HEIGHT * CELL_SIZE;

    // The size of our "demo slot" is 800px, which means we need some padding
    // on the left and right sides.
    var DISPLAY_XPAD = (800 - DISPLAY_WIDTH) / 2;
    // We have no padding on top/bottom.
    var DISPLAY_YPAD = 0;

    var STYLE = "height: " + (DISPLAY_HEIGHT + 1) + "px";

    var BYTES_PER_PIXEL = 4;

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

    ArticleDemos.registerDemo("rast1-grid-demo", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');
        demoMissing(ctx);
    });

    ArticleDemos.registerDemo("rast1-imagedata-pixel-format", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');
        demoMissing(ctx);
    });

    ArticleDemos.registerDemo("rast1-fillrect-basic", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        // !! EMBEDDED IN ARTICLE <<
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
        // >> EMBEDDED IN ARTICLE !!

        var x = 1;
        var y = 1;

        var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
        fillRectangle(imageData, x, y, 8, 8);
        rastDemoDraw(ctx, imageData);
    });

    ArticleDemos.registerDemo("rast1-fillrect-lerp", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

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

        // !! EMBEDDED IN ARTICLE <<
function lerp(a, b, t) {
    return (a * (1.0 - t)) + (b * t);
}

function draw(imageData, secs) {
    var startX = 1;
    var endX = 38;
    var x = Math.floor(lerp(startX, endX, secs));
    var y = 1;
    fillRectangle(imageData, x, y, 8, 8);
}
        // >> EMBEDDED IN ARTICLE !!

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

        // !! EMBEDDED IN ARTICLE <<
function lerp(a, b, t) {
    return (a * (1.0 - t)) + (b * t);
}

function smoothstep(t) {
    return t*t*(3 - t*2);
}

function draw(imageData, secs) {
    var startX = 1;
    var endX = 38;
    var smoothSecs = smoothstep(secs);
    var x = Math.floor(lerp(startX, endX, smoothSecs));
    var y = 1;
    fillRectangle(imageData, x, y, 8, 8);
}
        // >> EMBEDDED IN ARTICLE !!

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

        function lerp(a, b, t) {
            return (a * (1.0 - t)) + (b * t);
        }

        function newRGB(r, g, b) {
            return { r: r, g: g, b: b };
        }

        function lerpRGB(color1, color2, t) {
            var newR = lerp(color1.r, color2.r, t);
            var newG = lerp(color1.g, color2.g, t);
            var newB = lerp(color1.b, color2.b, t);
            return newRGB(newR, newG, newB);
        }

        // !! EMBEDDED IN ARTICLE <<
function fillPixel(imageData, x, y, rgb) {
    var idx = indexForPixelLocation(imageData, x, y);
    imageData.data[idx + 0] = rgb.r;
    imageData.data[idx + 1] = rgb.g;
    imageData.data[idx + 2] = rgb.b;
    imageData.data[idx + 3] = 255; // Alpha
}

function fillRectangle(imageData, rgb, x1, y1, width, height) {
    for (var y = y1; y < y1 + height; y++)
        for (var x = x1; x < x1 + width; x++)
            fillPixel(imageData, x, y, rgb);
}

function draw(imageData) {
    var startX = 1;
    var endX = BUFFER_WIDTH - 1;

    var red = newRGB(255, 0, 0);
    var blue = newRGB(0, 0, 255);
    for (var x = startX; x < endX; x++) {
        var t = (x - startX) / (endX - startX);
        var rgb = lerpRGB(red, blue, t);
        fillRectangle(imageData, rgb, x, 1, 1, BUFFER_HEIGHT - 2);
    }
}
        // >> EMBEDDED IN ARTICLE !!

        var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
        draw(imageData);
        rastDemoDraw(ctx, imageData);
    });

(function() {
function lerp(a, b, t) {
    return (a * (1.0 - t)) + (b * t);
}

// !! EMBEDDED IN ARTICLE <<
function newRGB(r, g, b) {
    return { r: r, g: g, b: b };
}

function lerpRGB(color1, color2, t) {
    var newR = lerp(color1.r, color2.r, t);
    var newG = lerp(color1.g, color2.g, t);
    var newB = lerp(color1.b, color2.b, t);
    return newRGB(newR, newG, newB);
}

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
        // so we can mix the colors.
        var t = distance / radius;
        return lerpRGB(centerRGB, edgeRGB, t);
    };
}

// The same code as above, but slightly adapted to handle fill styles
// and custom colors.
function fillPixel(imageData, x, y, rgb) {
    var idx = indexForPixelLocation(imageData, x, y);
    imageData.data[idx + 0] = rgb.r;
    imageData.data[idx + 1] = rgb.g;
    imageData.data[idx + 2] = rgb.b;
    imageData.data[idx + 3] = 255; // Alpha
}

function fillRectangle(imageData, fillStyle, x1, y1, width, height) {
    for (var y = y1; y < y1 + height; y++) {
        for (var x = x1; x < x1 + width; x++) {
            var rgb = fillStyle(x, y);
            fillPixel(imageData, x, y, rgb);
        }
    }
}

function fillCircle(imageData, fillStyle, centerX, centerY, radius) {
    var x1 = centerX - radius, y1 = centerY - radius;
    var x2 = centerX + radius, y2 = centerY + radius;
    for (var y = y1; y < y2; y++) {
        for (var x = x1; x < x2; x++) {
            var distX = (x - centerX), distY = (y - centerY);
            var distance = Math.sqrt(distX*distX + distY*distY);
            if (distance <= radius) {
                var rgb = fillStyle(x, y);
                fillPixel(imageData, x, y, rgb);
            }
        }
    }
}
// >> EMBEDDED IN ARTICLE !!

    function newSolidFill(rgb) {
        return function(x, y) {
            return rgb;
        };
    }

    ArticleDemos.registerDemo("rast1-gradients", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var x = 20 + Math.floor(Math.cos(t / 500) * 16);
            var y = 1;

            var grad = newRadialGradient(x + 4, y + 4, 6, newRGB(255, 0, 0), newRGB(0, 0, 255));
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            fillRectangle(imageData, grad, x, y, 8, 8);
            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, draw);
    });

    ArticleDemos.registerDemo("rast1-circle", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var y = 5;

            var green = newSolidFill(newRGB(0, 180, 0));
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            fillCircle(imageData, green, x, y, 4);
            rastDemoDraw(ctx, imageData);
        }

        visibleRAF(canvas, draw);
    });

    function scanAndDrawSamples(ctx, imageData, x1, y1, x2, y2, pixOffs) {
        ctx.save();

        ctx.lineWidth = 1;
        for (var y = y1; y < y2; y++) {
            for (var x = x1; x < x2; x++) {
                var idx = indexForPixelLocation(imageData, x, y);
                var hasContents = (imageData.data[idx + 0] < 255 &&
                                   imageData.data[idx + 1] < 255 && 
                                   imageData.data[idx + 2] < 255);

                var ctxX = DISPLAY_XPAD + ((x + pixOffs) * CELL_SIZE) + 0.5;
                var ctxY = DISPLAY_YPAD + ((y + pixOffs) * CELL_SIZE) + 0.5;

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
            }
        }

        ctx.restore();
    }

    ArticleDemos.registerDemo("rast1-circle-overlay", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var y = 5;

            var green = newSolidFill(newRGB(0, 180, 0));
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            fillCircle(imageData, green, x, y, 4);
            rastDemoDraw(ctx, imageData);

            scanAndDrawSamples(ctx, imageData, 1, 1, imageData.width, imageData.height, 0);

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

    function fillCircleFixed(imageData, fillStyle, centerX, centerY, radius) {
        var x1 = centerX - radius, y1 = centerY - radius;
        var x2 = centerX + radius, y2 = centerY + radius;
        for (var y = y1; y < y2; y++) {
            for (var x = x1; x < x2; x++) {
                var distX = (x - centerX + 0.5), distY = (y - centerY + 0.5);
                var distance = Math.sqrt(distX*distX + distY*distY);
                if (distance <= radius) {
                    var rgb = fillStyle(x, y);
                    fillPixel(imageData, x, y, rgb);
                }
            }
        }
    }

    ArticleDemos.registerDemo("rast1-circle-overlay-fixed", STYLE, function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(t) {
            var x = 23 + Math.floor(Math.cos(t / 500) * 16);
            var y = 5;

            var green = newSolidFill(newRGB(0, 180, 0));
            var imageData = newImageData(BUFFER_WIDTH, BUFFER_HEIGHT);
            fillCircleFixed(imageData, green, x, y, 4);
            rastDemoDraw(ctx, imageData);

            scanAndDrawSamples(ctx, imageData, 0, 0, imageData.width, imageData.height, 0.5);

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

})();

})(window);
