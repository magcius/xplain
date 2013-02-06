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
            var clientGeom = this._server.getGeometry(this, this._windowId);
            var totalGeom = this._server.translateCoordinates(this, this._windowId, this._server.rootWindowId, 0, 0);
            return { x: totalGeom.x - clientGeom.x, y: totalGeom.y - clientGeom.y };
        },
    });

    var ImageWindow = new Class({
        Extends: Window,
        initialize: function(src) {
            this.parent();
            this._image = new Image();
            this._image.src = src;
        },
        connect: function(server) {
            this.parent(server);
            this._image.addEventListener("load", function() {
                this.moveResize(0, 0, this._image.width, this._image.height);
                this.invalidate();
            }.bind(this));
        },
        expose: function(wrapper) {
            wrapper.drawWithContext(function(ctx) {
                ctx.drawImage(this._image, 0, 0, this.width, this.height);
            }.bind(this));
            wrapper.clearDamage();
        },
    });

    var Button = new Class({
        Extends: Window,
        initialize: function() {
            this.parent();

            // Table of states
            //   Pressing? | Mouse Location | State
            // 1. no          outside          up
            // 2. no          inside           over
            // 3. yes         inside           down
            // 4. yes         outside          over

            this._pressing = false;
            this._hovering = false;
            this._state = "up";
        },
        connect: function(server) {
            this.parent(server);
            this._server.selectInput(this, this._windowId, ["Enter", "Leave", "ButtonPress", "ButtonRelease"]);
            this._server.defineCursor(this, this._windowId, "pointer");
            this._server.changeAttributes(this, this._windowId, { overrideRedirect: true });
            this._syncButtonState();
        },
        _getState: function() {
            if (!this._pressing && !this._hovering) // 1.
                return "up";
            if (!this._pressing &&  this._hovering) // 2.
                return "over";
            if (this._pressing  &&  this._hovering) // 3.
                return "down";
            if (this._pressing  && !this._hovering) // 4.
                return "over";
        },
        _syncButtonState: function() {
            var state = this._getState();
            if (this._state == state)
                return;
            this._state = state;
            this._server.invalidateWindow(this, this._windowId);
        },
        handleEvent: function(event) {
            switch(event.type) {
            case "Expose":
                this._expose(event.ctx, this._state);
                break;
            case "Enter":
                this._hovering = true;
                break;
            case "Leave":
                this._hovering = false;
                break;
            case "ButtonPress":
                this._pressing = true;
                break;
            case "ButtonRelease":
                this._pressing = false;
                if (this._hovering)
                    this.clickCallback(event);
                break;
            default:
                return this.parent(event);
            }

            this._syncButtonState();
        },
        _expose: function(wrapper) {
            wrapper.clearDamage();
        },
    });

    exports.Window = Window;
    exports.ImageWindow = ImageWindow;
    exports.Button = Button;

})(window);
