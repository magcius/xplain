(function(exports) {

	var BackgroundWindow = new Class({
		Extends: Window,
		initialize: function() {
			this.parent();
			this._image = new Image();
			this._image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABABAMAAABYR2ztAAAAMFBMVEX////MzP+Zmf+ZZplmZsyqqqqIiIh3d3cAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADx2ftJAAAEGUlEQVR4nERVQW4bMQzUF7Qt0vOyUnm3A/hchXHviyg5G3Dsc7WO9f3OUJvUhuFdiSKHwyEVtHVtcRKJV5E5ikiX3iQvPevlbBLEP1Gbb4qoaJPtY5Ys4G2eepunOU5mRfgq7kP1UtI58L2LjvPHJziKDIjI9/VR7BjocZ4y3dAnok2SGer2x1YzC2vvjJnsfekjeF7oQG5m0Z5fNpD9boe2uGEZWNuLIdgfC4Cw4GQq2vLSejPGYSIEI9UCYvpRBs7YMO7LT66kIrkG7XyeB3LQg3VpOcPe/FhoWKNNpA94VlKAk+pw8xLo3t8GtGU8qu22sMGX6QOQMh6rG8wWBwgJXdbb4QDjyykSfHbE8fcgtEjAiVXp4x3VrIOnndzhj/zKVs18ZX0UC/XNi5U/KbXgWdr7wMY9Ffc+T4kbl8CkJO13mpXcfRNp88NO6uwY4GErgBXNb3cWstYFtM074X59DVuwY3E1gSHmcAHGJBlBatgUls8FPHaYgj6pJx6/MQg9NDJ7hwUozUMTe2RcDQYWNkaB4zwyZsCVfyVOeIRBXVLhFzArVqru6BQZM8+FTIqdWVpzkMvmcRYvzxzqgnUrzpeUqu1nE6UZfyBjA0nViQIHJYAtry9dfA8oafUiCbCdjYTBYtBI/YX7lQ5yrczDjkhWm7apgXaQBoNclyFaK3kxbg5loS28A8JgTrZ2YKQBKMHgsTiT+YVS//9ZPgDJjk9WAK8GUuohFMAbpwPQwuLpiP3kHtbbcyWf3oIDRAFrNnQQDq5qCC47iSSgFfsqi4Z39jvI6zRsTH0lfLeGYw3TPHEiIFlE7D0db497k/9lCSgIfCihmR0vdt73a2IDZu3QT4VoOXV+iBcgn6mKlmz0qOgHiuXTKboaC8eaOVmjWKJ/A1y/sRPUyctEqYJBguKgVde/YWgQUQA2ohYyOF/w1fZ6oh44asAQ2jGy7Evft5HiPQ7BoE0ys7p869etHN0xon1gEH20wCHPYH5gA4NR2d/QzK9TiF6fSiuUo3ln6XrAIJmxOiNElk/SlnnaBtHnX/YJM1RLGPBKF/NUtW99quFLJxzXwNU9q3wFz6/NJdfH7PAob651vw4W9+Ct50KCs/yxDE5Gpr3DorL9t4k0GiWyNEh/iIghAKcxT/jbumUwPyFrzGYJDxF171SiT3cPtlIBw7SGOOWtOo4mM01sYnQ88VrIgX0OGHWoWliiuMWiRQ+d9okDCsfFc+OCAUJNo7NoPzpPvSy8sngED+m5BtespORKp63K+tWIbJwTblW0dSmDBkbnSLRUjOSW0FjC+WLlINv09SIlyFfJdzgbhuYcH/Aav2pCTObCbqHgSpV+IjEqflE5K7aZScBsOOQLrhu2JzEgOHojMll2yT8AAAD//wMAcvuS6EkdiHcAAAAASUVORK5CYII=";
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
			this._delayedDraw = new Task(this._draw.bind(this), delay);
		},
		expose: function(wrapper) {
			this._delayedDraw(wrapper);
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
