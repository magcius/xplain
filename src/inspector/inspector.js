// Contains the "Inspector", which allows the user to inspect and investigate
// the X server interactively.

(function(exports) {
    "use strict";

    // A <canvas> that overlays the X server and highlights certain windows
    // by drawing semi-transparent boxes and anchor lines.
    var InspectorHighlighter = new Class({
        initialize: function(server) {
            this._server = server;
            var connection = server.connect();

            this._display = connection.display;
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._highlightedWindowId = null;

            this._canvas = document.createElement("canvas");
            this._canvas.classList.add("inspector-highlight");
            this._ctx = this._canvas.getContext('2d');

            server.elem.appendChild(this._canvas);

            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ['SubstructureNotify'] });
            this._syncSize();
        },

        _syncSize: function() {
            var geom = this._display.getGeometry({ drawableId: this._display.rootWindowId });
            this._canvas.width = geom.width;
            this._canvas.height = geom.height;
        },

        _handleEvent: function(event) {
            this._draw();
        },

        _draw: function() {
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
            this._ctx.beginPath();

            if (this._highlightedWindowId != null) {
                var geom = this._display.getGeometry({ drawableId: this._highlightedWindowId });
                var coords = this._display.translateCoordinates({ srcWindowId: this._highlightedWindowId,
                                                                  destWindowId: this._display.rootWindowId,
                                                                  x: 0, y: 0 });
                this._ctx.fillStyle = 'rgba(100, 140, 200, 0.6)';
                this._ctx.fillRect(coords.x, coords.y, geom.width, geom.height);

                var query = this._display.queryTree({ windowId: this._highlightedWindowId });
                if (query.parent) {
                    var parentCoords = this._display.translateCoordinates({ srcWindowId: query.parent,
                                                                            destWindowId: this._display.rootWindowId,
                                                                            x: 0, y: 0 });

                    // Horizontal alignment anchor
                    this._ctx.moveTo(parentCoords.x, coords.y + 0.5);
                    this._ctx.lineTo(coords.x, coords.y + 0.5);

                    // Vertical alignment anchor
                    this._ctx.moveTo(coords.x + 0.5, parentCoords.y);
                    this._ctx.lineTo(coords.x + 0.5, coords.y);

                    this._ctx.strokeStyle = 'rgb(20, 75, 20)';
                    this._ctx.setLineDash([1]);
                    this._ctx.lineDashOffset = 1;
                    this._ctx.stroke();
                }
            }
        },

        setWindowToHighlight: function(xid) {
            this._highlightedWindowId = xid;
            this._draw();
        },
    });

    // A simple window that opens/closes the inspector when clicking on it.
    var InspectorButton = new Class({
        Extends: Window,
        initialize: function(inspector) {
            this.parent();
            this._inspector = inspector;
        },
        connect: function(server) {
            this.parent(server);
            this._display.changeAttributes({ windowId: this.windowId, cursor: 'pointer', overrideRedirect: true });
            this._display.changeProperty({ windowId: this.windowId, name: 'DEBUG_NAME', value: "Inspector Button" });
            this._display.selectInput({ windowId: this.windowId, events: ["ButtonRelease"] });
            this._display.selectInput({ windowId: this._display.rootWindowId, events: ["ConfigureNotify"] });
            this._display.configureWindow({ windowId: this.windowId, width: 32, height: 32 });
            this._syncConfiguration();

            this.setShowing(false);
            this._display.mapWindow({ windowId: this.windowId });
        },
        _syncConfiguration: function() {
            var rootGeom = this._display.getGeometry({ drawableId: this._display.rootWindowId });
            var selfGeom = this._display.getGeometry({ drawableId: this.windowId });

            // Place in the top-right of the root window.
            var padding = 10;
            var x = rootGeom.width - selfGeom.width - padding;
            var y = padding;
            this._display.configureWindow({ windowId: this.windowId, x: x, y: y });
        },
        configureNotify: function(event) {
            if (event.windowId == this._display.rootWindowId) {
                this._syncConfiguration();
                this._display.invalidateWindow({ windowId: this.windowId });
            } else {
                this.parent(event);
                this._display.invalidateWindow({ windowId: this.windowId });
            }
        },
        _draw: function() {
            this._display.drawTo(this.windowId, function(ctx) {
                this._exposeHandler.clip(ctx);
                var geom = this._display.getGeometry({ drawableId: this.windowId });
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#000000';
                ctx.strokeRect(0, 0, geom.width, geom.height);

                ctx.font = 'bold 12pt monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillStyle = this._showing ? '#ffffff' : '#000000';
                ctx.fillText('i', geom.width / 2, 8);
            }.bind(this));
        },
        _clicked: function() {
            this._inspector.toggle();
        },
        setShowing: function(showing) {
            this._showing = showing;
            var color = this._showing ? '#000000' : '#ffffff';
            this._display.changeAttributes({ windowId: this.windowId, backgroundColor: color });
            this._display.invalidateWindow({ windowId: this.windowId });
        },
        handleEvent: function(event) {
            switch (event.type) {
            case "ButtonRelease":
                return this._clicked(event);
            default:
                return this.parent(event);
            }
        },
    });

    // A simple client that takes a pointer grab, allowing the user to click
    // on a window. It also takes a highlighter, which it will use to highlight
    // a specific window on hover.
    var WindowChooser = new Class({
        initialize: function(server, highlighter) {
            this._server = server;
            this._highlighter = highlighter;

            var connection = server.connect();
            this._display = connection.display;
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ["X-CursorWindowChanged"] });
            this._cursorWindow = null;
        },

        grab: function() {
            this._display.grabPointer({ windowId: this._display.rootWindowId,
                                        ownerEvents: true,
                                        events: ['ButtonRelease'],
                                        pointerMode: 'Async',
                                        cursor: 'x-cursor' });
        },

        _handleEvent: function(event) {
            switch (event.type) {
            case "ButtonRelease":
                this._display.ungrabPointer();
                this._highlighter.setWindowToHighlight(null);
                this.onChosen(this._cursorWindow);
                this._display.disconnect();
                return;
            case "X-CursorWindowChanged":
                this._cursorWindow = event.newCursorWindow;
                this._highlighter.setWindowToHighlight(event.newCursorWindow);
                return;
            }
        },
    });

    // A simple custom-content tooltip that tracks the cursor when
    // the user hovers over the target element.
    var Tooltip = new Class({
        initialize: function(target) {
            this._target = target;
            this._target.addEventListener("mouseover", this._onTargetMouseOver.bind(this));
            this._target.addEventListener("mouseout", this._onTargetMouseOut.bind(this));
            this._target.addEventListener("mousemove", this._onTargetMouseMove.bind(this));

            this.elem = document.createElement("div");
            this.elem.classList.add("tooltip");
            this.elem.style.position = "absolute";
            document.body.appendChild(this.elem);

            this._setVisible(false);
        },

        _setVisible: function(shown) {
            this.elem.style.display = shown ? "block" : "none";
        },

        _updateForEvent: function(e) {
            this.elem.style.left = e.pageX + 'px';
            this.elem.style.top = e.pageY + 'px';
        },

        _onTargetMouseOver: function(e) {
            this._setVisible(true);
            this._updateForEvent(e);
        },

        _onTargetMouseOut: function(e) {
            this._setVisible(false);
        },

        _onTargetMouseMove: function(e) {
            this._updateForEvent(e);
        },
    });

    function empty(node) {
        while (node.firstChild)
            node.removeChild(node.firstChild);
    }

    var WindowTree = new Class({
        initialize: function(server) {
            this._server = server;
            var connection = server.connect();
            this._display = connection.display;
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('window-tree');

            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ['SubstructureNotify', 'X-CursorWindowChanged'] });

            this.elem = this._toplevel;
        },

        _handleConfigureNotify: function(event) {
            // The only thing that can change the window tree is a
            // restack. Resizes and moves won't change the window tree,
            // so don't rebuild it in that case.
            if (event.stackMode !== undefined)
                this._syncWindowTree();
        },

        _handleEvent: function(event) {
            switch (event.type) {
                case "X-CursorWindowChanged":
                    return this._setCursorWindow(event.oldCursorWindow, event.newCursorWindow);
                case "ConfigureNotify":
                    return this._handleConfigureNotify(event);
                case "MapNotify":
                case "UnmapNotify":
                case "DestroyNotify":
                    return this._syncWindowTree();
            }
        },

        _getDebugName: function(xid) {
            var debugName;
            if (!debugName)
                debugName = this._display.getProperty({ windowId: xid, name: "DEBUG_NAME" });
            if (!debugName)
                debugName = this._display.getProperty({ windowId: xid, name: "WM_NAME" });
            if (!debugName)
                debugName = "Unnamed Window";

            return debugName;
        },
        _makeWindowLabel: function(xid) {
            var node = document.createElement("div");
            node.classList.add('title');

            var debugNameLabel = document.createElement("span");
            debugNameLabel.classList.add('debug-name');
            debugNameLabel.textContent = this._getDebugName(xid);
            node.appendChild(debugNameLabel);

            var xidLabel = document.createElement("span");
            xidLabel.classList.add('xid');
            xidLabel.textContent = xid;
            node.appendChild(xidLabel);

            var emblems = document.createElement("span");
            node.appendChild(emblems);

            var cursorWindowEmblem = document.createElement("span");
            cursorWindowEmblem.classList.add('cursor-window-emblem');
            emblems.appendChild(cursorWindowEmblem);

            return node;
        },
        _setCursorWindow: function(oldId, newId) {
            if (this._windowTreeNodes[oldId])
                this._windowTreeNodes[oldId].classList.remove("cursor-window");
            if (this._windowTreeNodes[newId])
                this._windowTreeNodes[newId].classList.add("cursor-window");
        },
        selectWindow: function(xid) {
            if (this._windowTreeNodes[this._selectedWindowId])
                this._windowTreeNodes[this._selectedWindowId].classList.remove("selected");
            this._selectedWindowId = xid;
            if (this._windowTreeNodes[this._selectedWindowId])
                this._windowTreeNodes[this._selectedWindowId].classList.add("selected");
        },
        _syncWindowTree: function() {
            var makeNodeForWindow = function(xid) {
                var node = document.createElement("div");
                node.classList.add('window');

                var windowLabel = this._makeWindowLabel(xid);
                node.appendChild(windowLabel);

                var childList = document.createElement("div");
                childList.classList.add('children');
                node.appendChild(childList);

                // Recurse
                var query = this._display.queryTree({ windowId: xid });
                query.children.forEach(function(childXid) {
                    childList.appendChild(makeNodeForWindow(childXid));
                });

                node.addEventListener("mouseover", function(event) {
                    this.onWindowHighlighted(xid);
                    event.stopPropagation();
                }.bind(this));
                node.addEventListener("mouseout", function(event) {
                    this.onWindowHighlighted(null);
                    event.stopPropagation();
                }.bind(this));
                node.addEventListener("click", function(event) {
                    this.onWindowSelected(xid);
                    event.stopPropagation();
                }.bind(this));

                this._windowTreeNodes[xid] = node;

                return node;
            }.bind(this);

            empty(this._toplevel);
            this._windowTreeNodes = {};

            var rootNode = makeNodeForWindow(this._display.rootWindowId);
            this._toplevel.appendChild(rootNode);

            var pointerInfo = this._display.queryPointer();
            this._setCursorWindow(0, pointerInfo.child);

            // Ensure that the node still appears selected
            this.selectWindow(this._selectedWindowId);
        },
    });

    var HeaderBox = new Class({
        initialize: function(title) {
            this._toplevel = document.createElement('div');

            this._header = document.createElement('div');
            this._header.classList.add('window-inspector-header');
            this._header.textContent = title;
            this._toplevel.appendChild(this._header);

            this.content = document.createElement('div');
            this._toplevel.appendChild(this.content);

            this.elem = this._toplevel;
        },

        setVisible: function(visible) {
            this._toplevel.style.display = visible ? 'block' : 'none';
        },
    });

    // The right-hand pane of the inspector. It shows the window's geometry,
    // its attributes, and any custom properties.
    var WindowDetails = new Class({
        initialize: function(server) {
            this._server = server;
            var connection = server.connect();
            this._display = connection.display;
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('window-details');

            this._geometry = new HeaderBox("Geometry");
            this._geometry.content.classList.add('geometry-box');
            this._toplevel.appendChild(this._geometry.elem);

            this._attributes = new HeaderBox("Attributes");
            this._attributes.content.classList.add('attribute-list');
            this._toplevel.appendChild(this._attributes.elem);

            this._properties = new HeaderBox("Properties");
            this._properties.content.classList.add('property-list');
            this._toplevel.appendChild(this._properties.elem);

            this._noWindowSelected = document.createElement('div');
            this._noWindowSelected.classList.add('no-window-selected');
            this._noWindowSelected.textContent = "No window selected";
            this._toplevel.appendChild(this._noWindowSelected);

            this.elem = this._toplevel;

            this._sync();
        },

        // Creates a simple box/label to show a color.
        _createColorDisplay: function(color) {
            var node = document.createElement('span');

            var colorDisplay = document.createElement('span');
            colorDisplay.classList.add('color-display');
            colorDisplay.style.backgroundColor = color;
            node.appendChild(colorDisplay);

            var valueItem = document.createElement('span');
            valueItem.classList.add('value');
            valueItem.classList.add('literal');
            valueItem.textContent = color;
            node.appendChild(valueItem);

            return node;
        },

        // Creates a box that shows a pixmap, and shows the full pixmap
        // in a Tooltip when hovering over it.
        _createPixmapDisplay: function(xid) {
            var node = document.createElement('span');

            var image = this._display.getPixmapImage({ pixmapId: xid });

            function createCanvas() {
                var canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                return canvas;
            }

            var pixmapDisplayThumb = createCanvas();
            pixmapDisplayThumb.classList.add('pixmap-display-thumb');
            node.appendChild(pixmapDisplayThumb);

            var tooltip = new Tooltip(pixmapDisplayThumb);
            var pixmapDisplay = createCanvas();
            pixmapDisplay.classList.add('pixmap-display');
            tooltip.elem.appendChild(pixmapDisplay);

            var tooltipDescription = document.createElement('span');
            tooltipDescription.innerHTML = "<span>" + image.width + "</span>×<span>" + image.height + "</span>, pixmap ID <span>" + xid + "</span>";
            tooltipDescription.classList.add('tooltip-description');
            tooltip.elem.appendChild(tooltipDescription);

            var valueItem = document.createElement('span');
            valueItem.classList.add('value');
            valueItem.classList.add('xid');
            valueItem.textContent = xid;
            node.appendChild(valueItem);

            return node;
        },

        _syncGeometry: function() {
            empty(this._geometry.content);
            var geometry = this._display.getGeometry({ drawableId: this._selectedWindowId });

            var geometrySize = document.createElement('div');
            geometrySize.classList.add('geometry-size');
            geometrySize.innerHTML = '<span>' + geometry.width + '</span>×<span>' + geometry.height + '</span>';
            this._geometry.content.appendChild(geometrySize);

            var geometryPos = document.createElement('div');
            geometryPos.classList.add('geometry-position');
            geometryPos.innerHTML = '<span>' + geometry.x + '</span>, <span>' + geometry.y + '</span>';
            this._geometry.content.appendChild(geometryPos);
        },

        _syncAttributes: function() {
            empty(this._attributes.content);
            var attribs = this._display.getAttributes({ windowId: this._selectedWindowId });

            if (attribs.backgroundColor) {
                var node = document.createElement('div');
                node.classList.add('attribute');

                var nameNode = document.createElement('span');
                nameNode.classList.add('name');
                nameNode.textContent = 'background-color';
                node.appendChild(nameNode);
                node.appendChild(this._createColorDisplay(attribs.backgroundColor));
                this._attributes.content.appendChild(node);
            }

            if (attribs.backgroundPixmap) {
                var node = document.createElement('div');
                node.classList.add('attribute');

                var nameNode = document.createElement('span');
                nameNode.classList.add('name');
                nameNode.textContent = 'background-pixmap';
                node.appendChild(nameNode);

                node.appendChild(this._createPixmapDisplay(attribs.backgroundPixmap));

                if (attribs.backgroundColor)
                    node.classList.add('overridden');

                this._attributes.content.appendChild(node);
            }
        },

        _syncProperties: function() {
            empty(this._properties.content);

            var makeNodeForProperty = function(name, value) {
                var node = document.createElement('div');
                node.classList.add('property');

                var nameNode = document.createElement('span');
                nameNode.classList.add('name');
                nameNode.textContent = name;
                node.appendChild(nameNode);

                var valueNode = document.createElement('span');
                valueNode.classList.add('value');
                valueNode.textContent = JSON.stringify(value);
                node.appendChild(valueNode);

                return node;
            };

            var props = this._display.listProperties({ windowId: this._selectedWindowId });
            props.forEach(function(name) {
                var value = this._display.getProperty({ windowId: this._selectedWindowId, name: name });
                var node = makeNodeForProperty(name, value);
                this._properties.content.appendChild(node);
            }.bind(this));
        },

        _sync: function() {
            var hasWindow = !!this._selectedWindowId;
            this._geometry.setVisible(hasWindow);
            this._attributes.setVisible(hasWindow);
            this._properties.setVisible(hasWindow);
            this._noWindowSelected.style.display = (!hasWindow) ? 'flex' : 'none';

            if (hasWindow) {
                this._syncGeometry();
                this._syncAttributes();
                this._syncProperties();
            }
        },

        selectWindow: function(xid) {
            this._selectedWindowId = xid;
            this._sync();
        },
    });

    var Inspector = new Class({
        initialize: function(server) {
            this._server = server;
            var connection = server.connect();
            this._display = connection.display;
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('inspector');

            this._toplevel.addEventListener("contextmenu", function(event) {
                event.preventDefault();
            });

            this._header = document.createElement('div');
            this._header.classList.add('header');
            this._header.textContent = 'Inspector';
            this._toplevel.appendChild(this._header);

            this._closeButton = document.createElement('div');
            this._closeButton.classList.add('close-button');
            this._closeButton.title = "Close Inspector";
            this._closeButton.addEventListener("click", this.toggle.bind(this));
            this._header.appendChild(this._closeButton);

            this._chooseWindowButton = document.createElement('div');
            this._chooseWindowButton.classList.add('choose-window-button');
            this._chooseWindowButton.title = "Inspect Window";
            this._chooseWindowButton.addEventListener("click", this._chooseWindow.bind(this));
            this._header.appendChild(this._chooseWindowButton);

            this._refreshButton = document.createElement('div');
            this._refreshButton.classList.add('refresh-button');
            this._refreshButton.title = "Redraw X Server";
            this._refreshButton.addEventListener("click", this._redrawServer.bind(this));
            this._header.appendChild(this._refreshButton);

            this._paneContainer = document.createElement('div');
            this._paneContainer.classList.add('pane-container');
            this._toplevel.appendChild(this._paneContainer);

            this._windowTree = new WindowTree(server);
            this._paneContainer.appendChild(this._windowTree.elem);

            this._windowDetails = new WindowDetails(server);
            this._paneContainer.appendChild(this._windowDetails.elem);

            this._highlighter = new InspectorHighlighter(server);

            this._windowTree.onWindowHighlighted = function(xid) {
                this._highlighter.setWindowToHighlight(xid);
            }.bind(this);
            this._windowTree.onWindowSelected = function(xid) {
                this._selectWindow(xid);
            }.bind(this);

            this._button = new InspectorButton(this);
            this._button.connect(server);

            this.elem = this._toplevel;
        },

        toggle: function() {
            this.elem.classList.toggle("visible");
            this._button.setShowing(this.elem.classList.contains("visible"));
        },

        _selectWindow: function(xid) {
            this._windowTree.selectWindow(xid);
            this._windowDetails.selectWindow(xid);
        },

        _chooseWindow: function() {
            this._chooseWindowButton.classList.add("active");
            var chooser = new WindowChooser(this._server, this._highlighter);
            chooser.onChosen = function(xid) {
                this._selectWindow(xid);
                this._chooseWindowButton.classList.remove("active");
            }.bind(this);
            chooser.grab();
        },

        _redrawServer: function() {
            this._display.invalidateWindow({ windowId: this._display.rootWindowId,
                                             includeChildren: true });
        },
    });

    exports.Inspector = Inspector;

})(window);
