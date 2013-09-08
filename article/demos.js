(function(exports) {
    "use strict";

    var ColoredWindow = new Class({
        Extends: Window,
        initialize: function(color) {
            this.parent();
            this._color = color;
        },
        connect: function(server) {
            this.parent(server);
            this._display.changeAttributes({ windowId: this.windowId,
                                             backgroundColor: this._color });
            this._display.mapWindow({ windowId: this.windowId });
        },
    });

    function makeStipple(display) {
        var stipple = display.createPixmap({ width: 2, height: 2 });
        display.drawTo(stipple, function(ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 2, 2);

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1, 1);
            ctx.fillRect(1, 1, 1, 1);
        });
        return stipple;
    }

    function makeDemoServer(elem) {
        var server = new Server();
        server.resize(elem.clientWidth, elem.clientHeight);
        var connection = server.clientConnected(this);
        var display = connection.display;
        var stipple = makeStipple(display);
        display.changeAttributes({ windowId: display.rootWindowId,
                                   backgroundPixmap: stipple });
        return server;
    }

    function test(elem) {
        var server = makeDemoServer(elem);
        elem.appendChild(server.elem);
    }

    function demo1(elem) {
        var server = makeDemoServer(elem);
        elem.appendChild(server.elem);

        var width = elem.clientWidth;
        var height = elem.clientHeight;

        var spacing = 20;
        ['#ff0000', '#00ff00', '#0000ff'].forEach(function(color, i, arr) {
            var w = new ColoredWindow(color);
            w.width = 50;
            w.height = 50;

            var totalSize = (w.width + spacing) * arr.length - spacing;
            w.x = (width - totalSize) / 2 + (i * (w.width + spacing));
            w.y = (height - w.height) / 2;
            w.connect(server);
        });
    }

    var demos = [
        test,
        demo1,
    ];

    demos.forEach(function(func) {
        var elem = document.querySelector(".demo-server." + func.name);
        func(elem);
    });

})(window);