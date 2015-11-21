(function(exports) {
    "use strict";

    ArticleDemos.registerDemo("xeyes", "height: 400px", function(res) {
        DemoCommon.addInspector(res);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#266FB2' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        var wm = new WindowManager(server);

        var xe = new Xeyes(server);
        display.mapWindow({ windowId: xe.windowId });

        var xc = new Xclock(server);
        display.mapWindow({ windowId: xc.windowId });

        var xl = new Xlogo(server);
        display.mapWindow({ windowId: xl.windowId });

        var panel = new Panel(server);
        display.mapWindow({ windowId: panel.windowId });
    });

})(window);
