// Contains my custom code editor, as seen in rast2.

(function(exports) {

    const visibleRAF = CanvasUtil.visibleRAF;
    const MONOSPACE = '"Source Code Pro", "Droid Sans Mono", monospace';

    // Gross number formatting function used to lop unlucky floating points off...
    // e.g. 12345.100000007 => '12345.1'
    function formatDecimal(value) {
        let valueStr = value.toString();
        const sides = valueStr.split('.');
        const beforeDec = sides[0];
        if (sides.length === 1)
            return beforeDec;

        let afterDec = sides[1].slice(0, 2);
        if (afterDec[1] === '0') {
            afterDec = afterDec.slice(0, 1);
            if (afterDec[0] === '0')
                return beforeDec;
        }
        return beforeDec + '.' + afterDec;
    }

    // Helper class to globally set a cursor.
    class CursorOverride {
        constructor() {
            this._styleElem = document.createElement('style');
            document.head.appendChild(this._styleElem);
            this._style = this._styleElem.sheet;
            this._owner = null;
        }
        setCursor(owner, cursor) {
            // If we have a current owner, don't let modifications by other owners...
            if (this._owner && owner !== this._owner)
                return;

            if (this._style.cssRules.length)
                this._style.deleteRule(0);

            if (cursor) {
                const rule = `* { cursor: ${cursor} !important; }`;
                this._style.insertRule(rule, 0);
                this._owner = owner;
            } else {
                this._owner = null;
            }
        }
    }

    const cursorOverride = new CursorOverride();

    // This is the fancy number slider controller that comes up from the editor.
    // UI inspired by Houdini's number slider control.
    class NumberDragger {
        constructor() {
            // User callback.
            this.onvalue = null;
            this.onend = null;

            this._toplevel = document.createElement('div');
            this._toplevel.style.position = 'fixed';
            this._toplevel.style.transform = 'translate(0, -50%)';
            this._toplevel.style.fontFamily = MONOSPACE;
            this._toplevel.style.backgroundColor = '#232323';
            this._toplevel.style.color = '#c93';
            this._toplevel.style.border = '2px solid #c93';
            this._toplevel.style.lineHeight = '1.5em';
            this._toplevel.style.marginLeft = '1em';
            this._toplevel.style.borderRadius = '6px';
            this._toplevel.style.boxShadow = 'rgba(0, 0, 0, .4) 0px 4px 16px';

            this._segments = [];
            for (let exp = 2; exp >= -2; exp--) {
                const incr = Math.pow(10, exp);
                const segment = document.createElement('div');
                segment.style.padding = '.5em 1em';
                segment.textContent = incr;
                segment._incr = incr;
                this._toplevel.appendChild(segment);
                this._segments.push(segment);
            }

            this._mouseX = 0;
            this._onMouseMove = this._onMouseMove.bind(this);
            this._onMouseUp = this._onMouseUp.bind(this);
        }

        _onMouseMove(e) {
            const y = e.clientY;
            for (const segment of this._segments) {
                const bbox = segment.getBoundingClientRect();
                if (y < bbox.bottom) {
                    this._selectSegment(segment);
                    break;
                }
            }

            const accel = 10;
            const dx = ((e.clientX - this._mouseX) / accel) | 0;
            if (dx !== 0) {
                this._mouseX = e.clientX;
                this._value += this._currentIncr * dx;
                this.onvalue(this._value);
            }
        }

        _onMouseUp(e) {
            this.onend();
            document.documentElement.removeEventListener('mouseup', this._onMouseUp);
            document.documentElement.removeEventListener('mousemove', this._onMouseMove);
            document.body.removeChild(this._toplevel);

            cursorOverride.setCursor(this, '');
        }

        _selectSegment(segment) {
            const incr = segment._incr;
            if (this._currentIncr === incr)
                return;
            this._currentIncr = incr;

            for (const seg of this._segments) {
                const hilite = seg === segment;
                seg.style.backgroundColor = hilite ? '#c93' : '';
                seg.style.color = hilite ? '#222' : '';
                seg.style.fontWeight = hilite ? 'bold' : '';
            }
        }

        setPosition(x, y) {
            this._toplevel.style.left = x + 'px';
            this._toplevel.style.top = y + 'px';
        }

        show(value, e) {
            this._mouseX = e.clientX;
            this._value = value;

            // reset
            this._selectSegment(this._segments[2]);

            document.body.appendChild(this._toplevel);

            document.documentElement.addEventListener('mouseup', this._onMouseUp);
            document.documentElement.addEventListener('mousemove', this._onMouseMove);

            cursorOverride.setCursor(this, 'e-resize');
        }
    }

    // XXX: Differing browsers have inconsistent ways of drawing text... specifically,
    // they don't always agree on what 'top' baseline alignment is. This tries to
    // accurately measure the top margin by drawing a character and scanning where the top is...
    function expensiveMeasureTextMargin(width, height, font) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.font = font;
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'black';
        ctx.fillText('l', 0, 0);
        const image = ctx.getImageData(0, 0, width, height);
        for (let y = 0; y < image.height; y++)
            for (let x = 0; x < image.width; x++)
                if (image.data[4*(y*image.width+x)+3])
                    return y;
        throw new Error('wtf');
    }

    exports.Editor = class Editor {
        constructor() {
            // User-specified callback.
            this.ontextchanged = null;

            this._prefix = '';
            this._suffix = '';

            // Padding, in units of line height.
            this._paddingTop = .2;
            this._paddingBottom = 1.5;

            this._toplevel = document.createElement('div');
            this._toplevel.style.position = 'relative';

            // We need to append this to the body to measure / get metrics... :(
            // Setup is particularly wacky... maybe clean it up at some point?
            document.body.appendChild(this._toplevel);

            this._textarea = document.createElement('textarea');
            this._textarea.style.fontFamily = MONOSPACE;
            this._textarea.style.marginLeft = '4px';
            this._textarea.oninput = this._onInput.bind(this);
            this._textarea.onkeydown = this._onKeyDown.bind(this);
            this._toplevel.appendChild(this._textarea);

            this._canvas = document.createElement('canvas');
            this._toplevel.appendChild(this._canvas);
            this._onMouseDown = this._onMouseDown.bind(this);
            this._onMouseMove = this._onMouseMove.bind(this);
            this._onMouseUp = this._onMouseUp.bind(this);
            this._onMouseLeave = this._onMouseLeave.bind(this);
            this._canvas.onmousedown = this._onMouseDown;
            this._canvas.onmouseleave = this._onMouseLeave;
            this._canvas.onmousemove = this._onMouseMove;
            this._textarea.style.whiteSpace = 'pre';
            this._textarea.style.overflowWrap = 'normal';
            // Hide the textarea the canvas now that we've sized it...
            this._textarea.style.position = 'absolute';
            this._canvas.style.position = 'absolute';

            this._needsRecalculate = false;

            // Redraw-internal state.
            this._redraw_cursorPosition = undefined;
            this._redraw_cursorBlinkStart = undefined;

            this._numberDragger = new NumberDragger();
            this._numberDragger.onvalue = this._onNumberDraggerValue.bind(this);
            this._numberDragger.onend = this._onNumberDraggerEnd.bind(this);

            this.elem = this._toplevel;

            visibleRAF(this._canvas, this.redraw.bind(this));
        }

        _setNeedsRecalculate() {
            this._needsRecalculate = true;
        }

        // Sets a chunk of text at the beginning and end that the user cannot modify.
        setPrefixSuffix(prefix, suffix) {
            this._prefix = prefix;
            this._suffix = suffix;
            this._setNeedsRecalculate();
        }

        setFontSize(size) {
            this._textarea.style.fontSize = size;
            this._setNeedsRecalculate();
        }

        // Sets the size. The height here is actually a minimum height. Since we don't
        // yet have scrolling, the Editor always expands to fill however many lines it
        // takes up...
        setSize(w, h) {
            this._minHeight = h;
            this._canvas.width = w;
            this._toplevel.style.width = w + 'px';
            this._setNeedsRecalculate();
        }

        getValue() {
            return this._textarea.value;
        }
        setValue(t) {
            this._textarea.value = t;
            this._setNeedsRecalculate();
        }
        getFullText() {
            return this._prefix + this._textarea.value + this._suffix;
        }

        _isRowLocked(row) {
            // XXX(WRAP): Assumes not word wrapping.
            if (row < this._prefixRows)
                return true;
            if (row >= this._suffixRows)
                return true;
            return false;
        }
        _recalculate() {
            if (!this._needsRecalculate)
                return;

            // If we aren't attached to a parent node, recalculating is futile...
            if (!this._toplevel.parentNode)
                return;

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
                // XXX(WRAP): At some point we used to support word wrap, but we no longer do.
                const rows = 1;
                lineModel.push({ start, end, length, rows, startRow, lineno });
                row += rows;
                lineno++;
                idx = end;
            }
            this._lineModel = lineModel;

            this._prefixRows = this._prefix.split('\n').length - 1;
            this._suffixRows = this._lineModel.length - (this._suffix.split('\n').length - 1);

            // Compute syntax highlights.
            const syntaxRuns = [];
            const draggableNumbers = [];

            let match;

            // Colors taken from the railscasts color scheme.
            const keywords = (/\b(abstract|async|await|boolean|break|byte|case|catch|char|class|const|continue|debugger|default|delete|do|double|else|enum|export|extends|final|finally|float|for|from|function|goto|if|implements|import|in|instanceof|int|interface|let|long|native|new|null|of|package|private|protected|public|return|short|static|super|switch|synchronized|this|throw|throws|transient|try|typeof|var|void|volatile|while|with|true|false|prototype|yield)\b/g);
            while ((match = keywords.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#c26230' });
            const types = (/\b(Array|Date|eval|hasOwnProperty|Infinity|isFinite|isNaN|isPrototypeOf|Math|NaN|Number|Object|prototype|String|toString|undefined|valueOf)\b/g);
            while ((match = types.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#6d9cbe' });
            const numbers = (/\W-?\d+(\.\d+)?\b/g); // Don't bother supporting scientific notation on numbers...
            while ((match = numbers.exec(chars)) !== null) {
                syntaxRuns.push({ start: match.index+1, end: match.index + match[0].length, color: '#a5c261' });
                draggableNumbers.push({ start: match.index+1, end: match.index + match[0].length });
            }
            const strings = (/("[^"]*")|('[^']*')/g);
            while ((match = strings.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#6d9cbe' });
            const comments = (/\/\/.*$/gm);
            while ((match = comments.exec(chars)) !== null)
                syntaxRuns.push({ start: match.index, end: match.index + match[0].length, color: '#bc9458', style: 'italic' });

            syntaxRuns.sort((a, b) => a.start - b.start);
            this._syntaxRuns = syntaxRuns;
            this._draggableNumbers = draggableNumbers;

            const textareaStyle = window.getComputedStyle(this._textarea);
            this._textareaStyle = textareaStyle;

            const ctx = this._canvas.getContext('2d');
            ctx.font = `${textareaStyle.fontSize} ${textareaStyle.fontFamily}`;

            // We're using a monospace font. It should have identical metrics for all characters,
            // so just measuring one should be fine...
            this._charWidth = ctx.measureText(' ').width;

            let rowHeight = textareaStyle.lineHeight;
            // XXX: This seems to be a Chrome default for the line-height? Not sure how else I can
            // calculate this guy... grr...
            if (rowHeight === 'normal')
                rowHeight = 1.3 * parseFloat(textareaStyle.fontSize);
            else
                rowHeight = parseFloat(rowHeight);
            this._rowHeight = Math.ceil(rowHeight);

            if (this._charMarginTop === undefined) {
                const stdMargin = 4;
                this._charMarginTop = stdMargin - expensiveMeasureTextMargin(this._charWidth, this._rowHeight, ctx.font);
            }

            // Recalculate geometry.
            const numLines = this._lineModel.length;

            const gutterChars = ('' + numLines).length;
            this._gutterMargin = 10;
            this._gutterWidth = this._charWidth * Math.max(gutterChars, 2) + this._gutterMargin * 2;
            this._textMargin = 10;

            const newHeight = Math.max(this._minHeight, this._rowHeight * (numLines + this._paddingTop + this._paddingBottom));
            if (newHeight !== this._height) {
                this._height = newHeight;
                this._canvas.height = this._height;
                this._toplevel.style.height = this._height + 'px';
                // Resize the textarea so the window doesn't scroll back in when we click on it...
                this._textarea.style.height = (this._height - this._rowHeight) + 'px';
            }

            this._needsRecalculate = false;

            if (this.ontextchanged)
                this.ontextchanged();
        }
        _onInput() {
            this._setNeedsRecalculate();
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
            if (this._isRowLocked(row)) {
                this._textarea.blur();
            } else if (col === -1) {
                const { line, idx } = this._rowColToLineIdx(row, 0);
                this._textarea.setSelectionRange(this._idxToTextarea(line.start), this._idxToTextarea(line.end));
                this._textarea.focus();
            } else {
                const { line, idx } = this._rowColToLineIdx(row, col);

                this._dragStartX = e.clientX;
                this._dragStartY = e.clientY;

                const draggableNumber = this._findDraggableNumber(idx);
                if (draggableNumber) {
                    const { start, end } = draggableNumber;
                    const value = +this.getValue().slice(this._idxToTextarea(start), this._idxToTextarea(end));
                    this._draggingNumber = { start, end, value };

                    this._syncNumberDraggerPosition();
                    this._numberDragger.show(value, e);
                } else {
                    this._textarea.setSelectionRange(this._idxToTextarea(idx), this._idxToTextarea(idx));
                    this._textarea.focus();
                    this._dragStartIdx = idx;
                    this._dragging = 'selection';

                    document.documentElement.addEventListener('mouseup', this._onMouseUp);
                    document.documentElement.addEventListener('mousemove', this._onMouseMove);
                }
            }
        }
        _onMouseUp(e) {
            this._dragging = undefined;

            document.documentElement.removeEventListener('mouseup', this._onMouseUp);
            document.documentElement.removeEventListener('mousemove', this._onMouseMove);
        }
        _onMouseMove(e) {
            const { row, col } = this._xyToRowCol(e.layerX, e.layerY);
            const { line, idx } = this._rowColToLineIdx(row, col);
            this._mouseIdx = idx;

            if (this._dragging === 'selection') {
                const startIdx = Math.min(this._dragStartIdx, idx);
                const endIdx = Math.max(this._dragStartIdx, idx);
                this._textarea.setSelectionRange(this._idxToTextarea(startIdx), this._idxToTextarea(endIdx));
                this._textarea.focus();
            }

            // Dragging takes priority.
            let cursor;
            if (this._dragging === 'selection') {
                cursor = 'text';
            } else if (col === -1 || this._isRowLocked(row)) {
                cursor = 'default';
            } else if (this._findDraggableNumber(idx)) {
                cursor = 'e-resize';
            } else {
                cursor = 'text';
            }

            this._canvas.style.cursor = cursor;
            if (this._dragging)
                cursorOverride.setCursor(this, cursor);
            else
                cursorOverride.setCursor(this, '');
        }
        _onMouseLeave(e) {
            this._mouseIdx = undefined;
        }
        _onNumberDraggerValue(newValue) {
            this._textarea.blur();
            const start = this._idxToTextarea(this._draggingNumber.start);
            const end = this._idxToTextarea(this._draggingNumber.end);
            const newValueString = formatDecimal(newValue);
            this.setValue(this._spliceValue(start, end, newValueString));
            this._draggingNumber.end = this._draggingNumber.start + newValueString.length;
            this._syncNumberDraggerPosition();
        }
        _onNumberDraggerEnd() {
            this._draggingNumber = null;
        }
        _syncNumberDraggerPosition() {
            const { start, end } = this._draggingNumber;
            const endPos = this._getCharPos(end);
            const { x, y } = this._rowColToXY(endPos.row, endPos.col);
            const bbox = this._toplevel.getBoundingClientRect();
            const absX = bbox.left + x;
            const absY = bbox.top + y + this._rowHeight / 2;
            this._numberDragger.setPosition(absX, absY);
        }
        _spliceValue(start, end, v) {
            const chars = this.getValue();
            return chars.slice(0, start) + v + chars.slice(end);
        }
        _findDraggableNumber(idx) {
            this._recalculate();
            return this._draggableNumbers.find(({ start, end }) => {
                return idx >= start && idx <= end;
            });
        }
        _idxToTextarea(idx) {
            return idx - this._prefix.length;
        }
        _textareaToIdx(idx) {
            return idx + this._prefix.length;
        }
        _rowColToLineIdx(row, col) {
            this._recalculate();
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
            this._recalculate();
            y -= this._paddingTop * this._rowHeight;
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
        _rowColToXY(row, col) {
            const x = this._gutterWidth + this._textMargin + col * this._charWidth;
            const y = (this._paddingTop + row) * this._rowHeight;
            return { x, y };
        }
        _getRowLength(row) {
            this._recalculate();
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
            this._recalculate();
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
            // XXX: Doesn't work in Firefox. :(
            // https://github.com/w3c/editing/issues/160
            // https://bugzilla.mozilla.org/show_bug.cgi?id=1220696

            this._textarea.focus();
            document.execCommand('insertText', false, s);
            this._setNeedsRecalculate();
        }
        redraw(t) {
            this._recalculate();

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

            const textareaStyle = this._textareaStyle;
            ctx.font = `${textareaStyle.fontSize} ${textareaStyle.fontFamily}`;

            // Highlight the current line before the gutter so the shadow interacts with it.
            if (this._redraw_cursorPosition) {
                const cursorPos = this._getCharPos(this._redraw_cursorPosition);
                const row = cursorPos.row;
                const y = (this._paddingTop + row) * this._rowHeight;
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
            for (let i = 0; i < this._lineModel.length; i++) {
                const line = this._lineModel[i];
                const no = line.lineno + 1;
                const y = (this._paddingTop + line.startRow) * this._rowHeight;
                ctx.fillStyle = this._isRowLocked(line.startRow) ? '#888' : '#ccc';
                ctx.textBaseline = 'top';
                ctx.textAlign = 'right';
                ctx.fillText(no, this._gutterWidth - this._gutterMargin, this._charMarginTop + y);
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
                    const y = (this._paddingTop + row) * this._rowHeight;
                    ctx.fillStyle = selectionColor;
                    ctx.fillRect(startX, y, endX - startX, this._rowHeight);
                }
            }

            const syntaxRuns = this._syntaxRuns;
            let currentSyntaxRun = 0;

            // Anything interesting under the mouse?
            let draggableNumber;
            if (this._draggingNumber)
                draggableNumber = this._draggingNumber;
            else if (!this._dragging && this._mouseIdx > -1)
                draggableNumber = this._findDraggableNumber(this._mouseIdx);

            // Setting the font on a CanvasRenderingContext2D in Firefox is expensive, so try
            // to set it as little as possible by only setting it when it changes.
            let currentFont;
            
            // Now for the actual paint.
            for (let m = 0; m < this._lineModel.length; m++) {
                const line = this._lineModel[m];
                let row = line.startRow, col = 0;
                for (let i = line.start; i < line.end; i++) {
                    // XXX: Use something else other than charAt for Unicode compliance.
                    const char = chars.charAt(i);
                    const x = col * this._charWidth, y = (this._paddingTop + row) * this._rowHeight;

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

                    if (draggableNumber !== undefined && i >= draggableNumber.start && i < draggableNumber.end) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(x | 0, y + this._rowHeight);
                        ctx.lineTo((x + this._charWidth) | 0, y + this._rowHeight);
                        ctx.setLineDash([1, 1]);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                        ctx.restore();
                    }

                    let color = '#e6e1dc';
                    let style = '';

                    if (currentSyntaxRun < syntaxRuns.length) {
                        const run = syntaxRuns[currentSyntaxRun];
                        if (i >= run.start && i < run.end) {
                            if (run.color)
                                color = run.color;
                            if (run.style)
                                style = run.style;
                        }
                    }

                    while (currentSyntaxRun < syntaxRuns.length && i >= syntaxRuns[currentSyntaxRun].end)
                        currentSyntaxRun++;

                    ctx.textBaseline = 'top';
                    ctx.textAlign = 'left';
                    ctx.fillStyle = color;
                    const newFont = `${style} ${textareaStyle.fontSize} ${textareaStyle.fontFamily}`;
                    if (currentFont !== newFont) {
                        ctx.font = newFont;
                        currentFont = newFont;
                    }
                    ctx.fillText(char, x, y + this._charMarginTop);
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


})(window);
