// Contains the demo in the "Expert Window Techniques" article.

(function(exports) {
    "use strict";

    var ResizeGrip = new Class({
        initialize: function(server, parentWindowId) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._parentWindowId = parentWindowId;
            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 16, height: 16 });
            this._display.selectInput({ windowId: this._parentWindowId, events: ["ConfigureNotify"] });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ButtonPress"] });
            this._display.changeAttributes({ windowId: this.windowId, cursor: "bottom-right" });
            this._display.changeProperty({ windowId: this.windowId, name: "DEBUG_NAME", value: "Resize Grip" });
            this._display.reparentWindow({ windowId: this.windowId, newParentId: this._parentWindowId });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
            this._parentResized();
        },
        _handleEvent: function(event) {
            switch(event.type) {
            case "ButtonPress":
                return this._handleButtonPress(event);
            case "ButtonRelease":
                return this._handleButtonRelease(event);
            case "Motion":
                return this._handleMotion(event);
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            case "ConfigureNotify":
                return this._parentReconfigured(event);
            }
        },
        _sync: function() {
            var dx = this._rootMouseX - this._origRootMouseX;
            var dy = this._rootMouseY - this._origRootMouseY;
            var newWidth = this._origWindowWidth + dx;
            var newHeight = this._origWindowHeight + dy;
            this._display.configureWindow({ windowId: this._parentWindowId, width: newWidth, height: newHeight });
        },
        _updateWindowFromEvent: function(event) {
            this._rootMouseX = event.rootX;
            this._rootMouseY = event.rootY;
            this._sync();
        },
        _handleButtonRelease: function(event) {
            if (event.button != 1)
                return;

            this._updateWindowFromEvent(event);
            this._display.ungrabPointer({ windowId: this._windowId });
        },
        _handleMotion: function(event) {
            this._updateWindowFromEvent(event);
        },
        _handleButtonPress: function(event) {
            if (event.button != 1)
                return;

            this._origRootMouseX = event.rootX;
            this._origRootMouseY = event.rootY;
            var parentGeometry = this._display.getGeometry({ drawableId: this._parentWindowId });
            this._origWindowWidth = parentGeometry.width;
            this._origWindowHeight = parentGeometry.height;
            this._updateWindowFromEvent(event);

            this._display.grabPointer({ windowId: this.windowId,
                                        ownerEvents: false,
                                        events: ["ButtonRelease", "Motion"],
                                        pointerMode: "Async" });
        },
        _parentReconfigured: function(event) {
            if (event.width !== undefined || event.height !== undefined)
                this._parentResized(event);
        },
        _parentResized: function() {
            var geometry = this._display.getGeometry({ drawableId: this.windowId });
            var parentGeometry = this._display.getGeometry({ drawableId: this._parentWindowId });

            this._display.configureWindow({ windowId: this.windowId,
                                            x: parentGeometry.width - geometry.width,
                                            y: parentGeometry.height - geometry.height });
        },
        _draw: function() {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.rect(0, 0, width, height);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#000';
                var N_LINES = 4;
                for (var i = 0; i < N_LINES; i++) {
                    var startX = (i / N_LINES) * (width / 2);
                    var endX = startX + width;
                    var endY = (i / N_LINES) * (height / 2);
                    var startY = endY + height;
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                }
                ctx.stroke();
            }.bind(this));
        },
    })

    var MoveGrip = new Class({
        initialize: function(server, parentWindowId) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._parentWindowId = parentWindowId;
            this.windowId = this._display.createWindow({ x: 8, y: 8, width: 16, height: 16 });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ButtonPress"] });
            this._display.changeAttributes({ windowId: this.windowId, cursor: "grab" });
            this._display.changeProperty({ windowId: this.windowId, name: "DEBUG_NAME", value: "Move Grip" });
            this._display.reparentWindow({ windowId: this.windowId, newParentId: this._parentWindowId });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));
        },
        _handleEvent: function(event) {
            switch(event.type) {
            case "ButtonPress":
                return this._handleButtonPress(event);
            case "ButtonRelease":
                return this._handleButtonRelease(event);
            case "Motion":
                return this._handleMotion(event);
            case "Expose":
                return this._exposeHandler.handleExpose(event);
            }
        },
        _sync: function() {
            var dx = this._rootMouseX - this._origRootMouseX;
            var dy = this._rootMouseY - this._origRootMouseY;
            var newX = this._origWindowX + dx;
            var newY = this._origWindowY + dy;
            this._display.configureWindow({ windowId: this._parentWindowId, x: newX, y: newY });
        },
        _updateWindowFromEvent: function(event) {
            this._rootMouseX = event.rootX;
            this._rootMouseY = event.rootY;
            this._sync();
        },
        _handleButtonRelease: function(event) {
            if (event.button != 1)
                return;

            this._updateWindowFromEvent(event);
            this._display.ungrabPointer({ windowId: this._windowId });
        },
        _handleMotion: function(event) {
            this._updateWindowFromEvent(event);
        },
        _handleButtonPress: function(event) {
            if (event.button != 1)
                return;

            this._origRootMouseX = event.rootX;
            this._origRootMouseY = event.rootY;
            var parentGeometry = this._display.getGeometry({ drawableId: this._parentWindowId });
            this._origWindowX = parentGeometry.x;
            this._origWindowY = parentGeometry.y;
            this._updateWindowFromEvent(event);

            this._display.grabPointer({ windowId: this.windowId,
                                        ownerEvents: false,
                                        events: ["ButtonRelease", "Motion"],
                                        pointerMode: "Async",
                                        cursor: "grabbing" });
        },
        _draw: function() {
            var geom = this._display.getGeometry({ drawableId: this.windowId });
            var width = geom.width, height = geom.height;

            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);

                ctx.fillStyle = '#777';
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.rect(0, 0, width, height);
                ctx.fill();
                ctx.stroke();
            }.bind(this));
        },
    })

    var DropdownMenuPopup = new Class({
        initialize: function(connection, items, onPopdown) {
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
            this.windowId = this._display.createWindow({ x: 0, y: 0, width: 200, height: this._items.length * this.heightPerItem });
            this._display.changeAttributes({ windowId: this.windowId, overrideRedirect: true });
            this._display.changeProperty({ windowId: this.windowId, name: "DEBUG_NAME", value: "Dropdown Menu Popup" });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose"] });
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

                ctx.fillStyle = '#fff';
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
                            ctx.fillStyle = '#000';
                            ctx.fillRect(0, 0, width, this.heightPerItem);
                            ctx.fillStyle = '#fff';
                            ctx.fillText(item, textLeftPad, textTopPad);
                        } else if (isSelected) {
                            ctx.fillStyle = '#ccc';
                            ctx.fillRect(0, 0, width, this.heightPerItem);
                            ctx.fillStyle = '#000';
                            ctx.fillText(item, textLeftPad, textTopPad);
                        } else {
                            ctx.fillStyle = '#000';
                            ctx.fillText(item, textLeftPad, textTopPad);
                        }
                    }
                    ctx.translate(0, this.heightPerItem);
                }.bind(this));
                ctx.restore();

                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.strokeRect(0, 0, width, height);
            }.bind(this));
        },
        popup: function(x, y) {
            this._selectedItemIndex = -1;
            this._display.configureWindow({ windowId: this.windowId, x: x, y: y });
            this._display.mapWindow({ windowId: this.windowId });
            this._display.grabPointer({ windowId: this.windowId,
                                        ownerEvents: true,
                                        events: ["ButtonPress", "ButtonRelease", "Motion", "Leave"],
                                        pointerMode: "Async" });
        },
        popdown: function(callCallback) {
            this._isPressed = false;
            this._display.ungrabPointer({ windowId: this.windowId });
            this._display.unmapWindow({ windowId: this.windowId });

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

                item.popup = new DropdownMenuPopup(this._connection, itemPopupItems, this._handlePopdown.bind(this));
                return item;
            }.bind(this));

            // We also, for convenience, set the width of the entire bar here.
            this._width = Math.ceil(x);
        },
        _handlePopdown: function() {
            this._shouldMenuBeOpen = false;
            this._setSelectedItemIndex(-1);
            this._syncPopup();
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
                var popupX = item.x;
                var geom = this._display.getGeometry({ drawableId: this.windowId });
                var popupY = geom.height;

                var coords = this._display.translateCoordinates({ srcWindowId: this.windowId,
                                                                  destWindowId: this._display.rootWindowId,
                                                                  x: popupX, y: popupY });

                this._currentPopup = item.popup;
                this._currentPopup.popup(coords.x, coords.y);
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

                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, width, height);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';

                this._items.forEach(function(item, i) {
                    var x = item.x;
                    var slotWidth = item.slotWidth;
                    var textX = x + slotWidth/2;
                    var textTopPad = 6;
                    ctx.font = '12pt sans-serif';

                    if (i == this._currentPopupItemIndex) {
                        ctx.fillStyle = '#000';
                        ctx.fillRect(x, 0, slotWidth, height);
                        ctx.fillStyle = '#fff';
                        ctx.fillText(item.label, textX, textTopPad);
                    } else if (i == this._selectedItemIndex) {
                        ctx.fillStyle = '#eee';
                        ctx.fillRect(x, 0, slotWidth, height);
                        ctx.fillStyle = '#000';
                        ctx.fillText(item.label, textX, textTopPad);
                    } else {
                        ctx.fillStyle = '#000';
                        ctx.fillText(item.label, textX, textTopPad);
                    }
                }.bind(this));
            }.bind(this));
        },
    });

    var Kitten = new Class({
        initialize: function(server) {
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this.windowId = this._display.createWindow({ x: 200, y: 50, width: 300, height: 300 });
            this._display.selectInput({ windowId: this.windowId, events: ["Expose", "ConfigureNotify"] });
            this._display.changeProperty({ windowId: this.windowId, name: "WM_NAME", value: "Image Viewer" });
            this._exposeHandler = new ClientUtil.ExposeHandler(this._draw.bind(this));

            this._resizeGrip = new ResizeGrip(server, this.windowId);
            this._display.mapWindow({ windowId: this._resizeGrip.windowId });

            this._moveGrip = new MoveGrip(server, this.windowId);
            this._display.mapWindow({ windowId: this._moveGrip.windowId });

            var menuItems = [
                ["File", ["New", "-", "Open...", "Save", "Save as...", "-", "Quit"]],
                ["Edit", ["Undo", "Redo", "-", "Cut", "Copy", "Paste"]],
                ["View", ["Always on Top"]],
            ];

            this._menuBar = new DropdownMenuBar(server, menuItems);
            this._display.reparentWindow({ windowId: this._menuBar.windowId, newParentId: this.windowId });
            this._display.configureWindow({ windowId: this._menuBar.windowId, x: 32, y: 1 });
            this._display.mapWindow({ windowId: this._menuBar.windowId });

            /*
            this._menuPopup = new DropdownMenuPopup(server, menuItems[0][1]);
            this._menuPopup.popup(100, 100);
            */
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

                ctx.fillStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000';
                ctx.rect(0, 0, width, height);
                ctx.fill();
                ctx.stroke();
            }.bind(this));
        },
    });

    ArticleDemos.registerDemo("menu-example", "height: 400px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        DemoCommon.setBackground(display, DemoCommon.makeStipple(display));

        var menu = new Kitten(server);
        display.mapWindow(menu);
    });

})(window);
