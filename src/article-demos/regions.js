(function(exports) {
    "use strict";

    // XXX: This reuses a lot of code from combineRegions.
    function drawPerimeter(ctx, R) {
        function getBand(region, i) {
            if (i == -1)
                return { top: -Infinity, bottom: region.bands[0].top, walls: [] };
            if (i == region.bands.length)
                return { top: region.bands[i - 1].bottom, bottom: Infinity, walls: [] };
            return region.bands[i];
        }

        var State = {
            NONE: 0x0,
            IN_1: 0x1,
            IN_2: 0x2,
        };

        function matchState(state) {
            return state == State.IN_1 || state == State.IN_2;
        }

        for (var i = -1; i < R.bands.length; i++) {
            var band1 = getBand(R, i), band2 = getBand(R, i+1);

            // Draw horizontal walls unconditionally.
            band1.walls.forEach(function(w) {
                ctx.moveTo(w, band1.top);
                ctx.lineTo(w, band1.bottom);
            });

            var state = State.NONE;
            var i1 = 0, i2 = 0;
            var lastWall;
            while (true) {
                var oldState = state;

                // Take the first wall we see.
                var wall;
                var w1 = band1.walls[i1];
                var w2 = band2.walls[i2];

                if (w1 !== undefined && w2 !== undefined)
                    wall = Math.min(w1, w2);
                else if (w1 !== undefined)
                    wall = w1;
                else if (w2 !== undefined)
                    wall = w2;
                else
                    break;

                if (wall == w1) {
                    i1++;
                    state ^= State.IN_1;
                }
                if (wall == w2) {
                    i2++;
                    state ^= State.IN_2;
                }

                if (matchState(oldState) != matchState(state)) {
                    if (lastWall !== undefined) {
                        ctx.moveTo(lastWall, band1.bottom);
                        ctx.lineTo(wall, band1.bottom);

                        lastWall = undefined;
                    } else {
                        lastWall = wall;
                    }
                }
            }
        }
    }

    ArticleDemos.registerDemo("region-basic", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var operations = [
            { title: "Union", op: "union", color: '#dd6666' },
            { title: "Subtract", op: "subtract", color: '#dddd66' },
            { title: "Intersect", op: "intersect", color: '#66dd66' },
            { title: "Xor", op: "xor", color: '#dd66dd' },
        ];

        var R1 = new Region();
        var R2 = new Region();
        R2.init_rect(0, 0, 80, 80);

        var R3 = new Region();

        var binWidth = 160;
        var binHeight = 140;
        var padding = 20;
        var spacing = (canvas.width - padding*2 - binWidth * operations.length) / (operations.length - 1);

        var x = padding;
        operations.forEach(function(op, i, arr) {
            op.clipRect = { x: x, y: 0, width: binWidth, height: binHeight };

            ctx.font = '14pt sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText(op.title, x + binWidth / 2, canvas.height - 2);

            if (i != arr.length - 1) {
                x += binWidth;

                /* I don't like the look of these dashes, actually... */
                if (false) {
                    ctx.save();
                    ctx.lineWidth = 2;
                    ctx.globalAlpha = 0.2;
                    ctx.setLineDash([5, 5]);
                    ctx.moveTo(x + spacing/2, 0);
                    ctx.lineTo(x + spacing/2, canvas.height);
                    ctx.stroke();
                    ctx.restore();
                }

                x += spacing;
            }
        });

        function drawOperation(op) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(op.clipRect.x, op.clipRect.y, op.clipRect.width, op.clipRect.height);
            ctx.clip();

            ctx.translate(op.clipRect.x + 2, op.clipRect.y + 4);
            ctx.clearRect(0, 0, op.clipRect.width, op.clipRect.height);

            R3[op.op].call(R3, R1, R2);

            ctx.save();
            ctx.beginPath();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = 'black';
            ctx.translate(6, 6);
            CanvasUtil.pathFromRegion(ctx, R3);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            CanvasUtil.pathFromRegion(ctx, R1);
            CanvasUtil.pathFromRegion(ctx, R2);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = op.color;
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            CanvasUtil.pathFromRegion(ctx, R3);
            ctx.fillStyle = op.color;
            ctx.fill();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            drawPerimeter(ctx, R3);
            ctx.stroke();

            ctx.restore();
        }

        var t = 0;
        function update(t_) {
            t += (t_ - t);

            var x = Math.sin(t * 0.001) * 30;
            R1.init_rect(40 + x, 40, 80, 80);

            operations.forEach(drawOperation);
            window.requestAnimationFrame(update);
        }
        update(0);
    });

    function drawWindowShadow(ctx, w, h) {
        ctx.save();
        ctx.translate(6, 6);
        ctx.fillStyle = 'black';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    function drawWindowFrame(ctx, w, h, title) {
        var titleBarHeight = 30;

        // Window contents.
        ctx.fillStyle = 'gray';
        ctx.fillRect(0, 0, w, h);

        // Title bar.
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, w, titleBarHeight);

        ctx.font = '16pt sans-serif';
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'hanging';
        ctx.fillText(title, 6, 5);

        // Title bar bottom line.
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.moveTo(0, titleBarHeight - .5);
        ctx.lineTo(w, titleBarHeight - .5);
        ctx.stroke();

        // Stroke around frame.
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ArticleDemos.registerDemo("region-desktop", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var ww = 400;
        var wh = 150;

        var wx = (canvas.width - ww) / 2 - 50;
        var wy = 70;
        ctx.translate(wx, wy);

        drawWindowShadow(ctx, ww, wh);
        drawWindowFrame(ctx, ww, wh, "Text Editor");

        ctx.translate(150, -45);

        drawWindowShadow(ctx, ww, wh);
        drawWindowFrame(ctx, ww, wh, "kitten.png");
    });

    ArticleDemos.registerDemo("region-desktop-L", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var ww = 400;
        var wh = 150;

        var wx = (canvas.width - ww) / 2 - 50;
        var wy = 70;
        ctx.translate(wx, wy);

        var R1 = new Region();
        R1.union_rect(R1, 0, 0, ww, wh);
        R1.subtract_rect(R1, 150, -45, ww, wh);

        drawWindowShadow(ctx, ww, wh);
        drawWindowFrame(ctx, ww, wh, "Text Editor");

        ctx.save();
        ctx.beginPath();
        CanvasUtil.pathFromRegion(ctx, R1);
        ctx.globalAlpha = .5;
        ctx.fillStyle = '#dddd66';
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(150, -45);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, ww, wh);
        ctx.globalAlpha = .3;
        drawWindowFrame(ctx, ww, wh, "kitten.png");
        ctx.restore();

        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        drawPerimeter(ctx, R1);
        ctx.stroke();
    });

    // Given a "rectangle set" ( [ [0,0,20,20], [20,20,50,50] ] ), path it onto
    // the canvas context.
    function rectSetPath(ctx, rectSet) {
        rectSet.forEach(function(r) {
            ctx.rect(r[0], r[1], r[2], r[3]);
        });
    }

    // Draws a given rectSet in a fancy way
    function rectSetDraw(ctx, rectSet, x, y) {
        ctx.save();
        ctx.translate(x, y);

        ctx.save();
        ctx.beginPath();
        ctx.translate(6, 6);
        rectSetPath(ctx, rectSet);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        rectSetPath(ctx, rectSet);
        ctx.fillStyle = '#ddddff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    ArticleDemos.registerDemo("region-incorrect-regions", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var regionWidth = 120;
        var regionHeight = 120;
        var padding = 20;
        var x = (canvas.width - regionWidth) / 2;
        var y = 0;

        var demos = [
            [ [0, 0, 80, 80], [80, 40, 40,  80], [40, 80, 40, 40] ],
            [ [0, 0, 80, 80], [80, 40, 40,  40], [40, 80, 80, 40] ],
            [ [0, 0, 40, 80], [40,  0, 40, 120], [80, 40, 40, 80] ],
            [ [0, 0, 80, 40], [ 0, 40, 120, 40], [40, 80, 80, 40] ],
            [ [0, 0, 40, 40], [40,  0, 40,  40], [0, 40, 40, 40], [40, 40, 40, 40], [80, 40, 40, 40], [40, 80, 40, 40], [80, 80, 40, 40], ],
        ];

        ctx.beginPath();
        ctx.save();
        ctx.translate(x, y);
        rectSetPath(ctx, demos[0], x, y);
        ctx.fill();
        ctx.restore();

        y += regionHeight + padding;
        var demosWidth = demos.length * (regionWidth + padding) - padding;
        x = (canvas.width - demosWidth) / 2;

        demos.forEach(function(rs) {
            rectSetDraw(ctx, rs, x, y);
            x += regionWidth + padding;
        });
    });

    ArticleDemos.registerDemo("region-correct-regions", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var regionWidth = 120;
        var x = (canvas.width - regionWidth) / 2;

        rectSetDraw(ctx, [ [0, 0, 80, 40], [ 0, 40, 120, 40], [40, 80, 80, 40] ], x, 2);
    });

    // Takes a "band" (part of the region internals) and converts it to a rect set
    // for our fancy draw function.
    function bandRectSet(band) {
        var rs = [];
        for (var i = 0; i < band.walls.length; i += 2)
            rs.push([band.walls[i], band.top, band.walls[i+1] - band.walls[i], band.bottom - band.top]);
        return rs;
    }

    function pathGuideLine(ctx, y) {
        ctx.moveTo(-ctx.canvas.width, y);
        ctx.lineTo(ctx.canvas.width*2, y);
    }
    function pathRegionGuideLines(ctx, region) {
        pathGuideLine(ctx, region.bands[0].top);
        region.bands.forEach(function(band) {
            pathGuideLine(ctx, band.bottom);
        });
    }
    function drawGuideLines(ctx, extents, padding, f) {
        var regionWidth = extents.x2 - extents.x1;
        var regionHeight = extents.y2 - extents.y1;

        ctx.save();
        ctx.beginPath();
        ctx.rect(-padding/2, -2, regionWidth + padding, regionHeight+4);
        ctx.clip();
        ctx.beginPath();
        f();
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();
    }

    ArticleDemos.registerDemo("region-bands", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var R1 = new Region();
        R1.union_rect(R1, 0, 0, 80, 80);
        R1.union_rect(R1, 40, 40, 80, 80);
        R1.union_rect(R1, 140, 0, 120, 120);
        R1.subtract_rect(R1, 180, 40, 40, 40);

        var regionWidth = R1.extents.x2 - R1.extents.x1;
        var padding = 50;
        var x = (canvas.width - regionWidth*2 - padding) / 2;
        ctx.translate(x, 0);

        ctx.beginPath();
        CanvasUtil.pathFromRegion(ctx, R1);
        ctx.fill();

        ctx.translate(regionWidth + padding, 0);
        CanvasUtil.pathFromRegion(ctx, R1);
        ctx.globalAlpha = .2;
        ctx.fill();
        ctx.globalAlpha = 1;

        var band = R1.bands[1];
        drawGuideLines(ctx, R1.extents, padding, function() {
            pathGuideLine(ctx, band.top);
            pathGuideLine(ctx, band.bottom);
        });

        rectSetDraw(ctx, bandRectSet(band), 0, 0);
    });

    // Constructs a rect set out of all the rects in the region.
    function regionRectSet(region) {
        var rs = [];
        region.bands.forEach(function(b) { rs = rs.concat(bandRectSet(b)); });
        return rs;
    }

    ArticleDemos.registerDemo("region-misleading-region", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var R1 = new Region();
        R1.union_rect(R1, 0, 0, 40, 120);
        R1.union_rect(R1, 50, 30, 40, 20);

        var regionWidth = R1.extents.x2 - R1.extents.x1;
        var padding = 70;
        var x = (canvas.width - regionWidth*2 - padding) / 2;
        ctx.translate(x, 2);

        ctx.beginPath();
        CanvasUtil.pathFromRegion(ctx, R1);
        ctx.fill();

        ctx.translate(regionWidth + padding, 0);

        drawGuideLines(ctx, R1.extents, padding, function() {
            pathRegionGuideLines(ctx, R1);
        });

        rectSetDraw(ctx, regionRectSet(R1), 0, 0);
    });

})(window);
