(function(exports) {
    "use strict";

    var server = new Server();
    document.querySelector(".server").appendChild(server.elem);

    var wm = new WindowManager();
    wm.connect(server);

    var w = new Background();
    w.connect(server);

    var panel = new Panel();
    panel.connect(server);

    var launcher;

    launcher = new Launcher("demo/data/launcher-terminal.png", FakeTerminal);
    launcher.connect(server);
    panel.addLauncher(launcher);

    launcher = new Launcher("demo/data/launcher-xeyes.png", Xeyes);
    launcher.connect(server);
    panel.addLauncher(launcher);

    var refresh = new Refresh();
    refresh.connect(server);
    panel.addAction(refresh);

    var menu = new MenuButton("Menu");
    menu.connect(server);
    panel.addAction(menu);

    window.server = server;

    function debouncer(callback) {
        var timeoutId, currentEvent;

        return function handler(event) {
            if (timeoutId)
                window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(function timeout() {
                callback(event);
                timeoutId = 0;
            }, 20);
        };
    }

    function syncSize() {
        var width = document.documentElement.clientWidth;
        var height = document.documentElement.clientHeight;
        server.resize(width, height);
    }

    window.addEventListener("resize", debouncer(syncSize));
    syncSize();

})(window);
