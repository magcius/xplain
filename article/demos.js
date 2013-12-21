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

    function bootstrapServer(container) {
        var elem = document.createElement("div");
        elem.classList.add('demo-server-slot');
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

        var addInspector = container.classList.contains("demo-inspectable");
        if (addInspector) {
            var inspector = new Inspector(server);
            container.appendChild(inspector.elem);
        }

        return { display: display, server: server };
    }

    var demos = {};
    function registerDemo(name, func) {
        demos[name] = func;
    }

    registerDemo("test", function(elem) {
        bootstrapServer(elem);
    });

    registerDemo("calculatorCSD", function(elem) {
        var res = bootstrapServer(elem);
        var server = res.server;
        var display = res.display;
        var calculator = new CalculatorCSD(server);
        Util.centerWindow(display, calculator.windowId);
        display.mapWindow({ windowId: calculator.windowId });
    });

    registerDemo("expose", function(elem) {
        var res = bootstrapServer(elem);
        var server = res.server;
        var display = res.display;
        var kitten = new ExposeDemo(server, "kitten1.png");
        Util.centerWindow(display, kitten.windowId, { x: 15, y: 15 });
        display.mapWindow({ windowId: kitten.windowId });
    });

    function run() {
        var elems = document.querySelectorAll(".demo-server");
        [].forEach.call(elems, function(elem) {
            var demoName = elem.dataset.demo;
            var demoFunc = demos[demoName];
            if (!demoFunc)
                console.error("Unknown demo: " + demo);

            demoFunc(elem);
        });
    }

    run();

})(window);
