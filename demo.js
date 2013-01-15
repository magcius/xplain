
(function($) {
	var Server = new Class({
		initialize: function(container) {
			this._container = container;
			this.elem = this._container;
		},
		addWindow: function(w) {
			this._container.appendChild(w.elem);
		}
	});
	var server = new Server(document.querySelector(".server"));

	var Window = new Class({
		initialize: function() {
			this._container = document.createElement("div");
			this._container.classList.add("window");
			this.elem = this._container;
		},
		draw: function() {
		},
		_constructCanvas: function() {
			if (this.canvas) {
				this._container.removeChild(this._canvas);
			}
			this._canvas = document.createElement("canvas");
			this._canvas.setAttribute("width", this.width);
			this._canvas.setAttribute("height", this.height);
			this._container.appendChild(this._canvas);
			this.draw(this._canvas.getContext('2d'));
		},
		configure: function(x, y, width, height) {
			this.setPosition(x, y)
			this.setSize(width, height);
		},
		setPosition: function(x, y) {
			this._container.style.left = x + "px";
			this._container.style.top = y + "px";
		},
		setSize: function(width, height) {
			this.width = width;
			this.height = height;
			this._constructCanvas();
		}
	});

	var ColorWindow = new Class({
		Extends: Window,
		initialize: function(color, title) {
			this.parent();
			this.color = color;
			this.title = title;
		},
		draw: function(ctx) {
			ctx.fillStyle = this.color;
			ctx.fillRect(0, 0, this.width, this.height);
			ctx.fillStyle = '#000';
			ctx.textAlign = 'center';
			ctx.font = '36px sans-serif';
			ctx.fillText(this.title, this.width / 2, this.height / 2);
		}
	});

	function getRandomColor() {
		function r() {
			return Math.floor(Math.random() * 256);
		}
		return 'rgb({r}, {g}, {b})'.substitute({ r: r(), g: r(), b: r() });
	}

	for (var i = 1; i <= 5; i++) {
		var w = new ColorWindow(getRandomColor(), "Window {i}".substitute({ i: i }));
		var cascade = 40;
		w.configure(i * cascade, i * cascade, 400, 300);
		server.addWindow(w);
	}
})();
