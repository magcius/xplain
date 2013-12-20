(function(exports) {
    "use strict";

    var PADDING = 10;

    var CalculatorBase = new Class({
        initialize: function(server) {
            var connection = server.connect();
            this._display = connection.display;
            this._events = new EventRegistry();
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._events.handleEvent(messageEvent.data);
            }.bind(this));

            this._stack = [];
            this._currentValue = "0";
            this._reset = true;

            this.windowId = this._createToplevel();

            this._createLayout();
            this._syncCurrentValue();
        },

        _strokeWindow: function (windowId, ctx) {
            var geom = this._display.getGeometry({ drawableId: windowId });
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';
            ctx.strokeRect(0, 0, geom.width, geom.height);
            return geom;
        },

        _createLabel: function(text, y) {
            var display = this._display;

            var toplevelGeom = display.getGeometry({ drawableId: this.windowId });
            var windowId = display.createWindow({ x: PADDING, y: y, width: toplevelGeom.width - PADDING * 2, height: 30 });
            display.changeAttributes({ windowId: windowId, backgroundColor: '#ffffff' });
            display.changeProperty({ windowId: windowId, name: 'DEBUG_NAME', value: "Label \"" + text + "\"" });
            display.reparentWindow({ windowId: windowId, newParentId: this.windowId });
            display.mapWindow({ windowId: windowId });
            display.selectInput({ windowId: windowId, events: ['Expose'] })

            function labelExpose(event) {
                display.drawTo(event.windowId, function(ctx) {
                    ctx.font = 'bolder 12pt sans-serif';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#000000';
                    ctx.fillText(text, 0, 0);
                });
            }
            this._events.registerHandler(windowId, 'Expose', labelExpose);
            return windowId;
        },

        _createTextField: function(y) {
            var display = this._display;

            var toplevelGeom = display.getGeometry({ drawableId: this.windowId });
            var windowId = display.createWindow({ x: PADDING, y: y, width: toplevelGeom.width - PADDING * 2, height: 30 });
            display.changeAttributes({ windowId: windowId, backgroundColor: '#ffffff' });
            display.changeProperty({ windowId: windowId, name: 'DEBUG_NAME', value: 'Text Field' });
            display.reparentWindow({ windowId: windowId, newParentId: this.windowId });
            display.selectInput({ windowId: windowId, events: ['Expose'] })
            display.mapWindow({ windowId: windowId });

            var text = "";
            function textFieldExpose(event) {
                display.drawTo(event.windowId, function(ctx) {
                    var geom = this._strokeWindow(event.windowId, ctx);
                    ctx.font = 'bolder 16pt monospace';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#000000';
                    ctx.fillText(text, geom.width - 4, 6);
                }.bind(this));
            }
            function setText(value) {
                text = value;
                display.invalidateWindow({ windowId: windowId });
            }

            this._events.registerHandler(windowId, 'Expose', textFieldExpose.bind(this));
            return { windowId: windowId, setText: setText };
        },

        _createButton: function(x, y, width, height, text, callback) {
            var display = this._display;

            var windowId = display.createWindow({ x: x, y: y, width: width, height: height });
            display.reparentWindow({ windowId: windowId, newParentId: this.windowId });
            display.changeAttributes({ windowId: windowId, cursor: 'pointer' });
            display.mapWindow({ windowId: windowId });
            display.changeProperty({ windowId: windowId, name: 'DEBUG_NAME', value: "Button \"" + text + "\"" });
            display.selectInput({ windowId: windowId, events: ['Expose', 'Enter', 'Leave', 'ButtonPress', 'ButtonRelease'] });

            var entered = false, pressed = false;
            function syncBackground() {
                var bg = pressed ? '#000000' : entered ? '#dddddd' : '#ffffff';
                display.changeAttributes({ windowId: windowId, backgroundColor: bg });
            }

            function buttonExpose(event) {
                display.drawTo(windowId, function(ctx) {
                    var geom = this._strokeWindow(windowId, ctx);
                    ctx.font = '12pt monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = pressed ? '#ffffff' : '#000000';
                    ctx.fillText(text, geom.width / 2, 4);
                }.bind(this));
            }
            function buttonEnter(event) {
                entered = true;
                syncBackground();
            }
            function buttonLeave(event) {
                entered = false;
                syncBackground();
            }
            function buttonPress(event) {
                pressed = true;
                syncBackground();
            }
            function buttonRelease(event) {
                pressed = false;
                syncBackground();
                callback(event);
            }

            syncBackground();

            this._events.registerHandler(windowId, 'Expose', buttonExpose.bind(this));
            this._events.registerHandler(windowId, 'Enter', buttonEnter.bind(this));
            this._events.registerHandler(windowId, 'Leave', buttonLeave.bind(this));
            this._events.registerHandler(windowId, 'ButtonPress', buttonPress.bind(this));
            this._events.registerHandler(windowId, 'ButtonRelease', buttonRelease.bind(this));
            return windowId;
        },

        _createButtons: function(baseY) {
            var display = this._display;

            function buttonPressed(text) {
                if ('0123456789.'.indexOf(text) >= 0)
                    this._append(text);
                else if ('+-*/'.indexOf(text) >= 0)
                    this._operator(text);
                else if (text == 'ENT')
                    this._enter();
            }

            var toplevelGeom = display.getGeometry({ drawableId: this.windowId });

            ['7',  '8',  '9',  '*',
             '4',  '5',  '6',  '/',
             '1',  '2',  '3',  '+',
             '0',  '.', 'ENT', '-'].forEach(function(text, i) {
                var cols = 4;
                var spacing = 5;
                var gridY = (i / cols) | 0;
                var gridX = (i % cols) | 0;

                var baseX = PADDING;

                var width = (toplevelGeom.width - PADDING * 2 - (spacing * (cols - 1))) / cols;
                var height = 25;

                var x = baseX + gridX * (width + spacing);
                var y = baseY + gridY * (height + spacing);

                this._createButton(x, y, width, height, text, buttonPressed.bind(this, text));
            }.bind(this));
        },

        _createContent: function(y) {
            y += PADDING;
            this._textField = this._createTextField(y);
            y += 30 + PADDING;
            this._createButtons(y);
        },

        _syncCurrentValue: function() {
            this._textField.setText(this._currentValue);
        },
        _append: function(c) {
            if (c == '.') {
                if (this._currentValue.indexOf('.') >= 0)
                    return;
                this._currentValue += '.';
                this._syncCurrentValue();
            } else {
                if (this._reset)
                    this._currentValue = c;
                else
                    this._currentValue += c;
                this._reset = false;
                this._syncCurrentValue();
            }
        },
        _enter: function() {
            this._reset = true;
            this._stack.push(parseFloat(this._currentValue));
        },
        _operator: function(op) {
            if (!this._reset)
                this._enter();
            var v1 = this._stack.pop();
            var v2 = this._stack.pop();

            switch (op) {
                case '+': this._currentValue = (v2 + v1).toString(); break;
                case '-': this._currentValue = (v2 - v1).toString(); break;
                case '*': this._currentValue = (v2 * v1).toString(); break;
                case '/': this._currentValue = (v2 / v1).toString(); break;
            }
            this._syncCurrentValue();
        }
    });

    var CalculatorSSD = new Class({
        Extends: CalculatorBase,

        _createToplevel: function() {
            var display = this._display;

            var toplevelWidth = 200;
            var toplevelHeight = 174;

            var toplevelId = display.createWindow({ x: 0, y: 0, width: toplevelWidth, height: toplevelHeight });
            display.changeAttributes({ windowId: toplevelId, backgroundColor: '#ffffff' });
            display.changeProperty({ windowId: toplevelId, name: 'WM_NAME', value: "Calculator" });
            display.selectInput({ windowId: toplevelId, events: ['Expose'] })

            return toplevelId;
        },

        _createLayout: function() {
            this._createContent(0);
        },
    });

    var CalculatorCSD = new Class({
        Extends: CalculatorBase,

        _createToplevel: function() {
            var display = this._display;

            var toplevelWidth = 200;
            var toplevelHeight = 220;

            var toplevelId = display.createWindow({ x: 0, y: 0, width: toplevelWidth, height: toplevelHeight });
            display.changeAttributes({ windowId: toplevelId, backgroundColor: '#ffffff' });
            display.changeProperty({ windowId: toplevelId, name: 'WM_NAME', value: "Calculator" });
            display.selectInput({ windowId: toplevelId, events: ['Expose'] })

            function toplevelExpose(event) {
                this._display.drawTo(event.windowId, function(ctx) {
                    this._strokeWindow(event.windowId, ctx);
                }.bind(this));
            }
            this._events.registerHandler(toplevelId, 'Expose', toplevelExpose.bind(this));

            return toplevelId;
        },

        _createLayout: function() {
            this._createLabel("Calculator", PADDING);
            this._createContent(PADDING + 30);
        },
    });

    exports.CalculatorSSD = CalculatorSSD;
    exports.CalculatorCSD = CalculatorCSD;

})(window);
