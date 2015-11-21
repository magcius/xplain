// Contains the demos in the "Adding Transparency" section, demonstrating
// the COMPOSITE extension, window redirection, and the goal of a
// compositing manager.

(function(exports) {
    "use strict";

    ArticleDemos.registerDemo("window-pixel-map", "height: 250px", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#266FB2' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        // The shaking window that's behind.
        var kitten2 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten2, { x: -20, y: 40 });
        display.changeAttributes({ windowId: kitten2, backgroundColor: '#B24E48' });
        display.invalidateWindow({ windowId: kitten2 });
        display.mapWindow({ windowId: kitten2 });

        // The window on top that's obscuring the window behind it.
        var kitten1 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten1);
        display.changeAttributes({ windowId: kitten1, backgroundColor: '#F3FF5D' });
        display.invalidateWindow({ windowId: kitten1 });
        display.mapWindow({ windowId: kitten1 });

        var shaker = new DemoCommon.WindowShaker(server, kitten2);
    });

    ArticleDemos.registerDemo("window-pixel-map-shaped", "height: 250px", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#266FB2' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        // The shaking window that's behind.
        var kitten2 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten2, { x: -20, y: 40 });
        display.changeAttributes({ windowId: kitten2, backgroundColor: '#B24E48' });
        display.invalidateWindow({ windowId: kitten2 });
        display.mapWindow({ windowId: kitten2 });

        // The window on top that's obscuring the window behind it.
        var kitten1 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten1);
        display.changeAttributes({ windowId: kitten1, backgroundColor: '#F3FF5D' });
        display.invalidateWindow({ windowId: kitten1 });

        ClientUtil.loadImageAsPixmap(display, "kittencircle.png", function(pixmapId) {
            var image = display.getPixmapImage({ pixmapId: pixmapId });
            var ctx = image.getContext('2d');
            var imgData = ctx.getImageData(0, 0, image.width, image.height);

            var region = DemoCommon.scanImageDataForVisibleRegion(imgData);
            display.setWindowShapeRegion({ windowId: kitten1,
                                           shapeType: "Bounding",
                                           region: region });
            display.mapWindow({ windowId: kitten1 });
        });

        var shaker = new DemoCommon.WindowShaker(server, kitten2);
    });

    ArticleDemos.registerDemo("naive-redirect", "height: 250px", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        display.changeAttributes({ windowId: display.rootWindowId, backgroundColor: '#266FB2' });
        display.invalidateWindow({ windowId: display.rootWindowId });

        // The shaking window that's behind.
        var kitten2 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten2, { x: -20, y: 40 });
        ClientUtil.loadImageAsPixmap(display, "kitten2.png", function(pixmapId) {
            display.changeAttributes({ windowId: kitten2, backgroundPixmap: pixmapId });
            display.invalidateWindow({ windowId: kitten2 });
            display.mapWindow({ windowId: kitten2 });
        });

        // The window on top that's obscuring the window behind it.
        var kitten1 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten1);
        ClientUtil.loadImageAsPixmap(display, "kitten1.png", function(pixmapId) {
            display.changeAttributes({ windowId: kitten1, backgroundPixmap: pixmapId });
            display.invalidateWindow({ windowId: kitten1 });
            display.redirectWindow({ windowId: kitten1, mode: "manual" });
            display.mapWindow({ windowId: kitten1 });
        });

        var dragger = new DemoCommon.WindowDragger(server, kitten1);

        var shaker = new DemoCommon.WindowShaker(server, kitten2);
    });

    ArticleDemos.registerDemo("composited-kitten", "height: 250px", function(res) {
        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        // Rather than use a normal background on the root window, use a large background
        // window that gets redirected so the CM won't fight to paint on the root window.
        //
        // ... I should add a COW at some point, shouldn't I... sigh.
        var bgWindow = display.createWindow({ x: 0, y: 0, width: 1000, height: 1000 });
        display.changeAttributes({ windowId: bgWindow, backgroundColor: '#266FB2' });
        display.mapWindow({ windowId: bgWindow });

        // The shaking window that's behind.
        var kitten2 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten2, { x: -20, y: 40 });
        ClientUtil.loadImageAsPixmap(display, "kitten2.png", function(pixmapId) {
            display.changeAttributes({ windowId: kitten2, backgroundPixmap: pixmapId });
            display.invalidateWindow({ windowId: kitten2 });
        });
        display.mapWindow({ windowId: kitten2 });

        // The window on top that's obscuring the window behind it.
        var kitten1 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        display.changeProperty({ windowId: kitten1, name: 'OPACITY', value: 0.5 });
        DemoCommon.centerWindow(display, kitten1);
        ClientUtil.loadImageAsPixmap(display, "kitten1.png", function(pixmapId) {
            display.changeAttributes({ windowId: kitten1, backgroundPixmap: pixmapId });
            display.invalidateWindow({ windowId: kitten1 });
        });
        display.mapWindow({ windowId: kitten1 });

        var dragger = new DemoCommon.WindowDragger(server, kitten1);

        var shaker = new DemoCommon.WindowShaker(server, kitten2);

        var cm = new CompositingManager.Canvas2DCompositingManager(server, display.rootWindowId);
    });

    ArticleDemos.registerDemo("gl-composite", "height: 250px", function(res) {
        var elem = res.elem;
        var serverSlot = elem.querySelector("div");

        var width = serverSlot.clientWidth;
        var height = serverSlot.clientHeight;

        var glCanvas = document.createElement("canvas");
        glCanvas.classList.add("overlay");
        glCanvas.width = width;
        glCanvas.height = height;
        elem.appendChild(glCanvas);

        var gl = glCanvas.getContext("webgl", { alpha: false });
        gl.$viewportWidth = width;
        gl.$viewportHeight = height;
        gl.viewport(0, 0, width, height);

        var server = res.server;
        var connection = server.connect();
        var display = connection.display;

        // Rather than use a normal background on the root window, use a large background
        // window that gets redirected so the CM won't fight to paint on the root window.
        //
        // ... I should add a COW at some point, shouldn't I... sigh.
        var bgWindow = display.createWindow({ x: 0, y: 0, width: 1000, height: 1000 });
        display.changeAttributes({ windowId: bgWindow, backgroundColor: '#266FB2' });
        display.mapWindow({ windowId: bgWindow });

        // The shaking window that's behind.
        var kitten2 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        DemoCommon.centerWindow(display, kitten2, { x: -20, y: 40 });
        ClientUtil.loadImageAsPixmap(display, "kitten2.png", function(pixmapId) {
            display.changeAttributes({ windowId: kitten2, backgroundPixmap: pixmapId });
            display.invalidateWindow({ windowId: kitten2 });
        });

        // The window on top that's obscuring the window behind it.
        var kitten1 = display.createWindow({ x: 0, y: 0, width: 125, height: 125 });
        display.changeProperty({ windowId: kitten1, name: 'OPACITY', value: 0.5 });
        DemoCommon.centerWindow(display, kitten1);
        ClientUtil.loadImageAsPixmap(display, "kitten1.png", function(pixmapId) {
            display.changeAttributes({ windowId: kitten1, backgroundPixmap: pixmapId });
            display.invalidateWindow({ windowId: kitten1 });
        });

        var dragger = new DemoCommon.WindowDragger(server, kitten1);

        var shaker = new DemoCommon.WindowShaker(server, kitten2);

        var cm = new CompositingManager.GLCompositingManager(server, display.rootWindowId, gl);
        display.mapWindow({ windowId: kitten2 });
        display.mapWindow({ windowId: kitten1 });

        // Disgusting hack to insert the triangle in the right spot.
        setTimeout(function() {
            var tri = new CompositingManager.TriangleActor(cm._renderer, cm._gl);
            cm._renderer._actorStacking.splice(2, 0, tri);
        }, 500);
    });

})(window);
