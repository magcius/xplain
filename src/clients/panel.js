(function(exports) {
    "use strict";

    var PANEL_BACKGROUND_COLOR = "#eeeeec";

    var Panel = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._leftButtons = [];
            this._rightButtons = [];
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: PANEL_BACKGROUND_COLOR });
            this._server.selectInput({ windowId: this._server.rootWindowId,
                                       events: ["ConfigureNotify"] });
            this._server.changeProperty({ windowId: this.windowId,
                                          name: "_NET_WM_WINDOW_TYPE",
                                          value: "_NET_WM_WINDOW_TYPE_DOCK" });
            this._syncSize();
            this._server.mapWindow({ windowId: this.windowId });
        },
        _syncSize: function() {
            var rootWindowGeometry = this._server.getGeometry({ windowId: this._server.rootWindowId });
            this._server.configureWindow({ windowId: this.windowId,
                                           width: rootWindowGeometry.width,
                                           height: 30 });
        },
        _relayout: function() {
            var padding = 4;
            var x;
            x = padding;

            var buttonHeight = this.height - 1;
            this._leftButtons.forEach(function(button) {
                var geom = this._server.getGeometry({ windowId: button.windowId });
                this._server.configureWindow({ windowId: button.windowId,
                                               x: x, y: 0, height: buttonHeight });
                x += geom.width + padding;
            }.bind(this));

            x = this.width - padding;
            this._rightButtons.forEach(function(button) {
                var geom = this._server.getGeometry({ windowId: button.windowId });
                x -= geom.width;
                this._server.configureWindow({ windowId: button.windowId,
                                               x: x, y: 0, height: buttonHeight });
                x -= padding;
            }.bind(this));
        },
        configureNotify: function(event) {
            this.parent(event);

            // Try and resize if the root window changes size
            if (event.windowId === this._server.rootWindowId)
                this._syncSize();

            // If we've changed width, relayout.
            else if (event.windowId === this.windowId && event.width !== undefined)
                this._relayout();

            // And if a button changes width, relayout as well.
            else if (event.windowId !== this.windowId && event.width !== undefined)
                this._relayout();
        },
        _addButton: function(box, button) {
            box.push(button);
            this._server.selectInput({ windowId: button.windowId,
                                       events: ["ConfigureNotify"] });
            this._server.reparentWindow({ windowId: button.windowId,
                                          newParentId: this.windowId });
            this._server.mapWindow({ windowId: button.windowId });
            this._relayout();
        },
        _removeButton: function(box, button) {
            var idx = box.indexOf(button);
            // XXX -- way to unselect for input
            this._server.reparentWindow({ windowId: button.windowId,
                                          newParentId: this._server.rootWindowId });
            box.splice(idx, 1);
        },
        addLauncher: function(launcher) {
            this._addButton(this._leftButtons, launcher);
        },
        removeLauncher: function(launcher) {
            this._removeButton(this._leftButtons, launcher);
        },
        addAction: function(action) {
            this._addButton(this._rightButtons, action);
        },
        removeAction: function(action) {
            this._removeButton(this._rightButtons, action);
        },
        expose: function(event) {
            this._server.drawWithContext(this.windowId, function(ctx) {
                ctx.strokeStyle = '#bec0c0';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, this.height - 0.5);
                ctx.lineTo(this.width, this.height - 0.5);
                ctx.stroke();
            }.bind(this));
        },
    });

    // Used for operations like measureText which require
    // a 2D context but we don't really draw anything to.
    var tmpCanvas = document.createElement("canvas");
    var tmpCtx = tmpCanvas.getContext("2d");

    var Menu = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: "#ffffff",
                                            overrideRedirect: true });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["ButtonPress", "ButtonRelease"] });
        },
        _syncGeometry: function(openerWindowId) {
            var tree = this._server.queryTree({ windowId: openerWindowId });
            var geometry = this._server.getGeometry({ windowId: openerWindowId });
            var rootCoords = this._server.translateCoordinates({ srcWindowId: tree.parent,
                                                                 destWindowId: this._server.rootWindowId,
                                                                 x: geometry.x, y: geometry.y });

            var width = 200;
            var height = 200;

            // XXX: hardcoded anchor to the bottom right
            var openerRight = rootCoords.x + geometry.width;
            var openerBottom = rootCoords.y + geometry.height;

            var x = openerRight - width;
            var y = openerBottom;

            this._server.configureWindow({ windowId: this.windowId,
                                           x: x, y: y, width: width, height: height });
        },
        _grab: function() {
            this._server.grabPointer({ windowId: this.windowId,
                                       ownerEvents: true,
                                       events: [],
                                       pointerMode: "Async",
                                       cursor: "" });
        },
        _ungrab: function() {
            this._server.ungrabPointer({ windowId: this.windowId });
        },
        open: function(openerWindowId, closedCallback) {
            this._syncGeometry(openerWindowId);
            this._server.mapWindow({ windowId: this.windowId });
            this._grab();
            this._closedCallback = closedCallback;
       },
        close: function() {
            this._server.unmapWindow({ windowId: this.windowId });
            this._closedCallback();
        },
        expose: function() {
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonRelease":
                return this.close();
            default:
                return this.parent(event);
            }
        },
    });

    var MenuButton = new Class({
        Extends: Window,
        initialize: function(label) {
            this.parent();
            this._label = label;

            this.menu = new Menu();
        },
        connect: function(server) {
            this.parent(server);
            this._syncSize();
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: PANEL_BACKGROUND_COLOR });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["ButtonPress"] });

            this.menu.connect(server);
        },
        _syncSize: function() {
            var padding = 4;
            tmpCtx.save();
            tmpCtx.font = '11pt sans';
            var metrics = tmpCtx.measureText(this._label);
            tmpCtx.restore();
            var width = metrics.width + padding * 2;
            this._server.configureWindow({ windowId: this.windowId,
                                           width: width });
        },
        expose: function(event) {
            var padding = 4;
            this._server.drawWithContext(this.windowId, function(ctx) {
                ctx.font = '11pt sans';
                ctx.fillStyle = '#000000';
                // XXX: Browsers can't measure alphabetic baseline yet,
                // so just hardcode it for now.
                // var metrics = ctx.measureText(this._label);
                // var baseline = metrics.alphabeticBaseline;
                var baseline = 11;
                var y = (this.height - baseline) / 2 + baseline;
                ctx.fillText(this._label, padding, y);
            }.bind(this));
        },
        _onMenuClosed: function() {
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: PANEL_BACKGROUND_COLOR });
        },
        _clicked: function() {
            this.menu.open(this.windowId, this._onMenuClosed.bind(this));
            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: "#ffffff" });
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonPress":
                return this._clicked(event);
            default:
                return this.parent(event);
            }
        },
    });

    var Button = new Class({
        Extends: Window,
        initialize: function(imageSrc) {
            this.parent();
            this._imageSrc = imageSrc;
        },
        connect: function(server) {
            this.parent(server);

            this._loaded = false;
            this._image = new Image();
            this._image.addEventListener("load", function() {
                this._loaded = true;
                this._server.configureWindow({ windowId: this.windowId,
                                               width: this._image.width,
                                               height: this._image.height });
            }.bind(this));
            this._image.src = this._imageSrc;

            this._server.changeAttributes({ windowId: this.windowId,
                                            backgroundColor: PANEL_BACKGROUND_COLOR,
                                            cursor: "pointer" });
            this._server.selectInput({ windowId: this.windowId,
                                       events: ["ButtonPress"] });
        },
        configureNotify: function(event) {
            this.parent(event);
            this._server.invalidateWindow({ windowId: this.windowId });
        },
        expose: function(event) {
            this._server.drawWithContext(this.windowId, function(ctx) {
                if (!this._loaded)
                    return;

                var x = ((this.width - this._image.width) / 2) | 0;
                var y = ((this.height - this._image.height) / 2) | 0;
                ctx.drawImage(this._image, x, y, this._image.width, this._image.height);
            }.bind(this));
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonPress":
                return this._clicked(event);
            default:
                return this.parent(event);
            }
        },
    });

    var Refresh = new Class({
        Extends: Button,
        initialize: function() {
            this.parent("demo/data/refresh.png");
        },
        _clicked: function() {
            this._server.invalidateWindow({ windowId: this._server.rootWindowId,
                                            includeChildren: true });
        },
    });

    var Launcher = new Class({
        Extends: Button,
        initialize: function(imageSrc, constructor) {
            this.parent(imageSrc);
            this._constructor = constructor;
        },
        _clicked: function() {
            var client = new this._constructor();
            client.connect(this._privateServer);
        },
    });

    exports.Panel = Panel;
    exports.MenuButton = MenuButton;
    exports.Launcher = Launcher;
    exports.Refresh = Refresh;

})(window);
