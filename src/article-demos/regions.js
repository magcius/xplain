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
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#aaa';
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

})(window);
