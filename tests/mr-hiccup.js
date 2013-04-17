module("_.dom");
// tests will not pass because of variations in self closing tags (with or without ending slash) so we detect that
var gt  = ">",
	gts = "/>";

var selfClosingEnd = gts;
var div = document.createElement("div");
var img = document.createElement("img");
div.appendChild(img);
if (div.innerHTML === "<img>") {
	selfClosingEnd = gt;
}


// not sure if we are escaping by default or not
var escapeHTML = false;

test("_.node", function() {

	expect(7);

	var node = _.node();
	same(node.toString(), "<div></div>", "empty div by default");

	node.set("id", "test");
	same(node.toString(), '<div id="test"></div>', "simple set attr works fine");
	console.log(node.toString());

	node.set({
		id: "test",
		"class": "test",
		title: "this is a good title"
	});

	var expectedNodeStr = '<div id="test" class="test" title="this is a good title"></div>';

	same(node.toString(), expectedNodeStr, "complex set attr, with spec object and attr removal works fine");
	console.log(node.toString());

	var nextNode = _.node("div");
	nextNode.set("id", "next");
	console.log("nextNode", nextNode, node);
	nextNode.append(node);
	console.log(nextNode.toString());
	console.log("nextNode", nextNode, node);
	same(nextNode.toString(), '<div id="next">'+expectedNodeStr+'</div>', "simple append works fine");

	console.log(nextNode.children.toString());
	same(expectedNodeStr, nextNode.children.toString(), "children.toString works fine");

	nextNode.append([node, _.node(), _.node()]);

	same(nextNode.toString(), '<div id="next">'+expectedNodeStr+expectedNodeStr+'<div></div><div></div></div>', "array append works fine");

	var p = _.node("p");
	var textNode = 'this is some text with some <html><p>in it</p></html>';
	p.append(textNode);
	console.log(p.toString());
	nextNode.append(p);

	escapeHTML = _.doc.usesRealDom();

	same(p.toString(), "<p>"+textNode+"</p>", "text append with escaping html strings works fine");

});



