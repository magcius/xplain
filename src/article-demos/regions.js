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
        R2.init_rect(20, 40, 80, 80);

        var R3 = new Region();

        var padding = 20;
        var spacing = 10;
        var binWidth = (canvas.width - padding * 2 - (operations.length - 1) * spacing) / operations.length;
        var labelHeight = 10;
        var binHeight = canvas.height - padding * 2 - labelHeight;

        var x = padding;
        operations.forEach(function(op) {
            op.clipRect = { x: x, y: padding, width: binWidth, height: binHeight };

            ctx.strokeStyle = op.color;
            ctx.lineWidth = 4;
            ctx.strokeRect(x, padding, binWidth, binHeight);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x, padding, binWidth, binHeight);

            ctx.font = '14pt sans-serif';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText(op.title, x + binWidth / 2, canvas.height);

            x += binWidth + spacing;
        });

        function drawOperation(op) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(op.clipRect.x, op.clipRect.y, op.clipRect.width, op.clipRect.height);
            ctx.clip();

            ctx.translate(op.clipRect.x, op.clipRect.y);
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
            drawPerimeter(ctx, R3);
            ctx.stroke();

            ctx.restore();
        }

        var t = 0;
        function update() {
            ++t;

            var x = Math.sin(t * 0.01) * 30;
            R1.init_rect(60 + x, 80, 80, 80);

            operations.forEach(drawOperation);
            window.requestAnimationFrame(update);
        }
        update();
    });

    function drawWindowFrame(ctx, wx, wy, ww, wh, title, alpha) {
        var hbh = 30;
        var alpha = alpha || 1.0;

        ctx.fillStyle = 'black';
        ctx.globalAlpha = alpha * 0.2;
        ctx.fillRect(wx+6, wy+6, ww, wh);
        ctx.globalAlpha = alpha * 1.0;

        ctx.fillStyle = 'gray';
        ctx.fillRect(wx, wy, ww, wh);

        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.fillRect(wx, wy, ww, hbh);

        ctx.beginPath();
        ctx.moveTo(wx, wy + hbh - .5);
        ctx.lineTo(wx + ww, wy + hbh - .5);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.rect(wx, wy, ww, wh);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '16pt sans-serif';
        ctx.fillStyle = 'black';
        ctx.textBaseline = 'hanging';
        ctx.fillText(title, wx + 6, wy + 5);
    }

    ArticleDemos.registerDemo("region-desktop", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#00aa99';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var ww = 400;
        var wx = (canvas.width - ww) / 2 - 50;
        var wy = 70;
        var wh = 150;

        drawWindowFrame(ctx, wx, wy, ww, wh, "Text Editor");
        wx += 150;
        wy -= 45;

        drawWindowFrame(ctx, wx, wy, ww, wh, "kitten.png");
    });

    ArticleDemos.registerDemo("region-desktop-L", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#00aa99';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var ww = 400;
        var wx = (canvas.width - ww) / 2 - 50;
        var wy = 70;
        var wh = 150;

        ctx.fillStyle = 'black';
        ctx.globalAlpha = 0.2;
        ctx.fillRect(wx+6, wy+6, ww, wh);
        ctx.globalAlpha = 1.0;

        ctx.fillStyle = 'red';
        ctx.fillRect(wx, wy, ww, wh);

        wx += 150;
        wy -= 45;

        ctx.fillStyle = '#00aa99';
        ctx.fillRect(wx, wy, ww, wh);
        drawWindowFrame(ctx, wx, wy, ww, wh, "kitten.png", .3);
    });

    function rsp(ctx, rs) {
        rs.forEach(function(r) {
            ctx.rect(r[0], r[1], r[2], r[3]);
        });
    }
    function rsd(ctx, rs, x, y) {
        ctx.save();
        ctx.translate(x, y);

        ctx.save();
        ctx.beginPath();
        ctx.translate(6, 6);
        rsp(ctx, rs);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.restore();

        ctx.beginPath();
        rsp(ctx, rs);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    ArticleDemos.registerDemo("region-incorrect-regions", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var rw = 120;
        var rh = 120;
        var padding = 20;
        var x = (canvas.width - rw) / 2;
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
        rsp(ctx, demos[0], x, y);
        ctx.fill();
        ctx.restore();

        y += rh + padding;
        var dw = demos.length * (rw + padding) - padding;
        x = (canvas.width - dw) / 2;

        demos.forEach(function(rs) {
            rsd(ctx, rs, x, y);
            x += rw + padding;
        });
    });

    ArticleDemos.registerDemo("region-correct-regions", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var rw = 120;
        var x = (canvas.width - rw) / 2;

        rsd(ctx, [ [0, 0, 80, 40], [ 0, 40, 120, 40], [40, 80, 80, 40] ], x, 2);
    });

    function brs(band) {
        var rs = [];
        for (var i = 0; i < band.walls.length; i += 2)
            rs.push([band.walls[i], band.top, band.walls[i+1] - band.walls[i], band.bottom - band.top]);
        return rs;
    }

    ArticleDemos.registerDemo("region-bands", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var R1 = new Region();
        R1.union_rect(R1, 0, 0, 80, 80);
        R1.union_rect(R1, 40, 40, 80, 80);
        R1.union_rect(R1, 140, 0, 120, 120);
        R1.subtract_rect(R1, 180, 40, 40, 40);

        var rw = R1.extents.x2 - R1.extents.x1;
        var padding = 50;
        var x = (canvas.width - rw*2 - padding) / 2;
        ctx.translate(x, 0);

        ctx.beginPath();
        CanvasUtil.pathFromRegion(ctx, R1);
        ctx.fill();

        ctx.translate(rw + padding, 0);
        CanvasUtil.pathFromRegion(ctx, R1);
        ctx.globalAlpha = .2;
        ctx.fill();
        ctx.globalAlpha = 1;

        var band = R1.bands[1];
        rsd(ctx, brs(band), 0, 0);
    });

    function rrs(r) {
        var rs = [];
        r.bands.forEach(function(b) { rs = rs.concat(brs(b)); });
        return rs;
    }

    ArticleDemos.registerDemo("region-misleading-region", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        var R1 = new Region();
        R1.union_rect(R1, 0, 0, 40, 120);
        R1.union_rect(R1, 50, 30, 40, 20);

        var rw = R1.extents.x2 - R1.extents.x1;
        var padding = 70;
        var x = (canvas.width - rw*2 - padding) / 2;
        ctx.translate(x, 2);

        ctx.beginPath();
        CanvasUtil.pathFromRegion(ctx, R1);
        ctx.fill();

        ctx.translate(rw + padding, 0);
        rsd(ctx, rrs(R1), 0, 0);
    });

})(window);
