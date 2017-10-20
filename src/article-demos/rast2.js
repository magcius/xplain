// Contains the demo code for rast2.

(function(exports) {
    "use strict";

    const visibleRAF = CanvasUtil.visibleRAF;

    // #region PostScript
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
    // #endregion

    // #region Worker Management
    // A wrapper around a web worker that implements a watchdog timer. If we don't get
    // a response in 2 seconds, we kill it.
    class WorkerWatchdog {
        constructor(worker) {
            this._worker = worker;
            this._worker.onerror = (e) => {
                // Terminate on first sight of error.
                this.terminate(`onerror: ${e.message}`);
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

            if (reason)
                console.error(reason);
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
            const TIMEOUT = 2000;

            if (this.pending) {
                const diff = time - this._lastSentTime;
                if (diff > TIMEOUT)
                    this.terminate('timeout');
                return;
            }

            this._worker.postMessage(job);
            this.pending = true;
            this._lastSentTime = time;
        }
    }

    // The secret magic of our demo. The rough idea is to save off the "last known good" worker
    // and only swap it out when we get a response. This prevents accidental compilation errors
    // and infinite loops from killing the program.
    class DoubleBufferedWorker {
        constructor() {
            this._currentWorker = null;
            this._pendingWorker = null;

            this.onresult = null;
        }

        setPendingWorker(pendingWorker) {
            if (this._pendingWorker)
                this._pendingWorker.terminate();

            this._pendingWorker = new WorkerWatchdog(pendingWorker);
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
            // Do the swap.

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

    // The typical trick to compile a Worker from a string of source code.
    function compileWorkerFromParts(parts) {
        const blob = new Blob(parts, { type: 'text/javascript' });
        const url = window.URL.createObjectURL(blob);
        const worker = new Worker(url);
        window.URL.revokeObjectURL(url);
        return worker;
    }
    // #endregion

    // #region Splitter
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
            document.documentElement.addEventListener('mousemove', this._onMouseMove, { capture: true });
            document.documentElement.addEventListener('mouseup', this._onMouseUp);
            this._setActive(true);
            if (this.ondragstart)
                this.ondragstart();
        }

        _onMouseMove(e) {
            e.stopPropagation();
            const dx = e.clientX - this._dragStartX;
            const dy = e.clientY - this._dragStartY;
            if (this.ondrag)
                this.ondrag(dx, dy, e);
        }

        _onMouseUp(e) {
            document.documentElement.removeEventListener('mousemove', this._onMouseMove, { capture: true });
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
    // #endregion

    // #region Editor Base Demo
    // This is the main "base class" for all of the demos that stack a result canvas,
    // a splitter, and an editor widget on top of each other. It's in charge of all
    // three components as well as constructing the workers, collecting results, etc.
    class CanvasEditorDemoBase {
        constructor(source) {
            this._toplevel = document.createElement('div');

            const topHalf = document.createElement('div');
            this._canvas = document.createElement('canvas');
            this._canvas.getContext('2d', { 'alpha': false });
            visibleRAF(this._canvas, this._redraw.bind(this), this._setActive.bind(this));
            this._canvas.onmousemove = this._onMouseMove.bind(this);
            this._canvas.onmouseout = this._onMouseOut.bind(this);
            this._canvas.onmousedown = this._onMouseDown.bind(this);
            this._canvas.onmouseup = this._onMouseUp.bind(this);
            topHalf.appendChild(this._canvas);

            this._splitter = new Splitter();
            this._splitter.ondragstart = this._onSplitterDragStart.bind(this);
            this._splitter.ondrag = this._onSplitterDrag.bind(this);
            topHalf.appendChild(this._splitter.elem);

            topHalf.style.backgroundColor = 'white';
            topHalf.style.position = 'sticky';
            // work around a dumb chrome issue
            topHalf.style.top = '-1px';
            topHalf.style.paddingTop = '1px';
            topHalf.style.zIndex = '10';
            this._toplevel.appendChild(topHalf);

            this._editor = new Editor();
            this._editor.setFontSize('12pt');
            // Trim initial newline.
            source = source.replace(/^\n+/, '');
            source = source.replace(/\n+$/, '');
            this._editor.onvaluechanged = this._onEditorValueChanged.bind(this);
            this._editor.setValue(source);
            this._toplevel.appendChild(this._editor.elem);

            this._mouse = null;
            this._bufferHeightNext = 0;
            this._doubleBufferedWorker = new DoubleBufferedWorker();
            this._doubleBufferedWorker.onresult = this._workerResult.bind(this);

            this.elem = this._toplevel;
        }
        _onSplitterDragStart() {
            this._splitterDragStartHeight = this._canvas.height;
        }
        _onSplitterDrag(dx, dy, e) {
            this.setNextHeight(this._splitterDragStartHeight + dy);
        }
        _translateMouse(e) {
            const x = (e.layerX - DISPLAY_XPAD) / DISPLAY_CELL_SIZE;
            const y = (e.layerY - DISPLAY_YPAD) / DISPLAY_CELL_SIZE;
            return { x, y };
        }
        _constrainHeight(height) {
            const bufferHeight = Math.round((height - DISPLAY_YPAD * 2) / DISPLAY_CELL_SIZE);
            const bufferHeightClamped = Math.max(bufferHeight, 1);
            return bufferHeightClamped;
        }
        _onMouseMove(e) {
            if (!this._mouse)
                this._mouse = { pressed: false };
            const { x, y } = this._translateMouse(e);
            this._mouse.x = x;
            this._mouse.y = y;
        }
        _onMouseOut(e) {
            this._mouse = null;
        }
        _onMouseDown(e) {
            e.preventDefault();
            this._onMouseMove(e);
            this._mouse.pressed = true;
        }
        _onMouseUp(e) {
            this._onMouseMove(e);
            this._mouse.pressed = false;
        }
        setWidth(width) {
            this._canvas.width = width;
            const ctx = this._canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
            this._editor.setSize(width, 250);
        }
        _setActive(active) {
            this._active = active;

            if (this._active)
                this._createPendingWorker();
            else
                this._doubleBufferedWorker.terminate();
        }
        setNextHeight(bufferHeightRaw) {
            const bufferHeight = this._constrainHeight(bufferHeightRaw);
            if (this._bufferHeight === bufferHeight)
                return;

            this._bufferHeightNext = bufferHeight;
        }
        _createPendingWorker() {
            const newWorker = this._createWorker(this._editor.getValue());
            this._doubleBufferedWorker.setPendingWorker(newWorker);
        }
        _onEditorValueChanged() {
            if (this._active)
                this._createPendingWorker();
        }
        _calculateEnvironPrefix(environ) {
            // Gross number formatting function used to lop unlucky floating points off...
            // e.g. 12345.100000007 => '12345.1'
            function formatDecimal(value, places = 2) {
                let valueStr = value.toFixed(places);
                while (valueStr.includes('.') && '.0'.includes(valueStr.slice(-1)))
                    valueStr = valueStr.slice(0, -1);
                return valueStr;
            }

            function jsonStringifyButItActuallyLooksGood(v) {
                const r = jsonStringifyButItActuallyLooksGood;
                // aesthetic
                if (Array.isArray(v)) {
                    return '[ ' + v.map(r).join(', ') + ' ]';
                } else if (typeof v === 'object' && v) {
                    return '{ ' + Object.keys(v).map((k) => `${k}: ${r(v[k])}`).join(', ') + ' }';
                } else if (typeof v === 'number') {
                    return formatDecimal(v);
                } else {
                    return JSON.stringify(v);
                }
            }

            // Calculate fake globals line.
            let prefix = '';
            for (const key in environ) {
                const value = jsonStringifyButItActuallyLooksGood(environ[key]);
                prefix += `const ${key} = ${value};\n`;
            }

            return prefix;
        }
        _getJob(time) {
            const mouse = this._mouse;
            const imageSize = { width: BUFFER_WIDTH, height: this._bufferHeight };
            return { time, imageSize, mouse };
        }
        _redraw(time) {
            if (this._bufferHeightNext)
                this._bufferHeight = this._bufferHeightNext;

            const job = this._getJob(time);
            this._setPrefixSuffix(job);
            const sentJob = this._doubleBufferedWorker.sendJob(job);

            if (!sentJob)
                this._fallbackDraw();
        }
    }
    // #endregion

    // XXX: I need better names for these variables.

    // The size of our rasterized buffer.
    const BUFFER_WIDTH = 46, INITIAL_BUFFER_HEIGHT = 10;

    // This rasterized buffer gets rendered so that each "picture element"
    // in it gets a giant 16x16 "cell" for demonstration purposes.
    const DISPLAY_CELL_SIZE = 16;

    const DISPLAY_YPAD = 2;

    // As such, the final size of the buffer, rendered on the canvas, is:
    const DISPLAY_WIDTH = BUFFER_WIDTH * DISPLAY_CELL_SIZE;

    // The size of our "demo slot" is 800px, which means we need some padding
    // on the left and right sides.
    const DISPLAY_XPAD = (800 - DISPLAY_WIDTH) / 2;

    // -- Demo Utilities --

    function bufferToDisplay(p) {
        p.x = p.x * DISPLAY_CELL_SIZE;
        p.y = p.y * DISPLAY_CELL_SIZE;
    }

    // Path out a grid of strokes drawing a grid.
    function gridPath(ctx, width, height) {
        const start = { x: 0, y: 0 };
        const end = { x: 0, y: 0 };

        for (let x = 0; x <= width; x++) {
            start.x = end.x = x;
            start.y = 0; end.y = height;
            bufferToDisplay(start); bufferToDisplay(end);
            ctx.moveTo(start.x + 0.5, start.y);
            ctx.lineTo(end.x + 0.5, end.y);
        }

        for (let y = 0; y <= height; y++) {
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

    // Runs in Worker scope! Needs to bundle all of its dependencies!
    function coverageWorker(global) {
        function collectCoverage(x1, y1, callback) {
            const numSubpixels = 4;
            const numSubpixelsX = numSubpixels;
            const numSubpixelsY = numSubpixels;
    
            let coverage = 0;
            for (let subpixelY = 0; subpixelY < numSubpixelsY; subpixelY++) {
                for (let subpixelX = 0; subpixelX < numSubpixelsX; subpixelX++) {
                    const sampleX = x1 + (subpixelX + 0.5) / numSubpixelsX;
                    const sampleY = y1 + (subpixelY + 0.5) / numSubpixelsY;
                    coverage += callback(sampleX, sampleY);
                }
            }
            coverage /= numSubpixelsX * numSubpixelsY;

            return coverage;
        }

        global.onmessage = function(e) {
            Object.assign(global, e.data);
            const time = global.time;

            const w = e.data.imageSize.width, h = e.data.imageSize.height;
            const array = new Uint8Array(w*h);

            let i = 0;
            let error;
            outer:
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let value;
                    try {
                        value = collectCoverage(x, y, coverage);
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

    class CoverageDemo extends CanvasEditorDemoBase {
        _setPrefixSuffix(environ) {
            const environPrefix = this._calculateEnvironPrefix(environ);
            const prefix = `${environPrefix}\nfunction coverage(x, y) {\n`;
            const suffix = `\n}`;
            this._editor.setPrefixSuffix(prefix, suffix);
        }
        _drawGrid(buffer) {
            if (this._bufferHeightNext === this._bufferHeight) {
                this._canvas.height = this._bufferHeight * DISPLAY_CELL_SIZE + DISPLAY_YPAD * 2;
                this._bufferHeightNext = 0;
            }

            const ctx = this._canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
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
        _createWorker(value) {
            const source = `function coverage(x, y) {\n${value}\n}`;
            return compileWorkerFromParts([source, coverageWorker.toString(), 'coverageWorker(this);']);
        }
        _workerResult(data) {
            const buffer = data.buffer;
            this._drawGrid(buffer);
        }
        _fallbackDraw() {
            this._drawGrid(null);
        }
    }

    function runCoverageDemo(elem, source) {
        const coverageDemo = new CoverageDemo(source);
        elem.appendChild(coverageDemo.elem);
        coverageDemo.setWidth(elem.clientWidth);
        coverageDemo.setNextHeight(INITIAL_BUFFER_HEIGHT * DISPLAY_CELL_SIZE);
    }

    ArticleDemos.registerDemo('rast2-coverage-editor-1', (elem) => runCoverageDemo(elem, `
    const centerX = imageSize.width / 2;
    const centerY = imageSize.height / 2;

    let circleX = centerX + Math.sin(time / 1000) * 10;
    let circleY = centerY;
    let radius = 3;

    // Follow the mouse!
    if (mouse) {
        circleX = mouse.x;
        circleY = mouse.y;
        if (mouse.pressed)
            radius += (Math.sin(time / 100) + 1) * 1.5;
    }

    // A circle includes any point where the distance
    // between points is less than the radius.
    const dx = circleX - x, dy = circleY - y;
    return Math.sqrt(dx*dx + dy*dy) <= radius;
`));

    ArticleDemos.registerDemo('rast2-coverage-editor-2', (elem) => runCoverageDemo(elem, `
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

    const height = 8, radius = height / 2;

    const cy = (imageSize.height - height) / 2;
    
    let x1 = Math.sin(time / 700) * 3 + 7;
    let x2 = Math.sin(time / 500) * 5 + 25;

    // Put some fun bits in here to follow the mouse.
    if (mouse && mouse.x - radius < x1 && mouse.x)
        x1 = mouse.x - radius;
    else if (mouse && mouse.x + radius > x2 && mouse.y)
        x2 = mouse.x + radius;

    const width = x2 - x1;
    return capsule(x1, cy, width, height);
`));

    // Runs in Worker scope! Needs to bundle all of its dependencies!
    function transformWorker(global) {
        global.onmessage = function(e) {
            const time = e.data.time;
            const w = e.data.width, h = e.data.height;
            const numSubpixelsX = e.data.numSubpixelsX;
            const numSubpixelsY = e.data.numSubpixelsY;
            const array = new Float32Array(w*h*numSubpixelsX*numSubpixelsY*2);

            let i = 0;
            let error;
            outer:
            for (let y = 0; y < h; y++)
                for (let yy = 0; yy < numSubpixelsY; yy++)
                    for (let x = 0; x < w; x++)
                        for (let xx = 0; xx < numSubpixelsX; xx++) {
                            const sampleX = x + xx / numSubpixelsX;
                            const sampleY = y + yy / numSubpixelsY;
                            try {
                                const { newX, newY } = transform(sampleX, sampleY);
                                array[i++] = newX;
                                array[i++] = newY;
                            } catch(e) {
                                error = e;
                                break outer;
                            }
                        }

            if (error !== undefined)
                global.postMessage({ time: time, error: error.message });
            else
                global.postMessage({ time: time, buffer: array.buffer }, [array.buffer]);
        };
    }

    class TransformDrawer {
        constructor() {
            this._canvas = document.createElement('canvas');
            visibleRAF(this._canvas, this._redraw.bind(this), this._setActive.bind(this));

            this._bufferHeightNext = 0;
            this._doubleBufferedWorker = new DoubleBufferedWorker();
            this._doubleBufferedWorker.onresult = this._workerResult.bind(this);

            this.elem = this._canvas;
        }

        getCanvas() {
            return this._canvas;
        }

        _drawGrid(meshBuffer) {
            if (this._bufferHeightNext === this._bufferHeight) {
                this._canvas.height = this._bufferHeight * DISPLAY_CELL_SIZE + DISPLAY_YPAD * 2;
                this._bufferHeightNext = 0;
            }

            const ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            ctx.save();
            ctx.translate(DISPLAY_XPAD, DISPLAY_YPAD);

            const array = new Float32Array(meshBuffer);
            const numSubpixelsX = 4, numSubpixelsY = 4;
            ctx.strokeStyle = 'rgba(127, 127, 127, 0.4)';
            let i;
            // This is complicated.
            //
            // First, draw the horizontal lines.
            for (let y = 0; y < this._bufferHeight; y++) {
                ctx.beginPath();
                for (let x = 0; x < BUFFER_WIDTH; x++) {
                    for (let xx = 0; xx < numSubpixelsX; xx++) {
                        const yy = 0;
                        const idx = ((y*numSubpixelsY+yy)*BUFFER_WIDTH*numSubpixelsX + x*numSubpixelsX+xx) * 2;
                        const px = (array[idx+0]) * DISPLAY_CELL_SIZE;
                        const py = (array[idx+1]) * DISPLAY_CELL_SIZE + 0.5;
                        ctx.lineTo(px, py);
                    }
                }
                ctx.stroke();
            }
            // Vertical lines.
            for (let x = 0; x < BUFFER_WIDTH; x++) {
                ctx.beginPath();
                for (let y = 0; y < this._bufferHeight; y++) {
                    for (let yy = 0; yy < numSubpixelsY; yy++) {
                        const xx = 0;
                        const idx = ((y*numSubpixelsY+yy)*BUFFER_WIDTH*numSubpixelsX + x*numSubpixelsX+xx) * 2;
                        const px = (array[idx+0]) * DISPLAY_CELL_SIZE + 0.5;
                        const py = (array[idx+1]) * DISPLAY_CELL_SIZE;
                        ctx.lineTo(px, py);
                    }
                }
                ctx.stroke();
            }
            // XXX: Now fill these things with coverage.

            ctx.restore();
        }

        _setActive(active) {
            this._active = active;

            if (this._active)
                this._createPendingWorker();
            else
                this._doubleBufferedWorker.terminate();
        }

        setWidth(width) {
            this._canvas.width = width;
        }

        setNextHeight(bufferHeight) {
            if (this._bufferHeight === bufferHeight)
                return;

            this._bufferHeightNext = bufferHeight;
        }

        setSource(source) {
            this._source = source;

            if (this._active)
                this._createWorker();
        }

        _createWorker() {
            if (!this._source)
                return;

            const newWorker = compileWorkerFromParts([this._source, transformWorker.toString(), 'transformWorker(this);']);
            this._doubleBufferedWorker.setPendingWorker(newWorker);
        }

        _workerResult(data) {
            const buffer = data.buffer;
            this._drawGrid(buffer);
        }

        _redraw(time) {
            if (this._bufferHeightNext)
                this._bufferHeight = this._bufferHeightNext;

            const width = BUFFER_WIDTH, height = this._bufferHeight;
            const numSubpixelsX = 4, numSubpixelsY = 4;
            const job = { time, width, height, numSubpixelsX, numSubpixelsY };
            const sentJob = this._doubleBufferedWorker.sendJob(job);

            // XXX: Should we draw a blank grid or keep the last known good compile there?
            if (!sentJob)
                this._drawGrid(null);
        }
    }

    function runTransformDemo(elem, initialHeight, source) {
        const transformDrawer = new TransformDrawer();
        transformDrawer.setWidth(elem.clientWidth);
        transformDrawer.setNextHeight(initialHeight);
        elem.appendChild(transformDrawer.elem);

        const editor = new Editor();
        editor.setFontSize('12pt');
        editor.setSize(elem.clientWidth, 250);
        editor.setPrefixSuffix('function transform(x, y, time) {\n', '\n    return { newX, newY };\n}');
        // Trim initial newline.
        source = source.replace(/^\n+/, '');
        source = source.replace(/\n+$/, '');
        editor.setValue(source);

        elem.appendChild(editor.elem);

        function transform() {
            transformDrawer.setSource(editor.getFullText());
        }

        editor.onvaluechanged = transform;
        transform();
    }

    ArticleDemos.registerDemo('rast2-transforms-1', (elem) => runTransformDemo(elem, INITIAL_BUFFER_HEIGHT, `
    const t = Math.sin(time / 1000) + 2;
    const newX = x;
    const newY = y;
`));

})(window);