test("_.el", function() {

	expect(0);

	_.doc.useRealDom(true);
	var div = _.el("div");
	div.id = "testdiv";

	console.log(typeof div, div, div.toString());
	document.body.appendChild(div);

	var items = [1, 2, 3, 4];
	var div2 = _.el('div#message', [
		_.el('a.biglink', {href: 'http://www.google.com'}, 'A link to Google'),
		_.el('ul', _.map(items, function(item) {
			return _.el('li.item', item + '. Item');
		}))
	]);

	div.appendChild(div2);
	console.log(typeof div2, div2, div2.toString());

	_.doc.useRealDom(false);
	var div3 = _.el('div#message', [
		_.el('a.biglink', {href: 'http://www.google.com'}, ['A link to Google']),
		_.el('ul', _.map(items, function(item) {
			return _.el('li.item', [item + '. Item']);
		}))
	]);

	console.log(typeof div3, div3, div3.toString());
	console.log(div3.toString());
	console.log(div.innerHTML);

	var html = '<div id="message"><a class="biglink" href="http://www.google.com">A link to Google</a><ul><li class="item">1. Item</li><li class="item">2. Item</li><li class="item">3. Item</li><li class="item">4. Item</li></ul></div>';

	same(html, div3.toString(), "string mode html output is as expected");
	same(html, div.innerHTML, "dom mode html output is as expected");

	_.id("testdiv").innerHTML = "";


	var genDOMWithel = function ( data ) {

		return _.el( 'div', {
			className: 'Foo' +
				( data.isSelected ? ' selected' : '' ) +
				( data.isActive ? ' active' : '' )
		}, [
			_.el( 'label', [
				_.el( 'input', {
					type: 'checkbox',
					checked: data.isSelected ? 'checked': ''
				})
			]),
			_.el( 'button', {
				className:'button',
				title: 'A title'
			}, ['The button text']),
			_.el( 'a', {
				href: data.href
			}, [
				_.el( 'span', {
					className: 'lorem' +
						( data.total > 1 ? ' ipsum' : '' )
				}, [
					_.el( 'span', {
						className:'dolores',
						unselectable: 'on'
					}, [
						data.text
					]),
					data.total > 1 ? _.el( 'span', {
						className:'total',
						unselectable: 'on'
					},'(' + data.total + ')') : null
				]),
				data.yes ? _.el( 'span', {className:'yes'},'*') : null,
				_.el( 'span', {
						className:'text',unselectable: 'on'
					},
					data.total > 1 ? data.text : null
				),
				_.el( 'time', {
					unselectable: 'on',
					title: data.displayDate
				}, data.displayDate),
				_.el( 'span', {
					className:'preview',unselectable: 'on'
				}, data.preview)
			])
		]);
	};


	var genDOMWithInnerHTML = function ( data ) {
		var div = document.createElement( 'div' );
		div.innerHTML = '<div class="Foo' +
			(data.isSelected ? ' selected' : '') +
			(data.isActive ? ' active' : '') + '">' +
			'<label><input type="checkbox" checked="' +
			(data.isSelected ? 'checked': '') + '"></label>' +
			'<button class="button" title="A title">The button text</button>' +
			'<a href="' + data.href + '"><span class="lorem' +
			( data.total > 1 ? ' ipsum' : '' ) +
			'"><span class="dolores" unselectable="on">' + data.text +
			'</span>' + ( data.total > 1 ?
			'<span class="total" unselectable="on">(' + data.total + ')</span>' :
			'') +
			'</span>' + (data.yes ? '<span class="yes">*</span>' : '') +
			'<span class="text" unselectable="on">' +
			(data.total > 1 ? data.text : null) +
			'</span>' +
			'<time unselectable="on" title="' + data.displayDate + '">' +
			data.displayDate +
			'</time><span class="preview" unselectable="on">' + data.preview +
			'</span></a></div>';
		return div.firstChild;
	};

	var data = {
		isSelected: true,
		isActive: false,
		href: 'http://www.google.com',
		total: 4,
		displayDate: '28th December 2011',
		text: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
		preview: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
	};

	_.doc.useRealDom(true);
	var elDomContainer = _.el("div");
	var elDom = genDOMWithel(data);
	elDomContainer.appendChild(elDom);
	var elDomHtml = elDomContainer.innerHTML;

	_.doc.useRealDom(false);
	var elHtm = genDOMWithel(data);
	var elHtmHtml = elHtm.toString();


	_.doc.useRealDom(true);
	var htmlDomContainer = _.el("div");
	var htmlDom = genDOMWithInnerHTML(data);
	htmlDomContainer.appendChild(htmlDom);
	var htmlInner = htmlDomContainer.innerHTML;

	same(elDomHtml, elHtmHtml, "complex string and dom mode output is the same");
	same(elHtmHtml, htmlInner, "complex string mode output is the same as reference html");
	same(elDomHtml, htmlInner, "complex dom mode output is the same as reference html");
//	same(html, div.innerHTML, "dom mode html output is as expected");

});


// used in dom
var validDoms = {

	simple1: {
		dom: 		["div"],
		val:		"<div></div>"
	},
	simple2: {
		dom: 		["div", "h1", "p"],
		val:		"<div></div><h1></h1><p></p>"
	},
	simple3: {
		dom: 		["div", "hello"],
		val:		"<div>hello</div>"
	},
	simple4: {
		dom: 		["div", ["h1", "p"]],
		val:		"<div><h1></h1><p></p></div>"
	},
	simple5: {
		dom: 		["div", ["h1"], "p"],
		val:		"<div><h1></h1></div><p></p>"
	},
	simple6: {
		dom: 		["div.test", "h1#foo", "p#foo2.test.test2"],
		val:		'<div class="test"></div><h1 id="foo"></h1><p id="foo2" class="test test2"></p>'
	},
	simple7: {
		dom: 		["div.test", {title: "the title"}, "h1#foo", {className: "test3", title: "the title"}, "inner text", "p#foo2.test.test2", {className: "test3", title: "the title"}],
		val:		'<div class="test" title="the title"></div><h1 id="foo" class="test3" title="the title">inner text</h1><p id="foo2" class="test test2 test3" title="the title"></p>'
	},
	simple8: {
		dom: 		["div.test", {title: "the title"}, ["h1#foo", {className: "test3", title: "the title"}, "inner text", "p#foo2.test.test2", {className: "test3", title: "the title"}]],
		val:		'<div class="test" title="the title"><h1 id="foo" class="test3" title="the title">inner text</h1><p id="foo2" class="test test2 test3" title="the title"></p></div>'
	},
	simple9: {
		dom: 		["div.test", {title: "the title"}, ["h1#foo", {className: "test3", title: "the title"}, "inner text"], "p#foo2.test.test2", {className: "test3", title: "the title"}],
		val:		'<div class="test" title="the title"><h1 id="foo" class="test3" title="the title">inner text</h1></div><p id="foo2" class="test test2 test3" title="the title"></p>'
	},
	escapeHtmlStrings: {
		dom: ["div.test-3", "<div>this is some html<p>p tag</p></div>"],
		val: '<div class="test-3"><div>this is some html<p>p tag</p></div></div>'
	}
	// todo add LOTS more here
};


