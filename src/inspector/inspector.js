(function(exports) {

    var Inspector = new Class({
        initialize: function(server) {
            this._server = server;
            var connection = server.connect();
            this._display = connection.display;
            this._port = connection.clientPort;
            this._port.addEventListener("message", function(messageEvent) {
                this._handleEvent(event);
            }.bind(this));

            this._toplevel = document.createElement('div');
            this._toplevel.classList.add('inspector');
            this.elem = this._toplevel;

            this._windowTree = document.createElement('div');
            this._windowTree.classList.add('window-tree');
            this._toplevel.appendChild(this._windowTree);

            this._display.selectInput({ windowId: this._display.rootWindowId,
                                        events: ['SubstructureNotify'] });
        },

        _handleEvent: function(event) {
            this._syncWindowTree();
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
                return node;
            }.bind(this);

            while (this._windowTree.firstChild)
                this._windowTree.removeChild(this._windowTree.firstChild);

            var rootNode = makeNodeForWindow(this._display.rootWindowId);
            this._windowTree.appendChild(rootNode);
        },
    });

    exports.Inspector = Inspector;

})(window);
