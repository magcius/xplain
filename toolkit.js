(function(exports) {

    var Window = new Class({
        initialize: function() {
            this.hasInput = true;
            this.backgroundColor = null;
        },
        connect: function(server) {
            this._server = server;
            this._server.clientConnected(this);
            this._windowId = this._server.createWindow(this);
            this._server.changeAttributes(this, this._windowId, { hasInput: this.hasInput, backgroundColor: this.backgroundColor });
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
            this.x = event.x;
            this.y = event.y;
            this.width = event.width;
            this.height = event.height;
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

        getRootCoords: function() {
            var clientGeom = this._server.getGeometry(this, this._windowId);
            var totalGeom = this._server.translateCoordinates(this, this._windowId, this._server.rootWindowId, 0, 0);
            return { x: totalGeom.x - clientGeom.x, y: totalGeom.y - clientGeom.y };
        },
    });

    exports.Window = Window;

})(window);
