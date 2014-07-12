// Contains various utility methods to help generate the more dynamic parts
// of the articles. You may be looking for the code for some of the demos,
// which are in src/article-demos.

(function(exports) {
    "use strict";

    var Article = {};

    // The master table of contents.
    var TOC = [
        { id: "index", title: "Introduction & Table of Contents" },
        { id: "x-basics", title: "X Window System Basics" },
        { id: "window-tree", title: "Advanced Window Techniques" },
    ];

    function findTOCEntryIndex(id) {
        for (var i = 0; i < TOC.length; i++)
            if (TOC[i].id == id)
                return i;
        throw new Error("Unknown page");
    }

    function linkToEntry(entry) {
        return entry.id + '.html';
    }

    // Generate the table of contents
    Article.generateTOC = function() {
        var tocElem = document.querySelector('.table-of-contents');
        TOC.forEach(function(entry) {
            var link = document.createElement('a');
            link.href = linkToEntry(entry);
            link.textContent = entry.title;

            var li = document.createElement('li');
            li.appendChild(link);
            tocElem.appendChild(li);
        });
    };

    // Generate the <h2> at the top of each page, along with nav buttons linking
    // to the next/previous articles.
    Article.generateNavButtons = function() {
        var h2 = document.querySelector('h2');
        var navBottom = document.querySelector('.nav-bottom');
        var entryIndex = findTOCEntryIndex(document.body.id);
        var entry = TOC[entryIndex];

        function createNavButton(container, entry, content) {
            var slot = document.createElement('span');
            slot.classList.add('nav-button');
            container.appendChild(slot);

            if (entry) {
                var link = document.createElement('a');
                link.href = linkToEntry(entry);
                link.innerHTML = content;
                link.title = entry.title;
                slot.appendChild(link);
            }
        }

        // Prev page button
        createNavButton(h2, TOC[entryIndex - 1], '&lang;');
        createNavButton(navBottom, TOC[entryIndex - 1], '&lang;');

        var textSlot = document.createElement('span');
        textSlot.classList.add('text-slot');
        textSlot.textContent = entry.title;
        h2.appendChild(textSlot);

        var dummySlot = document.createElement('span');
        dummySlot.classList.add('text-slot');
        navBottom.appendChild(dummySlot);

        // Next page button
        createNavButton(h2, TOC[entryIndex + 1], '&rang;');
        createNavButton(navBottom, TOC[entryIndex + 1], '&rang;');
    };

    // Generate the permalinks to each section in the article for easy linking.
    Article.generateSectionLinks = function() {
        var sections = document.querySelectorAll('section');
        [].forEach.call(sections, function(section) {
            var h3 = section.querySelector('h3');

            var link = document.createElement('a');
            link.href = '#' + section.id;
            link.innerHTML = '&para;';
            h3.appendChild(link);
        });
    };

    exports.Article = Article;

})(window);
