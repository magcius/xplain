(function(exports) {
    "use strict";

    var Background = new Class({
        Extends: Window,
        connect: function(server) {
            this.parent(server);

            this._pixmapId = 0;
            Util.loadImageAsPixmap(this._display, "demo/data/background.jpg", function(pixmapId) {
                this._pixmapId = pixmapId;
                this._display.invalidateWindow({ windowId: this.windowId });
            }.bind(this));

            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ["ConfigureNotify"] });
            this._display.changeAttributes({ windowId: this.windowId, overrideRedirect: true });
            this._syncSize();
            this._display.mapWindow({ windowId: this.windowId });
        },
        _syncSize: function() {
            var rootWindowGeometry = this._display.getGeometry({ drawableId: this._display.rootWindowId });
            this._display.configureWindow({ windowId: this.windowId,
                                            width: rootWindowGeometry.width,
                                            height: rootWindowGeometry.height });
        },
        configureNotify: function(event) {
            this.parent(event);

            if (event.windowId === this._display.rootWindowId)
                this._syncSize();

            this._display.invalidateWindow({ windowId: this.windowId });
        },
        _draw: function() {
            if (!this._pixmapId)
                return;

            var image = this._display.getPixmapImage({ pixmapId: this._pixmapId });
            var ratio = Math.max(this.width / image.width,
                                 this.height / image.height);
            var imageWidth = image.width * ratio;
            var imageHeight = image.height * ratio;
            var centerX = (this.width - imageWidth) / 2;
            var centerY = (this.height - imageHeight) / 2;

            this._display.drawTo(this.windowId, function(ctx) {
                this._clipToExposedRegion(ctx);

                ctx.drawImage(image,
                              0, 0, image.width, image.height,
                              centerX, centerY, imageWidth, imageHeight);
            }.bind(this));
        },
    });

    exports.Background = Background;

})(window);
