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
                if (this.onerror)
                    this.onerror(e);
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
            this.onsuccess = null;
            this.onerror = null;
        }

        setPendingWorker(pendingWorker) {
            if (this._pendingWorker)
                this._pendingWorker.terminate();

            this._pendingWorker = new WorkerWatchdog(pendingWorker);
            this._pendingWorker.onresult = this._pendingWorkerResult.bind(this);
            this._pendingWorker.onerror = this._pendingWorkerError.bind(this);
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
                this._currentWorkerResult(worker, data);
            };

            worker.onterminated = (e) => {
                this._currentWorkerTerminated(worker, e);
            };

            this._pendingWorker = null;

            if (this.onsuccess)
                this.onsuccess();

            this._currentWorkerResult(worker, data);
        }

        _pendingWorkerError(e) {
            if (this.onerror)
                this.onerror(e);
        }

        _currentWorkerResult(worker, data) {
            if (worker !== this._currentWorker) {
                worker.terminate();
                return;
            }

            this.onresult(data);
        }

        _currentWorkerTerminated(worker, e) {
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
            this._doubleBufferedWorker = new DoubleBufferedWorker();
            this._doubleBufferedWorker.onresult = this._workerResult.bind(this);
            this._doubleBufferedWorker.onerror = this._workerError.bind(this);
            this._doubleBufferedWorker.onsuccess = this._workerSuccess.bind(this);

            this.elem = this._toplevel;

            // We contain two grid geometry parameters: one is the "next" set of sizes
            // sent to the job, the other is set upon job success. This ensures a smooth draw.
            this._bufferGeometryToSend = {};
            this._bufferGeometryToDraw = {};
        }
        _onSplitterDragStart() {
            this._splitterDragStartHeight = this._canvas.height;
        }
        _onSplitterDrag(dx, dy, e) {
            const displayHeight = this._splitterDragStartHeight + dy;
            const bufferHeight = Math.round((displayHeight - this._displayYpad * 2) / this._bufferGeometryToSend.displayCellSize);
            const bufferHeightClamped = Math.max(bufferHeight, 1);
            this.setBufferGeometry(undefined, bufferHeightClamped, undefined);
        }
        _onMouseMove(e) {
            if (!this._mouse)
                this._mouse = { pressed: false };
            this._mouse.x = e.offsetX;
            this._mouse.y = e.offsetY;
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
        _calculateAutoBufferWidth(cellSize) {
            const numCellsPadding = 2; // Two cells worth of padding on each side.
            const bufferWidth = Math.floor(this._canvas.width / cellSize) - numCellsPadding * 2;
            return bufferWidth;
        }
        setBufferGeometry(bufferWidth, bufferHeight, displayCellSize) {
            if (bufferHeight !== undefined) {
                this._bufferGeometryToSend.bufferHeight = bufferHeight;
            }
            if (displayCellSize !== undefined) {
                this._bufferGeometryToSend.displayCellSize = displayCellSize;
            }
            if (bufferWidth !== undefined) {
                if (bufferWidth === "auto") {
                    bufferWidth = this._calculateAutoBufferWidth(this._bufferGeometryToSend.displayCellSize);
                }
                this._bufferGeometryToSend.bufferWidth = bufferWidth;
            }
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
            const imageSize = {
                width: this._bufferGeometryToSend.bufferWidth,
                height: this._bufferGeometryToSend.bufferHeight,
            }
            let mouse = null;
            if (this._mouse) {
                const displayXpad = this._getDisplayXpad(this._bufferGeometryToSend);
                const displayYpad = this._displayYpad;
                mouse = {
                    x: (this._mouse.x - displayXpad) / this._bufferGeometryToSend.displayCellSize,
                    y: (this._mouse.y - displayYpad) / this._bufferGeometryToSend.displayCellSize,
                    pressed: this._mouse.pressed,
                };
            }
            return { time, imageSize, mouse };
        }
        _redraw(time) {
            const job = this._getJob(time);
            this._setPrefixSuffix(job);
            job.bufferGeometry = this._bufferGeometryToSend;
            const sentJob = this._doubleBufferedWorker.sendJob(job);
        }
        _workerSuccess() {
            this._editor.setLineFlairs([]);
        }
        _workerError(e) {
            const lineno = e.lineno + this._editor._prefixLines - 2;
            this._editor.setLineFlairs([{ lineno, color: '#662020' }]);
        }
    }
    // #endregion

    // Coverage worker.

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

            const bufferGeometry = e.data.bufferGeometry;
            const bufferWidth = bufferGeometry.bufferWidth, bufferHeight = bufferGeometry.bufferHeight;
            const array = new Uint8Array(bufferWidth * bufferHeight);

            let i = 0;
            let error;
            outer:
            for (let y = 0; y < bufferHeight; y++) {
                for (let x = 0; x < bufferWidth; x++) {
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

            if (error !== undefined) {
                global.postMessage({ time: time, error: error.message });
                return;
            }

            // Success!
            global.postMessage({ time, bufferGeometry, buffer: array.buffer }, [array.buffer]);
        };
    }

    class CoverageDemo extends CanvasEditorDemoBase {
        _setPrefixSuffix(environ) {
            const environPrefix = this._calculateEnvironPrefix(environ);
            const prefix = `${environPrefix}\nfunction coverage(x, y) {\n`;
            const suffix = `\n}`;
            this._editor.setPrefixSuffix(prefix, suffix);
        }
        _workerResult(data) {
            this._setDrawBufferGeometry(data.bufferGeometry);
            this._drawCoverageBuffer(data.buffer);
        }
        _getDisplayXpad(geometry) {
            const displayWidth = geometry.bufferWidth * geometry.displayCellSize;
            return (this._canvas.width - displayWidth) / 2;
        }
        _setDrawBufferGeometry(geometry) {
            if (this._bufferGeometryToDraw.displayCellSize !== geometry.displayCellSize) {
                this._bufferGeometryToDraw.displayCellSize = geometry.displayCellSize;
            }
            if (this._bufferGeometryToDraw.bufferWidth !== geometry.bufferWidth) {
                this._bufferGeometryToDraw.bufferWidth = geometry.bufferWidth;
                this._displayXpad = this._getDisplayXpad(this._bufferGeometryToDraw);
            }
            if (this._bufferGeometryToDraw.bufferHeight !== geometry.bufferHeight) {
                this._bufferGeometryToDraw.bufferHeight = geometry.bufferHeight;
                this._displayYpad = 2;
                // Resize canvas to match.
                this._canvas.height = this._bufferGeometryToDraw.bufferHeight * this._bufferGeometryToDraw.displayCellSize + this._displayYpad * 2;
            }
        }
        _drawCoverageBuffer(buffer) {
            const ctx = this._canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
            ctx.save();
            ctx.translate(this._displayXpad, this._displayYpad);

            if (buffer) {
                const array = new Uint8Array(buffer);
                let i = 0;
                for (let y = 0; y < this._bufferGeometryToDraw.bufferHeight; y++) {
                    for (let x = 0; x < this._bufferGeometryToDraw.bufferWidth; x++) {
                        const coverage = array[i++] / 255;
                        const color = `rgba(0, 0, 0, ${coverage})`;
                        ctx.fillStyle = color;
                        const cellSize = this._bufferGeometryToDraw.displayCellSize;
                        const displayX = x * cellSize;
                        const displayY = y * cellSize;
                        ctx.fillRect(displayX, displayY, cellSize, cellSize);
                    }
                }
            }

            this._drawGridLines(ctx);
            ctx.restore();
        }
        _drawGridLines(ctx) {
            const width = this._bufferGeometryToDraw.bufferWidth;
            const height = this._bufferGeometryToDraw.bufferHeight;
            const cellSize = this._bufferGeometryToDraw.displayCellSize;

            ctx.beginPath();

            for (let x = 0; x <= width; x++) {
                const startX = x * cellSize, endX = x * cellSize;
                const startY = 0, endY = height * cellSize;
                ctx.moveTo(startX + 0.5, startY);
                ctx.lineTo(endX + 0.5, endY);
            }

            for (let y = 0; y <= height; y++) {
                const startY = y * cellSize, endY = y * cellSize;
                const startX = 0, endX = width * cellSize;
                ctx.moveTo(startX, startY + 0.5);
                ctx.lineTo(endX, endY + 0.5);
            }

            ctx.strokeStyle = 'rgba(127, 127, 127, 0.4)';
            ctx.stroke();
        }
        _createWorker(value) {
            const source = `function coverage(x, y) {\n${value}\n}`;
            return compileWorkerFromParts([source, coverageWorker.toString(), 'coverageWorker(this);']);
        }
    }

    function runCoverageDemo(elem, source) {
        const coverageDemo = new CoverageDemo(source);
        elem.appendChild(coverageDemo.elem);
        coverageDemo.setWidth(elem.clientWidth);
        coverageDemo.setBufferGeometry("auto", 20, 8);
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

})(window);
