(function(exports) {

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

            if (this._highlightedWindowId != null) {
                this._ctx.lineWidth = 2;
                this._ctx.strokeStyle = '#ff0000';

                var geom = this._display.getGeometry({ drawableId: this._highlightedWindowId });
                var coords = this._display.translateCoordinates({ srcWindowId: this._highlightedWindowId,
                                                                  destWindowId: this._display.rootWindowId,
                                                                  x: 0, y: 0 });

                this._ctx.strokeRect(coords.x, coords.y, geom.width, geom.height);
            }
        },

        setWindowToHighlight: function(xid) {
            this._highlightedWindowId = xid;
            this._draw();
        },
    });

    var InspectorButton = new Class({
        Extends: Window,
        initialize: function(inspector) {
            this.parent();
            this._inspector = inspector;
        },
        connect: function(server) {
            this.parent(server);
            this._display.changeAttributes({ windowId: this.windowId, cursor: 'pointer' });
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
                this._clipToExposedRegion(ctx);
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

    function empty(node) {
        while (node.firstChild)
            node.removeChild(node.firstChild);
    }

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
            this.elem = this._toplevel;

            this._buildWindowTree();
            this._buildWindowInspector();

            this._highlighter = new InspectorHighlighter(server);

            this._button = new InspectorButton(this);
            this._button.connect(server);
        },

        toggle: function() {
            this.elem.classList.toggle("visible");
            this._button.setShowing(this.elem.classList.contains("visible"));
        },

        _handleEvent: function(event) {
            this._syncWindowTree();
        },

        _buildWindowInspector: function() {
            this._windowInspector = document.createElement('div');
            this._windowInspector.classList.add('window-inspector');
            this._toplevel.appendChild(this._windowInspector);
        },
        _syncWindowInspector: function() {
            empty(this._windowInspector);

            var makeNodeForProperty = function(name, value) {
                var node = document.createElement('div');
                node.classList.add('property-listing');

                var nameNode = document.createElement('span');
                nameNode.classList.add('name');
                nameNode.innerText = name;
                node.appendChild(nameNode);

                var valueNode = document.createElement('span');
                valueNode.classList.add('value');
                valueNode.innerText = JSON.stringify(value);
                node.appendChild(valueNode);

                return node;
            };

            if (!this._selectedWindowId)
                return;

            var props = this._display.listProperties({ windowId: this._selectedWindowId });
            props.forEach(function(name) {
                var value = this._display.getProperty({ windowId: this._selectedWindowId, name: name });
                var node = makeNodeForProperty(name, value);
                this._windowInspector.appendChild(node);
            }.bind(this));
        },
        _selectWindow: function(xid) {
            if (this._windowTreeNodes[this._selectedWindowId])
                this._windowTreeNodes[this._selectedWindowId].classList.remove("selected");
            this._selectedWindowId = xid;
            if (this._windowTreeNodes[this._selectedWindowId])
                this._windowTreeNodes[this._selectedWindowId].classList.add("selected");

            this._syncWindowInspector();
        },

        _buildWindowTree: function() {
            this._windowTree = document.createElement('div');
            this._windowTree.classList.add('window-tree');
            this._toplevel.appendChild(this._windowTree);

            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ['SubstructureNotify'] });
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
            debugNameLabel.innerText = this._getDebugName(xid);
            node.appendChild(debugNameLabel);

            var xidLabel = document.createElement("span");
            xidLabel.classList.add('xid');
            xidLabel.innerText = xid;
            node.appendChild(xidLabel);

            return node;
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
                    this._highlighter.setWindowToHighlight(xid);
                    event.stopPropagation();
                }.bind(this));
                node.addEventListener("click", function(event) {
                    this._selectWindow(xid);
                    event.stopPropagation();
                }.bind(this));

                this._windowTreeNodes[xid] = node;

                return node;
            }.bind(this);

            empty(this._windowTree);
            this._windowTreeNodes = {};

            var rootNode = makeNodeForWindow(this._display.rootWindowId);
            this._windowTree.appendChild(rootNode);

            this._selectWindow(this._selectedWindowId);
        },
    });

    exports.Inspector = Inspector;

})(window);
