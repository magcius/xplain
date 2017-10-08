// Contains the demo code for rast2.

(function(exports) {
    "use strict";

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
        const start = { x: 0, y: 0 };
        const end = { x: 0, y: 0 };

        for (var x = 0; x <= width; x++) {
            start.x = end.x = x;
            start.y = 0; end.y = height;
            bufferToDisplay(start); bufferToDisplay(end);
            ctx.moveTo(start.x + 0.5, start.y);
            ctx.lineTo(end.x + 0.5, end.y);
        }

        for (var y = 0; y <= height; y++) {
            start.y = end.y = y;
            start.x = 0; end.x = width;
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
                global.postMessage({ time: time, buffer: array.buffer }, [array.buffer]);
        };
    }

    // A wrapper around a worker that implements a watchdog timer. If we don't get
    // a response in 2 seconds, we kill it.
    class WorkerWatchdog {
        constructor(url) {
            this._worker = new Worker(url);
            this._worker.onerror = (e) => {
                this.terminate(`onerror: ${e}`);
            };
            this._worker.onmessage = this._onMessage.bind(this);

            this.terminated = null;
            this.pending = false;

            this.onterminated = null;
            this.onresult = null;
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
                this.terminate(`worker error: ${data.error}`);
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
    }

    class DoubleBufferedWorker {
        constructor() {
            this._currentWorker = null;
            this._pendingWorker = null;

            this.onresult = null;
        }

        setPendingWorker(pendingWorker) {
            if (this._pendingWorker)
                this._pendingWorker.terminate();

            this._pendingWorker = pendingWorker;
            this._pendingWorker.onresult = this._pendingWorkerResult.bind(this);
        }

        sendJob(job) {
            if (this._pendingWorker)
                this._pendingWorker.sendJob(job);
            if (this._currentWorker)
                this._currentWorker.sendJob(job);

            return !!this._currentWorker || !!this._pendingWorker;
        }

        terminate() {
            if (this._pendingWorker) {
                this._pendingWorker.terminate();
                this._pendingWorker = null;
            }

            if (this._currentWorker) {
                this._currentWorker.terminate();
                this._currentWorker = null;
            }
        }

        _pendingWorkerResult(data) {
            // Kill the current worker.
            if (this._currentWorker)
                this._currentWorker.terminate();

            const worker = this._pendingWorker;
            this._currentWorker = worker;
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
            if (worker !== this._currentWorker) {
                worker.terminate();
                return;
            }

            this.onresult(data);
        }

        _workerTerminated(worker, e) {
            // If the worker goes away, strip it.
            if (this._currentWorker === worker)
                this._currentWorker = null;
        }
    }

    class CoverageDrawer {
        constructor(canvas) {
            this._canvas = canvas;
            visibleRAF(this._canvas, this._redraw.bind(this), this._setActive.bind(this));

            this._bufferHeightNext = 0;
            this._doubleBufferedWorker = new DoubleBufferedWorker();
            this._doubleBufferedWorker.onresult = this._workerResult.bind(this);
        }

        getCanvas() {
            return this._canvas;
        }

        _drawGrid(buffer) {
            if (this._bufferHeightNext === this._bufferHeight) {
                this._canvas.height = this._bufferHeight * DISPLAY_CELL_SIZE + DISPLAY_YPAD * 2;
                this._bufferHeightNext = 0;
            }

            const ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            ctx.save();
            ctx.translate(DISPLAY_XPAD, DISPLAY_YPAD);

            const px = { x: 0, y: 0 };
            if (buffer) {
                const array = new Uint8Array(buffer);
                let i = 0;
                for (let y = 0; y < this._bufferHeight; y++) {
                    for (let x = 0; x < BUFFER_WIDTH; x++) {
                        const coverage = array[i++] / 255;
                        const color = `rgba(0, 0, 0, ${coverage})`;
                        ctx.fillStyle = color;
                        px.x = x; px.y = y; bufferToDisplay(px);
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
                this._doubleBufferedWorker.terminate();
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

        _compileWorker(coverageFunc) {
            const blob = new Blob([coverageFunc, collectCoverage.toString(), coverageWorker.toString(), 'coverageWorker(this);'], { type: 'text/javascript' });
            const url = window.URL.createObjectURL(blob);
            const worker = new WorkerWatchdog(url);
            window.URL.revokeObjectURL(url);
            return worker;
        }

        _createWorker() {
            if (!this._source)
                return;

            const newWorker = this._compileWorker(this._source);
            this._doubleBufferedWorker.setPendingWorker(newWorker);
        }

        _workerResult(data) {
            const buffer = data.buffer;
            this._drawGrid(buffer);
        }

        _redraw(time) {
            if (this._bufferHeightNext) {
                this._bufferHeight = this._bufferHeightNext;
                // Don't clear.
            }

            const job = { time: time, width: BUFFER_WIDTH, height: this._bufferHeight };
            const sentJob = this._doubleBufferedWorker.sendJob(job);

            // XXX: Should we draw a blank grid or keep the last known good compile there?
            if (!sentJob)
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
