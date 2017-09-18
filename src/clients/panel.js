(function(exports) {
    "use strict";

    var PANEL_BACKGROUND_COLOR = "#eeeeec";

    class Panel {
        constructor(server) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._clientButtons = [];
            this._display.selectInput({ windowId: this._display.rootWindowId, events: ["ConfigureNotify"] });
            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 1, height: 1 });
            this._display.changeProperty({ windowId: this.windowId,
                                           name: "_NET_WM_WINDOW_TYPE",
                                           value: "_NET_WM_WINDOW_TYPE_DOCK" });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose"] });
            this._syncSize();
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        }
        _syncSize() {
            var rootWindowGeometry = this._display.getGeometry({ drawableId: this._display.rootWindowId });
            var panelHeight = 30;
            this._display.configureWindow({ windowId: this.windowId,
                                            y: rootWindowGeometry.height - panelHeight,
                                            width: rootWindowGeometry.width,
                                            height: panelHeight });
        }
        _relayout() {
            var padding = 4;
            var x;
            x = padding;

            var buttonHeight = this.height - 1;
            this._clientButtons.forEach(function(button) {
                var geom = this._display.getGeometry({ windowId: button.windowId });
                this._display.configureWindow({ windowId: button.windowId,
                                                x: x, y: 0, height: buttonHeight });
                x += geom.width + padding;
            }.bind(this));
        }
        _configureNotify(event) {
            // Try and resize if the root window changes size
            if (event.windowId === this._server.rootWindowId)
                this._syncSize();

            // If we've changed width, relayout.
            else if (event.windowId === this.windowId && event.width !== undefined)
                this._relayout();

            // And if a button changes width, relayout as well.
            else if (event.windowId !== this.windowId && event.width !== undefined)
                this._relayout();
        }
        _handleEvent(event) {
            switch(event.type) {
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            case "ConfigureNotify":
                return this._configureNotify(event);
            }
        }
        _draw() {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, width, height);

                ctx.strokeStyle = '#bbb';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, 0.5);
                ctx.lineTo(width, 0.5);
                ctx.stroke();
            }.bind(this));
        }
    }

    exports.Panel = Panel;

})(window);
