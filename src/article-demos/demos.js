// Contains the "demo framework", along with some of the more simple demos.

(function(exports) {
    "use strict";

    // Makes a stipple checkerboard pattern as seen in classic X.
    // Let's party_like_its_1989.
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

    // Creates a server instance for each demo, and sets up "demo things".
    // It sizes each server according to the containing element, adds the
    // stipple pattern, and (optionally) adds the inspector as well.
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

    var ArticleDemos = {};
    ArticleDemos.registerDemo = function(name, func) {
        demos[name] = func;
    };

    // The "test" demo used in the first paragraph to let the user test
    // that everything is working fine on their browser...
    ArticleDemos.registerDemo("test", function() {
        // Nothing to do.
    });

    ArticleDemos.registerDemo("calculatorCSD", function(res) {
        var server = res.server;
        var display = res.display;
        var calculator = new CalculatorCSD(server);
        DemoCommon.centerWindow(display, calculator.windowId);
        display.mapWindow({ windowId: calculator.windowId });
    });

    ArticleDemos.runDemo = function(elem) {
        var demoName = elem.dataset.demo;
        var demoFunc = demos[demoName];
        if (!demoFunc)
            console.error("Unknown demo: " + demo);

        var res = bootstrapDemo(demoName, elem);
        demoFunc(res);
    };

    // The "main" function of the article. Goes over all the demo elements
    // the article's source code and runs the according demo for them.
    ArticleDemos.runAllDemos = function() {
        var elems = document.querySelectorAll(".demo-server");
        [].forEach.call(elems, ArticleDemos.runDemo);
    };

    exports.ArticleDemos = ArticleDemos;

})(window);
