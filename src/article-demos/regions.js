// Contains the demo code for the "Regional Geometry".

(function(exports) {
    "use strict";

    // Given a region, draw a perimeter around the region as a stroke. This
    // is trickier than it might imagine. It's possible I'm overcomplicating
    // this, but I've come up with something that works.

    // Since walls *always* toggle in and out of regions, they're easy. We
    // simply always draw all walls we encounter as vertical lines.
    // The complexity comes with the horizontal lines that trace each band.
    // We use an edge-triggered-based approach similar to combineRegions,
    // which walks the bands of a region in pairs, down the line.
    // We draw a line when we transition from being in one band but not
    // the other -- a XOR.
    function drawPerimeter(ctx, R) {
        // XXX: This reuses a lot of code from combineRegions.

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

    // Draw the window frames in the desktop examples.
    function drawWindowFrame(ctx, w, h, title) {
        var titleBarHeight = 30;

        // Window contents.
        ctx.fillStyle = '#ccc';
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

    // Draws the gray window shadows below each region. It's split out because
    // the kitten.png window in the second example has no shadow.
    function drawWindowShadow(ctx, w, h) {
        ctx.save();
        ctx.translate(6, 6);
        ctx.fillStyle = 'black';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    ArticleDemos.registerDemo("region-desktop", "height: 250px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw(x) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();

            var ww = 400;
            var wh = 150;

            var wx = (canvas.width - ww) / 2 - 50;
            var wy = 70;
            ctx.translate(wx, wy);

            drawWindowShadow(ctx, ww, wh);
            drawWindowFrame(ctx, ww, wh, "Text Editor");

            ctx.translate(150 + x, -45);

            drawWindowShadow(ctx, ww, wh);
            drawWindowFrame(ctx, ww, wh, "kitten.png");
            ctx.restore();
        }

        function update(t) {
            var x = (Math.sin(t * 0.001) * 30) | 0;
            draw(x);
            window.requestAnimationFrame(update);
        }
        update(0);
    });

    ArticleDemos.registerDemo("region-desktop-L", "height: 250px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var region = new Region();

        function draw(x) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();

            var ww = 400;
            var wh = 150;
            var wx = (canvas.width - ww) / 2 - 50;
            var wy = 70;

            ctx.translate(wx, wy);

            region.clear();
            region.union_rect(region, 0, 0, ww, wh);
            region.subtract_rect(region, 150 + x, -45, ww, wh);

            drawWindowShadow(ctx, ww, wh);
            drawWindowFrame(ctx, ww, wh, "Text Editor");

            ctx.save();
            ctx.beginPath();
            CanvasUtil.pathFromRegion(ctx, region);
            ctx.globalAlpha = .8;
            ctx.fillStyle = '#dddd66';
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(150 + x, -45);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, ww, wh);
            ctx.globalAlpha = .3;
            drawWindowFrame(ctx, ww, wh, "kitten.png");
            ctx.restore();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            drawPerimeter(ctx, region);
            ctx.stroke();
            ctx.restore();
        }

        function update(t) {
            var x = (Math.sin(t * 0.001) * 30) | 0;
            draw(x);
            window.requestAnimationFrame(update);
        }
        update(0);
    });

    ArticleDemos.registerDemo("region-basic", "height: 160px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var operations = [
            { title: "Union", op: "union", color: '#dd6666' },
            { title: "Subtract", op: "subtract", color: '#dddd66' },
            { title: "Intersect", op: "intersect", color: '#66dd66' },
            { title: "Xor", op: "xor", color: '#dd66dd' },
        ];

        var regionA = new Region();
        regionA.init_rect(0, 40, 80, 80);

        var regionB = new Region();

        var regionResult = new Region();

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

                ctx.beginPath();
                ctx.save();
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.2;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(x + spacing/2, 0);
                ctx.lineTo(x + spacing/2, canvas.height);
                ctx.stroke();
                ctx.restore();

                x += spacing;
            }
        });

        function drawOperation(op) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(op.clipRect.x, op.clipRect.y, op.clipRect.width, op.clipRect.height);
            ctx.clip();

            ctx.translate(op.clipRect.x + 2, op.clipRect.y + 4);
            ctx.clearRect(0, -1, op.clipRect.width, op.clipRect.height);

            regionResult[op.op].call(regionResult, regionA, regionB);

            ctx.save();
            ctx.beginPath();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = 'black';
            ctx.translate(6, 6);
            CanvasUtil.pathFromRegion(ctx, regionResult);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            CanvasUtil.pathFromRegion(ctx, regionA);
            CanvasUtil.pathFromRegion(ctx, regionB);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = op.color;
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            CanvasUtil.pathFromRegion(ctx, regionResult);
            ctx.fillStyle = op.color;
            ctx.fill();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            drawPerimeter(ctx, regionResult);
            ctx.stroke();

            ctx.restore();
        }

        function update(t) {
            var x = (Math.sin(t * 0.001) * 30) | 0;
            regionB.init_rect(40 + x, 0, 80, 80);

            operations.forEach(drawOperation);
            window.requestAnimationFrame(update);
        }
        update(0);
    });

    // Given a "rectangle set" ( [ [0,0,20,20], [20,20,50,50] ] ), path it onto
    // the given canvas context.
    function rectSetPath(ctx, rectSet) {
        rectSet.forEach(function(r) {
            ctx.rect(r[0], r[1], r[2], r[3]);
        });
    }

    // Draws a given rectSet in a fancy way used by the rest of the article.
    function rectSetDraw(ctx, rectSet) {
        // First, draw the shadow.
        ctx.save();
        ctx.beginPath();
        ctx.translate(6, 6);
        rectSetPath(ctx, rectSet);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.restore();

        // Now for the actual rectangle. We draw it in a blue color to make
        // it stand out from the white background.
        ctx.beginPath();
        rectSetPath(ctx, rectSet);
        ctx.fillStyle = '#ddddff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ArticleDemos.registerDemo("region-incorrect-regions", "height: 280px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var regionWidth = 120;
        var regionHeight = 120;
        var padding = 20;
        var x = (canvas.width - regionWidth) / 2;
        var y = 0;

        var demos = [
            [ [0, 40, 80, 80], [80, 0, 40,  80], [40, 0, 40, 40] ],
            [ [0, 40, 80, 80], [80, 40, 40,  40], [40, 0, 80, 40] ],
            [ [0, 40, 40, 80], [40,  0, 40, 120], [80, 0, 40, 80] ],
            [ [40, 0, 80, 40], [ 0, 40, 120, 40], [0, 80, 80, 40] ],
            [ [0, 80, 40, 40], [40,  0, 40,  40], [0, 40, 40, 40], [40, 40, 40, 40], [80, 40, 40, 40], [40, 80, 40, 40], [80, 0, 40, 40], ],
        ];

        ctx.beginPath();
        ctx.save();
        ctx.translate(x, y);
        rectSetPath(ctx, demos[0]);
        ctx.fill();
        ctx.restore();

        y += regionHeight + padding;
        var demosWidth = demos.length * (regionWidth + padding) - padding;
        x = (canvas.width - demosWidth) / 2;
        ctx.translate(x, y);

        demos.forEach(function(rs) {
            rectSetDraw(ctx, rs);
            ctx.translate(regionWidth + padding, 0);
        });
    });

    ArticleDemos.registerDemo("region-correct-regions", "height: 130px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var regionWidth = 120;
        var x = (canvas.width - regionWidth) / 2;

        ctx.translate(x, 2);
        rectSetDraw(ctx, [ [40, 0, 80, 40], [ 0, 40, 120, 40], [0, 80, 80, 40] ]);
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

    ArticleDemos.registerDemo("region-bands", "height: 120px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var region = new Region();
        region.union_rect(region, 40, 0, 80, 80);
        region.union_rect(region, 0, 40, 80, 80);
        region.union_rect(region, 140, 0, 120, 120);
        region.subtract_rect(region, 180, 40, 40, 40);

        var regionWidth = region.extents.x2 - region.extents.x1;
        var regionHeight = region.extents.y2 - region.extents.y1;

        var padding = 50;
        var x = (canvas.width - regionWidth*2 - padding) / 2;
        ctx.translate(x, 0);

        ctx.beginPath();
        CanvasUtil.pathFromRegion(ctx, region);
        ctx.fill();

        ctx.translate(regionWidth + padding, 0);
        CanvasUtil.pathFromRegion(ctx, region);
        ctx.globalAlpha = .2;
        ctx.fill();
        ctx.globalAlpha = 1;

        var band = region.bands[1];

        ctx.save();
        ctx.beginPath();
        ctx.rect(-padding/2, -2, regionWidth + padding, regionHeight+4);
        ctx.clip();
        ctx.beginPath();
        pathGuideLine(ctx, band.top);
        pathGuideLine(ctx, band.bottom);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();

        rectSetDraw(ctx, bandRectSet(band));
    });

    // Constructs a rect set out of all the rects in the region.
    function regionRectSet(region) {
        var rs = [];
        region.bands.forEach(function(b) { rs = rs.concat(bandRectSet(b)); });
        return rs;
    }

    ArticleDemos.registerDemo("region-misleading-region", "height: 130px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var region = new Region();
        region.union_rect(region, 0, 0, 40, 120);
        region.union_rect(region, 50, 30, 40, 20);

        var regionWidth = region.extents.x2 - region.extents.x1;
        var regionHeight = region.extents.y2 - region.extents.y1;

        var padding = 70;
        var x = (canvas.width - regionWidth*2 - padding) / 2;
        ctx.translate(x, 2);

        ctx.beginPath();
        CanvasUtil.pathFromRegion(ctx, region);
        ctx.fill();

        ctx.translate(regionWidth + padding, 0);

        ctx.save();
        ctx.beginPath();
        ctx.rect(-padding/2, -2, regionWidth + padding, regionHeight+4);
        ctx.clip();
        ctx.beginPath();
        pathRegionGuideLines(ctx, region);
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.restore();

        rectSetDraw(ctx, regionRectSet(region));
    });

    // Given a series of "walls", draw them with the standard band diagram we
    // introduce in the "Merging Bands" section.
    function drawWalls(ctx, walls, height) {
        height = height || 40;

        // XXX: This function merges a lot of responsibilities and should
        // probably be split out or refactored to be better.

        // A "wall" has an "x", its X position, a "label" (which is usually a
        // multiple of the X position -- we scale the band up for demonstration
        // purposes), whether the wall is "selected" (used for the walkthrough),
        // and whether the wall is "open" (used for the walkthrough -- this means)
        // it draws the fill to the wall position but doesn't draw the wall itself.

        function drawWall(w) {
            if (w.open) return;

            ctx.save();

            if (w.selected)
                ctx.fillStyle = ctx.strokeStyle = 'red';
            else
                ctx.fillStyle = ctx.strokeStyle = 'black';

            ctx.textAlign = 'center';
            ctx.textBaseline = 'hanging';
            ctx.fillText(w.label, w.x, height);

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.moveTo(w.x, 0);
            ctx.lineTo(w.x, height);
            ctx.stroke();
            ctx.restore();
        }

        function drawFill(w1, w2) {
            var x1 = w1.x, x2 = w2.x;

            var fillPad = 6;
            var w = x2 - x1;
            var y1 = fillPad;
            var h = height - fillPad * 2;

            ctx.beginPath();
            ctx.rect(x1, y1, w, h);
            ctx.save();
            ctx.fill();
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y1);
            ctx.moveTo(x1, y1+h);
            ctx.lineTo(x2, y1+h);
            ctx.save();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#666';
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
        }

        for (var i = 0; i < walls.length; i += 2) {
            var w1 = walls[i], w2 = walls[i+1];
            if (w1 && w2) drawFill(w1, w2);
            if (w1) drawWall(w1);
            if (w2) drawWall(w2);
        }
    }

    ArticleDemos.registerDemo("region-walls", "height: 130px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var walls1 = [ { x: 0, label: "20" }, { x: 200, label: "40" } ];
        var walls2 = [ { x: 100, label: "30" }, { x: 300, label: "50" } ];

        var width = 300;
        var x = (canvas.width - width) / 2;

        ctx.fillStyle = '#ddddff';
        ctx.font = '14pt sans-serif';

        ctx.translate(x, 2);
        drawWalls(ctx, walls1);

        ctx.translate(0, 70);
        drawWalls(ctx, walls2);
    });

    ArticleDemos.registerDemo("region-walls-walkthrough",  "height: 180px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');
        var elem = res.elem;

        var liSteps = [].slice.call(elem.querySelectorAll('li'));

        var currentStep;

        var prevButton = elem.querySelector('button.prev');
        prevButton.addEventListener('click', function() { setStep(currentStep - 1); });
        var nextButton = elem.querySelector('button.next')
        nextButton.addEventListener('click', function() { setStep(currentStep + 1); });

        var width = 300;
        var x = (canvas.width - width) / 2;

        function setStep(newStep) {
            currentStep = newStep;

            liSteps.forEach(function(li) { li.classList.remove('selected'); })
            liSteps[currentStep].classList.add('selected');

            var hasPrev = currentStep > 0;
            prevButton.disabled = !hasPrev;
            var hasNext = currentStep < (liSteps.length-1);
            nextButton.disabled = !hasNext;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            var walls1 = [ { x: 0, label: "20" }, { x: 200, label: "40" } ];
            var walls2 = [ { x: 100, label: "30" }, { x: 300, label: "50" } ];

            var outWalls = [];

            if (currentStep == 0) { walls1[0].selected = true; outWalls.push({ x: 0, label: "20" }); }
            if (currentStep == 1) { walls2[0].selected = true; outWalls.push({ x: 0, label: "20" }); outWalls.push({ x: 100, open: true }); }
            if (currentStep == 2) { walls1[1].selected = true; outWalls.push({ x: 0, label: "20" }); outWalls.push({ x: 200, open: true }); }
            if (currentStep == 3) { walls2[1].selected = true; outWalls.push({ x: 0, label: "20" }); outWalls.push({ x: 300, label: "50" }); }

            ctx.save();
            ctx.font = '14pt sans-serif';
            ctx.fillStyle = '#ddddff';
            ctx.translate(x, 2);
            drawWalls(ctx, walls1);
            ctx.translate(0, 70);
            drawWalls(ctx, walls2);
            ctx.translate(0, 70);
            drawWalls(ctx, outWalls, 20);
            ctx.restore();
        }
        setStep(0);
    });

    ArticleDemos.registerDemo("region-operations", "height: 220px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var operations = [
            { title: "Union", op: "union", color: '#dd6666', code: 'insideA || insideB' },
            { title: "Subtract", op: "subtract", color: '#dddd66', code: 'insideA && !insideB' },
            { title: "Intersect", op: "intersect", color: '#66dd66', code: 'insideA && insideB' },
            { title: "Xor", op: "xor", color: '#dd66dd', code: 'insideA != insideB' },
        ];

        var regionA = new Region();
        regionA.init_rect(0, 0, 100, 40);

        var regionB = new Region();

        var regionResult = new Region();

        var binWidth = 160;
        var binHeight = 160;
        var padding = 20;
        var spacing = (canvas.width - padding*2 - binWidth * operations.length) / (operations.length - 1);

        var x = padding;
        operations.forEach(function(op, i, arr) {
            op.clipRect = { x: x, y: 0, width: binWidth, height: binHeight };

            ctx.font = '14pt sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(op.title, x + binWidth / 2, canvas.height - 30);
            ctx.textBaseline = 'hanging';
            ctx.font = '12pt monospace';
            ctx.fillText(op.code, x + binWidth / 2, canvas.height - 16);

            if (i != arr.length - 1) {
                x += binWidth;

                ctx.beginPath();
                ctx.save();
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.2;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(x + spacing/2, 0);
                ctx.lineTo(x + spacing/2, canvas.height);
                ctx.stroke();
                ctx.restore();

                x += spacing;
            }
        });

        function drawOperation(op) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(op.clipRect.x, op.clipRect.y, op.clipRect.width, op.clipRect.height);
            ctx.clip();

            ctx.translate(op.clipRect.x + 2, op.clipRect.y + 4);
            ctx.clearRect(0, -1, op.clipRect.width, op.clipRect.height);

            function makeDrawWalls(band) {
                return band.walls.map(function(x) { return { x: x, label: x.toString() }});
            }
            function fade(color, alpha) {
                function p(i) { return parseInt(color.substr(i, 2), 16); }
                return 'rgba(' + [p(1), p(3), p(5), alpha].join(', ') + ')';
            }

            ctx.save();
            ctx.font = '10pt sans-serif';
            ctx.beginPath();
            ctx.fillStyle = fade(op.color, .3);
            ctx.translate(10, 0);
            drawWalls(ctx, makeDrawWalls(regionA.bands[0]), 20);
            ctx.translate(0, 40);
            drawWalls(ctx, makeDrawWalls(regionB.bands[0]), 20);
            ctx.translate(0, 60);

            regionResult[op.op].call(regionResult, regionA, regionB);

            ctx.fillStyle = op.color;
            drawWalls(ctx, makeDrawWalls(regionResult.bands[0]), 30);
            ctx.restore();

            ctx.restore();
        }

        function update(t) {
            var x = (Math.sin(t * 0.001) * 21) | 0;
            regionB.init_rect(40 + x, 0, 60, 40);

            operations.forEach(drawOperation);
            window.requestAnimationFrame(update);
        }
        update(0);
    });

    function regionExplorer(canvas) {
        var ctx = canvas.getContext('2d');
        var selectedBand = null, selectedWall = null;
        var region = new Region();

        function pick() {
            var x = mx, y = my;

            selectedWall = null;

            if (y < 0)
                return selectedBand = null;

            if (y < region.extents.y1)
                return selectedBand = -1;
            else if (y > region.extents.y2)
                return selectedBand = region.bands.length;

            for (var i = 0; i < region.bands.length; i++) {
                var band = region.bands[i];
                if (y > band.bottom)
                    continue;

                selectedBand = i;

                for (var j = 0; j < band.walls.length; j += 2) {
                    var x1 = band.walls[j], x2 = band.walls[j + 1];
                    if (x < x1)
                        return;
                    if (x < x2)
                        return selectedWall = j;
                }

                return;
            }
        }

        function draw() {
            if (region.is_empty())
                return;

            pick();

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();

            var band;
            if (selectedBand !== null) {
                ctx.save();
                ctx.fillStyle = '#ddddff';
                var y, h;
                if (selectedBand === -1) {
                    y = 0; h = region.bands[0].top;
                } else if (selectedBand === region.bands.length) {
                    y = region.bands[region.bands.length - 1].bottom; h = canvas.height;
                } else {
                    band = region.bands[selectedBand];
                    y = band.top; h = band.bottom - y;
                }

                ctx.fillRect(0, y, canvas.width, h);
                ctx.restore();
            }

            CanvasUtil.pathFromRegion(ctx, region);
            ctx.globalAlpha = .2;
            ctx.fill();
            ctx.globalAlpha = 1;

            if (band) {
                ctx.save();
                ctx.beginPath();
                rectSetPath(ctx, bandRectSet(band));
                ctx.fillStyle = '#ffffff';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();

                if (selectedWall !== null) {
                    var w1 = band.walls[selectedWall], w2 = band.walls[selectedWall+1];
                    rectSetDraw(ctx, [[w1, band.top, w2-w1, band.bottom-band.top]]);
                }
            }

            ctx.save();
            ctx.beginPath();
            pathRegionGuideLines(ctx, region);
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();

            ctx.restore();
        }

        function setRegion(r) {
            region.copy(r);
        }

        var mx = -1, my = -1;
        canvas.addEventListener('mousemove', function(e) {
            var canvasPos = canvas.getBoundingClientRect();
            mx = e.clientX - canvasPos.left, my = e.clientY - canvasPos.top;
            draw();
        });
        canvas.addEventListener('mouseout', function() {
            mx = -1; my = -1;
            draw();
        });

        return { setRegion: setRegion, draw: draw };
    }

    ArticleDemos.registerDemo("region-band-explorer", "height: 140px", function(res) {
        var canvas = res.canvas;

        var scene = regionExplorer(canvas);

        var region = new Region();
        var sceneT = 0;

        function makeScene() {
            var r2x = (Math.cos(sceneT * Math.PI * 2) * 100) | 0;
            var r2y = (Math.sin(sceneT * Math.PI * 2) * 20) | 0;

            region.clear();
            region.union_rect(region, 0, 0, 60, 40);
            region.union_rect(region, r2x, 40 + r2y, 40, 40);
            var regionWidth = 60;
            var x = (canvas.width - regionWidth) / 2;
            region.translate(x, 20);
            scene.setRegion(region);
            scene.draw();
        }

        var elem = res.elem;

        var isDragging = false;
        var isPaused = false;

        var timeSlider = elem.querySelector('.time-slider');
        timeSlider.addEventListener('input', function() {
            isDragging = true;
            sceneT = timeSlider.value;
        });
        timeSlider.addEventListener('change', function() {
            isDragging = false;
            sceneT = Number(timeSlider.value);
        });

        var timeButton = elem.querySelector('.time-button');
        function setPaused(paused) {
            isPaused = paused;
            timeButton.textContent = isPaused ? 'Play' : 'Pause';
        }
        timeButton.addEventListener('click', function() {
            setPaused(!isPaused);
        });
        setPaused(false);

        var afMsec = 0;
        var duration = 5 * 1000;
        function update(msec) {
            var dt = (msec - afMsec) / duration;
            afMsec = msec;

            makeScene();
            window.requestAnimationFrame(update);

            if (isDragging || isPaused)
                return;

            sceneT = (sceneT + dt) % 1;
            timeSlider.value = sceneT;
        }
        update(0);
    });

    ArticleDemos.registerDemo("region-rounded-corner", "height: 140px", function(res) {
        var canvas = res.canvas;

        var scene = regionExplorer(canvas);

        var region = new Region();
        var radius = 5;
        var w = 600;
        var scaleX = 5, scaleY = 10;
        for (var i = 0; i < radius; i++) {
            var x = (radius - Math.sqrt(radius*radius - (radius-i)*(radius-i))) * scaleX;
            region.union_rect(region, x, i * 10, w-x*2, 10);
        }
        region.union_rect(region, 0, radius*scaleY, w, 50);
        region.translate((canvas.width-w)/2, 20);

        scene.setRegion(region);
        scene.draw();
    });

    ArticleDemos.registerDemo("region-checkerboard", "height: 140px", function(res) {
        var canvas = res.canvas;

        var scene = regionExplorer(canvas);

        var region = new Region();
        var w = 40, h = 10;
        var size = 10;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                if ((x%2) == (y%2))
                    region.union_rect(region, x*size, y*size, size, size);
            }
        }
        region.translate((canvas.width-w*size)/2, 20);

        scene.setRegion(region);
        scene.draw();
    });

})(window);
