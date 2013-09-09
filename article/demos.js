(function(exports) {
    "use strict";

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

    function bootstrapServer(elem) {
        var width = elem.clientWidth;
        var height = elem.clientHeight;

        var server = new Server();
        server.resize(width, height);
        elem.appendChild(server.elem);

        var connection = server.clientConnected(this);
        var display = connection.display;
        var stipple = makeStipple(display);
        display.changeAttributes({ windowId: display.rootWindowId,
                                   backgroundPixmap: stipple });

        return { display: display, server: server };
    }

    function test(elem) {
        bootstrapServer(elem);
    }

    function demo1(elem) {
        var res = bootstrapServer(elem);
        var display = res.display;

        var rootGeom = display.getGeometry({ drawableId: display.rootWindowId });

        var spacing = 20;
        ['#ff0000', '#00ff00', '#0000ff'].forEach(function(color, i, arr) {
            var width = 50;
            var height = 50;

            var totalWidth = (width + spacing) * arr.length - spacing;

            var x = (rootGeom.width - totalWidth) / 2 + (i * (width + spacing));
            var y = (rootGeom.height - height) / 2;

            var windowId = display.createWindow({ x: x, y: y, width: width, height: height });
            display.changeAttributes({ windowId: windowId,
                                       backgroundColor: color });
            display.mapWindow({ windowId: windowId });
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