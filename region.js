
(function(exports) {

	var canvas = document.createElement("canvas");
	var ctx = canvas.getContext("2d");

	function scanRegion(ctx, offset) {
		offset = offset || { x: 0, y: 0 };

		var sw = ctx.canvas.width, sh = ctx.canvas.height;
		var img = ctx.getImageData(0, 0, sw, sh);

		function getAlphaPixel(x, y) {
			var pix = y * sw + x;
			var idx = pix * 4 + 3; // alpha pixel
			return img.data[idx];
		}

		var rects = [];
		for (var y = 0; y < sh; y++) {
			for (var x = 0; x < sw; x++) {
				var w = x;
				while (getAlphaPixel(w, y) == 255 && w < sw)
					w++;
				if (w > x)
					rects.push({ x: x + offset.x, y: y + offset.y,
								 width: w - x, height: 1 });
			}
		}
		return rects;
	}

	function scan(offset) {
		return scanRegion(ctx, offset);
	}

	function regionBounds() {
		var regions = [].slice.call(arguments);
		var rects = regions.reduce(function(a, b) { return a.concat(b); }, []);

		var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
		rects.forEach(function(r) {
			x1 = Math.min(x1, r.x);
			y1 = Math.min(y1, r.y);
			x2 = Math.max(x2, r.x + r.width);
			y2 = Math.max(y2, r.y + r.height);
		});

		return { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
	}

	function clearCanvas(bounds) {
		ctx.canvas.width = bounds.width;
		ctx.canvas.height = bounds.height;
	}

	function regionPath(region, off) {
		region.forEach(function(r) {
			ctx.rect(r.x - off.x, r.y - off.y, r.width, r.height);
		});
	}

	function compositeRegions(r1, r2, operator) {
		var bounds = regionBounds(r1, r2);
		clearCanvas(bounds);

		ctx.save();

		ctx.beginPath();
		regionPath(r1, bounds);
		ctx.fill();

		ctx.beginPath();
		ctx.globalCompositeOperation = operator;
		regionPath(r2, bounds);
		ctx.fill();

		ctx.restore();

		return scan(bounds);
	}

	function unionRegion(r1, r2) {
		return compositeRegions(r1, r2, 'source-over');
	}

	function subtractRegion(r1, r2) {
		return compositeRegions(r1, r2, 'destination-out');
	}

	function intersectRegion(r1, r2) {
		return compositeRegions(r1, r2, 'destination-in');
	}

	function excludeRegion(r1, r2) {
		return compositeRegions(r1, r2, 'xor');
	}

	exports.scanRegion = scanRegion;
	exports.regionBounds = regionBounds;
	exports.unionRegion = unionRegion;
	exports.subtractRegion = subtractRegion;
	exports.intersectRegion = intersectRegion;
	exports.excludeRegion = excludeRegion;

})(window);
