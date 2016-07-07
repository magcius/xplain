// Contains the demo in the "Expert Window Techniques" article.

(function(exports) {
    "use strict";

    var BACKGROUND = '#eee';
    var FOREGROUND = '#000';
    var BACKGROUND_HILITE = '#fff';
    var FOREGROUND_HILITE = '#000';
    var BACKGROUND_SELECTED = '#aaccff';
    var FOREGROUND_SELECTED = '#000';

    var DropdownMenuPopup = new Class({
        initialize: function(connection, items, onPopdown, x, y) {
            // A weird quirk of dropdown menus is that for hover switching
            // correctly, they *need* to be on the same client as the dropdown
            // menu, since the grab encompasses everything. So, the dropdown
            // API takes a client connection rather than a server to connect
            // to, and filters out all windows that aren't its by hand.
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._items = items;
            this._onPopdown = onPopdown;

            this.heightPerItem = 32;
            this.windowId = this._display.createWindow({ x: x, y: y, width: 200, height: this._items.length * this.heightPerItem });
            this._display.changeAttributes({ windowId: this.windowId, overrideRedirect: true });
            this._display.changeProperty({ windowId: this.windowId, name: "DEBUG_NAME", value: "Dropdown Menu Popup" });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "Motion", "Leave", "ButtonPress", "ButtonRelease"] });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
            this._selectedItemIndex = -1;
            this._isPressed = false;
        },

        _setSelectedItemIndex: function(selectedItemIndex) {
            if (this._selectedItemIndex === selectedItemIndex)
                return;
            this._selectedItemIndex = selectedItemIndex;
            this._display.invalidateWindow({ windowId: this.windowId });
        },

        _handleEvent: function(event) {
            switch(event.type) {
            case "Expose":
                return this._handleExpose(event);
            case "ButtonPress":
                return this._handleButtonPress(event);
            case "ButtonRelease":
                return this._handleButtonRelease(event);
            case "Motion":
                return this._handleMotion(event);
            case "Leave":
                return this._handleLeave(event);
            }
        },
        _handleExpose: function(event) {
            if (event.windowId !== this.windowId)
                return;

            this._exposeHandler.handleExpose(event);
        },

        _handleButtonPress: function(event) {
            if (event.windowId !== this.windowId) {
                if (this._isPressed)
                    this.popdown(true);
                return;
            }

            this._isPressed = true;
            this._display.invalidateWindow({ windowId: this.windowId });
        },
        _handleButtonRelease: function(event) {
            if (!this._isPressed)
                return;

            this.popdown(true);
        },
        _handleMotion: function(event) {
            if (event.windowId !== this.windowId)
                return;

            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            // Random events are reported with respect to the grab window (us),
            // so filter out any events that come outside our window.
            if (event.winX < 0 || event.winX > width)
                return;
            if (event.winY < 0 || event.winY > height)
                return;

            var selectedItemIndex = (event.winY / this.heightPerItem) | 0;
            this._setSelectedItemIndex(selectedItemIndex);
        },
        _handleLeave: function(event) {
            if (event.windowId !== this.windowId)
                return;

            this._setSelectedItemIndex(-1);
        },

        _draw: function() {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = BACKGROUND;
                ctx.fillRect(0, 0, width, height);

                ctx.save();
                this._items.forEach(function(item, idx) {
                    if (item == "-") {
                        var middle = this.heightPerItem / 2;
                        // Separator.
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = '#aaa';
                        ctx.beginPath();
                        ctx.moveTo(0, middle);
                        ctx.lineTo(width, middle);
                        ctx.stroke();
                    } else {
                        ctx.font = '12pt sans-serif';
                        ctx.textBaseline = 'top';

                        var textLeftPad = 10;
                        var textTopPad = 8;

                        var isSelected = (idx == this._selectedItemIndex);
                        if (isSelected && this._isPressed) {
                            ctx.fillStyle = BACKGROUND_SELECTED;
                            ctx.fillRect(0, 0, width, this.heightPerItem);
                            ctx.fillStyle = FOREGROUND_SELECTED;
                            ctx.fillText(item, textLeftPad, textTopPad);
                        } else if (isSelected) {
                            ctx.fillStyle = BACKGROUND_HILITE;
                            ctx.fillRect(0, 0, width, this.heightPerItem);
                            ctx.fillStyle = FOREGROUND_HILITE;
                            ctx.fillText(item, textLeftPad, textTopPad);
                        } else {
                            ctx.fillStyle = FOREGROUND;
                            ctx.fillText(item, textLeftPad, textTopPad);
                        }
                    }
                    ctx.translate(0, this.heightPerItem);
                }.bind(this));
                ctx.restore();

                ctx.lineWidth = 2;
                ctx.strokeStyle = '#aaa';
                ctx.strokeRect(0, 0, width, height);
            }.bind(this));
        },
        _grab: function() {
            this._display.grabPointer({ windowId: this.windowId,
                                        ownerEvents: true,
                                        events: [],
                                        pointerMode: "Async" });
        },
        _ungrab: function() {
            this._display.ungrabPointer({ windowId: this.windowId });
        },
        popup: function() {
            this._selectedItemIndex = -1;
            this._display.configureWindow({ windowId: this.windowId, stackMode: "Above" });
            this._display.mapWindow({ windowId: this.windowId });
            this._grab();
        },
        popdown: function(callCallback) {
            this._isPressed = false;
            this._ungrab();
            this._display.unmapWindow({ windowId: this.windowId });

            // Set a timeout to destroy the popups so users can see them
            // being "GC"d in the inspector...
            setTimeout(function() {
                this._display.destroyWindow({ windowId: this.windowId });
            }.bind(this), 1000);

            if (callCallback)
                this._onPopdown();
        },
    });

    var DropdownMenuBar = new Class({
        initialize: function(server, items) {
            var connection = server.connect();
            this._connection = connection;
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.itemPadding = 16;

            this._createItems(items);

            this.windowId = this._display.createWindow({ x: 0, y: 0, width: this._width, height: 32 });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ButtonPress", "Motion", "Leave"] });
            this._display.changeProperty({ windowId: this.windowId, name: "DEBUG_NAME", value: "Dropdown Menu Bar" });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
            this._selectedItemIndex = -1;
            this._currentPopupItemIndex = -1;
            this._shouldMenuBeOpen = false;
        },
        _handleEvent: function(event) {
            if (event.windowId !== this.windowId)
                return;

            switch(event.type) {
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            case "ButtonPress":
                return this._handleButtonPress(event);
            case "Motion":
                return this._handleMotion(event);
            case "Leave":
                return this._handleLeave(event);
            }
        },

        _createItems: function(items) {
            // We create a canvas and context here so we can call measureText...
            // the web doesn't have a nicer way to do this, does it?

            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            ctx.font = '12pt sans-serif';

            var x = 0;
            this._items = items.map(function(itemRecord) {
                var itemLabel = itemRecord[0];
                var itemPopupItems = itemRecord[1];

                var item = {};
                item.label = itemLabel;
                item.popupItems = itemPopupItems;

                item.x = x;
                item.textWidth = ctx.measureText(itemLabel).width;
                item.slotWidth = Math.ceil(item.textWidth + this.itemPadding * 2);
                x += item.slotWidth;

                item.popupItems = itemPopupItems;
                return item;
            }.bind(this));

            // We also, for convenience, set the width of the entire bar here.
            this._width = Math.ceil(x);
        },
        _handlePopdown: function() {
            this._currentPopup = null;
            this._shouldMenuBeOpen = false;
            this._setSelectedItemIndex(-1);
            this._syncPopup();
        },
        _getPopupClass: function() {
            return DropdownMenuPopup;
        },
        _makePopup: function(item) {
            var popupX = item.x;
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var popupY = geom.height;

            var coords = this._display.translateCoordinates({ srcWindowId: this.windowId,
                                                              destWindowId: this._display.rootWindowId,
                                                              x: popupX, y: popupY });
            var popupClass = this._getPopupClass();
            return new popupClass(this._connection, item.popupItems, this._handlePopdown.bind(this), coords.x, coords.y);
        },
        _syncPopup: function() {
            if (this._shouldMenuBeOpen)
                var newPopup = this._selectedItemIndex;
            else
                var newPopup = -1;

            if (this._currentPopupItemIndex === newPopup)
                return;

            this._currentPopupItemIndex = newPopup;

            if (this._currentPopup) {
                this._currentPopup.popdown();
                this._currentPopup = null;
            }

            if (this._currentPopupItemIndex >= 0) {
                var item = this._items[this._currentPopupItemIndex];
                this._currentPopup = this._makePopup(item);
                this._currentPopup.popup();
            }

            this._display.invalidateWindow({ windowId: this.windowId });
        },
        _setSelectedItemIndex: function(selectedItemIndex) {
            if (this._selectedItemIndex === selectedItemIndex)
                return;
            this._selectedItemIndex = selectedItemIndex;
            this._display.invalidateWindow({ windowId: this.windowId });
            this._syncPopup();
        },
        _findItemByX: function(x) {
            for (var i = this._items.length - 1; i >= 0; i--) {
                var item = this._items[i];
                if (x > item.x)
                    return i;
            }
            return -1;
        },
        _handleButtonPress: function(event) {
            this._shouldMenuBeOpen = !this._shouldMenuBeOpen;
            this._syncPopup();
        },
        _handleMotion: function(event) {
            this._setSelectedItemIndex(this._findItemByX(event.winX));
        },
        _handleLeave: function(event) {
            if (!this._shouldMenuBeOpen)
                this._setSelectedItemIndex(-1);
        },
        _draw: function(ctx) {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = BACKGROUND;
                ctx.fillRect(0, 0, width, height);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                this._items.forEach(function(item, i) {
                    var x = item.x;
                    var slotWidth = item.slotWidth;
                    var textX = x + slotWidth/2;
                    var textTopPad = 8;
                    ctx.font = '12pt sans-serif';

                    if (i == this._currentPopupItemIndex) {
                        ctx.fillStyle = BACKGROUND_SELECTED;
                        ctx.fillRect(x, 0, slotWidth, height);

                        ctx.fillStyle = FOREGROUND_SELECTED;
                        ctx.fillText(item.label, textX, textTopPad);
                    } else if (i == this._selectedItemIndex) {
                        ctx.fillStyle = BACKGROUND_HILITE;
                        ctx.fillRect(x, 0, slotWidth, height);
                        ctx.fillStyle = FOREGROUND_HILITE;
                        ctx.fillText(item.label, textX, textTopPad);
                    } else {
                        ctx.fillStyle = FOREGROUND;
                        ctx.fillText(item.label, textX, textTopPad);
                    }
                }.bind(this));
            }.bind(this));
        },
    });

    var EXAMPLE_MENU_ITEMS = [
        ["File", ["New", "-", "Open...", "Save", "Save as...", "-", "Quit"]],
        ["Edit", ["Undo", "Redo", "-", "Cut", "Copy", "Paste"]],
        ["View", ["Always on Top"]],
    ];

    var Kitten = new Class({
        initialize: function(server) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.windowId = this._display.createWindow({ x: 190, y: 55, width: 400, height: 320 });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ConfigureNotify"] });
            this._display.changeProperty({ windowId: this.windowId, name: "WM_NAME", value: "kitten.jpg" });
            this._display.changeProperty({ windowId: this.windowId, name: 'WM_NORMAL_HINTS', value: {
                minWidth: 100, minHeight: 100,
            } });
            // Hide the close button so the user can't accidentally click it.
            this._display.changeProperty({ windowId: this.windowId, name: '_XJS_ACTIONS', value: {
                hasClose: false,
            } });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));

            this._menuBar = new DropdownMenuBar(server, EXAMPLE_MENU_ITEMS);
            this._display.reparentWindow({ windowId: this._menuBar.windowId, newParentId: this.windowId });
            this._display.mapWindow({ windowId: this._menuBar.windowId });

            this._pixmapId = 0;
            ClientUtil.loadImageAsPixmap(this._display, 'kitten500.jpg', function(pixmapId) {
                var geometry = this._display.getGeometry({ drawableId: pixmapId });
                this._pixmapId = pixmapId;
                this._display.invalidateWindow({ windowId: this.windowId });
            }.bind(this));
        },
        _configureNotify: function(event) {
            // Invalidate the entire window when we get resized, as we need
            // to repaint all contents to fit the new size.
            if (event.width !== undefined || event.height !== undefined)
                this._display.invalidateWindow({ windowId: this.windowId });
        },
        _handleEvent: function(event) {
            switch(event.type) {
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            case "ConfigureNotify":
                return this._configureNotify(event);
            }
        },

        _draw: function() {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = BACKGROUND;
                    ctx.fillRect(0, 0, width, height);

                var padTop = 40;
                var padBottom = 8;
                var padLeft = 8, padRight = 8;

                if (this._pixmapId) {
                    var image = this._display.getPixmapImage({ pixmapId: this._pixmapId });
                    var imageWidth = image.width, imageHeight = image.height;

                    var innerWidth = width - padLeft - padRight;
                    var innerHeight = height - padTop - padBottom;

                    var innerRatio = innerWidth / innerHeight;
                    var imageRatio = imageWidth / imageHeight;
                    var drawWidth, drawHeight;
                    if (imageRatio > innerRatio) {
                        drawWidth = innerWidth;
                        drawHeight = innerWidth / imageRatio;
                    } else {
                        drawWidth = innerHeight;
                        drawHeight = innerHeight * imageRatio;
                    }

                    var centerX = (padLeft + (innerWidth - drawWidth) / 2) | 0;
                    var centerY = (padTop + (innerHeight - drawHeight) / 2) | 0;

                    ctx.shadowColor = '#aaa';
                    ctx.shadowBlur = 10;
                    ctx.drawImage(image, centerX, centerY, drawWidth, drawHeight);

                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(centerX+.5, centerY+.5, drawWidth, drawHeight);
                }
            }.bind(this));
        },
    });

    ArticleDemos.registerDemo("example-kitten", "height: 400px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#335180' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var wm = new WindowManager(server);

        var menu = new Kitten(server);
        display.mapWindow({ windowId: menu.windowId });
    });

    var ExampleHarness = new Class({
        initialize: function(server, menubar) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 400, height: 80 });
            this._display.changeProperty({ windowId: this.windowId, name: 'WM_NORMAL_HINTS', value: {
                minWidth: 100, minHeight: 80,
            } });
            // Hide the close button so the user can't accidentally click it.
            this._display.changeProperty({ windowId: this.windowId, name: '_XJS_ACTIONS', value: {
                hasClose: false,
            } });
            this._display.changeProperty({ windowId: this.windowId, name: "WM_NAME", value: "My Amazing App" });
            this._display.changeAttributes({ windowId: this.windowId, backgroundColor: BACKGROUND });

            this._menuBar = new menubar(server, EXAMPLE_MENU_ITEMS);
            this._display.reparentWindow({ windowId: this._menuBar.windowId, newParentId: this.windowId });
            this._display.mapWindow({ windowId: this._menuBar.windowId });

            DemoCommon.centerWindow(this._display, this.windowId);
        },
    });

    var SubmenuDropdownMenuBar = new Class({
        Extends: DropdownMenuBar,
        _makePopup: function(item) {
            var popupX = item.x;
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var popupY = geom.height;

            var popup = new DropdownMenuPopup(this._connection, item.popupItems, this._handlePopdown.bind(this), popupX, popupY);
            var query = this._display.queryTree({ windowId: this.windowId });
            this._display.reparentWindow({ windowId: popup.windowId, newParentId: query.parent });
            return popup;
        },
    });

    ArticleDemos.registerDemo("subwindow", "height: 180px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#335180' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var wm = new WindowManager(server);

        var menu = new ExampleHarness(server, SubmenuDropdownMenuBar);
        display.mapWindow({ windowId: menu.windowId });
    });

    var DumbToplevelDropdownMenuBar = new Class({
        Extends: DropdownMenuBar,
        _makePopup: function(item) {
            var popup = this.parent(item);
            this._display.changeAttributes({ windowId: popup.windowId, overrideRedirect: false });
            return popup;
        },
    });

    ArticleDemos.registerDemo("dumb-toplevel-attempt", "height: 180px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#335180' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var wm = new WindowManager(server);

        var menu = new ExampleHarness(server, DumbToplevelDropdownMenuBar);
        display.mapWindow({ windowId: menu.windowId });
    });

    var DumbORDropdownMenuPopup = new Class({
        Extends: DropdownMenuPopup,
        _grab: function() {},
        _ungrab: function() {},
    });

    var DumbORDropdownMenuBar = new Class({
        Extends: DropdownMenuBar,
        _getPopupClass: function() {
            return DumbORDropdownMenuPopup;
        },
    });

    ArticleDemos.registerDemo("dumb-or-attempt", "height: 350px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#335180' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var wm = new WindowManager(server);

        var menu = new ExampleHarness(server, DumbORDropdownMenuBar);
        display.mapWindow({ windowId: menu.windowId });
    });

})(window);
