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

    class Editor {
        constructor() {
            this.ontextchanged = null;

            this._prefix = '';
            this._suffix = '';

            this._toplevel = document.createElement('div');
            this._toplevel.style.position = 'relative';
            document.body.appendChild(this._toplevel);

            this._textarea = document.createElement('textarea');
            this._textarea.style.fontFamily = '"Source Code Pro", "Droid Sans Mono", monospace';
            this._textarea.oninput = this._onInput.bind(this);
            this._textarea.onkeydown = this._onKeyDown.bind(this);
            this._toplevel.appendChild(this._textarea);

            this._canvas = document.createElement('canvas');
            this._toplevel.appendChild(this._canvas);
            this._canvas.onmousedown = this._onMouseDown.bind(this);
            this._canvas.onmouseup = this._onMouseUp.bind(this);
            this._canvas.onmousemove = this._onMouseMove.bind(this);
            this._textarea.style.whiteSpace = 'pre';
            this._textarea.style.overflowWrap = 'normal';
            // Hide the textarea the canvas now that we've sized it...
            this._textarea.style.position = 'absolute';
            this._canvas.style.position = 'absolute';

            visibleRAF(this._canvas, this.redraw.bind(this));
    
            // Redraw-internal state.
            this._redraw_cursorPosition = undefined;
            this._redraw_cursorBlinkStart = undefined;

            this.elem = this._toplevel;
        }
        setPrefixSuffix(prefix, suffix) {
            this._prefix = prefix;
            this._suffix = suffix;
            this._recalculate();
        }
        setFontSize(size) {
            this._textarea.style.fontSize = size;
            this._recalculate();
        }
        setSize(w, h) {
            this._canvas.width = w;
            this._canvas.height = h;
            this._toplevel.style.width = w + 'px';
            this._toplevel.style.height = h + 'px';
        }
        getValue() {
            return this._textarea.value;
        }
        setValue(t) {
            this._textarea.value = t;
            this._recalculate();
        }
        getFullText() {
            return this._prefix + this._textarea.value + this._suffix;
        }
        _isRowLocked(row) {
            // XXX: Assumes not word wrapping.
            const prefixRows = this._prefix.split('\n').length - 1;
            if (row < prefixRows)
                return true;
            const suffixRows = this._suffix.split('\n').length - 1;
            if (row >= this._lineModel.length - suffixRows)
                return true;
            return false;
        }
        _recalculate() {
            // Recalculate our line model.
            const chars = this.getFullText() + '\n';
            const lineModel = [];
            let idx = 0, row = 0, lineno = 0;
            while (true) {
                let newIdx = chars.indexOf('\n', idx);
                if (newIdx < 0)
                    break;
                const start = idx, end = newIdx + 1;
                const length = end - start - 1;
                const startRow = row;
                // XXX: At some point we used to support word wrap, but we no longer do.
                const rows = 1;
                lineModel.push({ start, end, length, rows, startRow, lineno });
                row += rows;
                lineno++;
                idx = end;
            }
            this._lineModel = lineModel;
    
            // Compute syntax highlights.
            const syntaxRuns = [];
    
            let match;
    
            // Colors taken from the railscasts color scheme.
            const keywords = (/\b(abstract|async|await|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|final|finally|float|for|from|function|goto|if|implements|import|in|instanceof|int|interface|let|long|native|new|null|of|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|try|typeof|var|void|volatile|while|with|true|false|prototype|yield)\b/g);
            while ((match = keywords.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#c26230' });
            const types = (/\b(Array|Date|eval|hasOwnProperty|Infinity|isFinite|isNaN|isPrototypeOf|Math|NaN|Number|Object|prototype|String|toString|undefined|valueOf)\b/g);
            while ((match = types.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#6d9cbe' });
            const numbers = (/\d+(\.\d+)?/g); // don't bother supporting scientific notation.
            while ((match = numbers.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#a5c261' });
            const strings = (/("[^"]*")|('[^']*')/g);
            while ((match = strings.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#6d9cbe' });
            const comments = (/\/\/.*$/gm);
            while ((match = comments.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#bc9458', style: 'italic' });
            // XXX: Overlapping runs? Need some sort of priority system here...
            syntaxRuns.sort((a, b) => a.start - b.start);
            this._syntaxRuns = syntaxRuns;
    
            const textareaStyle = window.getComputedStyle(this._textarea);
    
            const ctx = this._canvas.getContext('2d');
            ctx.font = textareaStyle.font;
            // A monospace font should have identical metrics for all characters.
            this._charWidth = ctx.measureText(' ').width;
    
            // Recalculate geometry.
            const gutterChars = ('' + this._lineModel.length).length;
            this._gutterMargin = 10;
            this._gutterWidth = this._charWidth * Math.max(gutterChars, 2) + this._gutterMargin * 2;
            this._textMargin = 10;
    
            let rowHeight = textareaStyle.lineHeight;
            if (rowHeight === 'normal')
                rowHeight = 1.2 * textareaStyle.fontSize.replace('px', '');
            this._rowHeight = rowHeight;
    
            if (this.ontextchanged)
                this.ontextchanged();
        }
        _onInput() {
            this._recalculate();
        }
        _onKeyDown(e) {
            if (e.key === 'Tab' && !e.shift) {
                // XXX: If we have a selection, then indent the selection.
                if (!this._hasSelection()) {
                    this._insertAtCursor('    ');
                }
                e.preventDefault();
            } else if (e.key === 'Tab' && e.shift) {
                // XXX: If we have a selection, then unindent the selection.
                e.preventDefault();
            }
        }
        _onMouseDown(e) {
            e.preventDefault();
            const { row, col } = this._xyToRowCol(e.layerX, e.layerY);
            if (this._isRowLocked(row))
                return;
            if (col === -1) {
                const { line, idx } = this._rowColToLineIdx(row, 0);
                this._textarea.setSelectionRange(this._idxToTextarea(line.start), this._idxToTextarea(line.end));
            } else {
                const { line, idx } = this._rowColToLineIdx(row, col);
                this._textarea.setSelectionRange(this._idxToTextarea(idx), this._idxToTextarea(idx));
                this._textarea.focus();
                this._dragIdxStart = idx;
                this._dragging = true;
            }
        }
        _onMouseMove(e) {
            const { row, col } = this._xyToRowCol(e.layerX, e.layerY);
            const { line, idx } = this._rowColToLineIdx(row, col);
            
            if (this._dragging) {
                const startIdx = Math.min(this._dragIdxStart, idx);
                const endIdx = Math.max(this._dragIdxStart, idx);
                this._textarea.setSelectionRange(this._idxToTextarea(startIdx), this._idxToTextarea(endIdx));
                this._textarea.focus();
            }
    
            if (!this._dragging && (col === -1 || this._isRowLocked(row)))
                this._canvas.style.cursor = 'default';
            else
                this._canvas.style.cursor = 'text';
        }
        _onMouseUp(e) {
            this._dragging = false;
        }
        _idxToTextarea(idx) {
            return idx - this._prefix.length;
        }
        _textareaToIdx(idx) {
            return idx + this._prefix.length;
        }
        _rowColToLineIdx(row, col) {
            let line;
            for (line of this._lineModel)
                if (row >= line.startRow && row < line.startRow + line.rows)
                    break;
    
            // We have our line. Find idx.
            let idx = line.start;
            // Fast path.
            col = Math.min(Math.max(col, 0), line.length);
            if (line.rows === 1) {
                idx += col;
            } else {
                idx += (row - line.startRow) * this._cols + col;
            }
            return { line, idx };
        }
        _xyToRowCol(x, y) {
            const row = Math.floor(y / this._rowHeight);
            let col;
            if (x < this._gutterWidth)
                col = -1;
            x -= this._gutterWidth;
            if (col === undefined && x < this._textMargin)
                col = 0;
            x -= this._textMargin;
            if (col === undefined)
                col = Math.round(x / this._charWidth);
            return { row, col };
        }
        _getRowLength(row) {
            let line;
            for (line of this._lineModel)
                if (row >= line.startRow && row < line.startRow + line.rows)
                    break;
    
            // Fast path.
            if (line.rows === 1)
                return line.length;
    
            if (row === line.startRow + line.rows - 1)
                return line.length % this._cols;
            else
                return this._cols;
        }
        _getCharPos(idx) {
            let line;
            for (line of this._lineModel)
                if (idx >= line.start && idx < line.end)
                    break;
    
            const lineIdx = idx - line.start;
            // Fast path.
            if (line.rows === 1)
                return { line, lineIdx, row: line.startRow, col: lineIdx };
    
            // Slow path.
            const col = lineIdx % this._cols;
            const row = line.startRow + Math.min((lineIdx / this._cols) | 0, line.rows);
            return { line, lineIdx, row, col };
        }
        _hasSelection() {
            return this._textarea.selectionStart !== this._textarea.selectionEnd;
        }
        _getSelection() {
            return [this._textareaToIdx(this._textarea.selectionStart), this._textareaToIdx(this._textarea.selectionEnd)];
        }
        _insertAtCursor(s) {
            this._textarea.focus();
            document.execCommand('insertText', false, s);
            this._recalculate();
        }
        redraw(t) {
            // First, recalculate anything that's dirty.
    
            const hasFocus = this._textarea.matches(':focus');
    
            if (hasFocus && !this._hasSelection()) {
                // Has a cursor.
                const cursorPosition = this._textareaToIdx(this._textarea.selectionStart);
                if (this._redraw_cursorPosition !== cursorPosition) {
                    this._redraw_cursorPosition = cursorPosition;
                    // Set it blinking again.
                    this._redraw_cursorBlinkStart = t;
                }
            } else {
                this._redraw_cursorPosition = undefined;
            }
    
            const ctx = this._canvas.getContext('2d');
    
            const bgcolor = '#232323';
            ctx.fillStyle = bgcolor;
            ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    
            const textareaStyle = window.getComputedStyle(this._textarea);
            ctx.font = textareaStyle.font;
    
            // Highlight the current line before the gutter so the shadow interacts with it.
            if (this._redraw_cursorPosition) {
                const cursorPos = this._getCharPos(this._redraw_cursorPosition);
                const row = cursorPos.row;
                const y = row * this._rowHeight;
                ctx.fillStyle = '#363430';
                ctx.fillRect(0, y, this._canvas.width, this._rowHeight);
            }
    
            // Gutter
            ctx.save();
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowOffsetX = 4;
            ctx.fillStyle = '#445';
            ctx.fillRect(0, 0, this._gutterWidth, this._canvas.height);
            ctx.restore();
    
            // Gutter text.
            ctx.fillStyle = '#ccc';
            for (const line of this._lineModel) {
                const no = line.lineno + 1;
                const y = line.startRow * this._rowHeight;
                ctx.textBaseline = 'top';
                ctx.textAlign = 'right';
                ctx.fillText(no, this._gutterWidth - this._gutterMargin, y);
            }
    
            // Add a newline at the end to make paint logic simpler.
            const chars = this.getFullText() + '\n';
    
            ctx.save();
            ctx.translate(this._gutterWidth + this._textMargin, 0);
    
            if (this._hasSelection()) {
                // Draw selection bounds.
                let inSelection = false;
                const [selectionStart, selectionEnd] = this._getSelection();
                const startPos = this._getCharPos(selectionStart);
                const endPos = this._getCharPos(selectionEnd);
    
                for (let row = startPos.row; row <= endPos.row; row++) {
                    let colStart = (row === startPos.row) ? startPos.col : 0;
                    let colEnd = (row === endPos.row) ? endPos.col : this._getRowLength(row);
    
                    const selectionColor = '#336';
                    const startX = colStart * this._charWidth;
                    const endX = colEnd * this._charWidth;
                    const y = row * this._rowHeight;
                    ctx.fillStyle = selectionColor;
                    ctx.fillRect(startX, y, endX - startX, this._rowHeight);
                }
            }
    
            // XXX: Don't generate garbage in the repaint loop.
            const syntaxRuns = this._syntaxRuns.slice();
    
            // Now for the actual paint.
            for (const line of this._lineModel) {
                let row = line.startRow, col = 0;
                for (let i = line.start; i < line.end; i++) {
                    // XXX: Use something else other than charAt for Unicode compliance.
                    const char = chars.charAt(i);
                    const x = col * this._charWidth, y = row * this._rowHeight;
    
                    if (i === this._redraw_cursorPosition) {
                        // Draw cursor.
                        ctx.save();
                        ctx.fillStyle = '#fff';
                        const blinkAnimationT = (t - this._redraw_cursorBlinkStart) / 1000;
                        const blinkAlpha = (Math.sin(blinkAnimationT * 6) + 1);
                        ctx.globalAlpha = blinkAlpha;
                        ctx.fillRect(Math.floor(x), y, 2, this._rowHeight);
                        ctx.restore();
                    }
    
                    if (char === '\n')
                        break;
    
                    let color = '#e6e1dc';
                    let style = 'normal';
                    if (syntaxRuns.length) {
                        const run = syntaxRuns[0];
                        if (i >= run.start && i < run.end) {
                            color = syntaxRuns[0].color;
                            style = syntaxRuns[0].style;
                        }
                        if (i >= run.end)
                            syntaxRuns.shift();
                    }
    
                    ctx.textBaseline = 'top';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = color;
                    ctx.font = `${style} ${textareaStyle.fontSize} ${textareaStyle.fontFamily}`;
                    ctx.fillText(char, x, y);
                    col++;
    
                    if (col === this._textarea.cols && (row - line.startRow) < line.rows - 1) {
                        row++;
                        col = 0;
                    }
                }
            }
    
            ctx.restore();
        }
    }    

    // XXX: I need better names for these variables.

    // The size of our rasterized buffer.
    var BUFFER_WIDTH = 46, BUFFER_HEIGHT = 10;

    // This rasterized buffer gets rendered so that each "picture element"
    // in it gets a giant 16x16 "cell" for demonstration purposes.
    var DISPLAY_CELL_SIZE = 16;

    var DISPLAY_YPAD = 2;

    // As such, the final size of the buffer, rendered on the canvas, is:
    var DISPLAY_WIDTH = BUFFER_WIDTH * DISPLAY_CELL_SIZE;
    var DISPLAY_HEIGHT = BUFFER_HEIGHT * DISPLAY_CELL_SIZE + DISPLAY_YPAD * 2;

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
        width = width !== undefined ? width : BUFFER_WIDTH;
        height = height !== undefined ? height : BUFFER_HEIGHT;
        ctx.beginPath();
        gridPath(ctx, width, height);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
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

    class CoverageDrawer {
        constructor(canvas) {
            this._canvas = canvas;
            visibleRAF(this._canvas, this._redraw.bind(this));
        }

        setCoverageFunc(source) {
            // Compile function.
            let f;
            try {
                f = new Function(source + '\n return coverage;');
            } catch(e) {
                // If we can't compile, don't bother doing anything.
                return;
            }

            this._coverage = f();
        }

        _redraw(time) {
            const ctx = this._canvas.getContext('2d');
            ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            ctx.save();
            ctx.translate(DISPLAY_XPAD, DISPLAY_YPAD);
            ctx.fillStyle = 'rgb(0, 0, 0)';
            drawGrid(ctx);

            for (let y = 0; y < BUFFER_HEIGHT; y++) {
                for (let x = 0; x < BUFFER_WIDTH; x++) {
                    // Number between 0 and 1.
                    const coverage = collectCoverage(x, y, this._coverage, [time]);
                    const color = `rgba(0, 0, 0, ${coverage})`;
                    ctx.fillStyle = color;
                    const px = bufferToDisplay({ x, y });
                    ctx.fillRect(px.x, px.y, DISPLAY_CELL_SIZE, DISPLAY_CELL_SIZE);
                }
            }
            ctx.restore();
        }
    }

    ArticleDemos.registerDemo("rast2-coverage-editor-1", "", function(res) {
        const demoSlot = res.demoSlot;

        const canvas = res.canvas;
        canvas.height = DISPLAY_HEIGHT;

        const coverageDrawer = new CoverageDrawer(canvas);

        const editor = new Editor();
        editor.setFontSize('14pt');
        editor.setSize(canvas.width, 250);
        editor.setPrefixSuffix('function coverage(x, y, time) {\n', '\n}');
        editor.setValue(`    const radius = 3;
    const circleX = 25 + Math.sin(time / 1000) * 10;
    const circleY = 5;
    const px = x - circleX, py = y - circleY;
    return Math.sqrt(px*px + py*py) <= radius;`);
        demoSlot.appendChild(editor.elem);

        function setCoverage() {
            coverageDrawer.setCoverageFunc(editor.getFullText());
        }

        editor.ontextchanged = setCoverage;
        setCoverage();
    });

})(window);
