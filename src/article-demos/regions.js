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

        var t = 0;
        function update(t_) {
            t += (t_ - t);

            var x = (Math.sin(t * 0.001) * 30) | 0;
            draw(x);

            window.requestAnimationFrame(update);
        }
        update(0);
    });

    ArticleDemos.registerDemo("region-desktop-L", "height: 250px", function(res) {
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

            var R1 = new Region();
            R1.union_rect(R1, 0, 0, ww, wh);
            R1.subtract_rect(R1, 150 + x, -45, ww, wh);

            drawWindowShadow(ctx, ww, wh);
            drawWindowFrame(ctx, ww, wh, "Text Editor");

            ctx.save();
            ctx.beginPath();
            CanvasUtil.pathFromRegion(ctx, R1);
            ctx.globalAlpha = .8;
            ctx.fillStyle = '#dddd66';
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(150 + x, -45);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, ww, wh);
            ctx.globalAlpha = .5;
            drawWindowFrame(ctx, ww, wh, "kitten.png");
            ctx.restore();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            drawPerimeter(ctx, R1);
            ctx.stroke();
            ctx.restore();
        }

        var t = 0;
        function update(t_) {
            t += (t_ - t);

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

        var R1 = new Region();
        var R2 = new Region();
        R2.init_rect(0, 40, 80, 80);

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
                if (true) {
                    ctx.beginPath();
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
            ctx.clearRect(0, -1, op.clipRect.width, op.clipRect.height);

            R3[op.op].call(R3, R2, R1);

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

            var x = (Math.sin(t * 0.001) * 30) | 0;
            R1.init_rect(40 + x, 0, 80, 80);

            operations.forEach(drawOperation);
            window.requestAnimationFrame(update);
        }
        update(0);
    });

    // Given a "rectangle set" ( [ [0,0,20,20], [20,20,50,50] ] ), path it onto
    // the canvas context.
    function rectSetPath(ctx, rectSet) {
        rectSet.forEach(function(r) {
            ctx.rect(r[0], r[1], r[2], r[3]);
        });
    }

    // Draws a given rectSet in a fancy way
    function rectSetDraw(ctx, rectSet) {
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

    ArticleDemos.registerDemo("region-bands", "height: 120px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var R1 = new Region();
        R1.union_rect(R1, 40, 0, 80, 80);
        R1.union_rect(R1, 0, 40, 80, 80);
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

        rectSetDraw(ctx, regionRectSet(R1));
    });

    function drawWalls(ctx, walls, height) {
        height = height || 40;

        function drawWall(w) {
            if (w.open) return;

            ctx.save();

            if (w.selected)
                ctx.fillStyle = ctx.strokeStyle = 'red';
            else
                ctx.fillStyle = ctx.strokeStyle = 'black';

            ctx.font = '14pt sans-serif';
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
            ctx.fillStyle = '#ddddff';
            ctx.globalAlpha = 0.5;
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

        var buttons = document.createElement('div');
        buttons.classList.add('buttons');
        elem.insertBefore(buttons, res.demoSlot.nextSibling);

        var currentStep;

        var prevButton = document.createElement('button');
        prevButton.textContent = '<<';
        prevButton.addEventListener('click', function() { setStep(currentStep - 1); });
        buttons.appendChild(prevButton);
        var nextButton = document.createElement('button');
        nextButton.textContent = '>>';
        nextButton.addEventListener('click', function() { setStep(currentStep + 1); });
        buttons.appendChild(nextButton);

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

})(window);
