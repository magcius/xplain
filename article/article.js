// Contains various utility methods to help generate the more dynamic parts
// of the articles. You may be looking for the code for some of the demos,
// which are in src/article-demos.

(function(exports) {
    "use strict";

    // The master table of contents.
    const TOC = [
        { id: "index", title: "Introduction & Table of Contents" },
        { id: "x-basics", title: "X Window System Basics" },
        { id: "window-tree", title: "Advanced Window Techniques" },
        { id: "composite", title: "Adding Transparency" },
        { id: "regions", title: "Regional Geometry" },
        { id: "rast1", title: "Basic 2D Rasterization" },
    ];
    exports.TOC = TOC;

    function findTOCEntryIndex(id) {
        for (let i = 0; i < TOC.length; i++)
            if (TOC[i].id == id)
                return i;
        return -1;
    }

    function linkToEntry(entry) {
        return entry.id + '.html';
    }

    function generateTitle() {
        const entryIndex = findTOCEntryIndex(document.body.id);
        if (entryIndex === -1)
            return;
        const entry = TOC[entryIndex];
        document.title += ` - ${entry.title}`;
    }

    // Generate the table of contents
    function generateTOC() {
        const tocElem = document.querySelector('.table-of-contents');
        if (!tocElem)
            return;

        for (const entry of TOC) {
            const link = document.createElement('a');
            link.href = linkToEntry(entry);
            link.textContent = entry.title;

            const li = document.createElement('li');
            li.appendChild(link);
            tocElem.appendChild(li);
        }
    }

    // Generate the <h2> at the top of each page, along with nav buttons linking
    // to the next/previous articles.
    function generateNavButtons() {
        const h2 = document.querySelector('h2');
        const navBottom = document.querySelector('.nav-bottom');
        const entryIndex = findTOCEntryIndex(document.body.id);
        if (entryIndex === -1)
            return;
        const entry = TOC[entryIndex];

        function createNavButton(container, entry, content) {
            const slot = document.createElement('span');
            slot.classList.add('nav-button');
            container.appendChild(slot);

            if (entry) {
                const link = document.createElement('a');
                link.href = linkToEntry(entry);
                link.innerHTML = content;
                link.title = entry.title;
                slot.appendChild(link);
            }
        }

        // Prev page button
        createNavButton(h2, TOC[entryIndex - 1], '&lang;');
        createNavButton(navBottom, TOC[entryIndex - 1], '&lang;');

        const textSlot = document.createElement('span');
        textSlot.classList.add('text-slot');
        textSlot.textContent = entry.title;
        h2.appendChild(textSlot);

        const bottomSlot = document.createElement('span');
        bottomSlot.innerHTML = 'Written by <a href="index.html#credits">Jasper St. Pierre, among others</a>';
        bottomSlot.classList.add('text-slot');
        navBottom.appendChild(bottomSlot);

        // Next page button
        createNavButton(h2, TOC[entryIndex + 1], '&rang;');
        createNavButton(navBottom, TOC[entryIndex + 1], '&rang;');
    }

    // Generate the permalinks to each section in the article for easy linking.
    function generateSectionLinks() {
        const sections = document.querySelectorAll('section');
        for (const section of sections) {
            const h3 = section.querySelector('h3');

            const link = document.createElement('a');
            link.href = '#' + section.id;
            link.innerHTML = '&para;';
            h3.appendChild(link);
        }
    };

    if (typeof window !== 'undefined') {
        window.onload = function() {
            // Silly thing about current year in composite.
            for (const yearElem of document.querySelectorAll('#current-year'))
                yearElem.textContent = (new Date().getFullYear());

            generateTitle();
            generateTOC();
            generateNavButtons();
            generateSectionLinks();

            // Run article demos.
            if (window.ArticleDemos !== undefined)
                ArticleDemos.runAllDemos();
        };
    }

})(this['window'] || exports);
