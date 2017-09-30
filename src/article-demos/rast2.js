// Contains the demo code for rast2.

(function(exports) {
    "use strict";

    /*
    // Path data for "g" used in demos. I retrieved this by going to https://opentype.js.org/glyph-inspector.html
    // dragging in Liberation Serif, and then running "font.glyphs.get(74).path.toSVG()".
    var g = "M870 643L870 643L870 643Q870 481 773 398L773 398L773 398Q676 315 494 315L494 315L494 315Q412 315 342 330L342 330L279 199L279 199Q282 182 318 167L318 167L318 167Q354 152 408 152L408 152L686 152L686 152Q838 152 911.50 86L911.50 86L911.50 86Q985 20 985-96L985-96L985-96Q985-201 926.50-279L926.50-279L926.50-279Q868-357 755-399.50L755-399.50L755-399.50Q642-442 481-442L481-442L481-442Q289-442 188.50-383L188.50-383L188.50-383Q88-324 88-215L88-215L88-215Q88-162 124-110.50L124-110.50L124-110.50Q160-59 256 10L256 10L256 10Q199 29 160 75L160 75L160 75Q121 121 121 174L121 174L279 352L279 352Q121 426 121 643L121 643L121 643Q121 797 218.50 881L218.50 881L218.50 881Q316 965 502 965L502 965L502 965Q539 965 597 957.50L597 957.50L597 957.50Q655 950 686 940L686 940L907 1051L942 1008L803 864L803 864Q870 789 870 643ZM829-127L829-127L829-127Q829-70 794-38L794-38L794-38Q759-6 688-6L688-6L324-6L324-6Q282-42 255.50-97.50L255.50-97.50L255.50-97.50Q229-153 229-201L229-201L229-201Q229-287 291-324.50L291-324.50L291-324.50Q353-362 481-362L481-362L481-362Q648-362 738.50-300L738.50-300L738.50-300Q829-238 829-127ZM496 391L496 391L496 391Q605 391 650.50 453.50L650.50 453.50L650.50 453.50Q696 516 696 643L696 643L696 643Q696 776 649 832.50L649 832.50L649 832.50Q602 889 498 889L498 889L498 889Q393 889 344 832L344 832L344 832Q295 775 295 643L295 643L295 643Q295 511 343 451L343 451L343 451Q391 391 496 391Z";

    function parseSVGPathDataToCanvas(ctx, pathString) {
        var commands = pathString.match(/M|L|Q|Z|-?[\d.]+/g);
        for (var i = 0; i < commands.length;) {
            var k = commands[i++];
            if (k === 'M') {
                var x = commands[i++], y = commands[i++];
                ctx.moveTo(x, y);
            } else if (k === 'L') {
                var x = commands[i++], y = commands[i++];
                ctx.lineTo(x, y);
            } else if (k === 'Q') {
                var cx = commands[i++], cy = commands[i++];
                var x = commands[i++], y = commands[i++];
                ctx.quadraticCurveTo(cx, cy, x, y);
            } else if (k === 'Z') {
                ctx.closePath();
            } else {
                console.assert(false, "Bad k %s at %d", k, i);
            }
        }
    }

    var visibleRAF = CanvasUtil.visibleRAF;

    ArticleDemos.registerDemo("rast2-coverage-map", "height: 300px", function(res) {
        var canvas = res.canvas;
        var ctx = canvas.getContext('2d');

        function draw() {
            ctx.beginPath();
            ctx.translate(300, 150);
            ctx.scale(0.1, -0.1);
            parseSVGPathData(ctx, g);
            ctx.fill();
        }

        draw();
    });
    */

    const visibleRAF = CanvasUtil.visibleRAF;
    
    ArticleDemos.registerDemo("rast2-postscript-canvas", "height: 220px", function(res) {
        const canvas = res.canvas;
        const ctx = canvas.getContext('2d');
        ctx.translate(300, 0);

        function drawBox(ctx) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 1);
            ctx.lineTo(1, 1);
            ctx.lineTo(1, 0);
            ctx.closePath();
        }

        ctx.save();
        ctx.scale(72, 72);
        drawBox(ctx); ctx.fill();
        ctx.translate(2, 2);
        drawBox(ctx); ctx.fill();
        ctx.restore();
    });

    // XXX: I need better names for these variables.

    // The size of our rasterized buffer.
    var BUFFER_WIDTH = 46, MIN_BUFFER_HEIGHT = 10;

    // This rasterized buffer gets rendered so that each "picture element"
    // in it gets a giant 16x16 "cell" for demonstration purposes.
    var DISPLAY_CELL_SIZE = 16;

    var DISPLAY_YPAD = 2;

    // As such, the final size of the buffer, rendered on the canvas, is:
    var DISPLAY_WIDTH = BUFFER_WIDTH * DISPLAY_CELL_SIZE;

    // The size of our "demo slot" is 800px, which means we need some padding
    // on the left and right sides.
    var DISPLAY_XPAD = (800 - DISPLAY_WIDTH) / 2;

    // -- Demo Utilities --

    function bufferToDisplay(p) {
        p.x = p.x * DISPLAY_CELL_SIZE;
        p.y = p.y * DISPLAY_CELL_SIZE;
        return p;
    }

    function displayToBuffer(p) {
        p.x = p.x / DISPLAY_CELL_SIZE;
        p.y = p.y / DISPLAY_CELL_SIZE;
        return p;
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
        ctx.beginPath();
        gridPath(ctx, width, height);
        ctx.strokeStyle = 'rgba(127, 127, 127, 0.4)';
        ctx.stroke();
    }

    function collectCoverage(x1, y1, callback, args, options) {
        if (!options)
            options = {};

        var bias = (options.bias !== undefined) ? options.bias : true;

        // Antialias by default.
        var numSubpixels = (options.numSubpixels !== undefined) ? numSubpixels :
                           (options.aa == undefined || options.aa) ? 4 : 1;
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

                coverage += callback(sampleX, sampleY, ...args);
            }
        }
        coverage /= numSubpixelsX * numSubpixelsY;

        return coverage;
    }

    function coverageWorker(global) {
        global.onmessage = function(e) {
            const time = e.data.time;
            const w = e.data.width, h = e.data.height;
            const array = new Uint8Array(w*h);

            let i = 0;
            let error;
            outer:
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let value;
                    try {
                        value = collectCoverage(x, y, coverage, [time]);
                    } catch(e) {
                        error = e;
                        break outer;
                    }
                    array[i++] = (value * 255) | 0;
                }
            }

            if (error !== undefined)
                global.postMessage({ time: time, error: error.message });
            else
                global.postMessage({ time: time, array: array });
        };
    }

    class CoverageWorker {
        constructor(sourceFunc) {
            this._worker = this._compileWorker(sourceFunc);
            this._worker.onerror = (e) => {
                this.terminate('onerror');
            };
            this._worker.onmessage = this._onMessage.bind(this);

            this.terminated = null;
            this.pending = false;
        }

        terminate(reason) {
            if (this.terminated)
                return;

            // Terminate on first sight of error.
            this.terminated = reason;
            this._worker.terminate();
            if (this.onterminated)
                this.onterminated();
        }

        _onMessage(e) {
            this.pending = false;
            const data = e.data;
            if (data.error !== undefined)
                this.terminate('error');
            else
                this.onresult(data);
        }

        sendJob(job, time) {
            if (this.pending) {
                const diff = time - this._lastSentTime;
                if (diff > 2000)
                    this.terminate('timeout');
                return;
            }

            this._worker.postMessage(job);
            this.pending = true;
            this._lastSentTime = time;
        }

        _compileWorker(coverageFunc) {
            const blob = new Blob([coverageFunc, collectCoverage.toString(), coverageWorker.toString(), 'coverageWorker(this);'], { type: 'text/javascript' });
            const url = window.URL.createObjectURL(blob);
            const worker = new Worker(url);
            window.URL.revokeObjectURL(url);
            return worker;
        }
    }

    class CoverageDrawer {
        constructor(canvas) {
            this._canvas = canvas;
            visibleRAF(this._canvas, this._redraw.bind(this), this._setActive.bind(this));

            this._bufferHeightNext = 0;
        }

        getCanvas() {
            return this._canvas;
        }

        _drawGrid(array) {
            if (this._bufferHeightNext === this._bufferHeight) {
                this._canvas.height = this._bufferHeight * DISPLAY_CELL_SIZE + DISPLAY_YPAD * 2;
                this._bufferHeightNext = 0;
            }

            const ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            ctx.save();
            ctx.translate(DISPLAY_XPAD, DISPLAY_YPAD);

            if (array) {
                let i = 0;
                for (let y = 0; y < this._bufferHeight; y++) {
                    for (let x = 0; x < BUFFER_WIDTH; x++) {
                        const coverage = array[i++] / 255;
                        const color = `rgba(0, 0, 0, ${coverage})`;
                        ctx.fillStyle = color;
                        const px = bufferToDisplay({ x, y });
                        ctx.fillRect(px.x, px.y, DISPLAY_CELL_SIZE, DISPLAY_CELL_SIZE);
                    }
                }
            }

            drawGrid(ctx, BUFFER_WIDTH, this._bufferHeight);
            ctx.restore();
        }

        _setActive(active) {
            this._active = active;

            if (this._active) {
                this._createWorker();
            } else {
                if (this._pendingWorker) {
                    this._pendingWorker.terminate();
                    this._pendingWorker = null;
                }

                if (this._worker) {
                    this._worker.terminate();
                    this._worker = null;
                }
            }
        }

        setNextHeight(bufferHeight) {
            if (this._bufferHeight === bufferHeight)
                return;

            this._bufferHeightNext = bufferHeight;
        }

        setCoverageFunc(source) {
            this._source = source;

            if (this._active)
                this._createWorker();
        }

        _createWorker() {
            if (this._pendingWorker)
                this._pendingWorker.terminate();

            // Keep the old worker around until the new one picks up.
            this._pendingWorker = new CoverageWorker(this._source);
            this._pendingWorker.onresult = this._pendingWorkerResult.bind(this);
        }

        _pendingWorkerResult(data) {
            // Kill the current worker.
            if (this._worker)
                this._worker.terminate();

            const worker = this._pendingWorker;
            this._worker = worker;
            worker.onresult = (data) => {
                this._workerResult(worker, data);
            };

            worker.onterminated = (e) => {
                this._workerTerminated(worker, e);
            };

            this._pendingWorker = null;
            this._workerResult(worker, data);
        }

        _workerResult(worker, data) {
            if (worker !== this._worker) {
                worker.terminate();
                return;
            }

            const array = data.array;
            this._drawGrid(array);
        }

        _workerTerminated(worker, e) {
            // If the worker goes away, strip it.
            if (this._worker === worker)
                this._worker = null;
        }

        _redraw(time) {
            if (this._bufferHeightNext) {
                this._bufferHeight = this._bufferHeightNext;
                // Don't clear.
            }

            const message = { time: time, width: BUFFER_WIDTH, height: this._bufferHeight };
            if (this._worker)
                this._worker.sendJob(message, time);
            if (this._pendingWorker)
                this._pendingWorker.sendJob(message, time);

            // XXX: Should we draw a blank grid or keep the last known good compile there?
            if (!this._worker)
                this._drawGrid(null);
        }
    }

    class Splitter {
        constructor() {
            this._splitter = document.createElement('div');
            this._splitter.style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAFCAYAAABM6GxJAAAAGklEQVQYlWNkYGD4z0ABYPz/nyL9DIxD3wUAwasI/QBdwtsAAAAASUVORK5CYII=)';
            this._splitter.style.backgroundRepeat = 'no-repeat';
            this._splitter.style.backgroundPosition = 'center center';
            this._splitter.style.cursor = 's-resize';
            this._splitter.style.height = '15px';
            this._setActive(false);

            this._splitter.onmousedown = this._onMouseDown.bind(this);
            this._onMouseMove = this._onMouseMove.bind(this);
            this._onMouseUp = this._onMouseUp.bind(this);

            this.elem = this._splitter;
        }

        _onMouseDown(e) {
            e.preventDefault();

            this._dragStartX = e.clientX;
            this._dragStartY = e.clientY;
            document.documentElement.addEventListener('mousemove', this._onMouseMove);
            document.documentElement.addEventListener('mouseup', this._onMouseUp);
            this._setActive(true);
            if (this.ondragstart)
                this.ondragstart();
        }

        _onMouseMove(e) {
            const dx = e.clientX - this._dragStartX;
            const dy = e.clientY - this._dragStartY;
            if (this.ondrag)
                this.ondrag(dx, dy, e);
        }

        _onMouseUp(e) {
            document.documentElement.removeEventListener('mousemove', this._onMouseMove);
            document.documentElement.removeEventListener('mouseup', this._onMouseUp);
            this._setActive(false);
        }

        _setActive(active) {
            if (active)
                document.body.style.setProperty('cursor', 's-resize', 'important');
            else
                document.body.style.cursor = '';
            this._splitter.style.opacity = active ? 1.0 : 0.3;
        }
    }

    class CoverageSplitter extends Splitter {
        constructor(coverage) {
            super();
            this._coverage = coverage;
        }
        ondragstart() {
            this._startHeight = this._coverage.getCanvas().height;
        }
        ondrag(dx, dy, e) {
            const rawHeight = this._startHeight + dy;
            const bufferHeight = Math.round((rawHeight - DISPLAY_YPAD * 2) / DISPLAY_CELL_SIZE);
            const bufferHeightClamped = Math.max(bufferHeight, MIN_BUFFER_HEIGHT);
            this._coverage.setNextHeight(bufferHeightClamped);
        }
    }

    function registerCoverageDemo(name, initialHeight, source) {
        ArticleDemos.registerDemo(name, "", function(res) {
            const demoSlot = res.demoSlot;
            const canvas = res.canvas;

            const coverageDrawer = new CoverageDrawer(canvas);
            coverageDrawer.setNextHeight(initialHeight);

            const splitter = new CoverageSplitter(coverageDrawer);
            demoSlot.appendChild(splitter.elem);

            const editor = new Editor();
            editor.setFontSize('12pt');
            editor.setSize(canvas.width, 250);
            editor.setPrefixSuffix('function coverage(x, y, time) {\n', '\n}');
            // Trim initial newline.
            source = source.replace(/^\n+/, '');
            source = source.replace(/\n+$/, '');
            editor.setValue(source);

            demoSlot.appendChild(editor.elem);

            function setCoverage() {
                coverageDrawer.setCoverageFunc(editor.getFullText());
            }

            editor.ontextchanged = setCoverage;
            setCoverage();
        });
    }

    registerCoverageDemo('rast2-coverage-editor-1', MIN_BUFFER_HEIGHT, `
    const radius = 3;
    const circleX = 25 + Math.sin(time / 1000) * 10;
    const circleY = 5;

    // A circle includes any point where the distance
    // between points is less than the radius.
    const dx = circleX - x, dy = circleY - y;
    return Math.sqrt(dx*dx + dy*dy) <= radius;
`);

registerCoverageDemo('rast2-coverage-editor-2', MIN_BUFFER_HEIGHT, `
    function circle(cx, cy, radius) {
        const dx = cx - x, dy = cy - y;
        // Quick optimization trick to avoid the sqrt: square both sides.
        return dx*dx + dy*dy <= radius*radius;
    }

    function rect(sx, sy, w, h) {
        const sx2 = sx+w, sy2 = sy+h;
        return x >= sx && x < sx2 && y >= sy && y < sy2;
    }

    function capsule(sx, sy, w, h) {
        // Our circle's radiuses are half the height.
        const r = h/2;
        return (
            circle(sx+r, sy+r, r)     || // Left cap.
            circle(sx+r+w-h, sy+r, r) || // Right cap.
            rect(sx+r, sy, w-h, h)       // Connecting rect.
        );
    }

    // Animate width over time
    const cx = Math.sin(time / 700) * 3 + 7;
    const cw = Math.sin(time / 500) * 5 + 25;
    return capsule(cx, 1, cw, 8);
`);

})(window);
