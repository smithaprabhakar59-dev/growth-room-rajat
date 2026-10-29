/* Minimal renderer for the Growth Room pages: {{holes}}, <sc-for>, <sc-if>, onClick. */
(function () {
  var KEY = 'gr-rajat-state:' + location.pathname;
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch);
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) {}
    render();
  };
  window.DCLogic = DCLogic;

  var tpl, mount, comp;
  function lookup(path, scope) {
    var parts = path.trim().split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  var HOLE = /\{\{\s*([\w.$]+)\s*\}\}/g;
  function single(str) { var m = /^\s*\{\{\s*([\w.$]+)\s*\}\}\s*$/.exec(str || ''); return m ? m[1] : null; }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, p) { var v = lookup(p, scope); return v == null ? '' : String(v); });
  }
  function build(node, scope, out) {
    if (node.nodeType === 3) { out.appendChild(document.createTextNode(interp(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var list = lookup(single(node.getAttribute('list')) || '', scope) || [];
      var as = node.getAttribute('as') || 'item';
      list.forEach(function (item, idx) {
        var s = Object.create(scope); s[as] = item; s.$index = idx;
        node.childNodes.forEach(function (c) { build(c, s, out); });
      });
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(single(node.getAttribute('value')) || '', scope)) node.childNodes.forEach(function (c) { build(c, scope, out); });
      return;
    }
    var el = document.createElementNS(node.namespaceURI, node.localName);
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i], n = a.name;
      if (/^on/i.test(n)) {
        var fn = lookup(single(a.value) || '', scope);
        if (typeof fn === 'function') el.addEventListener(n.slice(2).toLowerCase(), fn);
        continue;
      }
      if (n.indexOf('hint-') === 0) continue;
      el.setAttribute(n, interp(a.value, scope));
    }
    var kids = node.content ? node.content.childNodes : node.childNodes;
    kids.forEach(function (c) { build(c, scope, el); });
    out.appendChild(el);
  }
  function render() {
    var vals = comp.renderVals ? comp.renderVals() : {};
    var y = window.scrollY;
    var frag = document.createDocumentFragment();
    tpl.content.childNodes.forEach(function (c) { build(c, vals, frag); });
    mount.replaceChildren(frag);
    window.scrollTo(0, y);
  }
  window.dcStart = function (Component) {
    tpl = document.getElementById('dc-template');
    mount = document.getElementById('dc-root');
    comp = new Component({});
    try { var saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) Object.assign(comp.state, saved); } catch (e) {}
    render();
    if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
  };
})();
