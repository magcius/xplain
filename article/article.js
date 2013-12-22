(function(exports) {
    "use strict";

    var Article = {};

    var TOC = [
        { id: "index", title: "Introduction & Table of Contents" },
        { id: "x-basics", title: "X Window System Basics" }
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

    Article.generateNavButtons = function() {
        var h2 = document.querySelector('h2');
        var entryIndex = findTOCEntryIndex(document.body.id);
        var entry = TOC[entryIndex];

        function createNavButton(entry, content) {
            var slot = document.createElement('span');
            slot.classList.add('nav-button');
            h2.appendChild(slot);

            if (entry) {
                var link = document.createElement('a');
                link.href = linkToEntry(entry);
                link.innerHTML = content;
                link.title = entry.title;
                slot.appendChild(link);
            }
        }

        // Prev page button
        createNavButton(TOC[entryIndex - 1], '&lang;');

        var textSlot = document.createElement('span');
        textSlot.classList.add('text-slot');
        textSlot.textContent = entry.title;
        h2.appendChild(textSlot);

        // Next page button
        createNavButton(TOC[entryIndex + 1], '&rang;');
    };

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