test("_.dom", function() {

	var data = {
		isSelected: true,
		isActive: false,
		href: 'http://www.google.com',
		total: 4,
		displayDate: '28th December 2011',
		text: "text",
		preview: "preview"
	};



	_.each(validDoms, function(d) {

		_.doc.useRealDom(false);
		var dom1 = _.dom(d.dom);
		console.log(d);
		console.log(dom1.toString());

		_.doc.useRealDom(true);
		var div = _.el("div");


		var dom2 = _.dom(d.dom);
		console.log(dom1, div, dom2);
		_.each(dom2, function(val) {
			div.appendChild(val);
		});

		console.log(div.innerHTML);

		same(dom1.toString(), d.val, "outputStrings dom output is good");
		same(d.val, div.innerHTML, "dom output converted to string is good");
	});



	function genDom(data) {
		return _.dom([
			'div', {className: 'Foo' + (data.isSelected ? ' selected' : '') + (data.isActive ? ' active' : '')}, [
				'label', [
					'input', {type: 'checkbox', checked: (data.isSelected ? 'checked': '')}
				]
				,
				'button.button', {title: 'A title'},
				'The button text',
				'a', {href: data.href}, [
					'span', {className: 'lorem' + (data.total > 1 ? ' ipsum' : '')}, [
						'span.dolores', {unselectable: 'on'}, [
							data.text
						],
						'span.total', {unselectable: 'on', className: (data.total < 1 ? "hidden" : "")}
					],
					'span.yes', {className: (!data.yes ? "hidden" : "")},
					"*",
					'span', {unselectable: 'on'}, data.total > 1 ? data.text : null,
					'time', {unselectable: 'on', title: data.displayDate},
					data.displayDate,
					'span.preview', {unselectable: 'on'},
					data.preview
				]
			]
		]);
	}

	_.doc.useRealDom(false);
	var dom = genDom(data);

//	console.log(dom.toString());

	_.doc.useRealDom(true);
	var div = _.el("div");

	var dom2 = genDom(data);
//	console.log(div, dom2);
	_.each(dom2, function(val) {
		div.appendChild(val);
	});
//	console.log(div.innerHTML);

	escapeHTML = _.doc.usesRealDom();

	same(div.innerHTML, dom.toString(), "complex dom output same for both render modes");


	var testData = {
		val1: "this is a test",
		val2: "foo",
		val3: "bar",
		val4: "baz"
	};


	_.doc.useRealDom(false);


	var templateDoms = {
		simpleTpl1: {
			fn: function(data) {return _.dom(["div.test", data.val]);},
			val: '<div class="test">'+testData.val2+'</div>',
			val2: '<div class="test">'+testData.val3+'</div>'
		},

		simpleTpl1cc1: {
			fn: function(data) {return _.dom(["div.test",, data.val]);}, // using double comma
			val: '<div class="test">'+testData.val2+'</div>',
			val2: '<div class="test">'+testData.val3+'</div>'
		},

		simpleTpl1cc2: {
			fn: function(data) {return _.dom(["div.test", "div.test"]);}, // using double comma
			val: '<div class="test"></div><div class="test"></div>',
			val2: '<div class="test"></div><div class="test"></div>'
		},

		simpleTpl1cc3: {
			fn: function(data) {return _.dom(["div.test",, "div.test"]);}, // using double comma
			val: '<div class="test">div.test</div>',
			val2: '<div class="test">div.test</div>'
		},


		simpleTpl2: {
			fn: function(data) {return _.dom(["div.test", {title: data.val}, data.val]);},
			val: '<div class="test" title="'+testData.val2+'">'+testData.val2+'</div>',
			val2: '<div class="test" title="'+testData.val3+'">'+testData.val3+'</div>'
		},

		simpleTpl2cc1: {
			fn: function(data) {return _.dom(["div.test", {title: data.val},, data.val]);},
			val: '<div class="test" title="'+testData.val2+'">'+testData.val2+'</div>',
			val2: '<div class="test" title="'+testData.val3+'">'+testData.val3+'</div>'
		},

		simpleTpl2cc2: {
			fn: function(data) {return _.dom(["div.test", {title: data.val}, "div.test"]);},
			val: '<div class="test" title="'+testData.val2+'"></div><div class="test"></div>',
			val2: '<div class="test" title="'+testData.val3+'"></div><div class="test"></div>'
		},

		simpleTpl2cc3: {
			fn: function(data) {return _.dom(["div.test", {title: data.val},, "div.test"]);},
			val: '<div class="test" title="'+testData.val2+'">div.test</div>',
			val2: '<div class="test" title="'+testData.val3+'">div.test</div>'
		},

		imgs: {
			fn: function(data) {return _.dom(["img", {src: "#", title: data.val}, "img", {src: "#", title: data.val2}]);},
			val: '<img src="#" title="'+testData.val2+'"'+ selfClosingEnd+'<img src="#" title="'+testData.val3+'"'+ selfClosingEnd,
			val2: '<img src="#" title="'+testData.val3+'"'+ selfClosingEnd+'<img src="#" title="'+testData.val4+'"'+ selfClosingEnd
		},

		page0: {
			fn: function(data) {
				return _.dom([
					"html", [
						"head", [
							"title", data.val
						],
						"body", [
							"div.midNoise", [
							]
						]
					]
				]);
			},
			val: '<html><head><title>'+testData.val2+'</title></head><body><div class="midNoise"></div></body></html>',
			val2: '<html><head><title>'+testData.val2+'</title></head><body><div class="midNoise"></div></body></html>'
		},

		page1: {
			fn: function(data) {
				console.log("page1", data);
				return _.dom([
					"html", [
						"head", [
							"title", data.val
						],
						"body", [
							"div.midNoise", [
								"div.container", [
									"div.row", [
										"div.span16", [
											"h1#pageTitle", [
												"span.big", "TalkSmash", "br",
												data.val2
											]
										]
									]
								]
							]
						]
					]
				]);
			},
			val: '<html><head><title>'+testData.val2+'</title></head><body><div class="midNoise"><div class="container"><div class="row"><div class="span16"><h1 id="pageTitle"><span class="big">TalkSmash</span><br'+ selfClosingEnd + testData.val3+'</h1></div></div></div></div></body></html>',
			val2: '<html><head><title>'+testData.val2+'</title></head><body><div class="midNoise"><div class="container"><div class="row"><div class="span16"><h1 id="pageTitle"><span class="big">TalkSmash</span><br'+ selfClosingEnd + testData.val3+'</h1></div></div></div></div></body></html>'
		}
	};


	_.each(templateDoms, function(d, name) {

		_.doc.useRealDom(false);

		var dom0 = d.fn({val: testData.val2, val2: testData.val3});
		same(dom0.toString(), d.val, "outputStrings partial output is good");

		_.doc.useRealDom(true);
		var div = _.el("div.holder");
		var dom2 = d.fn({val: testData.val2, val2: testData.val3});
		console.log("useRealDom = true", dom2);
		_.each(dom2, function(val) {
			div.appendChild(val);
		});

		console.log(dom0, div.innerHTML, dom2);

		console.log(name, dom0.toString());

		same(div.innerHTML, d.val, "partial output converted to string is good");
	});
});

