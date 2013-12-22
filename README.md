xplain
======

A set of articles and custom demos to explain how the X Window System works.

Demo framework / xserver.js
===========================

It's not just a set of jury-rigged DOM nodes and custom JavaScript. It's
actually an accurate implementation of how the X server works, by implementing
most of the same requests that the X server normally takes, and sending the
same sorts of events back to clients. The clients written here actually look
mostly like clients that use raw Xlib to do a lot of their work.

It's not 100% complete, of course. Instead of emulating a state-of-the-80s
graphics API, I simply give clients the full power of `<canvas>` by giving
them a context that's already clipped to the area of the front buffer they
need to paint.

Some other optimizations or simplifications have been made either so that it
seems "more JavaScript-y" or for the sake of my sanity. For instance,
`SelectInput` is an actual request rather than being the only per-client
window attribute, and the request takes a list of event strings rather than
a mask. Instead of a "changed" mask like `ConfigureWindow` usually has, clients
just leave the property out of the property bag when they send the request over.

I also commonly add custom requests and events simply to make my life easier.
For instance, for the inspector, I added a `X-CursorWindowChanged` event so that
it can track the cursor window, rather than have to have to select for `Enter`/
`Leave` events on every window through `CreateNotify`.

Grab semantics are slightly different (they're more like `XI2` in that you can
overwite an existing grab instead of having to use `ChangeActivePointerGrab`).

I could go on.

Since this is a mostly from-scratch implementation of a 40 year old codebase,
there's probably plenty of bugs to be found. Please don't think this anything
but a learning project and a demo framework. If you send me a pull request
because you're basing your new VNC clone on this, I reserve rights to laugh
at you and close it.

Getting around
==============

Most of the server code is in src/server/server.js

All the demo code is in src/article-demos/

Credits
=======

This has taken me the better part of a year, off-and-on, to write. I've found
[browser bugs](https://bugzilla.mozilla.org/show_bug.cgi?id=842110), X server
bugs, gotten my name in the
[HTML5 specification](http://html5.org/tools/web-apps-tracker?from=7723&to=7724),
and lots more.

As I say in the article, I didn't do this alone. There's a lot of people who
helped me tremendously with this work. A big thanks goes to Keith Peters,
Alan Coopersmith, Adam Jackson, Peter Hutterer, and Owen Taylor who all helped
me figure a lot of the hairier parts of X11.
