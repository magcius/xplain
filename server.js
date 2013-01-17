(function(exports) {

	function pathFromRegion(ctx, region) {
		region.iter_rectangles(function(rect) {
			ctx.rect(rect.x, rect.y, rect.width, rect.height);
		});
	}

	var ServerWindow = new Class({
		initialize: function(window, server) {
			this.clientWindow = window;
			this._server = server;
			this.inputWindow = document.createElement("div");
			this.inputWindow.style.position = "absolute";

			// The region of the window that needs to be redrawn, in window coordinates.
			this.damagedRegion = new Region();

			// The region of the screen that the window occupies, in screen coordinates.
			this.shapeRegion = new Region();
			this.reconfigure(0, 0, 300, 300); // XXX defaults
		},
		finalize: function() {
			this.shapeRegion.finalize();
			this.shapeRegion = null;

			this.damagedRegion.finalize();
			this.damagedRegion = null;
		},
		_wrapContext: function(ctx) {
			return (function wrap(func) {
				ctx.beginPath();
				ctx.save();
				this._prepareContext(ctx);
				func(ctx);
				ctx.restore();
			}).bind(this);
		},
		_prepareContext: function(ctx) {
			ctx.translate(this.x, this.y);

			pathFromRegion(ctx, this.damagedRegion);
			ctx.clip();
		},
		draw: function(clippedRegion, ctx) {
			this.damagedRegion.clear();
			this.damagedRegion.copy(clippedRegion);
			this.damagedRegion.translate(-this.x, -this.y);
			this.clientWindow.expose(this._wrapContext(ctx), this.damagedRegion);
		},
		reconfigure: function(x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;

			this.inputWindow.style.left = this.x + "px";
			this.inputWindow.style.top = this.y + "px";
			this.inputWindow.style.width = this.width + "px";
			this.inputWindow.style.height = this.height + "px";

			this.shapeRegion.clear();
			this.shapeRegion.init_rect(this.x, this.y, this.width, this.height);

			this.clientWindow.configureNotify(this.x, this.y, this.width, this.height);
		}
	});

	var Server = new Class({
		initialize: function() {
			this._container = document.createElement("div");
			this._container.classList.add("crtc");
			this.elem = this._container;

			this._canvas = document.createElement("canvas");
			// xxx proper dimensions
			this._canvas.width = 800;
			this._canvas.height = 600;

			this._ctx = this._canvas.getContext('2d');
			this._container.appendChild(this._canvas);

			// All toplevel windows, sorted with the top-most window *first*.
			this._toplevelWindows = [];
			this._queueRedraw = new Task(this._redraw.bind(this));

			// The region of the screen that needs to be updated.
			this._damagedRegion = new Region();

			this._backgroundColor = 'rgb(51, 110, 165)';

			this._ctx.beginPath();
			this._ctx.save();
			this._ctx.fillStyle = this._backgroundColor;
			this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
			this._ctx.restore();
		},

		// For a given window, return the region that would be
		// immediately damaged if the window was removed. That is,
		// the window's shape region clipped to the areas that are
		// visible.
		_calculateEffectiveRegionForWindow: function(serverWindow) {
			var idx = this._toplevelWindows.indexOf(serverWindow);
			var windowsOnTop = this._toplevelWindows.slice(0, idx);
			var region = new Region();
			region.copy(serverWindow.shapeRegion);
			windowsOnTop.forEach(function(aboveWindow) {
				region.subtract(region, aboveWindow.shapeRegion);
			});
			return region;
		},

		_redraw: function() {
			var intersection = new Region();
			this._toplevelWindows.forEach(function(serverWindow) {
				intersection.clear();
				intersection.intersect(this._damagedRegion, serverWindow.shapeRegion);
				if (intersection.not_empty()) {
					this._damagedRegion.subtract(this._damagedRegion, intersection);
					serverWindow.draw(intersection, this._ctx);
				}
			}, this);

			if (this._damagedRegion.not_empty()) {
				var ctx = this._ctx;
				ctx.beginPath();
				ctx.save();
				pathFromRegion(ctx, this._damagedRegion);
				ctx.fillStyle = this._backgroundColor;
				ctx.fill();
				this._damagedRegion.clear();
				ctx.restore();
			}

			return false;
		},
		damageRegion: function(region) {
			this._damagedRegion.union(this._damagedRegion, region);
			this._queueRedraw();
		},
		addWindow: function(clientWindow) {
			var serverWindow = new ServerWindow(clientWindow, this);
			clientWindow._serverWindow = serverWindow;
			this._toplevelWindows.unshift(serverWindow);
			this._container.appendChild(serverWindow.inputWindow);

			// Since this window is on top, we know the entire shape region
			// is damaged.
			this.damageRegion(serverWindow.shapeRegion);
		},
		removeWindow: function(clientWindow) {
			var serverWindow = clientWindow._serverWindow;

			this._toplevelWindows.erase(serverWindow);
			this._container.removeChild(serverWindow.inputWindow);

			var region = this._calculateEffectiveRegionForWindow(serverWindow);
			this.damageRegion(region);
			region.finalize();

			clientWindow._serverWindow = null;
			serverWindow.finalize();
		},
		configureRequest: function(clientWindow, x, y, width, height) {
			var serverWindow = clientWindow._serverWindow;

			// This is a bit fancy. We need to accomplish a few things:
			//
			//   * If the window was resized, we need to ensure we mark
			//     the newly exposed region on the window itself as
			//     damaged.
			//
			//   * If the window was moved, we need to ensure we mark
			//     the newly exposed region under the old position of
			//     the window as damaged.
			//
			//   * If the area on top of the window was damaged before
			//     the reconfigure, we need to ensure we move that
			//     damaged region to the new coordinates.
			//
			//   * Make sure we prevent exposing as much as possible.
			//     If a window somewhere below the stack moves behind
			//     another window completely, we should only mark the
			//     newly exposed region.

			var oldRegion = this._calculateEffectiveRegionForWindow(serverWindow);
			var oldX = serverWindow.x, oldY = serverWindow.y;
			var oldW = serverWindow.width, oldH = serverWindow.height;

			// Reconfigure the window -- this will modify the shape region.
			serverWindow.reconfigure(x, y, width, height);

			var newRegion = this._calculateEffectiveRegionForWindow(serverWindow);

			var damagedRegion = new Region();

			// Pixels need to be exposed under the window in places where the
			// old region is, but the new region isn't.
			damagedRegion.subtract(oldRegion, newRegion);
			this._damagedRegion.union(this._damagedRegion, damagedRegion);

			// Pixels also need to be exposed on the window itself where the
			// new region is, and the old one isn't.
			damagedRegion.clear();
			damagedRegion.subtract(newRegion, oldRegion);
			this._damagedRegion.union(this._damagedRegion, damagedRegion);

			// If X/Y change, we copy the old area, so we need to translate into
			// the coordinate space of the new window's position to know what needs
			// to be redrawn after the copy.
			oldRegion.translate(serverWindow.x - oldX, serverWindow.y - oldY);
			damagedRegion.clear();
			damagedRegion.subtract(newRegion, oldRegion);
			this._damagedRegion.union(this._damagedRegion, damagedRegion);

			// Copy the old image contents over, masked to the region.
			var ctx = this._ctx;
			ctx.beginPath();
			ctx.save();
			pathFromRegion(ctx, newRegion);
			ctx.clip();
			ctx.drawImage(ctx.canvas, oldX, oldY, oldW, oldH, serverWindow.x, serverWindow.y, oldW, oldH);
			ctx.restore();

			this._queueRedraw();

			oldRegion.finalize();
			newRegion.finalize();
			damagedRegion.finalize();
		}
	});

	var Window = new Class({
		connect: function(server) {
			this._server = server;
			this._server.addWindow(this);
		},
		configureNotify: function(x, y, width, height) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
		},
		expose: function() {
		},
		configure: function(x, y, width, height) {
			x = x === undefined ? this.x : x;
			y = y === undefined ? this.y : y;
			width = width === undefined ? this.width : width;
			height = height === undefined ? this.height : height;
			this._server.configureRequest(this, x | 0, y | 0, width | 0, height | 0);
		}
	});

	exports.Server = Server;
	exports.Window = Window;

})(window);
