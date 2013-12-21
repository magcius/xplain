// Contains a very simple gnome-panel-like app that can contain widgets
// in the left/right zones.

(function(exports) {
    "use strict";

    var PANEL_BACKGROUND_COLOR = "#eeeeec";

    var Panel = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);
            this._leftButtons = [];
            this._rightButtons = [];
            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: PANEL_BACKGROUND_COLOR });
            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ["ConfigureNotify"] });
            this._display.changeProperty({ windowId: this.windowId,
                                           name: "_NET_WM_WINDOW_TYPE",
                                           value: "_NET_WM_WINDOW_TYPE_DOCK" });
            this._syncSize();
            this._display.mapWindow({ windowId: this.windowId });
        },
        _syncSize: function() {
            var rootWindowGeometry = this._display.getGeometry({ drawableId: this._display.rootWindowId });
            this._display.configureWindow({ windowId: this.windowId,
                                            width: rootWindowGeometry.width,
                                            height: 30 });
        },
        _relayout: function() {
            var padding = 4;
            var x;
            x = padding;

            var buttonHeight = this.height - 1;
            this._leftButtons.forEach(function(button) {
                var geom = this._display.getGeometry({ drawableId: button.windowId });
                this._display.configureWindow({ windowId: button.windowId,
                                                x: x, y: 0, height: buttonHeight });
                x += geom.width + padding;
            }.bind(this));

            x = this.width - padding;
            this._rightButtons.forEach(function(button) {
                var geom = this._display.getGeometry({ drawableId: button.windowId });
                x -= geom.width;
                this._display.configureWindow({ windowId: button.windowId,
                                               x: x, y: 0, height: buttonHeight });
                x -= padding;
            }.bind(this));
        },
        configureNotify: function(event) {
            this.parent(event);

            // Try and resize if the root window changes width
            if (event.windowId === this._display.rootWindowId && event.width !== undefined)
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
            this._display.selectInput({ windowId: button.windowId,
                                        events: ["ConfigureNotify"] });
            this._display.reparentWindow({ windowId: button.windowId,
                                           newParentId: this.windowId });
            this._display.mapWindow({ windowId: button.windowId });
            this._relayout();
        },
        _removeButton: function(box, button) {
            var idx = box.indexOf(button);
            this._display.selectInput({ windowId: button.windowId,
                                        events: ["!ConfigureNotify"] });
            this._display.reparentWindow({ windowId: button.windowId,
                                           newParentId: this._display.rootWindowId });
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
        _draw: function() {
            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

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
            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: "#ffffff",
                                             overrideRedirect: true });
            this._display.selectInput({ windowId: this.windowId,
                                       events: ["ButtonPress", "ButtonRelease"] });
        },
        _syncGeometry: function(openerWindowId) {
            var tree = this._display.queryTree({ windowId: openerWindowId });
            var geometry = this._display.getGeometry({ drawableId: openerWindowId });
            var rootCoords = this._display.translateCoordinates({ srcWindowId: tree.parent,
                                                                 destWindowId: this._display.rootWindowId,
                                                                 x: geometry.x, y: geometry.y });

            var width = 200;
            var height = 200;

            // XXX: hardcoded anchor to the bottom right
            var openerRight = rootCoords.x + geometry.width;
            var openerBottom = rootCoords.y + geometry.height;

            var x = openerRight - width;
            var y = openerBottom;

            this._display.configureWindow({ windowId: this.windowId,
                                           x: x, y: y, width: width, height: height });
        },
        _grab: function() {
            this._display.grabPointer({ windowId: this.windowId,
                                        ownerEvents: true,
                                        events: [],
                                        pointerMode: "Async",
                                        cursor: "" });
        },
        _ungrab: function() {
            this._display.ungrabPointer({ windowId: this.windowId });
        },
        open: function(openerWindowId, closedCallback) {
            this._syncGeometry(openerWindowId);
            this._display.configureWindow({ windowId: this.windowId, stackMode: "Above" });
            this._display.mapWindow({ windowId: this.windowId });
            this._grab();
            this._closedCallback = closedCallback;
        },
        close: function() {
            this._display.unmapWindow({ windowId: this.windowId });
            this._closedCallback();
        },
        _draw: function() {
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
            this._font = '11pt sans-serif';

            this.menu = new Menu();
        },
        connect: function(server) {
            this.parent(server);
            this._syncSize();
            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: PANEL_BACKGROUND_COLOR });
            this._display.selectInput({ windowId: this.windowId,
                                        events: ["ButtonPress"] });

            this.menu.connect(server);
        },
        _syncSize: function() {
            var padding = 4;
            tmpCtx.save();
            tmpCtx.font = this._font;
            var metrics = tmpCtx.measureText(this._label);
            tmpCtx.restore();
            var width = metrics.width + padding * 2;
            this._display.configureWindow({ windowId: this.windowId,
                                            width: width });
        },
        _draw: function() {
            var padding = 4;
            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.font = this._font;
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
            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: PANEL_BACKGROUND_COLOR });
            this._display.invalidateWindow({ windowId: this.windowId });
        },
        _clicked: function() {
            this.menu.open(this.windowId, this._onMenuClosed.bind(this));
            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: "#ffffff" });
            this._display.invalidateWindow({ windowId: this.windowId });
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

            this._pixmapId = 0;
            Util.loadImageAsPixmap(this._display, this._imageSrc, function(pixmapId) {
                this._pixmapId = pixmapId;
                var geom = this._display.getGeometry({ drawableId: this._pixmapId });
                this._display.configureWindow({ windowId: this.windowId,
                                                width: geom.width,
                                                height: geom.height });
                this._display.invalidateWindow({ windowId: this.windowId });
            }.bind(this));

            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: PANEL_BACKGROUND_COLOR,
                                             cursor: "pointer" });
            this._display.selectInput({ windowId: this.windowId,
                                        events: ["ButtonPress"] });
        },
        configureNotify: function(event) {
            this.parent(event);
            this._display.invalidateWindow({ windowId: this.windowId });
        },
        _draw: function() {
            if (!this._pixmapId)
                return;

            var image = this._display.getPixmapImage({ pixmapId: this._pixmapId });
            var x = ((this.width - image.width) / 2) | 0;
            var y = ((this.height - image.height) / 2) | 0;
            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);
                ctx.drawImage(image, x, y, image.width, image.height);
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
            this._display.invalidateWindow({ windowId: this._display.rootWindowId,
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
