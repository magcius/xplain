// Quick hacky thing to generate feed.xml

"use strict";

const fs = require('fs');
const path = require('path');

const article = require('./article');

function escapeHTML(S) {
    return S.replace('&', '&amp;');
}

function generateAtomFeed() {
    const base_url = 'http://magcius.github.io/xplain/article';

    let entries = "";
    for (const entry of article.TOC) {
        const filename = `${entry.id}.html`;
        const filepath = path.join(__dirname, filename);
        const stats = fs.statSync(filepath);

        const url = `${base_url}/${filename}`;
        entries += `    <entry>
        <title>${escapeHTML(entry.title)}</title>
        <link href="${url}" type="text/html" />
        <id>${url}</id>
        <updated>${stats.mtime.toISOString()}</updated>
    </entry>
`;
    }
    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>Explanations</title>
    <link href="${base_url}/feed.xml" rel="self" />
    <link href="${base_url}/" />
    <id>${base_url}/</id>
    <author>
        <name>Jasper St. Pierre</name>
        <email>jstpierre@mecheye.net</email>
    </author>
    <updated>${new Date().toISOString()}</updated>
${entries}
</feed>`;
}

fs.writeFileSync(path.join(__dirname, 'feed.xml'), generateAtomFeed());
