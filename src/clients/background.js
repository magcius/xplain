(function(exports) {
    "use strict";

    var Background = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);

            this._pixmapId = 0;
            Util.loadImageAsPixmap(this._server, "demo/data/background.jpg", function(pixmapId) {
                this._pixmapId = pixmapId;
            }.bind(this));

            this._server.selectInput({ windowId: this._server.rootWindowId,
                                       events: ["ConfigureNotify"] });
            this._server.changeAttributes({ windowId: this.windowId, overrideRedirect: true });
            this._syncSize();
            this._server.mapWindow({ windowId: this.windowId });
        },
        _syncSize: function() {
            var rootWindowGeometry = this._server.getGeometry({ drawableId: this._server.rootWindowId });
            this._server.configureWindow({ windowId: this.windowId,
                                           width: rootWindowGeometry.width,
                                           height: rootWindowGeometry.height });
        },
        configureNotify: function(event) {
            this.parent(event);

            if (event.windowId === this._server.rootWindowId)
                this._syncSize();

            this._server.invalidateWindow({ windowId: this.windowId });
        },
        expose: function(event) {
            if (!this._pixmapId)
                return;

            var geom = this._server.getGeometry({ drawableId: this._pixmapId });
            var ratio = Math.max(this.width / geom.width,
                                 this.height / geom.height);
            var imageWidth = geom.width * ratio;
            var imageHeight = geom.height * ratio;
            var centerX = (this.width - imageWidth) / 2;
            var centerY = (this.height - imageHeight) / 2;

            this._server.drawWithContext(this.windowId, function(dest) {
                this._server.drawWithContext(this._pixmapId, function(src) {
                    // XXX -- this is exploiting how pixmaps work
                    dest.drawImage(src.canvas,
                                   0, 0, geom.width, geom.height,
                                   centerX, centerY, imageWidth, imageHeight);
                }.bind(this));
            }.bind(this));
        },
    });

    exports.Background = Background;

})(window);
