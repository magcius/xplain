// Contains the "Inspector", which allows the user to inspect and investigate
// the X server interactively.

(function(exports) {
    "use strict";

    // A <canvas> that overlays the X server and highlights certain windows
    // by drawing semi-transparent boxes and anchor lines.
    class InspectorHighlighter {
        constructor(server) {
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
        }

        _syncSize() {
            var geom = this._display.getGeometry({ drawableId: this._display.rootWindowId });
            this._canvas.width = geom.width;
            this._canvas.height = geom.height;
        }

        _handleEvent(event) {
            this._draw();
        }

        _draw() {
            this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

            if (this._highlightedWindowId != null) {
                var geom = this._display.getGeometry({ drawableId: this._highlightedWindowId });
                var coords = this._display.translateCoordinates({ srcWindowId: this._highlightedWindowId,
                                                                  destWindowId: this._display.rootWindowId,
                                                                  x: 0, y: 0 });

                this._ctx.fillStyle = 'rgba(100, 140, 200, 0.6)';
                this._ctx.fillRect(coords.x, coords.y, geom.width, geom.height);

                var shape = this._display.getWindowShapeRegion({ windowId: this._highlightedWindowId,
                                                                 shapeType: 'Bounding' });
                if (shape) {
                    this._ctx.save();
                    this._ctx.globalCompositeOperation = 'source-atop';
                    this._ctx.translate(coords.x, coords.y);
                    CanvasUtil.pathFromRegion(this._ctx, shape);
                    this._ctx.fillStyle = 'yellow';
                    this._ctx.fill();
                    this._ctx.restore();
                    this._ctx.beginPath();
                }

                var visibleRegion = this._display.getVisibleRegion({ windowId: this._highlightedWindowId,
                                                                     includeChildren: true });
                this._ctx.save();
                this._ctx.globalCompositeOperation = 'source-atop';
                CanvasUtil.pathFromRegion(this._ctx, visibleRegion);
                this._ctx.fillStyle = 'lightgreen';
                this._ctx.fill();
                this._ctx.restore();
                this._ctx.beginPath();

                var query = this._display.queryTree({ windowId: this._highlightedWindowId });
                if (query.parent) {
                    var parentCoords = this._display.translateCoordinates({ srcWindowId: query.parent,
                                                                            destWindowId: this._display.rootWindowId,
                                                                            x: 0, y: 0 });

                    // Horizontal alignment anchor
                    var anchorY = Math.max(parentCoords.y, coords.y) + 0.5;
                    this._ctx.moveTo(parentCoords.x, anchorY);
                    this._ctx.lineTo(coords.x, anchorY);

                    // Vertical alignment anchor
                    var anchorX = Math.max(parentCoords.x, coords.x) + 0.5;
                    this._ctx.moveTo(anchorX, parentCoords.y);
                    this._ctx.lineTo(anchorX, coords.y);

                    this._ctx.strokeStyle = 'rgba(20, 20, 75, 0.5)';
                    this._ctx.stroke();
                    this._ctx.beginPath();
                }
            }
        }

        setWindowToHighlight(xid) {
            if (this._highlightedWindowId)
                this._display.selectInput({ windowId: this._highlightedWindowId,
                                            events: ['!ShapeNotify'] });
            this._highlightedWindowId = xid;
            if (this._highlightedWindowId)
                this._display.selectInput({ windowId: this._highlightedWindowId,
                                            events: ['ShapeNotify'] });

            this._draw();
        }
    }

    // A simple client that takes a pointer grab, allowing the user to click
    // on a window. It also takes a highlighter, which it will use to highlight
    // a specific window on hover.
    class WindowChooser {
        constructor(server, highlighter) {
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
        }

        grab() {
            this._display.grabPointer({ windowId: this._display.rootWindowId,
                                        ownerEvents: true,
                                        events: ['ButtonRelease'],
                                        pointerMode: 'Async',
                                        cursor: 'x-cursor' });
        }

        _handleEvent(event) {
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
        }
    }

    // A simple container to not litter the DOM...
    var tooltipsContainer = document.createElement('tooltips-container');
    document.body.appendChild(tooltipsContainer);

    // A simple custom-content tooltip that tracks the cursor when
    // the user hovers over the target element.
    class Tooltip {
        constructor(target) {
            this._target = target;
            this._target.addEventListener("mouseover", this._onTargetMouseOver.bind(this));
            this._target.addEventListener("mouseout", this._onTargetMouseOut.bind(this));
            this._target.addEventListener("mousemove", this._onTargetMouseMove.bind(this));

            this.elem = document.createElement("div");
            this.elem.classList.add("tooltip");
            this.elem.style.position = "absolute";
            tooltipsContainer.appendChild(this.elem);

            this._setVisible(false);
        }

        destroy() {
            // Assume target will be destroyed.

            tooltipsContainer.removeChild(this.elem);
            this.elem = null;
        }

        _setVisible(shown) {
            this.elem.style.display = shown ? "block" : "none";
        }

        _updateForEvent(e) {
            this.elem.style.left = e.pageX + 'px';
            this.elem.style.top = e.pageY + 'px';
        }

        _onTargetMouseOver(e) {
            this._setVisible(true);
            this._updateForEvent(e);
        }

        _onTargetMouseOut(e) {
            this._setVisible(false);
        }

        _onTargetMouseMove(e) {
            this._updateForEvent(e);
        }
    }

    function empty(node) {
        while (node.firstChild)
            node.removeChild(node.firstChild);
    }

    class WindowTree {
        constructor(server) {
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
                                        events: ['X-WindowTreeChanged', 'X-CursorWindowChanged'] });

            this.elem = this._toplevel;
        }

        _handleConfigureNotify(event) {
            // The only thing that can change the window tree is a
            // restack. Resizes and moves won't change the window tree,
            // so don't rebuild it in that case.
            if (event.stackMode !== undefined)
                this._syncWindowTree();
        }

        _handleEvent(event) {
            switch (event.type) {
                case "X-CursorWindowChanged":
                    return this._setCursorWindow(event.oldCursorWindow, event.newCursorWindow);
                case "ConfigureNotify":
                    return this._handleConfigureNotify(event);
                case "X-DrawTreeNotify":
                case "MapNotify":
                case "UnmapNotify":
                case "DestroyNotify":
                    return this._syncWindowTree();
            }
        }

        _getDebugName(xid) {
            var debugName;
            if (!debugName)
                debugName = this._display.getProperty({ windowId: xid, name: "DEBUG_NAME" });
            if (!debugName)
                debugName = this._display.getProperty({ windowId: xid, name: "WM_NAME" });
            if (!debugName)
                debugName = "Unnamed Window";

            return debugName;
        }
        _makeWindowLabel(xid) {
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
        }
        _setCursorWindow(oldId, newId) {
            if (this._windowTreeNodes[oldId])
                this._windowTreeNodes[oldId].classList.remove("cursor-window");
            if (this._windowTreeNodes[newId])
                this._windowTreeNodes[newId].classList.add("cursor-window");
        }
        selectWindow(xid) {
            this._selectedWindowId = xid;
            this._syncWindowTree();
        }
        _shouldHideWindow(xid) {
            return !!this._display.getProperty({ windowId: xid, name: '_XJS_HIDE_INSPECTOR' });
        }
        _syncWindowTree() {
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
                query.children.reverse().forEach(function(childXid) {
                    if (this._shouldHideWindow(childXid))
                        return;

                    childList.appendChild(makeNodeForWindow(childXid));
                }.bind(this));

                var attribs = this._display.getAttributes({ windowId: xid });
                node.classList.toggle('viewable', attribs.mapState === 'Viewable');

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

            if (this._selectedWindowId) {
                this._windowTreeNodes[this._selectedWindowId].classList.add('selected');
                const drawTreeRootId = this._display.getDrawTreeRoot({ windowId: this._selectedWindowId });
                if (drawTreeRootId)
                    this._windowTreeNodes[drawTreeRootId].classList.add('draw-tree-root');
            }
        }
    }

    class HeaderBox {
        constructor(title) {
            this._toplevel = document.createElement('div');

            this._header = document.createElement('div');
            this._header.classList.add('details-header');
            this._header.textContent = title;
            this._toplevel.appendChild(this._header);

            this.content = document.createElement('div');
            this._toplevel.appendChild(this.content);

            this.elem = this._toplevel;
        }

        setVisible(visible) {
            this._toplevel.style.display = visible ? 'block' : 'none';
        }
    }


    // Creates a simple that shows a small pixmap, and shows the full
    // pixmap in a Tooltip when hovering over it.
    class PixmapDisplay {
        constructor(server, xid) {
            this._server = server;
            var connection = server.connect();
            this._display = connection.display;

            this._xid = xid;

            this._toplevel = document.createElement('span');

            this._thumbCanvas = document.createElement('canvas');
            this._thumbCanvas.classList.add('pixmap-display-thumb');
            this._toplevel.appendChild(this._thumbCanvas);

            this._tooltip = new Tooltip(this._thumbCanvas);
            this._tooltipCanvas = document.createElement('canvas');
            this._tooltipCanvas.classList.add('pixmap-display');
            this._tooltip.elem.appendChild(this._tooltipCanvas);

            this._tooltipDescription = document.createElement('span');
            this._tooltipDescription.classList.add('tooltip-description');
            this._tooltip.elem.appendChild(this._tooltipDescription);

            this.update();

            this.elem = this._toplevel;
        }

        destroy() {
            this._display.disconnect();
            this._display = null;
            empty(this.elem);

            this._tooltip.destroy();
        }

        update() {
            var image = this._display.getPixmapImage({ pixmapId: this._xid });

            function updateCanvas(canvas) {
                canvas.width = image.width;
                canvas.height = image.height;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
            }

            this._tooltipDescription.innerHTML = "<span>" + image.width + "</span>×<span>" + image.height + "</span>, XID <span>" + this._xid + "</span>";
            updateCanvas(this._thumbCanvas);
            updateCanvas(this._tooltipCanvas);
        }
    }

    // The right-hand pane of the inspector. It shows the window's geometry,
    // its attributes, and any custom properties.
    class WindowDetails {
        constructor(server) {
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
        }

        // Creates a simple box/label to show a color.
        _createColorDisplay(color) {
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
        }

        _syncGeometry() {
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
        }

        _syncAttributes() {
            empty(this._attributes.content);
            var attribs = this._display.getAttributes({ windowId: this._selectedWindowId });

            if (this._pixmapDisplay) {
                this._pixmapDisplay.elem.parentNode.removeChild(this._pixmapDisplay.elem);
                this._pixmapDisplay.destroy();
                this._pixmapDisplay = null;
            }

            var node, nameNode, valNode;

            node = document.createElement('div');
            node.classList.add('attribute');
            nameNode = document.createElement('span');
            nameNode.classList.add('name');
            nameNode.textContent = 'map-state';
            node.appendChild(nameNode);
            valNode = document.createElement('span');
            valNode.classList.add('value');
            valNode.textContent = attribs.mapState;
            node.appendChild(valNode);
            this._attributes.content.appendChild(node);

            node = document.createElement('div');
            node.classList.add('attribute');
            nameNode = document.createElement('span');
            nameNode.classList.add('name');
            nameNode.textContent = 'input-only';
            node.appendChild(nameNode);
            valNode = document.createElement('span');
            valNode.classList.add('value');
            valNode.textContent = attribs.inputOnly ? "InputOnly" : "InputOutput";
            node.appendChild(valNode);
            this._attributes.content.appendChild(node);

            node = document.createElement('div');
            node.classList.add('attribute');
            nameNode = document.createElement('span');
            nameNode.classList.add('name');
            nameNode.textContent = 'override-redirect';
            node.appendChild(nameNode);
            valNode = document.createElement('span');
            valNode.classList.add('value');
            valNode.textContent = attribs.overrideRedirect ? "Yes" : "No";
            node.appendChild(valNode);
            this._attributes.content.appendChild(node);

            if (attribs.backgroundColor) {
                node = document.createElement('div');
                node.classList.add('attribute');

                nameNode = document.createElement('span');
                nameNode.classList.add('name');
                nameNode.textContent = 'background-pixel';
                node.appendChild(nameNode);
                node.appendChild(this._createColorDisplay(attribs.backgroundColor));
                this._attributes.content.appendChild(node);
            }

            if (attribs.backgroundPixmap) {
                node = document.createElement('div');
                node.classList.add('attribute');

                nameNode = document.createElement('span');
                nameNode.classList.add('name');
                nameNode.textContent = 'background-pixmap';
                node.appendChild(nameNode);

                this._pixmapDisplay = new PixmapDisplay(this._server, attribs.backgroundPixmap);
                node.appendChild(this._pixmapDisplay.elem);

                if (attribs.backgroundColor)
                    node.classList.add('overridden');

                this._attributes.content.appendChild(node);
            }

            const drawTreeRootId = this._display.getDrawTreeRoot({ windowId: this._selectedWindowId });
            const rootWindowId = this._display.rootWindowId;
            node = document.createElement('div');
            node.classList.add('attribute');
            nameNode = document.createElement('span');
            nameNode.classList.add('name');
            nameNode.textContent = 'is-redirected';
            node.appendChild(nameNode);
            valNode = document.createElement('span');
            valNode.classList.add('value');
            valNode.textContent = (drawTreeRootId !== rootWindowId) ? "Yes" : "No";
            node.appendChild(valNode);
            this._attributes.content.appendChild(node);
        }

        _syncProperties() {
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
        }

        _sync() {
            var hasWindow = !!this._selectedWindowId;
            this._geometry.setVisible(hasWindow);
            this._attributes.setVisible(hasWindow);
            this._properties.setVisible(hasWindow);
            this._noWindowSelected.classList.toggle('visible', !hasWindow);

            if (hasWindow) {
                this._syncGeometry();
                this._syncAttributes();
                this._syncProperties();
            }
        }

        _handleEvent(event) {
            switch (event.type) {
                case 'ConfigureNotify':
                    this._syncGeometry();
                break;
                case 'MapNotify':
                case 'UnmapNotify':
                    this._syncAttributes();
                break;
                case 'PropertyNotify':
                    this._syncProperties();
                break;
            }
        }

        selectWindow(xid) {
            if (this._selectedWindowId == xid)
                return;

            if (this._selectedWindowId)
                this._display.selectInput({ windowId: this._selectedWindowId,
                                            events: ['!ConfigureNotify', '!PropertyNotify', '!MapNotify', '!UnmapNotify'] });
            this._selectedWindowId = xid;
            if (this._selectedWindowId)
                this._display.selectInput({ windowId: this._selectedWindowId,
                                            events: ['ConfigureNotify', 'PropertyNotify', 'MapNotify', 'UnmapNotify'] });
            this._sync();
        }
    }

    class WindowsTab {
        constructor(server) {
            this.tabButton = document.createElement('div');
            this.tabButton.classList.add('inspector-tab-button');
            this.tabButton.textContent = "Windows";

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('inspector-tab');

            this._paneContainer = document.createElement('div');
            this._paneContainer.classList.add('pane-container');
            this._toplevel.appendChild(this._paneContainer);

            this._windowTree = new WindowTree(server);
            this._paneContainer.appendChild(this._windowTree.elem);

            this._windowDetails = new WindowDetails(server);
            this._paneContainer.appendChild(this._windowDetails.elem);

            this.elem = this._toplevel;

            this._windowTree.onWindowHighlighted = function(xid) {
                this.onWindowHighlighted(xid);
            }.bind(this);
            this._windowTree.onWindowSelected = function(xid) {
                this.selectWindow(xid);
            }.bind(this);
        }

        selectWindow(xid) {
            this._windowTree.selectWindow(xid);
            this._windowDetails.selectWindow(xid);
        }
    }

    class PixmapsList {
        constructor(server) {
            this._server = server;
            var connection = server.connect();
            this._display = connection.display;
            var port = connection.clientPort;
            port.addEventListener("message", function(messageEvent) {
                this._handleEvent(messageEvent.data);
            }.bind(this));

            this._display.selectInput({ windowId: this._server.rootWindowId,
                                        events: ['X-PixmapCreated', 'X-PixmapDestroyed', 'X-PixmapUpdated'] });
            this._pixmaps = {};

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('pixmap-list');

            var pixmaps = this._display.listPixmaps();
            pixmaps.forEach(function(xid) {
                return this._pixmapCreated(xid);
            }.bind(this));

            this.elem = this._toplevel;
        }

        _pixmapCreated(xid) {
            if (this._pixmaps[xid]) {
                console.log("already have display for xid", xid);
                return;
            }

            var entry = {};
            this._pixmaps[xid] = entry;

            var elem = document.createElement('div');
            elem.classList.add('pixmap');
            entry.elem = elem;

            var pixmapDisplay = new PixmapDisplay(this._server, xid)
            elem.appendChild(pixmapDisplay.elem);
            entry.display = pixmapDisplay;

            var xidLabel = document.createElement('span');
            xidLabel.classList.add('xid');
            xidLabel.textContent = xid;
            elem.appendChild(xidLabel);

            this._toplevel.appendChild(elem);
        }
        _pixmapDestroyed(xid) {
            if (!this._pixmaps[xid]) {
                console.log("don't have any display for xid", xid);
                return;
            }

            this._pixmaps[xid].display.destroy();
            this._toplevel.removeChild(this._pixmaps[xid].elem);
            this._pixmaps[xid] = null;
        }
        _pixmapUpdated(xid) {
            if (!this._pixmaps[xid]) {
                console.log("don't have any display for xid", xid);
                return;
            }

            this._pixmaps[xid].display.update();
        }

        _handleEvent(event) {
            switch (event.type) {
                case 'X-PixmapCreated':
                    return this._pixmapCreated(event.xid);
                case 'X-PixmapDestroyed':
                    return this._pixmapDestroyed(event.xid);
                case 'X-PixmapUpdated':
                    return this._pixmapUpdated(event.xid);
            }
        }
    }

    class PixmapsTab {
        constructor(server) {
            this.tabButton = document.createElement('div');
            this.tabButton.classList.add('inspector-tab-button');
            this.tabButton.textContent = "Pixmaps";

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('inspector-tab');

            this._pixmapsList = new PixmapsList(server);
            this._toplevel.appendChild(this._pixmapsList.elem);

            this.elem = this._toplevel;
        }
    }

    class Inspector {
        constructor(server) {
            this._server = server;
            var connection = server.connect();
            this._display = connection.display;

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('inspector');

            this._toplevel.addEventListener("contextmenu", function(event) {
                event.preventDefault();
            })

            this._header = document.createElement('div');
            this._header.classList.add('header');
            this._toplevel.appendChild(this._header);

            this._windowsTab = new WindowsTab(server);
            this._windowsTab.onWindowHighlighted = function(xid) {
                this._highlighter.setWindowToHighlight(xid);
            }.bind(this);
            this._addTab(this._windowsTab);

            this._pixmapsTab = new PixmapsTab(server);
            this._addTab(this._pixmapsTab);

            this._selectTab(this._windowsTab);

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

            this._buttons = [];
            this._highlighter = new InspectorHighlighter(server);

            this.elem = this._toplevel;
        }

        addButton(button) {
            this._buttons.push(button)
        }

        toggle() {
            this.elem.classList.toggle("visible");
            var visible = this.elem.classList.contains("visible");
            this._buttons.forEach(function(button) {
                button.setShowing(visible);
            })
        }

        _addTab(tab) {
            this._header.appendChild(tab.tabButton);
            this._toplevel.appendChild(tab.elem);

            tab.tabButton.addEventListener('click', function() {
                this._selectTab(tab);
            }.bind(this));
        }

        _selectTab(tab) {
            if (this._currentTab == tab)
                return;

            if (this._currentTab) {
                this._currentTab.tabButton.classList.remove('selected');
                this._currentTab.elem.classList.remove('visible');
            }

            this._currentTab = tab;

            if (this._currentTab) {
                this._currentTab.tabButton.classList.add('selected');
                this._currentTab.elem.classList.add('visible');
            }
        }

        _selectWindow(xid) {
            this._selectTab(this._windowsTab);
            this._windowsTab.selectWindow(xid);
        }

        _chooseWindow() {
            this._chooseWindowButton.classList.add("active");
            var chooser = new WindowChooser(this._server, this._highlighter);
            chooser.onChosen = function(xid) {
                this._selectWindow(xid);
                this._chooseWindowButton.classList.remove("active");
            }.bind(this);
            chooser.grab();
        }

        _redrawServer() {
            this._display.invalidateWindow({ windowId: this._display.rootWindowId,
                                             includeChildren: true });
        }
    }

    exports.Inspector = Inspector;

})(window);
