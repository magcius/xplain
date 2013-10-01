(function(exports) {
    "use strict";

    var FakeTerminal = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._focused = false;
            this._buffer = "";
            this._display.configureWindow({ windowId: this.windowId,
                                            width: 700, height: 400 });
            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: "#121212" });
            this._display.selectInput({ windowId: this.windowId,
                                        events: ["KeyPress"] });
            this._display.changeProperty({ windowId: this.windowId,
                                           name: "WM_NAME",
                                           value: "Fake Terminal" });
            this._display.mapWindow({ windowId: this.windowId });
        },
        handleEvent: function(event) {
            switch(event.type) {
            case "KeyPress":
                return this._handleKeyPress(event);
            default:
                return this.parent(event);
            }
        },
        _draw: function() {
            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

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
            this._display.invalidateWindow({ windowId: this.windowId });
        },
    });

    exports.FakeTerminal = FakeTerminal;

})(window);
