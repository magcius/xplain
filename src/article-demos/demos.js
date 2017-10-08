// Contains the "demo framework".

(function(exports) {
    "use strict";

    function bootstrapDemo(demo, elem) {
        var demoSlot = document.createElement("div");
        demoSlot.setAttribute('style', demo.style);
        elem.insertBefore(demoSlot, elem.firstChild);
        return demoSlot;
    }

    var demos = {};

    var ArticleDemos = {};
    ArticleDemos.registerDemo = function(name, style, func) {
        if (func !== undefined) {
            demos[name] = { name: name, func: func, style: style };
        } else {
            demos[name] = style;
        }
    };

    function findDemo(demoName) {
        var demo = demos[demoName];
        if (!demo)
            console.error("Unknown demo: " + demoName);
        return demo;
    }
    function runServerDemo(elem) {
        var demoName = elem.dataset.demo;
        var demo = findDemo(demoName);
        var demoFunc = demo.func;
        var demoSlot = bootstrapDemo(demo, elem);
        var server = new Server();
        server.resize(demoSlot.clientWidth, demoSlot.clientHeight);
        demoSlot.appendChild(server.elem);
        var res = { server: server, elem: elem };
        demoFunc(res);
    }
    function runCanvasDemo(elem) {
        var demoName = elem.dataset.demo;
        var demo = findDemo(demoName);
        if (!demo)
            return;
        var demoFunc = demo.func;
        var demoSlot = bootstrapDemo(demo, elem);
        var canvas = document.createElement('canvas');
        canvas.width = demoSlot.clientWidth;
        canvas.height = demoSlot.clientHeight;
        demoSlot.appendChild(canvas);
        var res = { canvas: canvas, elem: elem, demoSlot: demoSlot };
        demoFunc(res);
    }
    function runSlotDemo(elem) {
        const demoName = elem.dataset.demo;
        const demoFunc = findDemo(demoName);
        if (!demoFunc)
            return;
        demoFunc(elem);
    }

    // The "main" function of the article. Goes over all the demo elements
    // the article's source code and runs the according demo for them.
    ArticleDemos.runAllDemos = function() {
        var elems;
        elems = document.querySelectorAll(".demo-server");
        [].forEach.call(elems, runServerDemo);
        elems = document.querySelectorAll(".demo-canvas");
        [].forEach.call(elems, runCanvasDemo);
        elems = document.querySelectorAll(".demo-slot");
        [].forEach.call(elems, runSlotDemo);
    };

    exports.ArticleDemos = ArticleDemos;

})(window);
