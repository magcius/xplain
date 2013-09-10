(function(exports) {

    function Calculator(server) {
        var connection = server.connect();
        var display = connection.display;
        var events = new EventRegistry();
        var port = connection.clientPort;
        port.addEventListener("message", function(messageEvent) {
            events.handleEvent(messageEvent.data);
        });

        var toplevelWidth = 200;
        var toplevelHeight = 220;
        var toplevelId = display.createWindow({ x: 0, y: 0, width: toplevelWidth, height: toplevelHeight });
        display.changeAttributes({ windowId: toplevelId, backgroundColor: '#ffffff' });
        display.selectInput({ windowId: toplevelId, events: ['Expose'] })

        function strokeWindow(windowId, ctx) {
            var geom = display.getGeometry({ drawableId: windowId });
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#000000';
            ctx.strokeRect(0, 0, geom.width, geom.height);
            return geom;
        }

        function toplevelExpose(event) {
            display.drawTo(event.windowId, function(ctx) {
                strokeWindow(event.windowId, ctx);
            });
        }
        events.registerHandler(toplevelId, 'Expose', toplevelExpose);

        var padding = 10;

        function createLabel(text, y) {
            var windowId = display.createWindow({ x: padding, y: y, width: toplevelWidth - padding * 2, height: 30 });
            display.changeAttributes({ windowId: windowId, backgroundColor: '#ffffff' });
            display.reparentWindow({ windowId: windowId, newParentId: toplevelId });
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
            events.registerHandler(windowId, 'Expose', labelExpose);
            return windowId;
        }

        createLabel("Calculator", padding);

        function createTextField(y) {
            var windowId = display.createWindow({ x: padding, y: y, width: toplevelWidth - padding * 2, height: 30 });
            display.changeAttributes({ windowId: windowId, backgroundColor: '#ffffff' });
            display.reparentWindow({ windowId: windowId, newParentId: toplevelId });
            display.selectInput({ windowId: windowId, events: ['Expose'] })
            display.mapWindow({ windowId: windowId });

            var text = "";
            function textFieldExpose(event) {
                display.drawTo(event.windowId, function(ctx) {
                    var geom = strokeWindow(event.windowId, ctx);
                    ctx.font = 'bolder 16pt monospace';
                    ctx.textAlign = 'right';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#000000';
                    ctx.fillText(text, geom.width - 4, 6);
                });
            }
            function setText(value) {
                text = value;
                display.invalidateWindow({ windowId: windowId });
            }

            events.registerHandler(windowId, 'Expose', textFieldExpose);
            return { windowId: windowId, setText: setText };
        }

        var textField = createTextField(padding + 34);

        var stack = [];
        var currentValue = "0";
        var reset = true;
        function syncCurrentValue() {
            textField.setText(currentValue);
        }
        function append(c) {
            if (c == '.') {
                if (currentValue.indexOf('.') >= 0)
                    return;
                currentValue += '.';
                syncCurrentValue();
            } else {
                if (reset)
                    currentValue = c;
                else
                    currentValue += c;
                reset = false;
                syncCurrentValue();
            }
        }
        function enter() {
            reset = true;
            stack.push(parseFloat(currentValue));
        }
        function operator(op) {
            if (!reset)
                enter();
            var v1 = stack.pop();
            var v2 = stack.pop();

            switch (op) {
                case '+': currentValue = (v2 + v1).toString(); break;
                case '-': currentValue = (v2 - v1).toString(); break;
                case '*': currentValue = (v2 * v1).toString(); break;
                case '/': currentValue = (v2 / v1).toString(); break;
            }
            syncCurrentValue();
        }
        syncCurrentValue();

        function createButton(x, y, width, height, text, callback) {
            var windowId = display.createWindow({ x: x, y: y, width: width, height: height });
            display.reparentWindow({ windowId: windowId, newParentId: toplevelId });
            display.changeAttributes({ windowId: windowId, cursor: 'pointer' });
            display.mapWindow({ windowId: windowId });
            display.selectInput({ windowId: windowId, events: ['Expose', 'Enter', 'Leave', 'ButtonPress', 'ButtonRelease'] });

            var entered = false, pressed = false;
            function syncBackground() {
                var bg = pressed ? '#000000' : entered ? '#dddddd' : '#ffffff';
                display.changeAttributes({ windowId: windowId, backgroundColor: bg });
            }

            function buttonExpose(event) {
                display.drawTo(windowId, function(ctx) {
                    var geom = strokeWindow(windowId, ctx);
                    ctx.font = '12pt monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = pressed ? '#ffffff' : '#000000';
                    ctx.fillText(text, geom.width / 2, 4);
                });
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

            events.registerHandler(windowId, 'Expose', buttonExpose);
            events.registerHandler(windowId, 'Enter', buttonEnter);
            events.registerHandler(windowId, 'Leave', buttonLeave);
            events.registerHandler(windowId, 'ButtonPress', buttonPress);
            events.registerHandler(windowId, 'ButtonRelease', buttonRelease);
            return windowId;
        }

        function buttonPressed(text) {
            if ('0123456789.'.indexOf(text) >= 0)
                append(text);
            else if ('+-*/'.indexOf(text) >= 0)
                operator(text);
            else if (text == 'ENT')
                enter();
        }

        ['7',  '8',  '9',  '*',
         '4',  '5',  '6',  '/',
         '1',  '2',  '3',  '+',
         '0',  '.', 'ENT', '-'].forEach(function(text, i) {
            var cols = 4;
            var spacing = 5;
            var gridY = (i / cols) | 0;
            var gridX = (i % cols) | 0;

            var baseX = padding;
            var baseY = 92;

            var width = (toplevelWidth - padding * 2 - (spacing * (cols - 1))) / cols;
            var height = 25;

            var x = baseX + gridX * (width + spacing);
            var y = baseY + gridY * (height + spacing);

            createButton(x, y, width, height, text, buttonPressed.bind(null, text));
        });

        return toplevelId;
    }

    exports.Calculator = Calculator;

})(window);
