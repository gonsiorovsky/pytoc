// ==UserScript==
// @name        Python Docs TOC
// @description Dynamically generates TOC for the pages of the Python documentation sites
// @version     1.0
// @author      Denis Gonsiorovsky
// @downloadURL https://github.com/gonsiorovsky/pytoc/raw/master/pytoc.user.js
// @updateURL   https://github.com/gonsiorovsky/pytoc/raw/master/pytoc.user.js
// @include     *
// @run-at      document-end
// ==/UserScript==

;(function(){
    if (!document.querySelector('.docutils')) {
        return;
    }

    var style = document.createElement('style');
    style.innerHTML = '.toc-nobullet { list-style: none; } .toc-noindent { padding-left: 0; } .toc-strong { font-weight: bold; }';
    document.querySelector('head').appendChild(style);
    
    
    var repeat = function(string, num){ return new Array(parseInt(num) + 1).join(string); };
    var get_text = function (elem) {
        var text = []; 
        for (var node = elem.firstChild; node; node = node.nextSibling) {
            if (node.className == 'property' || node.className == 'headerlink') {
                continue;
            }

            // Get the text from text nodes and CDATA nodes
            if (node.nodeType == 3 || node.nodeType == 4)
                text.push(node.nodeValue);

            // Special case for script nodes
            else if (node.tagName === 'SCRIPT')
                text.push(node.text);

            // Traverse everything else, except comment nodes 
            else if (elem.nodeType !== 8)
                text.push(get_text(node));

        } 
        return text.join('');
    };
    
    var find_dls = function(parent) {
        var dls = [];
        for (var child, i = 0; child = parent.childNodes[i]; i++) {
            if (child.tagName === "DL") {
                dls.push(child);
            }
        }
        
        if (!dls.length) {
            for (var child, i = 0; child = parent.childNodes[i]; i++) {
                dls.push.apply(dls, find_dls(child));
            }
        }
        
        return dls;
    };
    
    var build_tree = function(parent) {
        var dls = find_dls(parent);
        
        if (!dls.length) {
            return null;
        }
        
        var ul = document.createElement('ul');
        ul.className = 'toc-ul';
        
        for (var dl, i = 0; dl = dls[i]; i++) {
            var dt = dl.querySelector('dt');
            
            var li = document.createElement('li');
            li.className = 'toc-li';
            
            if (dt.id) {
                var a = document.createElement('a');
                a.href = "#" + dt.id;
            } else {
                var a = document.createElement('span');
            }
            
            if (dl.className === 'class') {
                //a.className = 'toc-strong';
                
                var cls = document.createElement('span');
                cls.innerHTML = 'class';
                cls.className = 'toc-strong';
                li.appendChild(cls);
            }
            
            if (dl.className === 'method' || dl.className === 'function' || dl.className === 'classmethod') {
                var def = document.createElement('span');
                def.innerHTML = 'def';
                def.className = 'toc-strong';
                li.appendChild(def);
            }
            
            a.innerHTML = get_text(dt);

            li.appendChild(a);
            ul.appendChild(li);
            
            var child_ul = build_tree(dl);
            if (child_ul) {
                var li = document.createElement('li');
                li.className = 'toc-li toc-nobullet';
                li.appendChild(child_ul);
                ul.appendChild(li);
            }
        }
        
        return ul;
    };
      
    var sections = document.querySelectorAll('.section');
    
    for (var section, i = 0; section = sections[i]; i++) {
        (function() {
            var toc_header = document.createElement('h4');
            toc_header.innerHTML = 'Contents';

            var toc_ul = build_tree(section);
            toc_ul.className = 'toc-nobullet toc-noindent';


            var toc = document.createElement('div');
            toc.appendChild(toc_header);
            toc.appendChild(toc_ul);

            //var first_dl = section.querySelector('dl');
            var insert_at;
            for (var child, i = 0; child = section.childNodes[i]; i++) {
                if (child.tagName === 'DL' || child.className === 'section') {
                    insert_at = child;
                    break;
                }
            }

            if (!insert_at) {
                for (var child, i = 0; child = section.childNodes[i]; i++) {
                    if (child.tagName === 'H1' || child.tagName === 'H2' || child.tagName === 'H3' || child.tagName === 'H4') {
                        insert_at = child.nextSibling;
                        break;
                    }
                }
            }

            if (!insert_at) {
                insert_at = section.childNodes[0].nextSibling;
            }

            section.insertBefore(toc, insert_at);
        })();
    }
})();

