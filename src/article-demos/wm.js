// Contains the demo in the "Expert Window Techniques" article.

(function(exports) {
    "use strict";

    ArticleDemos.registerDemo("two-kittens-wm", "height: 240px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        DemoCommon.setBackground(display, DemoCommon.makeStipple(display));

        // Launch the window manager first.
        var wm = new WindowManager(server);

        // The shaking window that's behind.
        var kitten2 = new DemoCommon.DelayedExposeImage(server, "kitten2.png");
        DemoCommon.centerWindow(display, kitten2.windowId, { x: -20, y: 40 });
        display.mapWindow({ windowId: kitten2.windowId });

        // The window on top that's obscuring the window behind it.
        var kitten1 = new DemoCommon.SimpleImage(server, "kitten1.png");
        DemoCommon.centerWindow(display, kitten1.windowId);
        display.mapWindow({ windowId: kitten1.windowId });

        var dragger = new DemoCommon.WindowDragger(server, kitten1.windowId);
        var shaker = new DemoCommon.WindowShaker(server, kitten2.windowId);
    });

})(window);
