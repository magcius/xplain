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

    function bootstrapDemo(name, elem) {
        var serverSlot = document.createElement("div");
        serverSlot.classList.add('demo-' + name);
        elem.appendChild(serverSlot);

        var width = serverSlot.clientWidth;
        var height = serverSlot.clientHeight;

        var server = new Server();
        server.resize(width, height);
        serverSlot.appendChild(server.elem);

        var connection = server.connect();
        var display = connection.display;

        var stipple = makeStipple(display);
        display.changeAttributes({ windowId: display.rootWindowId,
                                   backgroundPixmap: stipple });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var addInspector = elem.classList.contains("demo-inspectable");
        if (addInspector) {
            var inspector = new Inspector(server);
            elem.appendChild(inspector.elem);
        }

        return { display: display, server: server };
    }

    var demos = {};
    function registerDemo(name, func) {
        demos[name] = func;
    }

    registerDemo("test", function() {
        // Nothing to do, just a simple stripe.
    });

    registerDemo("calculatorCSD", function(res) {
        var server = res.server;
        var display = res.display;
        var calculator = new CalculatorCSD(server);
        Util.centerWindow(display, calculator.windowId);
        display.mapWindow({ windowId: calculator.windowId });
    });

    registerDemo("expose", function(res) {
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

            var res = bootstrapDemo(demoName, elem);
            demoFunc(res);
        });
    }

    run();

})(window);
