mr-hiccup
=========

Mr. Hiccup is a dom constructor add-on for underscore.js inspired by [Hiccup for Clojure]: https://github.com/weavejester/hiccup

For usage examples:

define a tag with css style selectors

	_.dom("div");
	_.dom("div#someId");
	_.dom("div.someClass");
	_.dom("div#someId.someClass.someOtherClass");

	<div></div>
	<div id="someId"></div>
	<div class="someClass"></div>
	<div id="someId" class="someClass someOtherClass"></div>

optionally add some properties

	_.dom("input", {type: "text", value:"foo"});

	<input type="text" value="foo">

innerText and innerHTML

	_.dom("div", "some inner text");
	_.dom("div", "<p>some inner html</p>");

	<div>some inner text</div>
	<div id="someId"><p>some inner html</p></div>


child nodes can be defined by nesting the syntax in an array

	_.dom("ul", [
		"li", "this is some inner text"
	]);

	<ul><li>this is some inner text</li></ul>

still works fine with properties

	_.dom("select", {name: "mySelect"}, [
		"option", {selected: true}, "this is some inner text"
	]);

	<select name="mySelect"><option selected="selected">this is some inner text</option></select>

if it looks like a valid html tag/selector it will become a sibling, otherwise it is treated as text and will become inner text for the prior node

	_.dom("ul", ["li", "li", "li"]);

	<ul><li></li><li></li><li></li></ul>

the space in the 3rd li will actually force it to become innerText to the 2nd li

	_.dom("ul", ["li","li"," li"]);

	<ul><li></li><li> li</li></ul>

the sibling/inner text rules can combined

	_.dom("ul", [
		"li", "first item",
		"li",
		"li", "third item",
		"li",
		"li", "fifth item"
	]);

	<ul><li>first item</li><li></li><li>third item</li><li></li><li>fifth item</li></ul>



This can become dangerous though! How do you determine the difference between a sibling span and the innerText "span"?

	_.dom("span", "span");

	<span></span><span></span>

There is an added syntax to force the following string to be escaped and treated as innerText, it is the use of two leading commas instead of one.

Escape strings with ,,

	_.dom(["span",, "span"]);

	<span>span</span>

Note that you cannot use this convention when passing instructions as indivudual arguments to _.dom, they need to be wrapped in an array.


To facilitate storing these dom structures in variables and then passing them into the _.dom function you can wrap everything in an array and pass that one item into the function. These will produce equivalent output.

	// two arguments
	_.dom("ul", ["li","li"," li"]);

	// one argument
	var myList = ["ul", ["li","li"," li"]];
	_.dom(myList);

Dom nodes are also valid values.

	var li = document.createElement("li");
	_.dom("ul", [li, li.cloneNode(), li.cloneNode()]);

There is an imperfect check to determine if a given string is a tag or innerText. First it checks for a valid, leading tag name from the following list.

	//tags list derived from http://www.w3schools.com/html5/html5_reference.asp
	var validTags = "a abbr acronym address applet area article aside audio b base basefont bdi bdo big\
			blockquote body br button canvas caption center cite code col colgroup command datalist\
			dd del details dfn dir div dl dt em embed fieldset figcaption figure font footer\
			form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins keygen kbd\
			label legend li link map mark menu meta meter nav noframes noscript object ol optgroup\
			option output p param pre progress q rp rt ruby s samp script section select small source\
			span strike strong style sub summary sup table tbody td textarea tfoot th thead time title\
			tr track tt u ul var video wbr";

I say this is imperfect because it is possible that you will want to use one of these words as an individual innerText value, and that will not work. Unless you add something to it like an html tag, some whitespace, or more words a singular string from the list will become a dom node.

	_.dom([
        "<!DOCTYPE html>",
        "html", [
            "head", [
                "title", data.title,
                "link", {type: "text/css", rel: "stylesheet", href: "/css/docs2.css"},
                "link", {type: "text/css", rel: "stylesheet", href: "/js/prettify/solarized.css"}
            ],
            "body", {id: data.pageId}, [

                "div.midNoise", [

                    _.part('headerInclude'),

                    "div.container.span17", [
                        "div.row", [
                            "div#nav.span3.overlay", data.index,
                            "div#doc.span13", data.content
                        ]
                    ]
                ],

                _.js("/js/prettify/prettify.js"),

                _.js("/js/bootstrap-scrollspy.js"),

                _.js("/js/docs.js")

            ]
        ]
	});


support for iterator return values

	var colors = ["red", "green", "pink", "blue"];

	var colorList = _.dom([
		"ul", _.map(colors, function(color) {
			return ["li", color];
		})
	]);

The map will return an array which is perfect for defining the children of our ul. And if the first item in an array is another array that will be a signal to the parser to expand the contents of the inner array and treat it as if it didn’t exist.

In the process the following structure is produced.

	var colorList = _.dom([
		"ul", [
			["li", "red"],
			["li", "green"],
			["li", "pink"],
			["li", "blue"]
		]
	]);

Seeing an array as the first child the parser then concats all the inner arrays together and all is right with the world.

	var colorList = _.dom([
		"ul", [
			"li", "red",
			"li", "green",
			"li", "pink",
			"li", "blue"
		]
	]);

This also applies to objects. Rather than calling _.map(_.values(myObject), iterator) you can just do _.map(myObject, iterator).

	var items = {
		one: "item one",
		two: "item two",
		three: "item three"
	};

	_.dom([
		"ul", _.map(items, function(val, key) {
			return ["li."+key, val];
		})
	]);

This also works.

	_.dom([
		"ul", {
			one: ["li.one", "item one"],
			two: ["li.two", "item two"],
			three: ["li.three", "item three"]
		}
	]);

Seeing an array as the first value in the object the parser treats it not as attributes for the ul but as a map of children. It concats the array values and Voilà!

	_.dom([
		"ul", [
			"li.one", "item one",
			"li.two", "item two",
			"li.three", "item three"
		]
	]);

_.dom outputs arrays of DOM nodes but if you want to switch to string mode you can do that. _.dom uses two other apis, _.node and _.doc which present the minimal set of functionality for _.dom to do its thing with nodes or strings it is basically a tiny, very limited mock dom api. To turn on string mode in the browser just call _.doc.useRealDom(“false”); you can switch it back by calling it again with true. In node or any other environment without a document object it will default to the mock dom and the useRealDom method has no effect. You have to be careful with this however because depending on the state of the system some code may work while other code may not. Clearly this is not the optimal solution to this idea of supporting both dom nodes and html strings but it works for now.

but is it fast?

Short answer, NO!

I’ll post some benchmarks but suffice to say its a couple orders of magnitude slower than many of the templating solutions out there. A compiler for this system would need to somehow allow for all the things you can do in javascript while pulling out the static bits as a precompiled template. I’ve begun looking into that but it would require some serious ast parsing. That said there are probably plenty of gains to be had, I have not spent any time optimizing this yet. But when you consider the overhead of the browser and its ability to simply update the dom, the bottleneck is not this _.dom parser but the browser itself. So sure you can use some templating language that can build you a million complex tables in a second or two but it will take many times longer for the browser dom to catch up so in practice _.dom is viable in the browser for that reason. On the server even if you have a fast templating engine the best bet is to cache heavily if you have lots of server load. In situations where you are sensitive to performance of non-cacheable stuff then you should not use this code otherwise I think its ok.