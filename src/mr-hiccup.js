// Copyright (c) 2013 Andrew Luetgers, MIT License
(function() {

	var root = this,
		_ = root._;

	if (!_ && "module" in root && module.exports) {
		root._ = _ = require("underscore");
	}

	if (!_) {
		throw new Error("Mr Hiccup requires underscore.js");
	}

	var slice = Array.prototype.slice,
		splice = Array.prototype.splice;

	// basic types -------------------------------------------------------
	var typeStr = {lo: {}, ob: {}},
		strUp = "", strLo = "", one = 1,
		typeStringsCap = ("Arguments Array Boolean Date Element Error Function "+
			"Null Number Object RegExp String NaN Undefined").split(" ");

	for (var i=0; i<typeStringsCap.length; i++) {
		strUp = typeStringsCap[i];
		strLo = strUp.toLowerCase();
		typeStr.lo[strLo.substr(0, 3)] = strLo;
		typeStr.ob[strLo.substr(0, 3)] = "[object " + strUp + "]";
	}

	// a garbage free typeof function derived from the one used in qunit
	_.typeof = function(obj) {
		var lo = typeStr.lo,
			ob = typeStr.ob,
			t = typeof obj;

		if (t === lo.str) {return t;}
		if (t === lo.und) {return t;}
		if (obj === null) {return lo.nul;}
		if (obj.nodeType === one) {return lo.ele;}

		switch (toString.call(obj)) {
			case ob.num:	return (obj === obj) ? lo.num : lo.nan;
			case ob.str:	return lo.str;
			case ob.boo:	return lo.boo;
			case ob.arr:	return lo.arr;
			case ob.dat:	return lo.dat;
			case ob.reg:	return lo.reg;
			case ob.fun:	return lo.fun;
			case ob.arg:	return lo.arg;
		}
		return t;
	};





	_.slice = function(obj, start, end) {
		return slice.call(obj, start || 0, end);
	};

	_.splice = function(obj, start, howMany) {
		// slice creates garbage, lets not do that if we don't have to
		if (arguments.length > 3 || typeof obj === "string") {
			return splice.apply(obj, $flat($slice(arguments, 1)));
		} else {
			return splice.call(obj, start, howMany);
		}
	};






	_.id = function(id) {
		return document.getElementById(id);
	};


	/**
	 * _.combine augments the first object with deep copies of
	 * all other objects excluding their inherited properties
	 * @param target (object) an object to augment
	 * Remaining parameters may be object/s or array/s of objects
	 * all of the following are valid
	 * _.combine(object, object)
	 * _.combine(object, object, object, object)
	 * _.combine(object, [object])
	 * _.combine(object, [object, object, object])
	 * _.combine(object, object, [object, object], object)
	 */
	_.combine = function(target) {
		if(target) {
			var sources = $slice(arguments, 1);

			// accept objects or arrays of objects
			$each(sources, function(source) {
				for (var key in source) {
					// do a deep copy that excludes any inherited properties at any level on the source
					if (source.hasOwnProperty(key)) {
						target[key] = source[key];
					}
				}
			});
		}

		return target;
	}


	// use the same constructor every time to save on memory usage per
	// http://oranlooney.com/functional-javascript/
	function F() {}

	_.new = function(prototype, ignoreInit) {

		F.prototype = prototype || {};

		var newInstance = new F();

		if(!ignoreInit && newInstance.init) {

			if (_.isFunction(newInstance.init)) {
				newInstance.init();
			} else {
				// fix any uglyness that may have come through in the inits array
				var inits = _.filter(_.flatten(newInstance.init), _.isFunction);

				// support single init functions or arrays of them
				newInstance.init = function() {
					// call the init methods using the new object for "this"
					_.each(inits, function(fn) {
						fn.call(newInstance);
					});
				}
			}
		}

		return newInstance;
	};


	// hyper-simplistic dom node api for html string building, used by _.el for outputStrings mode
	// EXPOSED FOR TESTING ONLY, DON'T USE THIS DIRECTLY, DOES NOT ESCAPE HTML IN STRINGS
	var selfClosing = {area:1, base:1, basefont:1, br:1, col:1, frame:1, hr:1, img:1, input:1, link:1, meta:1, param:1};
	var directProperties = {className:'class', htmlFor:'for'};
	var booleanProperties = {checked: 1, defaultChecked: 1, disabled: 1, multiple: 1, selected: 1};

	_.node = (function() {

		var lt  = "<",  gt  = ">",
			lts = "</", gts = "/>" ,
			space = " ", equo = '="',
			quo = '"';

		// usage of trailing slash on self closing tags varies so mimic the platform
		// this is mostly to help write passing tests
		var selfClosingEnd = gts;
		if ("document" in root) {
			var div = document.createElement("div");
			var img = document.createElement("img");
			div.appendChild(img);
			if (div.innerHTML === "<img>") {
				selfClosingEnd = gt;
			}
		}

		// children toString should not include commas
		var childrenToString = function(node) {
			var str = "";
			_.each(node, function(val) {
				if (val || val === 0) {
					str += val;
				}
			});
			return str;
		};

		var node = {
			init: function() {
				this.type = "";
				this.attr = {};
				this.children = [];
				this.children.toString = function() {
					return childrenToString(this);
				}
			},
			nodeType: 1, // so we can pass the _.isElement test
			append: function(nodes) {
				// no we don't do validation here, so sue me
				// this will handle a single node or an array of nodes or a mixed array of nodes and arrays of nodes
				this.children.splice.apply(this.children, ([this.children.length, 0]).concat(nodes));
				return this;
			},
			set: function(key, value) {
				if (key) {
					if (!_.isString(key)) {
						var spec = key;
						that = this;
						// assume key is a hash of key value pairs to be added in to existing attr hash
						if (spec.id) {
							this.set("id", spec.id);
							delete spec.id;
						}

						if (spec.className) {
							this.set("className", spec["className"]);
							delete spec["className"];
						}

						_.each(spec, function(val, theKey) {
							that.set(theKey, val);
						});

					} else {
						// simple key value assignment
						if (value) {
							// add/edit attribute
							// support alternate attribute names
							key = directProperties[key] || key;
							if (booleanProperties[key]) {
								if (value) {
									value = key;
								} else {
									delete this.attr[key];
								}
							}
							this.attr[key] = value;
						} else {
							// remove the attribute
							delete this.attr[key];
						}
					}
				}
				return this;
			},

			toString: function() {
				// DONT CONSOLE.log "this" in here or do anything that will call toString on this
				// it will create an infinite loop of tostring calling tostring in firefox, others??
				var str = lt + this.type;
				_.each(this.attr, function(val, key) {
					if (val) {
						str += space + key + equo + val + quo;
					}
				});

				if (selfClosing[this.type]) {
					return str + selfClosingEnd;
				} else {
					return str + gt + this.children + lts + this.type + gt;
				}
			}
		};



		// for compatibility with _.el dom builder in outputStrings mode
		node.appendChild = node.append;
		node.removeAttribute = node.setAttribute = node.set;

		return function(type) {
			// use new to reduce memory footprint for many nodes
			var n = _.new(node);
			n.type = type || "div";
			return n;
		};

	}());

	// for compatibility with _.el dom builder in outputStrings mode
	var useDocument = root.document,
		emptyString = "",
		maxLength = 0,
		tags = {},
		splitter = /(#|\.)/,
		whitespace = /\s+/,
		validTags = "a abbr acronym address applet area article aside audio b base basefont bdi bdo big\
						blockquote body br button canvas caption center cite code col colgroup command datalist\
						dd del details dfn dir div dl dt em embed fieldset figcaption figure font footer\
						form frame frameset h1 h2 h3 h4 h5 h6 head header hgroup hr html i iframe img input ins keygen kbd\
						label legend li link map mark menu meta meter nav noframes noscript object ol optgroup\
						option output p param pre progress q rp rt ruby s samp script section select small source\
						span strike strong style sub summary sup table tbody td textarea tfoot th thead time title\
						tr track tt u ul var video wbr";
						// tags list derived from http://www.w3schools.com/html5/html5_reference.asp

	// create nodes in real DOM or microDom from one api
	_.doc = {
		hasRealDom: function() {
			return !!root.document;
		},
		usesRealDom: function() {
			return useDocument;
		},
		useRealDom: function(bool) {
			useDocument = root.document ? bool : false;
			return useDocument;
		},
		createTextNode: function(str) {
			return useDocument ? document.createTextNode(str) : str + emptyString;
		},
		createElement: function(tag) {
			return useDocument ? document.createElement(tag) : _.node(tag);
		},
		addTag: function(str) {
			maxLength = Math.max(maxLength, str.length);
			tags[str] = function(sel) {
				return str + sel || "";
			};
		},
		getTags: function() {
			return tags;
		},
		// its not perfect but should get the job done
		isSelector: function(string) {

			if (string && !string.charAt) {return false;}

			if (string.safe) {return false;}

			// spaces are not valid in selectors, must be content, this should cover 90% of content
			// a common case for content is innerHTML with tags so test for that if no space
			if ((string.indexOf(" ") > -1) || (string.indexOf("<") > -1)) {
				return false;
			}

			var parts = string.split(splitter),
				tag = parts[0].toLowerCase();

			// is it longer than any of the valid tags or is it not a valid tag?
			if ((tag.length > maxLength) || !(tag in tags)) {
				return false;
			}

			var partsLen = parts.length, id = "", className = "", i, j, l, name, type;

			if (partsLen > 2) {
				for (i=1, j=2, l=partsLen; j<l; i+=2, j+=2) {
					name = parts[j];
					type = parts[i];
					if (type === "#") {
						id = name;
					} else {
						className = className ? className + " " + name : name;
					}
				}
			}

			return {
				tag: tag,
				id: id,
				className: className
			};
		}
	};


	_.each(validTags.split(whitespace), _.doc.addTag);


	_.el = (function() {
		// dom builder see: http://blog.fastmail.fm/2012/02/20/building-the-new-ajax-mail-ui-part-2-better-than-templates-building-highly-dynamic-web-pages/
		// modified to support dom node output or string output, for server land
		var root = this;

		var directProperties = {
			'class': 		'className',
			className: 		'className',
			defaultValue: 	'defaultValue',
			'for': 			'htmlFor',
			value: 			'value'
		};

		var booleanProperties = {
			checked: 1,
			defaultChecked: 1,
			disabled: 1,
			multiple: 1,
			selected: 1,
			autoplay: 1,
			controls: 1,
			loop: 1
		};

		var eStr = "";

		function setProperty(node, key, value) {
			var directProp = directProperties[key];
			var noValue = (!value && value !== 0);
			if (directProp && !noValue) {
				node[directProp] = (noValue ? eStr : eStr + value);
			} else if (booleanProperties[key]) {
				// set the attribute if true or do not add it at all
				if (value) {
					node.setAttribute(key, key);
				}
			} else if (noValue) {
				node.removeAttribute(key);
			} else {
				node.setAttribute(key, eStr + value);
			}
		}

		var pop = "pop";
		function appendChildren(node, children) {
			if (!_.isArray(children)) {
				children = [children];
			}
			_.each(children, function(child) {
				appendChild(node, child);
			});
		}

		if (root.document) {
			var d = document.createElement("div");
		}
		function appendChild(node, child) {
			if (child || child === 0) {
				if (child && child.pop) {
					appendChildren(node, child);
				} else {
					if (!(child && child.nodeType === 1)) {
						// handle other node types here
						// this causes lots of garbage collections
						d.innerHTML = child; // this causes lots of parse html events
						_.each(d.childNodes, function(val) {
							node.appendChild(val);
						});
					} else {
						node.appendChild(child);
					}
				}
			}
		}


		var splitter = /(#|\.)/;
		function create(selector, props, children) {

			// this function is currently ugly and repeats code from elsewhere but
			// it is also the fastest I have been able to achieve by 30-100%
			if (!selector) {
				throw new Error("selector required");
			}

			var outProps,
				parts, name, len, node, i, j, l,
				tag, id, className;

			// support (selector, children) signature'
			// support (tag, children) signature
			if (props && (props.charAt || props.pop)) {
				children = props;
				props = {};
			}

			// parse the selector and merge props
			parts = selector.split(splitter);
			tag = parts[0];
			len = parts.length;

			if (len > 2) {

				outProps = props || {};
				for (i=1, j=2, l=len; j<l; i+=2, j+=2) {
					name = parts[j];
					if (parts[i] === '#') {
						id = name;
					} else {
						className = className ? (className + " " + name) : name;
					}
				}

				if (id || className) {
					// properties from selector override or append to those in props
					if (id) 		{outProps.id = id;}
					if (className) 	{outProps.className = (props && props.className) ? (className + " " + props.className) : className;} // append multiple classes
					props = outProps;
				}
			}

			id = className = null;

			tag = tag || "div";

			// create the node
			node = _.doc.createElement(tag);
			if (!useDocument) {
				props && node.set(props);
				children && node.append(children);

			} else {
				if (props) {
					props.id && setProperty(node, "id", props.id);
					props.className && setProperty(node, "class", props.className);
					_.each(props, function(val, key) {
						setProperty(node, key, val);
					});
				}
				children && appendChildren(node, children);
			}
			return node;
		}

		return create;
	}());



	/* _.dom
		dom instructions
		array == generic container for dom instructions
		object == attributes
		string == dom selector or innerHTML

		dom instruction patterns:

		[selector (String)]
		selectors begin with an html tag name optionally followed by #someId and zero or more .someClass
		a selector can be followed by any instruction another selector, an object, an array, innerHTML string

		[selector (String), innerHTML (String)]
		any string that does not look like a selector is treated as innerHTML,
		if your strings will look like a selector you can add non selector characters like so...
		invalid as innerHTML: "strong", "menu", "footer"
		valid as innerHTML: "<span>strong</span>", "menu "
		innerHTML can only be followed by a selector string

		[selector (String), children (Array)]
		an array can only be followed by a selector string

		[selector (String), attributes (Object)]
		attributes eg. {title: "my title", value: 2}
		an object can be followed by an array or a string (selector or innerHTML)

		[selector (String), attributes (Object), children (Array)]

		eg.

		var dom = [
			"div", {className: "todo " + data.done ? "done" : ""},[
				"div.display", [
				"input.check", {type: "checkbox", checked: data.done},
				"label.todo-content", data.content,
				"span.todo-destroy"
			],
			"div.edit", [
				"input.todo-input", {type: "text", value: data.content}
			],
			"ul", _.map(data.items, _.value)
		];
	 */

	_.dom = (function() {
		function dom(domInstructions, preProcessedSelector) {

			if (!domInstructions || !domInstructions.pop) {
				domInstructions = _.slice(arguments);
				preProcessedSelector = null;
			}

			var returnNodes = [],
				tag, attributes, childNodes,
				selector, arg, type,
				id, className, step = 1, prevStep, thisStep,
				precedingDoubleCommaDivider,
				i, len = domInstructions.length;

			for (i=0; i<len; i++) {
				arg = domInstructions[i];

				prevStep = thisStep;
				thisStep = step + "-" + _.typeof(arg);

				switch(thisStep) {

					// new sibling node via selector or new sibling text -------------------------------------------
					case "1-number":
						arg += ""; // convert to string and fall through to next block
					case "1-string":
						if (!precedingDoubleCommaDivider) {
							selector = preProcessedSelector || _.doc.isSelector(arg);
							if (selector) {
								tag = selector.tag;
								id = selector.id;
								className = selector.className;
								selector = preProcessedSelector = null;
								attributes = {};
								id && (attributes.id = id);
								className && (attributes.className = className);

								// create node with attributes now if final iteration
								if (i === len-1) {
									returnNodes.push(_.el(tag, attributes));
								}

								// we may have properties or children to add so move to step 2 for next arg
								step = 2;

							} else {
								// add a sibling text node
								returnNodes.push(arg);
								// stay on step 1 for next arg
							}

						} else {
							// add a sibling text node that is escaped
							returnNodes.push(_.escape(arg));
							precedingDoubleCommaDivider = false;
							// stay on step 1 for next arg
						}
						break;

					case "1-element":
						returnNodes.push(arg);
						// stay on step one for next arg
						break;

					// new sibling node/s via partial --------------------------------------------------------------
					case "1-function":
						// todo use object expansion here to allow more return types
						returnNodes = returnNodes.concat(_.dom(arg()));
						// stay on step one for next arg
						break;

					// array unwrapping kinda like macro expansion  -----------------------------------------------------------------------
					case "1-array":
						//replace array with its contents and re-run the step
						len += arg.length-1;
						domInstructions.splice.apply(domInstructions, [i, 1].concat(arg));
//						console.log("expand array", domInstructions);
						i--;
						// stay on step one for next arg
						break;

					// add/merge attributes ------------------------------------------------------------------------
					case "2-object":
						// grab the first value out of the object to test if it is not actually children
						var _val;
						_.each(arg, function(val) {
							_val = val;
							return "break";
						});

						// oop! looks like we actually want to treat the object as children here
						if (_val && (_val.pop || _.doc.isSelector(_val))) {
//							console.log("object as children", domInstructions);
							// final possible step so start back on 1 for next arg
							// this is where we do recursion, see also 2-array
							childNodes = _.dom(_.values(arg));
							// and push the result back into the final output
							returnNodes.push(_.el(tag, attributes, childNodes));
							step = 1;
							break;
						}

						_.each(arg, function(val, key) {
							attributes[key] = val;
						});

						id && (attributes.id = id);
						if (className) {
							attributes.className = arg.className ? (className + " " + arg.className) : className;  // remember we appended a space in _.doc.isSelector
						}
						// create node with attributes now if final iteration
						if (i === len-1) {
							returnNodes.push(_.el(tag, attributes));
						}

						id = className = null;

						// we may have a children to add so move to step 3 for next arg
						step = 3;
						break;

					// next sibling node via selector or child string ------------------------------------------------------------------
					case "2-number":
					case "3-number":
						arg += ""; // convert to string and fall through to next block
					case "2-string":
					case "3-string":
						if (!precedingDoubleCommaDivider) {
							selector = preProcessedSelector || _.doc.isSelector(arg);

							// starting a new object
							if (selector || selfClosing[tag]) {
								// finish the previous object
								returnNodes.push(_.el(tag, attributes));

								// about to start over on step 1 lets save some work,
								// no need to parse the selector string again
								preProcessedSelector = selector;
								i--; // iterate over this arg again

								// child text
							} else {
								//create node with child text
								returnNodes.push(_.el(tag, attributes, arg));
							}

						} else {
							//create node with child text that is escaped
							returnNodes.push(_.el(tag, attributes, _.escape(arg)));
							precedingDoubleCommaDivider = false;
						}


						// both cases are final possible step so start back on 1 for next arg
						step = 1;
						break;

					case "3-element":
						//create node with child text
						returnNodes.push(_.el(tag, attributes, arg));
						step = 1;
						break;

					// recursive child array -----------------------------------------------------------------------
					case "2-array":
					case "3-array":
						if (selfClosing[tag]) {
							throw new Error("Can not add children to " + tag);
						}
						// this is where we do our recursion, see also 2-object
						childNodes = _.dom(arg);
						// and push the result back into the final output
						returnNodes.push(_.el(tag, attributes, childNodes));
						// final possible step so start back on 1 for next arg
						step = 1;
						break;

					case "2-function":
					case "3-function":
						// no children so done, functions in second and third position are treated as siblings
						// to produce children functions can be wrapped in an array
						returnNodes.push(_.el(tag, attributes));
						returnNodes = returnNodes.concat(_.dom(arg()));
						// final possible step so start back on 1 for next arg
						step = 1;
						break;

					case "2-undefined":
					case "3-undefined":
						precedingDoubleCommaDivider = true;
						// this is in service of supporting double comma separators to denote the following section as inner text
						break;

					default:
						var errMsg = "_.dom: No such step + type combination: " + thisStep + " - previous was " + prevStep + ", " + arg;
						console.log(errMsg, arg, returnNodes);
						throw new TypeError(errMsg);
				}

			}

			childNodes = attributes = null;

			// we do this down here bc for function types we do a concat which overwrites returnNodes
			returnNodes.toString = function() {
				return this.join('');
			};
			return returnNodes;
		};

		return dom;

	}());

//
//	$("body").html(_.dom([
//		"table", [
//			"thead", [
//				"tr", [
//					"th", "url",
//					"th", "created",
//					"th", "subreddit"
//				]
//			],
//			"tbody", _.map(comments, function(c) { return [
//				"tr", [
//					"td",, commentToStoryUrl(c),
//					"td",, new Date(c.created.epoch * 1000).toString(),
//					"td",, c.subreddit
//				]
//			];})
//		]
//	]));


	// partials
	var parts = {};

	/*
	 * @param name String,
	 * @param arg Function or object
	 * @description this function serves as a constructor, getter, setter and collection interface to partials
	 * there are multiple signatures and a plural alias that makes more sense depending on what you want to do
	 * $part("name", function(data){...}) returns the provided function, saves the function under the given name so that it can be used via the following signatures
	 * $parts() returns and object that contains all the partials by name
	 * $parts("myPartial") returns a partial function(data) which if called returns a minidom
	 * $parts("myPartial", dataObject)
	 */
	_.part = function(name, partial) {
		if (!_.isString(name)) {
			throw new TypeError("Expected string for name but saw " + _.typeof(name));
		}

		if (!_.isFunction(partial)) {
			throw new TypeError("Expected function for partial but saw " + _.typeof(name));
		}

		// set new or update existing partial
		return parts[name] = partial;
	};


	_.parts = function(name, defaults) {
		if (!arguments.length) {
			return parts;
		}

		var fn = parts[name];

		if (fn) {
			return function(data) {
				return fn(data || defaults);
			};
		} else {
			throw new Error("No such partial '"+name);
		}
	};

	_.parts.drop = function(name) {
		parts[name] = null;
	};

	_.parts.dropAll = function(name) {
		parts = {};
	};



	// script tag helper
	var jsre = /^http|^\/|^\.|\.js$/i;
	_.js = function(script) {
		var val, attrs = {type: "text/javascript"};

		if (_.isFunction(script)) {
			var scriptStr = script.toString();
			scriptStr = scriptStr.substring(scriptStr.indexOf("{") + 1, scriptStr.lastIndexOf("}"));
			val = _.el("script", attrs, scriptStr);
		} else if (_.isString(script)) {
			if (script.match(jsre)) {
				attrs.src = script;
				val = _.el("script", attrs);
			} else {
				val = _.el("script", attrs, script);
			}
		} else if (_.isPlainObject(script)) {
			val = _.el("script", _.combine(attrs, script));
		}

		return val;
	}

	if ("module" in root) {
		module.exports = {
			dom: _.dom,
			part: _.part,
			parts: _.parts,
			typeof: _.typeof,
			slice: _.slice,
			splice: _.splice,
			splice: _.splice,
			combine: _.combine,
			new: _.new,
			node: _.node,
			doc: _.doc,
			el: _.el,
			_: _
		}
	}

}());