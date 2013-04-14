xserver.js
==========

What?
=====

An accurate emulation of the X server (and clients), written in JavaScript.

Why?
====

With Wayland coming out in the near future, it seems people don't quite
understand the whole thing, so I figured I'd make a helpful interactive
demo. This piggybacks on that "The Linux Graphics Stack" article I wrote
a little while ago.

Also, not gonna lie, because it's a fun side-project. There's also lots
of gritty subtleties of X11, and writing an alternate X server involves
me digging into those. I would be lying if I said I wasn't lying.

How?
====

Well, it's mostly hand-written JavaScript. There's a few exceptions:

  * Some code was ported from the X server, pretty much verbatim. These
    include the complex set of flags around sending focus and crossing
    events.

  * The code that calculates regions is an emscripten-compiled version
  	of the pixman region code, which stems back to the original DEC
  	XFree86 code dump. It's fairly hairy and math-y code, so I figured
  	that's one piece I really should just lift.

Demo?
=====

Over here, somewhere. I'm building a giant set of examples based on this
that basically go through the history of having 35 (just about) years of
X, and all the hacks and techniques that evolved over the years.
