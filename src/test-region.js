(function(exports) {
    "use strict";

    QUnit.test("basic", function(assert) {
        var r = new Region();
        r.init_rect(100, 200, 300, 400);

        assert.equal(r.n_rects(), 1);
        assert.equal(r.toString(), "[+100+200x300x400]");
        assert.equal(r.extentsString(), "100,200 - 400,600")
    });

    QUnit.test("translate", function(assert) {
        var r = new Region();
        r.init_rect(100, 200, 300, 400);
        r.translate(50, 25);
        assert.equal(r.toString(), "[+150+225x300x400]");
        assert.equal(r.extentsString(), "150,225 - 450,625")
    });

    QUnit.test("union", function(assert) {
        var r1 = new Region();
        r1.init_rect(50, 50, 100, 100);
        var r2 = new Region();
        r2.init_rect(100, 100, 100, 100);

        var rt = new Region();
        rt.union(r1, r2);

        assert.equal(rt.toString(), "[+50+50x100x50, +50+100x150x50, +100+150x100x50]");
        assert.equal(rt.extentsString(), "50,50 - 200,200");
    });

    QUnit.test("intersect", function(assert) {
        var r1 = new Region();
        r1.init_rect(50, 50, 100, 100);
        var r2 = new Region();
        r2.init_rect(100, 100, 100, 100);

        var rt = new Region();
        rt.intersect(r1, r2);

        assert.equal(rt.toString(), "[+100+100x50x50]");
        assert.equal(rt.extentsString(), "100,100 - 150,150");
    });

    QUnit.test("empty", function(assert) {
        var r = new Region();
        r.init_rect(50, 50, 100, 100);

        assert.ok(!r.is_empty());
        assert.ok(r.not_empty());

        r.clear();
        assert.ok(r.is_empty());
        assert.ok(!r.not_empty());
        assert.equal(r.extentsString(), "0,0 - 0,0");
    });

    QUnit.test("union rect", function(assert) {
        var r = new Region();
        for (var i = 0; i < 5; i++)
            r.union_rect(r, 10 * i, 0, 5, 5);

        assert.equal(r.toString(), "[+0+0x5x5, +10+0x5x5, +20+0x5x5, +30+0x5x5, +40+0x5x5]");
        assert.equal(r.extentsString(), "0,0 - 45,5");
    });

    QUnit.test("intersect empty", function(assert) {
        var r1 = new Region();
        var r2 = new Region();
        r2.init_rect(100, 100, 100, 100);

        var rt = new Region();
        rt.intersect(r1, r2);

        assert.equal(rt.toString(), "[]");
        assert.equal(rt.extentsString(), "0,0 - 0,0");
    });

    QUnit.test("subtract quantum", function(assert) {
        var r1 = new Region();
        r1.init_rect(0, 0, 100, 100);

        var r2 = new Region();
        r2.init_rect(40, 40, 20, 20);

        var rt = new Region();
        rt.subtract(r1, r2);

        assert.equal(rt.toString(), "[+0+0x100x40, +0+40x40x20, +60+40x40x20, +0+60x100x40]");
        assert.equal(rt.extentsString(), "0,0 - 100,100");
    });

    QUnit.test("subtract complex", function(assert) {
        var r1 = new Region();
        r1.init_rect(0, 0, 100, 100);

        var r2 = new Region();
        r2.union_rect(r2, 0,  0, 100, 10);
        r2.union_rect(r2, 0, 20, 100, 10);
        r2.union_rect(r2, 0, 40, 100, 10);
        r2.union_rect(r2, 0, 60, 100, 10);

        var rt = new Region();
        rt.subtract(r1, r2);

        assert.equal(rt.toString(), "[+0+10x100x10, +0+30x100x10, +0+50x100x10, +0+70x100x30]");
        assert.equal(rt.extentsString(), "0,0 - 100,100");
    });

})(window);
