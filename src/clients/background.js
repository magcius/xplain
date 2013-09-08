(function(exports) {
    "use strict";

    var Background = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);

            this._loaded = false;
            this._image = new Image();
            this._image.addEventListener("load", function() {
                this._loaded = true;
            }.bind(this));
            this._image.src ="demo/data/background.jpg";

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

            this._destroyPixmap();
            this._server.invalidateWindow({ windowId: this.windowId });
        },
        _destroyPixmap: function() {
            this._server.freePixmap({ pixmapId: this._pixmapId });
            this._pixmapId = 0;
        },
        _ensurePixmap: function() {
            if (this._pixmapId)
                return;

            this._pixmapId = this._server.createPixmap({ width: this.width,
                                                         height: this.height });

            if (!this._loaded)
                return;

            var ratio = Math.max(this.width / this._image.width,
                                 this.height / this._image.height);
            var imageWidth = this._image.width * ratio;
            var imageHeight = this._image.height * ratio;
            var centerX = (this.width - imageWidth) / 2;
            var centerY = (this.height - imageHeight) / 2;

            this._server.drawWithContext(this._pixmapId, function(ctx) {
                ctx.drawImage(this._image,
                              0, 0, this._image.width, this._image.height,
                              centerX, centerY, imageWidth, imageHeight);
            }.bind(this));
        },
        expose: function(event) {
            if (!this._loaded)
                return;

            this._ensurePixmap();

            this._server.copyArea({ srcDrawableId: this._pixmapId,
                                    destDrawableId: this.windowId,
                                    srcX: 0, srcY: 0, destX: 0, destY: 0,
                                    width: this.width, height: this.height });
        },
    });

    exports.Background = Background;

})(window);
