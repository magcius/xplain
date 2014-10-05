// Contains the demos in the "Advanced Window Techniques" section, demonstrating
// input and the window tree.

(function(exports) {
    "use strict";

    var Crosshairs = new Class({
        initialize: function(server) {
            var connection = server.connect();
            this._display = connection.display;

            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 1, height: 1 });

            this._display.changeProperty({ windowId: this.windowId, name: 'WM_NAME', value: 'Cross-hairs Input Demo' });
            this._display.selectInput({ windowId: this.windowId, events: ['Expose', 'Motion', 'Enter', 'Leave', 'ConfigureNotify'] });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));

            this._crosshairsVisible = false;
        },

        _draw: function() {
            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                var geom = this._display.getGeometry({ drawableId: this.windowId });

                // Background
                if (this._crosshairsVisible) {
                    ctx.fillStyle = 'white';
                } else {
                    ctx.fillStyle = '#ddd';
                }
                ctx.fillRect(0, 0, geom.width, geom.height);

                // Crosshairs
                if (this._crosshairsVisible) {
                    var hairWidth = 8;
                    var half = hairWidth / 2;

                    var mx = this._mx;
                    var my = this._my;

                    ctx.save();

                    ctx.fillStyle = 'rgba(2, 181, 240, 0.4)';
                    // Make the rects pixel-aligned
                    ctx.translate(-0.5, -0.5);

                    // Left hair
                    ctx.fillRect(0, my - half, mx - half, hairWidth);
                    // Top hair
                    ctx.fillRect(mx - half, 0, hairWidth, my - half);
                    // Right hair
                    ctx.fillRect(mx + half, my - half, geom.width, hairWidth);
                    // Bottom hair
                    ctx.fillRect(mx - half, my + half, hairWidth, geom.height);

                    ctx.restore();
                }

                // Text
                if (this._crosshairsVisible) {
                    ctx.fillStyle = '#000';
                    ctx.font = '10pt monospace';
                    ctx.fillText('X: ' + Math.ceil(this._mx), 8, 16);
                    ctx.fillText('Y: ' + Math.ceil(this._my), 8, 32);
                }

                // Border.
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'black';
                ctx.strokeRect(0, 0, geom.width, geom.height);
            }.bind(this));
        },

        _redraw: function() {
            this._display.invalidateWindow({ windowId: this.windowId });
        },

        _handleMotion: function(event) {
            this._mx = event.winX;
            this._my = event.winY;
            this._redraw();
        },

        _handleCrossing: function(event) {
            if (event.detail == "Virtual")
                return;

            this._crosshairsVisible = (event.type == "Enter");
            this._redraw();
        },

        _handleEvent: function(event) {
            switch (event.type) {
                case "Expose":
                    return this._exposeHandler.handleExpose(event);
                case "Motion":
                    return this._handleMotion(event);
                case "Enter":
                case "Leave":
                    return this._handleCrossing(event);
                case "ConfigureNotify":
                    return this._redraw();
            }
        },
    });

    ArticleDemos.registerDemo("input", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#354763' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var ch1 = new Crosshairs(server);
        display.configureWindow({ windowId: ch1.windowId, width: 150, height: 150 });
        DemoCommon.centerWindow(display, ch1.windowId);
        display.mapWindow({ windowId: ch1.windowId });

        DemoCommon.addInspector(res);
    });

    ArticleDemos.registerDemo("input-nested", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#354763' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var ch1 = new Crosshairs(server);
        display.configureWindow({ windowId: ch1.windowId, width: 150, height: 150 });
        DemoCommon.centerWindow(display, ch1.windowId);
        display.mapWindow({ windowId: ch1.windowId });

        var ch2 = new Crosshairs(server);
        display.reparentWindow({ windowId: ch2.windowId, newParentId: ch1.windowId });
        display.configureWindow({ windowId: ch2.windowId, x: 60, y: 15, width: 75, height: 75 });
        display.mapWindow({ windowId: ch2.windowId });

        var ch1Dragger = new DemoCommon.WindowDragger(server, ch1.windowId, true);
        var ch2Dragger = new DemoCommon.WindowDragger(server, ch2.windowId, false);

        DemoCommon.addInspector(res);
    });

    ArticleDemos.registerDemo("input-nested-composited", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        // Rather than use a normal background on the root window,
        // use a large background window that gets redirected so the CM
        // won't fight to paint on the root window.
        var bgWindow = display.createWindow({ x: 0, y: 0, width: 1000, height: 1000 });
        display.changeAttributes({ windowId: bgWindow, backgroundColor: '#354763' });
        display.changeProperty({ windowId: bgWindow, name: 'BACKGROUND', value: true });
        display.mapWindow({ windowId: bgWindow });

        var ch1 = new Crosshairs(server);
        display.configureWindow({ windowId: ch1.windowId, width: 150, height: 150 });
        DemoCommon.centerWindow(display, ch1.windowId);
        display.mapWindow({ windowId: ch1.windowId });

        var ch2 = new Crosshairs(server);
        display.reparentWindow({ windowId: ch2.windowId, newParentId: ch1.windowId });
        display.configureWindow({ windowId: ch2.windowId, x: 60, y: 15, width: 75, height: 75 });
        display.mapWindow({ windowId: ch2.windowId });

        var ch1Dragger = new DemoCommon.WindowDragger(server, ch1.windowId, true);
        var ch2Dragger = new DemoCommon.WindowDragger(server, ch2.windowId, false);

        var cm = new CompositingManager(server);
    });

})(window);
