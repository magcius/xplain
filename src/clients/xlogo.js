// Contains a clone of the classic "xlogo" demos.

(function(exports) {
    "use strict";

    var Xlogo = new Class({
        initialize: function(server) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.windowId = this._display.createWindow({ x: 500, y: 50, width: 150, height: 150 });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ConfigureNotify"] });
            this._display.changeProperty({ windowId: this.windowId, name: "WM_NAME", value: "xlogo.js" });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        },
        _configureNotify: function(event) {
            // Invalidate the entire window when we get resized, as we need
            // to repaint all contents to fit the new size.
            if (event.width !== undefined || event.height !== undefined)
                this._display.invalidateWindow({ windowId: this.windowId });
        },
        _handleEvent: function(event) {
            switch(event.type) {
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            case "ConfigureNotify":
                return this._configureNotify(event);
            }
        },

        _draw: function() {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            var TAU = Math.PI * 2;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);

                var hw = width / 2, hh = height / 2;
                ctx.translate(hw, hh);

                var size = Math.min(width, height);
                var thick = size / 3;
                var thin = size / 11;
                var gap = thin / 4;
                var d31 = thin * 3 + gap;

                ctx.beginPath();
                ctx.lineWidth = thin / 2;
                ctx.strokeStyle = 'black';
                ctx.moveTo(-size + d31 - thin, size);
                ctx.lineTo(-thin / 2, thin / 4);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = thin / 2;
                ctx.strokeStyle = 'black';
                ctx.moveTo(size - d31 + thin, -size);
                ctx.lineTo(thin / 2, -thin / 4);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = thick / 2;
                ctx.strokeStyle = 'black';
                ctx.moveTo(-size + d31, -size);
                ctx.lineTo(size - d31, size);
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = thin / 4;
                ctx.strokeStyle = 'white';
                ctx.moveTo(size - d31, -size);
                ctx.lineTo(-size + d31, size);
                ctx.stroke();

            }.bind(this));
        },
    });

    exports.Xlogo = Xlogo;

})(window);
