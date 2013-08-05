(function(exports) {
    "use strict";

    var FakeTerminal = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._focused = false;
            this._buffer = "";
            this._server.configureWindow({ windowId: this.windowId,
                                           width: 700, height: 400 });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["KeyPress"] });
            this._server.changeProperty({ windowId: this.windowId,
                                          name: "WM_NAME",
                                          value: "Fake Terminal" });
            this._server.mapWindow({ windowId: this.windowId });
        },
        handleEvent: function(event) {
            switch(event.type) {
            case "KeyPress":
                return this._handleKeyPress(event);
            default:
                return this.parent(event);
            }
        },
        expose: function(event) {
            this._server.drawWithContext(this.windowId, function(ctx) {
                ctx.fillStyle = "#121212";
                ctx.fillRect(0, 0, this.width, this.height);

                ctx.font = 'bold 10pt monospace';

                var x = 4, y = 16;
                function drawText(text) {
                    var metrics = ctx.measureText(text);
                    ctx.fillText(text, x, y);
                    x += metrics.width;
                }

                ctx.fillStyle = '#8ae234';
                drawText("jstpierre@jstpierre-lappy");

                ctx.fillStyle = '#729fcf';
                drawText(" ~ $ ");

                ctx.fillStyle = '#eeeeec';
                drawText(this._buffer);
            }.bind(this));
        },
        _handleKeyPress: function(event) {
            this._buffer += String.fromCharCode(event.charCode);
            this._server.invalidateWindow({ windowId: this.windowId });
        },
    });

    exports.FakeTerminal = FakeTerminal;

})(window);
