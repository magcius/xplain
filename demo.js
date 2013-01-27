(function(exports) {

	var BackgroundWindow = new Class({
		Extends: Window,
		initialize: function() {
			this.parent();
			this._image = new Image();
			this._image.src = "WoodBackground.jpg";
			this.hasInput = false;
		},
		connect: function(server) {
			this.parent(server);
			this.configure(0, 0, server.width, server.height);
		},
		expose: function(wrapper) {
			wrapper.drawWithContext(function(ctx) {
				var pattern = ctx.createPattern(this._image, 'repeat');
				ctx.fillStyle = pattern;
				ctx.fillRect(0, 0, this.width, this.height);
			}.bind(this));
			wrapper.clearDamage();
		},
	});

	var ColorWindow = new Class({
		Extends: Window,
		initialize: function(color, title, delay) {
			this.parent();
			this.color = color;
			this.title = title;

			// Delay every expose by a bit.
			this.expose = new Task(this._draw.bind(this), delay);
		},
		_draw: function(wrapper) {
			wrapper.drawWithContext((function(ctx) {
				ctx.fillStyle = this.color;
				ctx.fillRect(0, 0, this.width, this.height);
				ctx.fillStyle = '#000';
				ctx.textAlign = 'center';
				ctx.font = '36px sans-serif';
				ctx.fillText(this.title, this.width / 2, this.height / 2);
			}).bind(this));
			wrapper.clearDamage();
			return false;
		}
	});

	var server = new Server(1024, 768);
	document.querySelector(".server").appendChild(server.elem);

	var w = new BackgroundWindow();
	w.connect(server);

	function animWindow(window, freq) {
		var delay = 50;
		var stepsPerSec = 1000 / delay;

		var time = 0;
		var origX = window.x;

		var amplitude = 40;
		freq = freq || 0.5;

		var step = freq * (Math.PI * 2 / stepsPerSec);

		function animate() {
			var offs = Math.sin(time) * amplitude;
			var x = origX + offs;
			window.configure(x, undefined, undefined, undefined);
			time += step;
			return true;
		}
		var task = new Task(animate, delay);
		task();
	}

	var colors = ['red', 'orange', 'yellow', 'green', 'cyan'];
	for (var i = 0; i < 5; i++) {
		var cascade = 40;
		var windowNumber = i + 1;
		var delay = 40 - windowNumber * 10;
		var w = new ColorWindow(colors[i], "Window {i}".substitute({ i: windowNumber }), delay);
		w.connect(server);
		w.configure(windowNumber * cascade, windowNumber * cascade, 400, 300);
		var freq = i * 0.25 + 0.5;
		animWindow(w, freq);
	}

	window.addEventListener("keydown", function(evt) {
		var letter = String.fromCharCode(evt.keyCode);
		if (letter === 'D')
			server.toggleDebug();
		if (letter === 'R')
			server.queueFullRedraw();
	});

})(window);
