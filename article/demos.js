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

    function bootstrapServer(container, addInspector) {
        var elem = document.createElement("div");
        elem.classList.add('server-slot');
        container.appendChild(elem);

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
        display.invalidateWindow({ windowId: display.rootWindowId });

        if (addInspector) {
            var inspector = new Inspector(server);
            elem.appendChild(inspector.elem);
        }

        return { display: display, server: server };
    }

    function test(elem) {
        bootstrapServer(elem);
    }

    function calculatorCSD(elem) {
        var res = bootstrapServer(elem, true);
        var server = res.server;
        var display = res.display;
        var calculator = new CalculatorCSD(server);
        Util.centerWindow(display, calculator.windowId);
        display.mapWindow({ windowId: calculator.windowId });
    }

    function expose(elem) {
        var res = bootstrapServer(elem, true);
        var server = res.server;
        var display = res.display;
    }

    var demos = [
        test,
        calculatorCSD,
        expose
    ];

    demos.forEach(function(func) {
        var elem = document.querySelector(".demo-server." + func.name);
        func(elem);
    });

})(window);
