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

        var connection = server.connect();
        var display = connection.display;

        var stipple = makeStipple(display);
        display.changeAttributes({ windowId: display.rootWindowId,
                                   backgroundPixmap: stipple });

        return { display: display, server: server };
    }

    function test(elem) {
        bootstrapServer(elem);
    }

    function calculator(elem) {
        var res = bootstrapServer(elem);
        var server = res.server;

        var inspector = new Inspector(server);
        document.body.appendChild(inspector.elem);

        var display = res.display;
        var calculatorWindowId = Calculator(res.server);

        Util.centerWindow(display, calculatorWindowId);
        display.mapWindow({ windowId: calculatorWindowId });
    }

    var demos = [
        test,
        calculator,
    ];

    demos.forEach(function(func) {
        var elem = document.querySelector(".demo-server." + func.name);
        func(elem);
    });

})(window);
