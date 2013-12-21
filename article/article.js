(function(exports) {
    "use strict";

    var Article = {};

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
