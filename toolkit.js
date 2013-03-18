(function(exports) {
    "use strict";

    var Window = new Class({
        initialize: function() {
            this.backgroundColor = null;
        },
        connect: function(server) {
            this._server = server;
            this._port = this._server.clientConnected(this);
            this._port.addEventListener("message", function(messageEvent) {
                this.handleEvent(messageEvent.data);
            }.bind(this));
            this._windowId = this._server.createWindow(this);
            this._server.changeAttributes(this, this._windowId, { backgroundColor: this.backgroundColor });
            this._server.selectInput(this, this._windowId, ["Expose", "ConfigureNotify"]);
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ConfigureNotify":
                return this.configureNotify(event);
            case "Expose":
                return this.expose(event.ctx);
            }
        },
        configureNotify: function(event) {
            if (event.x !== undefined)
                this.x = event.x;
            if (event.y !== undefined)
                this.y = event.y;
            if (event.width !== undefined)
                this.width = event.width;
            if (event.height !== undefined)
                this.height = event.height;
        },
        invalidate: function() {
            this._server.invalidateWindow(this, this._windowId);
        },
        reparent: function(newParent) {
            this._server.reparentWindow(this, this._windowId, newParent._windowId);
        },
        expose: function() {
        },
        raise: function() {
            this._server.configureWindow(this, this._windowId, { stackMode: "Above" });
        },
        lower: function() {
            this._server.configureWindow(this, this._windowId, { stackMode: "Below" });
        },
        destroy: function() {
            this._server.destroyWindow(this, this._windowId);
        },
        map: function() {
            this._server.mapWindow(this, this._windowId);
        },
        unmap: function() {
            this._server.unmapWindow(this, this._windowId);
        },
        moveResize: function(x, y, width, height) {
            this._server.configureWindow(this, this._windowId, { x: x, y: y, width: width, height: height });
        },
        changeProperty: function(name, value) {
            this._server.changeProperty(this, this._windowId, name, value);
        },

        getRootCoords: function() {
            var translated = this._server.translateCoordinates(this, this._windowId, this._server.rootWindowId, 0, 0);
            return { x: translated.x, y: translated.y };
        },
    });

    exports.Window = Window;

})(window);
