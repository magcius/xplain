// Implements the "region" data structure as used all throughout the X server.

(function(exports) {
    "use strict";

    function int(x) { return x | 0; }

    // Some basic precalculated "empty" regions and parts of regions.
    const FROZEN_EMPTY_BANDS = Object.freeze([]);
    const FROZEN_EMPTY_EXTENTS = Object.freeze({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const FROZEN_EMPTY_REGION = Object.freeze({ bands: FROZEN_EMPTY_BANDS, extents: FROZEN_EMPTY_EXTENTS });

    // We have a number of data structures here:
    //
    // A "band" is composed of a Y1/Y2 ("top" / "bottom") and a list of walls.
    //
    // A "rectangle" is composed of x/y/width/height.
    //
    // An "extents" is an alternate form of a rectangle, composed of x1/y1/x2/y2.
    // It's more convenient for doing bounds testing on.
    //
    // A "region" is simply a list of bands combined with an extents.

    // The number of rectangles in a band.
    function bandsNRects(bands) {
        let n = 0;
        for (const band of bands)
            n += band.walls.length / 2;
        return n;
    }

    // Iterate over the rectangles in a region.
    function bandsRects(bands, callback) {
        for (const band of bands) {
            const y = band.top, height = band.bottom - y;

            for (let i = 0; i < band.walls.length; i += 2) {
                const x = band.walls[i], width = band.walls[i+1] - x;
                callback(x, y, width, height);
            }
        }
    }

    // Is point x,y in the extents?
    function pointInExtents(extents, x, y) {
        return (x >= extents.x1 && x < extents.x2 && y >= extents.y1 && y < extents.y2);
    }

    // The intersection of two extents.
    function extentsIntersection(extents1, extents2) {
        const x1 = Math.max(extents1.x1, extents2.x1);
        const x2 = Math.min(extents1.x2, extents2.x2);
        if (x1 >= x2)
            return FROZEN_EMPTY_EXTENTS;
        const y1 = Math.max(extents1.y1, extents2.y1);
        const y2 = Math.min(extents1.y2, extents2.y2);
        if (y1 >= y2)
            return FROZEN_EMPTY_EXTENTS;
        return Object.freeze({ x1: x1, x2: x2, y1: y1, y2: y2 });
    }

    // The union of two extents.
    function extentsUnion(extents1, extents2) {
        const x1 = Math.min(extents1.x1, extents2.x1);
        const x2 = Math.max(extents1.x2, extents2.x2);
        const y1 = Math.min(extents1.y1, extents2.y1);
        const y2 = Math.max(extents1.y2, extents2.y2);
        return Object.freeze({ x1: x1, x2: x2, y1: y1, y2: y2 });
    }

    // Create a new band given the top/bottom Y postiions and a list of walls.
    function newBand(top, bottom, walls) {
        return { top: top, bottom: bottom, walls: Object.freeze(walls) };
    }

    // Returns a region containing a single rectangle.
    function rectRegion(x1, y1, width, height) {
        x1 = int(x1); y1 = int(y1); width = int(width); height = int(height);
        const x2 = x1 + width, y2 = y1 + height;
        const bands = Object.freeze([newBand(y1, y2, [x1, x2])]);
        const extents = Object.freeze({ x1: x1, y1: y1, x2: x2, y2: y2 });
        return Object.freeze({ bands: bands, extents: extents });
    }


    // "Operations" are the boolean operations we implement for region math.
    //
    // We implement them with a clever trick. Through observation, we have
    // three possible "states" when we want to emit rectangles: when inside
    // region 1 alone, when inside region 2 alone, or when inside both
    // regions.
    //
    // For union, we want to emit rectangles for all three states.
    //
    // For intersection, we want to emit rectangles only when inside both
    // regions.
    //
    // For subtraction, we want to emit rectangles when inside region 1, but
    // not when inside region 2 or both.
    //
    // For XOR, we want to emit rectangles when inside either region alone,
    // but not when inside both.
    //
    // We describe these possible states with three bits. When we transition
    // from having none of these bits set to having one or more of these bits
    // set, we emit a wall. Same when transitioning to zero.
    const Operation = {
        // B = Inside both regions
        // 2 = Inside region 2, outside region 1
        // 1 = Inside region 1, outside region 2
        // The "outside both regions" case is unselectable.
        //                 B21
        UNION:     0x7, // 111
        INTERSECT: 0x4, // 100
        SUBTRACT:  0x1, // 001
        XOR:       0x3, // 011
    };

    // Bitfield components of Operation, above.
    const OperationComponents = {
        IN_1: 0x1,
        IN_2: 0x2,
        IN_BOTH: 0x4,
    };

    // Our main function, which combines the two regions given
    function combineRegion(op, src1, src2) {
        // Some quick fast paths. We hit these a surprising number of times,
        // so they're important to have.

        // If both regions are empty, no matter what operation we select,
        // we can never be in any of the three states, so just bail out with
        // an empty region.
        if (!src1.bands.length && !src2.bands.length)
            return FROZEN_EMPTY_REGION;

        // If src1 is empty, then check our operation -- we can never be in
        // IN_1 or IN_BOTH in this case, but we might to be inside IN_2. If
        // we select for IN_2 then this is the same as union/subtraction/xor.
        // If not, then this is the intersection case and we get an empty region.
        if (!src1.bands.length) {
            if (op & OperationComponents.IN_2)
                return src2;
            else
                return FROZEN_EMPTY_REGION;
        }
        if (!src2.bands.length) {
            if (op & OperationComponents.IN_1)
                return src1;
            else
                return FROZEN_EMPTY_REGION;
        }

        // If the extents of the regions don't intersect, then we can take an
        // early exit for the intersection/subtract cases.
        const intersection = extentsIntersection(src1.extents, src2.extents);
        if (intersection == FROZEN_EMPTY_EXTENTS) {
            if (op == OperationComponents.BOTH)
                return FROZEN_EMPTY_REGION;
            else if (op == OperationComponents.IN_1)
                return src1;
            else if (op == OperationComponents.IN_2)
                return src2;
        }

        // While IN_BOTH is a separate operation, this is particularly tricky
        // to track at runtime when entering/exiting walls. We keep a separate
        // "State" enum here, where (State.IN_1 | State.IN_2) is equivalent to
        // Operation.IN_BOTH when going to check. The bitfield of states maps
        // exactly to one bit inside OperationComponents.
        const State = {
            NONE: 0x0,
            IN_1: 0x1,
            IN_2: 0x2,
        };

        // Whether our current state is matching the operation passed in.
        function matchState(state) {
            // If we're outside both regions, then we can't possibly be
            // matching any operations.
            if (state == State.NONE)
                return false;

            // Translate the state to OperationComponents.
            let stateOp;
            if (state == (State.IN_1 | State.IN_2))
                stateOp = OperationComponents.IN_BOTH;
            else
                stateOp = state;

            return (stateOp & op) != 0;
        }

        // To make our algorithms not have a special case for the non-overlapping
        // case, we simply pretend that we have two extra bands on both sides of
        // the region, stretching all the way from negative infinity to positive
        // infinity. This means that a region has a band for all possible Y values,
        // and that our list of bands actually "starts indexing" at -1.
        function getBand(region, i) {
            if (i == -1)
                return { top: -Infinity, bottom: region.bands[0].top, walls: [] };
            if (i == region.bands.length)
                return { top: region.bands[i - 1].bottom, bottom: Infinity, walls: [] };
            return region.bands[i];
        }

        function selectMin(a, b) {
            if (a !== undefined && b !== undefined)
                return Math.min(a, b);
            else if (a !== undefined)
                return a;
            else if (b !== undefined)
                return b;
            else
                return undefined;
        }

        function combineBands(bandA, bandB) {
            let state = State.NONE;
            let iA = 0, iB = 0;
            const walls = [];
            while (true) {
                // Take the first wall we see.
                const wallA = bandA.walls[iA];
                const wallB = bandB.walls[iB];

                const wall = selectMin(wallA, wallB);

                // When we run out of walls, break out.
                if (wall === undefined)
                    break;

                const oldState = state;

                if (wall === wallA) {
                    iA++;
                    state ^= State.IN_1;
                }
                if (wall === wallB) {
                    iB++;
                    state ^= State.IN_2;
                }

                // Edge-triggered: when we transition from matching to not matching,
                // or from not matching to matching, now's our change to do a wall.
                if (matchState(oldState) !== matchState(state))
                    walls.push(wall);
            }
            return walls;
        }

        // Are these two walls equal? Basically an "arrayEquals" method.
        function wallsEqual(w1, w2) {
            if (w1.length != w2.length)
                return false;

            for (let i = 0; i < w1.length; i++)
                if (w1[i] != w2[i])
                    return false;

            return true;
        }

        // Push a new band to the list of bands in this region. If it notices
        // that this and the last band are touching with the exact same set of
        // walls, it will simply extend the last band down to where we are,
        // and discard our band, coalescing the two together.
        function pushBand(top, bottom, walls) {
            if (top >= bottom)
                return;
            if (top == -Infinity || bottom == Infinity)
                return;

            // Coalesce bands that have the same walls and are touching each other.
            if (bands.length >= 1) {
                const aboveBand = bands[bands.length - 1];
                if (wallsEqual(walls, aboveBand.walls) && top == aboveBand.bottom) {
                    aboveBand.bottom = bottom;
                    return;
                }
            }

            bands.push(newBand(top, bottom, walls));
        }

        let iA = -1, iB = -1;
        const bands = [];

        while (true) {
            const bandA = getBand(src1, iA);
            const bandB = getBand(src2, iB);

            const top = Math.max(bandA.top, bandB.top);
            const bottom = Math.min(bandA.bottom, bandB.bottom);

            const walls = combineBands(bandA, bandB);
            pushBand(top, bottom, walls);

            if (bottom === Infinity)
                break;

            if (bottom === bandA.bottom)
                iA++;
            if (bottom === bandB.bottom)
                iB++;
        }

        // Through observation, all operations will result in one of three
        // different extents: the extents of src1 (subtraction), the
        // intersection of the two extents (intersection), and the union of the
        // two extents (union, xor). As such, we can calculate the new extents
        // without actually looking at the resulting bands.

        let extents;
        if ((op & (OperationComponents.IN_1 | OperationComponents.IN_2)) == (OperationComponents.IN_1 | OperationComponents.IN_2))
            extents = extentsUnion(src1.extents, src2.extents);
        else if (op & OperationComponents.IN_1)
            extents = src1.extents;
        else if (op & OperationComponents.IN_2)
            // This case is unused with the normal four operations. It's added
            // for completeness.
            extents = src2.extents;
        else if (op & OperationComponents.IN_BOTH)
            extents = intersection;

        return Object.freeze({ bands: Object.freeze(bands), extents: extents });
    }

    class Region {
        constructor() {
            this.clear();
        }
        copy(source) {
            this.bands = source.bands;
            this.extents = source.extents;
        }
        finalize() {
            this.bands = null;
            this.extents = null;
        }
        clear() {
            this.copy(FROZEN_EMPTY_REGION);
        }
        init_rect(x, y, width, height) {
            this.copy(rectRegion(x, y, width, height));
        }
        union(r1, r2) {
            this.copy(combineRegion(Operation.UNION, r1, r2));
        }
        union_rect(r1, x, y, w, h) {
            this.copy(combineRegion(Operation.UNION, r1, rectRegion(x, y, w, h)));
        }
        intersect(r1, r2) {
            this.copy(combineRegion(Operation.INTERSECT, r1, r2));
        }
        intersect_rect(r1, x, y, w, h) {
            this.copy(combineRegion(Operation.INTERSECT, r1, rectRegion(x, y, w, h)));
        }
        subtract(r1, r2) {
            this.copy(combineRegion(Operation.SUBTRACT, r1, r2));
        }
        subtract_rect(r1, x, y, w, h) {
            this.copy(combineRegion(Operation.SUBTRACT, r1, rectRegion(x, y, w, h)));
        }
        xor(r1, r2) {
            this.copy(combineRegion(Operation.XOR, r1, r2));
        }
        is_empty() {
            return this.extents.x2 <= this.extents.x1;
        }
        not_empty() {
            return this.extents.x2 > this.extents.x1;
        }
        n_rects() {
            return bandsNRects(this.bands);
        }
        iter_rectangles(callback) {
            bandsRects(this.bands, callback);
        }
        translate(x, y) {
            this.bands = this.bands.map(function(band) {
                const newWalls = band.walls.map(function(wall) { return wall + x; });
                return newBand(band.top + y, band.bottom + y, newWalls);
            });
            this.extents = Object.freeze({ x1: this.extents.x1 + x, y1: this.extents.y1 + y,
                                        x2: this.extents.x2 + x, y2: this.extents.y2 + y });
        }
        contains_point(x, y) {
            if (!pointInExtents(this.extents, x, y))
                return false;

            for (let i = 0; i < this.bands.length; i++) {
                const band = this.bands[i];
                if (y < band.top)
                    return false;
                if (y > band.bottom)
                    continue;

                for (let j = 0; j < band.walls.length; j += 2) {
                    const x1 = band.walls[j], x2 = band.walls[j + 1];
                    if (x < x1)
                        return false;
                    if (x < x2)
                        return true;
                }
            }
            return false;
        }
        extentsString() {
            const { x1, y1, x2, y2 } = this.extents;
            return `${x1},${y1} - ${x2},${y2}`;
        }
        toString() {
            if (this.is_empty())
                return "[]";

            const S = "[";
            this.iter_rectangles(function(x, y, width, height) {
                S += `+${x}+${y}x${width}x${height}, `;
            });
            S = S.slice(0, -2) + "]";
            return S;
        }
    }

    exports.Region = Region;

})(window);
