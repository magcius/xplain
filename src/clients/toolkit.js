(function(exports) {
    "use strict";

    var Util = {};
    Util.loadImageAsPixmap = function(server, src, callback) {
        var image = new Image();
        image.addEventListener("load", function() {
            var width = image.width;
            var height = image.height;

            var pixmapId = server.createPixmap({ width: width, height: height });
            server.drawTo(pixmapId, function(ctx) {
                ctx.drawImage(image, 0, 0);
            });

            callback(pixmapId);
        });
        image.src = src;
    };

    var Window = new Class({
        initialize: function() {
            this.x = 0;
            this.y = 0;
            this.width = 1;
            this.height = 1;
        },
        connect: function(server) {
            this._privateServer = server;
            var connection = this._privateServer.clientConnected(this);
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this.handleEvent(messageEvent.data);
            }.bind(this));
            this._server = connection.server;
            this.windowId = this._server.createWindow({ x: this.x, y: this.y,
                                                        width: this.width, height: this.height });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["Expose", "ConfigureNotify"] });
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ConfigureNotify":
                return this.configureNotify(event);
            case "Expose":
                return this.expose(event);
            }
        },
        configureNotify: function(event) {
            if (event.windowId !== this.windowId)
                return;

            if (event.x !== undefined)
                this.x = event.x;
            if (event.y !== undefined)
                this.y = event.y;
            if (event.width !== undefined)
                this.width = event.width;
            if (event.height !== undefined)
                this.height = event.height;
        },
    });

    exports.Util = Util;
    exports.Window = Window;

})(window);
