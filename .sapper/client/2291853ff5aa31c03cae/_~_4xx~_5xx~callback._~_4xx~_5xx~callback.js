(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["_~_4xx~_5xx~callback"],{

/***/ "./node_modules/svelte-dev-helper/index.js":
/*!*************************************************!*\
  !*** ./node_modules/svelte-dev-helper/index.js ***!
  \*************************************************/
/*! exports provided: Registry, configure, getConfig, createProxy */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _lib_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib/proxy */ "./node_modules/svelte-dev-helper/lib/proxy.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Registry", function() { return _lib_proxy__WEBPACK_IMPORTED_MODULE_0__["Registry"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "configure", function() { return _lib_proxy__WEBPACK_IMPORTED_MODULE_0__["configure"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "getConfig", function() { return _lib_proxy__WEBPACK_IMPORTED_MODULE_0__["getConfig"]; });

/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "createProxy", function() { return _lib_proxy__WEBPACK_IMPORTED_MODULE_0__["createProxy"]; });



/***/ }),

/***/ "./node_modules/svelte-dev-helper/lib/proxy.js":
/*!*****************************************************!*\
  !*** ./node_modules/svelte-dev-helper/lib/proxy.js ***!
  \*****************************************************/
/*! exports provided: Registry, configure, getConfig, createProxy */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "configure", function() { return configure; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getConfig", function() { return getConfig; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createProxy", function() { return createProxy; });
/* harmony import */ var _registry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./registry */ "./node_modules/svelte-dev-helper/lib/registry.js");
/* harmony reexport (safe) */ __webpack_require__.d(__webpack_exports__, "Registry", function() { return _registry__WEBPACK_IMPORTED_MODULE_0__["default"]; });



let proxyOptions = {
  noPreserveState: false
};

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function getDebugName(id) {
  const posixID = id.replace(/[/\\]/g, '/');
  const name = posixID.split('/').pop().split('.').shift();
  return `<${capitalize(name)}>`;
}

function groupStart(msg) {
  console.group && console.group(msg);
}

function groupEnd() {
  console.groupEnd && console.groupEnd();
}




function configure(_options) {
  proxyOptions = Object.assign(proxyOptions, _options);
}

function getConfig() {
  return proxyOptions;
}

/*
creates a proxy object that
decorates the original component with trackers
and ensures resolution to the
latest version of the component
*/
function createProxy(id) {
  const handledMethods = '_mount,_unmount,destroy'.split(',');
  const forwardedMethods = 'get,fire,observe,on,set,teardown,_recompute,_set'.split(',');
  class proxyComponent {

    constructor(options) {
      this.id = id;
      this.__mountpoint = null;
      this.__anchor = null;
      this.__insertionPoint = null;
      this.__mounted = false;

      this._register(options);

      this._debugName = this.proxyTarget._debugName || getDebugName(this.id);

      // ---- forwarded methods ----
      const self = this;
      forwardedMethods.forEach(function(method) {
        self[method] = function() {
          return self.proxyTarget[method].apply(self.proxyTarget, arguments);
        };
      });
      // ---- END forwarded methods ----
    }

    // ---- augmented methods ----

    _mount(target, anchor, insertionPoint) {

      this.__mountpoint = target;
      this.__anchor = anchor;

      if (insertionPoint) {
        this.__insertionPoint = insertionPoint;
      } else {
        // eslint-disable-next-line no-undef
        this.__insertionPoint = document.createComment(this._debugName);
        target.insertBefore(this.__insertionPoint, anchor);
      }

      this.__insertionPoint.__component__ = this;

      anchor = this.__insertionPoint.nextSibling;

      if (target.nodeName == '#document-fragment' && insertionPoint) {
        //handles #4 by forcing a target
        //if original target was a document fragment
        target = this.__insertionPoint.parentNode;
      }

      this.__mounted = true;

      return this.proxyTarget._mount(target, anchor);
    }

    destroy(detach, keepInsertionPoint) {

      _registry__WEBPACK_IMPORTED_MODULE_0__["default"].deRegisterInstance(this);

      if (!keepInsertionPoint && this.__insertionPoint) {
        //deref for GC before removal of node
        this.__insertionPoint.__component__ = null;
        const ip = this.__insertionPoint;
        ip && ip.parentNode && ip.parentNode.removeChild(ip);
      }
      return this.proxyTarget.destroy(detach);
    }

    _unmount() {
      this.__mounted = false;
      return this.proxyTarget._unmount.apply(this.proxyTarget, arguments);
    }

    // ---- END augmented methods ----


    // ---- extra methods ----

    _register(options) {

      const record = _registry__WEBPACK_IMPORTED_MODULE_0__["default"].get(this.id);

      try {

        //resolve to latest version of component
        this.proxyTarget = new record.component(options);

      } catch (e) {

        const rb = record.rollback;

        if (!rb) {
          console.error(e);
          console.warn('Full reload required. Please fix component errors and reload the whole page');
          return;
        }

        groupStart(this._debugName + ' Errors');

        console.warn(e);
        console.warn(this._debugName + ' could not be hot-loaded because it has an error');

        //resolve to previous working version of component
        this.proxyTarget = new rb(options);
        console.info('%c' + this._debugName + ' rolled back to previous working version', 'color:green');

        //set latest version as the rolled-back version
        record.component = rb;

        groupEnd();

      }

      _registry__WEBPACK_IMPORTED_MODULE_0__["default"].set(this.id, record);

      //register current instance, so that
      //we can re-render it when required
      _registry__WEBPACK_IMPORTED_MODULE_0__["default"].registerInstance(this);

      //proxy custom methods
      const self = this;
      let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(self.proxyTarget));
      methods.forEach(function(method) {
        if (!handledMethods.includes(method) && !forwardedMethods.includes(method)) {
          self[method] = function() {
            return self.proxyTarget[method].apply(self.proxyTarget, arguments);
          };
        }
      });

      //(re)expose properties that might be used from outside
      this.refs = this.proxyTarget.refs || {};
      this._fragment = this.proxyTarget._fragment;
      this._slotted = this.proxyTarget._slotted;
      this.root = this.proxyTarget.root;
      this.store = this.proxyTarget.store || null;
    }

    _rerender() {
      const mountpoint = this.__mountpoint || null,
        anchor = this.__anchor || null,
        options = this.proxyTarget.options,
        oldstate = this.get(),
        isMounted = this.__mounted,
        insertionPoint = this.__insertionPoint;

      this.destroy(true, true);

      this._register(options);

      if (mountpoint && isMounted) {
        this.proxyTarget._fragment.c();
        this._mount(mountpoint, anchor, insertionPoint);

        //preserve local state (unless noPreserveState is true)
        if (
          !this.proxyTarget.constructor.noPreserveState
          && !proxyOptions.noPreserveState) {
          this.set(oldstate);
        } else {

          //we have to call .set() here
          //otherwise oncreate is not fired
          this.set(this.get());

        }
      }
    }

    // ---- END extra methods ----
  }

  //forward static properties and methods
  const originalComponent = _registry__WEBPACK_IMPORTED_MODULE_0__["default"].get(id).component;
  for (let key in originalComponent) {
    proxyComponent[key] = originalComponent[key];
  }

  return proxyComponent;
}


/***/ }),

/***/ "./node_modules/svelte-dev-helper/lib/registry.js":
/*!********************************************************!*\
  !*** ./node_modules/svelte-dev-helper/lib/registry.js ***!
  \********************************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);

class registry {
  constructor() {
    this._items = {};
  }

  set(k, v) {
    this._items[k] = Object.assign({
      rollback: null,
      component: null,
      instances: []
    }, v);
  }

  get(k) {
    return k ? this._items[k] || undefined : this._items;
  }

  registerInstance(instance) {
    const id = instance.id;
    this._items[id] && this._items[id].instances.push(instance);
  }

  deRegisterInstance(instance) {
    const id = instance.id;
    this._items[id] && this._items[id].instances.forEach(function(comp, idx, instances) {
      if (comp == instance) {
        instances.splice(idx, 1);
      }
    });
  }

}


// eslint-disable-next-line no-undef
const componentRegistry = (window.__SVELTE_REGISTRY__ = new registry);

/* harmony default export */ __webpack_exports__["default"] = (componentRegistry);

/***/ }),

/***/ "./node_modules/svelte-loader/lib/hot-api.js":
/*!***************************************************!*\
  !*** ./node_modules/svelte-loader/lib/hot-api.js ***!
  \***************************************************/
/*! exports provided: configure, register, reload */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "configure", function() { return configure; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "register", function() { return register; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reload", function() { return reload; });
/* harmony import */ var svelte_dev_helper__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte-dev-helper */ "./node_modules/svelte-dev-helper/index.js");


let hotOptions = {
	noPreserveState: false
};

function configure(options) {
	hotOptions = Object.assign(hotOptions, options);
	Object(svelte_dev_helper__WEBPACK_IMPORTED_MODULE_0__["configure"])(hotOptions);
}

function register(id, component) {

	//store original component in registry
	svelte_dev_helper__WEBPACK_IMPORTED_MODULE_0__["Registry"].set(id, {
		rollback: null,
		component,
		instances: []
	});

	return Object(svelte_dev_helper__WEBPACK_IMPORTED_MODULE_0__["createProxy"])(id);
}

function reload(id, component) {

	const record = svelte_dev_helper__WEBPACK_IMPORTED_MODULE_0__["Registry"].get(id);

	//keep reference to previous version to enable rollback
	record.rollback = record.component;

	//replace component in registry with newly loaded component
	record.component = component;

	svelte_dev_helper__WEBPACK_IMPORTED_MODULE_0__["Registry"].set(id, record);

	//re-render the proxies
	record.instances.slice().forEach(function(instance) {
		instance && instance._rerender();
	});
}

/***/ }),

/***/ "./node_modules/svelte/shared.js":
/*!***************************************!*\
  !*** ./node_modules/svelte/shared.js ***!
  \***************************************/
/*! exports provided: blankObject, destroy, destroyDev, _differs, _differsImmutable, dispatchObservers, fire, get, init, observe, observeDev, on, onDev, set, _set, setDev, callAll, _mount, _unmount, isPromise, PENDING, SUCCESS, FAILURE, removeFromStore, proto, protoDev, appendNode, insertNode, detachNode, detachBetween, detachBefore, detachAfter, reinsertBetween, reinsertChildren, reinsertAfter, reinsertBefore, destroyEach, createFragment, createElement, createSvgElement, createText, createComment, addListener, removeListener, setAttribute, setXlinkAttribute, getBindingGroupValue, toNumber, timeRangesToArray, children, claimElement, claimText, setInputType, setStyle, selectOption, selectOptions, selectValue, selectMultipleValue, linear, generateRule, hash, wrapTransition, transitionManager, noop, assign */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "blankObject", function() { return blankObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "destroy", function() { return destroy; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "destroyDev", function() { return destroyDev; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_differs", function() { return _differs; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_differsImmutable", function() { return _differsImmutable; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "dispatchObservers", function() { return dispatchObservers; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "fire", function() { return fire; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "get", function() { return get; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "init", function() { return init; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "observe", function() { return observe; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "observeDev", function() { return observeDev; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "on", function() { return on; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "onDev", function() { return onDev; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "set", function() { return set; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_set", function() { return _set; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setDev", function() { return setDev; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "callAll", function() { return callAll; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_mount", function() { return _mount; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "_unmount", function() { return _unmount; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "isPromise", function() { return isPromise; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "PENDING", function() { return PENDING; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "SUCCESS", function() { return SUCCESS; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "FAILURE", function() { return FAILURE; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeFromStore", function() { return removeFromStore; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "proto", function() { return proto; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "protoDev", function() { return protoDev; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "appendNode", function() { return appendNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "insertNode", function() { return insertNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detachNode", function() { return detachNode; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detachBetween", function() { return detachBetween; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detachBefore", function() { return detachBefore; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "detachAfter", function() { return detachAfter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reinsertBetween", function() { return reinsertBetween; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reinsertChildren", function() { return reinsertChildren; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reinsertAfter", function() { return reinsertAfter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "reinsertBefore", function() { return reinsertBefore; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "destroyEach", function() { return destroyEach; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createFragment", function() { return createFragment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createElement", function() { return createElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createSvgElement", function() { return createSvgElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createText", function() { return createText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "createComment", function() { return createComment; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "addListener", function() { return addListener; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "removeListener", function() { return removeListener; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setAttribute", function() { return setAttribute; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setXlinkAttribute", function() { return setXlinkAttribute; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "getBindingGroupValue", function() { return getBindingGroupValue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "toNumber", function() { return toNumber; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "timeRangesToArray", function() { return timeRangesToArray; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "children", function() { return children; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "claimElement", function() { return claimElement; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "claimText", function() { return claimText; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setInputType", function() { return setInputType; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "setStyle", function() { return setStyle; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "selectOption", function() { return selectOption; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "selectOptions", function() { return selectOptions; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "selectValue", function() { return selectValue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "selectMultipleValue", function() { return selectMultipleValue; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "linear", function() { return linear; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "generateRule", function() { return generateRule; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "hash", function() { return hash; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "wrapTransition", function() { return wrapTransition; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "transitionManager", function() { return transitionManager; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "noop", function() { return noop; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "assign", function() { return assign; });
function noop() {}

function assign(target) {
	var k,
		source,
		i = 1,
		len = arguments.length;
	for (; i < len; i++) {
		source = arguments[i];
		for (k in source) target[k] = source[k];
	}

	return target;
}

function appendNode(node, target) {
	target.appendChild(node);
}

function insertNode(node, target, anchor) {
	target.insertBefore(node, anchor);
}

function detachNode(node) {
	node.parentNode.removeChild(node);
}

function detachBetween(before, after) {
	while (before.nextSibling && before.nextSibling !== after) {
		before.parentNode.removeChild(before.nextSibling);
	}
}

function detachBefore(after) {
	while (after.previousSibling) {
		after.parentNode.removeChild(after.previousSibling);
	}
}

function detachAfter(before) {
	while (before.nextSibling) {
		before.parentNode.removeChild(before.nextSibling);
	}
}

function reinsertBetween(before, after, target) {
	while (before.nextSibling && before.nextSibling !== after) {
		target.appendChild(before.parentNode.removeChild(before.nextSibling));
	}
}

function reinsertChildren(parent, target) {
	while (parent.firstChild) target.appendChild(parent.firstChild);
}

function reinsertAfter(before, target) {
	while (before.nextSibling) target.appendChild(before.nextSibling);
}

function reinsertBefore(after, target) {
	var parent = after.parentNode;
	while (parent.firstChild !== after) target.appendChild(parent.firstChild);
}

function destroyEach(iterations) {
	for (var i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d();
	}
}

function createFragment() {
	return document.createDocumentFragment();
}

function createElement(name) {
	return document.createElement(name);
}

function createSvgElement(name) {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
}

function createText(data) {
	return document.createTextNode(data);
}

function createComment() {
	return document.createComment('');
}

function addListener(node, event, handler) {
	node.addEventListener(event, handler, false);
}

function removeListener(node, event, handler) {
	node.removeEventListener(event, handler, false);
}

function setAttribute(node, attribute, value) {
	node.setAttribute(attribute, value);
}

function setXlinkAttribute(node, attribute, value) {
	node.setAttributeNS('http://www.w3.org/1999/xlink', attribute, value);
}

function getBindingGroupValue(group) {
	var value = [];
	for (var i = 0; i < group.length; i += 1) {
		if (group[i].checked) value.push(group[i].__value);
	}
	return value;
}

function toNumber(value) {
	return value === '' ? undefined : +value;
}

function timeRangesToArray(ranges) {
	var array = [];
	for (var i = 0; i < ranges.length; i += 1) {
		array.push({ start: ranges.start(i), end: ranges.end(i) });
	}
	return array;
}

function children (element) {
	return Array.from(element.childNodes);
}

function claimElement (nodes, name, attributes, svg) {
	for (var i = 0; i < nodes.length; i += 1) {
		var node = nodes[i];
		if (node.nodeName === name) {
			for (var j = 0; j < node.attributes.length; j += 1) {
				var attribute = node.attributes[j];
				if (!attributes[attribute.name]) node.removeAttribute(attribute.name);
			}
			return nodes.splice(i, 1)[0]; // TODO strip unwanted attributes
		}
	}

	return svg ? createSvgElement(name) : createElement(name);
}

function claimText (nodes, data) {
	for (var i = 0; i < nodes.length; i += 1) {
		var node = nodes[i];
		if (node.nodeType === 3) {
			node.data = data;
			return nodes.splice(i, 1)[0];
		}
	}

	return createText(data);
}

function setInputType(input, type) {
	try {
		input.type = type;
	} catch (e) {}
}

function setStyle(node, key, value) {
	node.style.setProperty(key, value);
}

function selectOption(select, value) {
	for (var i = 0; i < select.options.length; i += 1) {
		var option = select.options[i];

		if (option.__value === value) {
			option.selected = true;
			return;
		}
	}
}

function selectOptions(select, value) {
	for (var i = 0; i < select.options.length; i += 1) {
		var option = select.options[i];
		option.selected = ~value.indexOf(option.__value);
	}
}

function selectValue(select) {
	var selectedOption = select.querySelector(':checked') || select.options[0];
	return selectedOption && selectedOption.__value;
}

function selectMultipleValue(select) {
	return [].map.call(select.querySelectorAll(':checked'), function(option) {
		return option.__value;
	});
}

function linear(t) {
	return t;
}

function generateRule(
	a,
	b,
	delta,
	duration,
	ease,
	fn
) {
	var keyframes = '{\n';

	for (var p = 0; p <= 1; p += 16.666 / duration) {
		var t = a + delta * ease(p);
		keyframes += p * 100 + '%{' + fn(t) + '}\n';
	}

	return keyframes + '100% {' + fn(b) + '}\n}';
}

// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
	var hash = 5381;
	var i = str.length;

	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
	return hash >>> 0;
}

function wrapTransition(component, node, fn, params, intro, outgroup) {
	var obj = fn(node, params);
	var duration = obj.duration || 300;
	var ease = obj.easing || linear;
	var cssText;

	// TODO share <style> tag between all transitions?
	if (obj.css && !transitionManager.stylesheet) {
		var style = createElement('style');
		document.head.appendChild(style);
		transitionManager.stylesheet = style.sheet;
	}

	if (intro) {
		if (obj.css && obj.delay) {
			cssText = node.style.cssText;
			node.style.cssText += obj.css(0);
		}

		if (obj.tick) obj.tick(0);
	}

	return {
		t: intro ? 0 : 1,
		running: false,
		program: null,
		pending: null,
		run: function(intro, callback) {
			var program = {
				start: window.performance.now() + (obj.delay || 0),
				intro: intro,
				callback: callback
			};

			if (obj.delay) {
				this.pending = program;
			} else {
				this.start(program);
			}

			if (!this.running) {
				this.running = true;
				transitionManager.add(this);
			}
		},
		start: function(program) {
			component.fire(program.intro ? 'intro.start' : 'outro.start', { node: node });

			program.a = this.t;
			program.b = program.intro ? 1 : 0;
			program.delta = program.b - program.a;
			program.duration = duration * Math.abs(program.b - program.a);
			program.end = program.start + program.duration;

			if (obj.css) {
				if (obj.delay) node.style.cssText = cssText;

				program.rule = generateRule(
					program.a,
					program.b,
					program.delta,
					program.duration,
					ease,
					obj.css
				);

				transitionManager.addRule(program.rule, program.name = '__svelte_' + hash(program.rule));

				node.style.animation = (node.style.animation || '')
					.split(', ')
					.filter(function(anim) {
						// when introing, discard old animations if there are any
						return anim && (program.delta < 0 || !/__svelte/.test(anim));
					})
					.concat(program.name + ' ' + duration + 'ms linear 1 forwards')
					.join(', ');
			}

			this.program = program;
			this.pending = null;
		},
		update: function(now) {
			var program = this.program;
			if (!program) return;

			var p = now - program.start;
			this.t = program.a + program.delta * ease(p / program.duration);
			if (obj.tick) obj.tick(this.t);
		},
		done: function() {
			var program = this.program;
			this.t = program.b;
			if (obj.tick) obj.tick(this.t);
			if (obj.css) transitionManager.deleteRule(node, program.name);
			program.callback();
			program = null;
			this.running = !!this.pending;
		},
		abort: function() {
			if (obj.tick) obj.tick(1);
			if (obj.css) transitionManager.deleteRule(node, this.program.name);
			this.program = this.pending = null;
			this.running = false;
		}
	};
}

var transitionManager = {
	running: false,
	transitions: [],
	bound: null,
	stylesheet: null,
	activeRules: {},

	add: function(transition) {
		this.transitions.push(transition);

		if (!this.running) {
			this.running = true;
			requestAnimationFrame(this.bound || (this.bound = this.next.bind(this)));
		}
	},

	addRule: function(rule, name) {
		if (!this.activeRules[name]) {
			this.activeRules[name] = true;
			this.stylesheet.insertRule('@keyframes ' + name + ' ' + rule, this.stylesheet.cssRules.length);
		}
	},

	next: function() {
		this.running = false;

		var now = window.performance.now();
		var i = this.transitions.length;

		while (i--) {
			var transition = this.transitions[i];

			if (transition.program && now >= transition.program.end) {
				transition.done();
			}

			if (transition.pending && now >= transition.pending.start) {
				transition.start(transition.pending);
			}

			if (transition.running) {
				transition.update(now);
				this.running = true;
			} else if (!transition.pending) {
				this.transitions.splice(i, 1);
			}
		}

		if (this.running) {
			requestAnimationFrame(this.bound);
		} else if (this.stylesheet) {
			var i = this.stylesheet.cssRules.length;
			while (i--) this.stylesheet.deleteRule(i);
			this.activeRules = {};
		}
	},

	deleteRule: function(node, name) {
		node.style.animation = node.style.animation
			.split(', ')
			.filter(function(anim) {
				return anim.slice(0, name.length) !== name;
			})
			.join(', ');
	}
};

function blankObject() {
	return Object.create(null);
}

function destroy(detach) {
	this.destroy = noop;
	this.fire('destroy');
	this.set = this.get = noop;

	if (detach !== false) this._fragment.u();
	this._fragment.d();
	this._fragment = this._state = null;
}

function destroyDev(detach) {
	destroy.call(this, detach);
	this.destroy = function() {
		console.warn('Component was already destroyed');
	};
}

function _differs(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

function _differsImmutable(a, b) {
	return a != a ? b == b : a !== b;
}

function dispatchObservers(component, group, changed, newState, oldState) {
	for (var key in group) {
		if (!changed[key]) continue;

		var newValue = newState[key];
		var oldValue = oldState[key];

		var callbacks = group[key];
		if (!callbacks) continue;

		for (var i = 0; i < callbacks.length; i += 1) {
			var callback = callbacks[i];
			if (callback.__calling) continue;

			callback.__calling = true;
			callback.call(component, newValue, oldValue);
			callback.__calling = false;
		}
	}
}

function fire(eventName, data) {
	var handlers =
		eventName in this._handlers && this._handlers[eventName].slice();
	if (!handlers) return;

	for (var i = 0; i < handlers.length; i += 1) {
		handlers[i].call(this, data);
	}
}

function get(key) {
	return key ? this._state[key] : this._state;
}

function init(component, options) {
	component._observers = { pre: blankObject(), post: blankObject() };
	component._handlers = blankObject();
	component._bind = options._bind;

	component.options = options;
	component.root = options.root || component;
	component.store = component.root.store || options.store;
}

function observe(key, callback, options) {
	var group = options && options.defer
		? this._observers.post
		: this._observers.pre;

	(group[key] || (group[key] = [])).push(callback);

	if (!options || options.init !== false) {
		callback.__calling = true;
		callback.call(this, this._state[key]);
		callback.__calling = false;
	}

	return {
		cancel: function() {
			var index = group[key].indexOf(callback);
			if (~index) group[key].splice(index, 1);
		}
	};
}

function observeDev(key, callback, options) {
	var c = (key = '' + key).search(/[.[]/);
	if (c > -1) {
		var message =
			'The first argument to component.observe(...) must be the name of a top-level property';
		if (c > 0)
			message += ", i.e. '" + key.slice(0, c) + "' rather than '" + key + "'";

		throw new Error(message);
	}

	return observe.call(this, key, callback, options);
}

function on(eventName, handler) {
	if (eventName === 'teardown') return this.on('destroy', handler);

	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
	handlers.push(handler);

	return {
		cancel: function() {
			var index = handlers.indexOf(handler);
			if (~index) handlers.splice(index, 1);
		}
	};
}

function onDev(eventName, handler) {
	if (eventName === 'teardown') {
		console.warn(
			"Use component.on('destroy', ...) instead of component.on('teardown', ...) which has been deprecated and will be unsupported in Svelte 2"
		);
		return this.on('destroy', handler);
	}

	return on.call(this, eventName, handler);
}

function set(newState) {
	this._set(assign({}, newState));
	if (this.root._lock) return;
	this.root._lock = true;
	callAll(this.root._beforecreate);
	callAll(this.root._oncreate);
	callAll(this.root._aftercreate);
	this.root._lock = false;
}

function _set(newState) {
	var oldState = this._state,
		changed = {},
		dirty = false;

	for (var key in newState) {
		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
	}
	if (!dirty) return;

	this._state = assign({}, oldState, newState);
	this._recompute(changed, this._state);
	if (this._bind) this._bind(changed, this._state);

	if (this._fragment) {
		dispatchObservers(this, this._observers.pre, changed, this._state, oldState);
		this._fragment.p(changed, this._state);
		dispatchObservers(this, this._observers.post, changed, this._state, oldState);
	}
}

function setDev(newState) {
	if (typeof newState !== 'object') {
		throw new Error(
			this._debugName + '.set was called without an object of data key-values to update.'
		);
	}

	this._checkReadOnly(newState);
	set.call(this, newState);
}

function callAll(fns) {
	while (fns && fns.length) fns.shift()();
}

function _mount(target, anchor) {
	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
}

function _unmount() {
	if (this._fragment) this._fragment.u();
}

function isPromise(value) {
	return value && typeof value.then === 'function';
}

var PENDING = {};
var SUCCESS = {};
var FAILURE = {};

function removeFromStore() {
	this.store._remove(this);
}

var proto = {
	destroy: destroy,
	get: get,
	fire: fire,
	observe: observe,
	on: on,
	set: set,
	teardown: destroy,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount,
	_differs: _differs
};

var protoDev = {
	destroy: destroyDev,
	get: get,
	fire: fire,
	observe: observeDev,
	on: onDev,
	set: setDev,
	teardown: destroyDev,
	_recompute: noop,
	_set: _set,
	_mount: _mount,
	_unmount: _unmount,
	_differs: _differs
};




/***/ }),

/***/ "./routes/_components/Layout.html":
/*!****************************************!*\
  !*** ./routes/_components/Layout.html ***!
  \****************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/shared.js */ "./node_modules/svelte/shared.js");
/* harmony import */ var _Nav_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Nav.html */ "./routes/_components/Nav.html");
/* routes/_components/Layout.html generated by Svelte v1.56.3 */





function create_main_fragment(component, state) {
	var text, main, slot_content_default = component._slotted.default;

	var nav = new _Nav_html__WEBPACK_IMPORTED_MODULE_1__["default"]({
		root: component.root,
		data: { page: state.page }
	});

	return {
		c: function create() {
			nav._fragment.c();
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n\n");
			main = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("main");
		},

		l: function claim(nodes) {
			nav._fragment.l(nodes);
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nodes, "\n\n");

			main = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "MAIN", {}, false);
			var main_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(main);

			main_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
		},

		m: function mount(target, anchor) {
			nav._mount(target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(text, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(main, target, anchor);

			if (slot_content_default) {
				Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(slot_content_default, main);
			}
		},

		p: function update(changed, state) {
			var nav_changes = {};
			if (changed.page) nav_changes.page = state.page;
			nav._set(nav_changes);
		},

		u: function unmount() {
			nav._unmount();
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(text);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(main);

			if (slot_content_default) {
				Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["reinsertChildren"])(main, slot_content_default);
			}
		},

		d: function destroy() {
			nav.destroy(false);
		}
	};
}

function Layout(options) {
	Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options);
	this._state = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])({}, options.data);

	this._slotted = options.slots || {};

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this.slots = {};

	this._fragment = create_main_fragment(this, this._state);

	if (options.target) {
		var nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(options.target);
		options.hydrate ? this._fragment.l(nodes) : this._fragment.c();
		nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
		this._mount(options.target, options.anchor);

		this._lock = true;
		Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["callAll"])(this._beforecreate);
		Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["callAll"])(this._oncreate);
		Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["callAll"])(this._aftercreate);
		this._lock = false;
	}
}

Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])(Layout.prototype, svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["proto"]);


let proxyComponent = Layout;

if (true) {

	const { configure, register, reload } = __webpack_require__(/*! svelte-loader/lib/hot-api */ "./node_modules/svelte-loader/lib/hot-api.js");

	module.hot.accept();

	if (!module.hot.data) {
		// initial load
		configure({});
		proxyComponent = register("routes/_components/Layout.html", Layout);
	} else {
		// hot update
		reload("routes/_components/Layout.html", proxyComponent);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (proxyComponent);


/***/ }),

/***/ "./routes/_components/Login.html":
/*!***************************************!*\
  !*** ./routes/_components/Login.html ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/shared.js */ "./node_modules/svelte/shared.js");
/* routes/_components/Login.html generated by Svelte v1.56.3 */


function data() {
  return {
    state: 'hide'
  }
};

var methods = {
  login() {
    var webAuth = new auth0.WebAuth({
      clientID: 'aSX04KlTPtCsWcKIKSj-F7I8fXeXLGnM',
      domain: 'department.auth0.com',
      redirectUri: 'http://paperclub.local:8080',
      responseType: 'token',
      scope: 'openid profile'
    });

    var email = document.querySelector('.js-email').value
    webAuth.passwordlessStart({
      connection: 'email',
      send: 'link',
      email: email
    }, function(err,res) {
      if (err) {
        alert('error sending email: '+ err.description);
        return;
      }
      alert('Email sent!');
    });
  }
};

function oncreate() {
  let user = JSON.parse(localStorage.user)
  if (user) {
    this.set({user: user})
  }

  var webAuth = new auth0.WebAuth({
    clientID: 'aSX04KlTPtCsWcKIKSj-F7I8fXeXLGnM',
    domain: 'department.auth0.com',
    redirectUri: 'http://paperclub.local:8080',
    responseType: 'token',
    scope: 'openid profile'
  });

  if(window.location.hash){
    webAuth.parseHash(window.location.hash, function(err, authResult) {
      if (err) {
        return console.log(err);
      } else if (authResult){
        localStorage.setItem('accessToken', authResult.accessToken);
        console.log(authResult.accessToken)

        webAuth.client.userInfo(authResult.accessToken, function(err, user) {
          if (err){
            console.log('err',err);
            alert('There was an error retrieving your profile: ' + err.message);
          } else {
            console.log(user)
            localStorage.setItem('user', JSON.stringify(user));
          }
        });
      }
    });
  }
};

function create_main_fragment(component, state) {
	var text, div, p, text_1, text_2, input, text_3, button, text_4;

	function select_block_type(state) {
		if (state.user) return create_if_block;
		return create_if_block_1;
	}
	var current_block_type = select_block_type(state);
	var if_block = current_block_type(component, state);

	function click_handler(event) {
		component.login();
	}

	return {
		c: function create() {
			if_block.c();
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n\n");
			div = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("div");
			p = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("p");
			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("Magic Link Sign In:");
			text_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n  ");
			input = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("input");
			text_3 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n  ");
			button = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("button");
			text_4 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("Send Email");
			this.h();
		},

		l: function claim(nodes) {
			if_block.l(nodes);
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nodes, "\n\n");

			div = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "DIV", { class: true }, false);
			var div_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(div);

			p = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(div_nodes, "P", {}, false);
			var p_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(p);

			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(p_nodes, "Magic Link Sign In:");
			p_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			text_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(div_nodes, "\n  ");

			input = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(div_nodes, "INPUT", { class: true, type: true, placeholder: true }, false);
			var input_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(input);

			input_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			text_3 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(div_nodes, "\n  ");

			button = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(div_nodes, "BUTTON", {}, false);
			var button_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(button);

			text_4 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(button_nodes, "Send Email");
			button_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			div_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			this.h();
		},

		h: function hydrate() {
			input.className = "js-email";
			input.type = "email";
			input.placeholder = "email";
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["addListener"])(button, "click", click_handler);
			div.className = state.state;
		},

		m: function mount(target, anchor) {
			if_block.m(target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(text, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(div, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(p, div);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_1, p);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_2, div);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(input, div);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_3, div);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(button, div);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_4, button);
		},

		p: function update(changed, state) {
			if (current_block_type === (current_block_type = select_block_type(state)) && if_block) {
				if_block.p(changed, state);
			} else {
				if_block.u();
				if_block.d();
				if_block = current_block_type(component, state);
				if_block.c();
				if_block.m(text.parentNode, text);
			}

			if (changed.state) {
				div.className = state.state;
			}
		},

		u: function unmount() {
			if_block.u();
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(text);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(div);
		},

		d: function destroy() {
			if_block.d();
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["removeListener"])(button, "click", click_handler);
		}
	};
}

// (1:0) {{#if user}}
function create_if_block(component, state) {
	var p, text_value = state.user.nickname, text, text_1;

	return {
		c: function create() {
			p = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("p");
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])(text_value);
			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n  authResult.accessToken");
		},

		l: function claim(nodes) {
			p = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "P", {}, false);
			var p_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(p);

			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(p_nodes, text_value);
			p_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nodes, "\n  authResult.accessToken");
		},

		m: function mount(target, anchor) {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(p, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text, p);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(text_1, target, anchor);
		},

		p: function update(changed, state) {
			if ((changed.user) && text_value !== (text_value = state.user.nickname)) {
				text.data = text_value;
			}
		},

		u: function unmount() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(p);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(text_1);
		},

		d: svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["noop"]
	};
}

// (4:0) {{else}}
function create_if_block_1(component, state) {
	var button, text;

	function click_handler(event) {
		var state = component.get();
		component.set({ state: state.show});
	}

	return {
		c: function create() {
			button = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("button");
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("login");
			this.h();
		},

		l: function claim(nodes) {
			button = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "BUTTON", {}, false);
			var button_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(button);

			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(button_nodes, "login");
			button_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			this.h();
		},

		h: function hydrate() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["addListener"])(button, "click", click_handler);
		},

		m: function mount(target, anchor) {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(button, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text, button);
		},

		p: svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["noop"],

		u: function unmount() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(button);
		},

		d: function destroy() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["removeListener"])(button, "click", click_handler);
		}
	};
}

function Login(options) {
	Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options);
	this._state = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])(data(), options.data);

	var _oncreate = oncreate.bind(this);

	if (!options.root) {
		this._oncreate = [];
	}

	this._fragment = create_main_fragment(this, this._state);

	this.root._oncreate.push(_oncreate);

	if (options.target) {
		var nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(options.target);
		options.hydrate ? this._fragment.l(nodes) : this._fragment.c();
		nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
		this._mount(options.target, options.anchor);

		Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["callAll"])(this._oncreate);
	}
}

Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])(Login.prototype, methods, svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["proto"]);


let proxyComponent = Login;

if (true) {

	const { configure, register, reload } = __webpack_require__(/*! svelte-loader/lib/hot-api */ "./node_modules/svelte-loader/lib/hot-api.js");

	module.hot.accept();

	if (!module.hot.data) {
		// initial load
		configure({});
		proxyComponent = register("routes/_components/Login.html", Login);
	} else {
		// hot update
		reload("routes/_components/Login.html", proxyComponent);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (proxyComponent);


/***/ }),

/***/ "./routes/_components/Nav.html":
/*!*************************************!*\
  !*** ./routes/_components/Nav.html ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/shared.js */ "./node_modules/svelte/shared.js");
/* harmony import */ var _Login_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Login.html */ "./routes/_components/Login.html");
/* routes/_components/Nav.html generated by Svelte v1.56.3 */





function create_main_fragment(component, state) {
	var nav;

	var login = new _Login_html__WEBPACK_IMPORTED_MODULE_1__["default"]({
		root: component.root
	});

	return {
		c: function create() {
			nav = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("nav");
			login._fragment.c();
		},

		l: function claim(nodes) {
			nav = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "NAV", {}, false);
			var nav_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(nav);

			login._fragment.l(nav_nodes);
			nav_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
		},

		m: function mount(target, anchor) {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(nav, target, anchor);
			login._mount(nav, null);
		},

		p: svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["noop"],

		u: function unmount() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(nav);
		},

		d: function destroy() {
			login.destroy(false);
		}
	};
}

function Nav(options) {
	Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options);
	this._state = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])({}, options.data);

	if (!options.root) {
		this._oncreate = [];
		this._beforecreate = [];
		this._aftercreate = [];
	}

	this._fragment = create_main_fragment(this, this._state);

	if (options.target) {
		var nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(options.target);
		options.hydrate ? this._fragment.l(nodes) : this._fragment.c();
		nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
		this._mount(options.target, options.anchor);

		this._lock = true;
		Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["callAll"])(this._beforecreate);
		Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["callAll"])(this._oncreate);
		Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["callAll"])(this._aftercreate);
		this._lock = false;
	}
}

Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])(Nav.prototype, svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["proto"]);


let proxyComponent = Nav;

if (true) {

	const { configure, register, reload } = __webpack_require__(/*! svelte-loader/lib/hot-api */ "./node_modules/svelte-loader/lib/hot-api.js");

	module.hot.accept();

	if (!module.hot.data) {
		// initial load
		configure({});
		proxyComponent = register("routes/_components/Nav.html", Nav);
	} else {
		// hot update
		reload("routes/_components/Nav.html", proxyComponent);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (proxyComponent);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvc3ZlbHRlLWRldi1oZWxwZXIvbGliL3Byb3h5LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9zdmVsdGUtZGV2LWhlbHBlci9saWIvcmVnaXN0cnkuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS1sb2FkZXIvbGliL2hvdC1hcGkuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS9zaGFyZWQuanMiLCJ3ZWJwYWNrOi8vLy4vcm91dGVzL19jb21wb25lbnRzL0xheW91dC5odG1sIiwid2VicGFjazovLy8uL3JvdXRlcy9fY29tcG9uZW50cy9Mb2dpbi5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBYSxpQkFBaUI7QUFDOUI7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR1E7O0FBRVI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7QUFHQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBLE9BQU87O0FBRVA7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBOzs7QUFHQTtBQUNBOztBQUVBLGtGOzs7Ozs7Ozs7Ozs7Ozs7OztBQ3RDNkQ7O0FBRTdEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0YsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN2Q0E7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFD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OTE4NTNmZjVhYTMxYzAzY2FlL19+XzR4eH5fNXh4fmNhbGxiYWNrLl9+XzR4eH5fNXh4fmNhbGxiYWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlZ2lzdHJ5IGZyb20gJy4vcmVnaXN0cnknO1xuXG5sZXQgcHJveHlPcHRpb25zID0ge1xuICBub1ByZXNlcnZlU3RhdGU6IGZhbHNlXG59O1xuXG5mdW5jdGlvbiBjYXBpdGFsaXplKHN0cikge1xuICByZXR1cm4gc3RyWzBdLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG59XG5cbmZ1bmN0aW9uIGdldERlYnVnTmFtZShpZCkge1xuICBjb25zdCBwb3NpeElEID0gaWQucmVwbGFjZSgvWy9cXFxcXS9nLCAnLycpO1xuICBjb25zdCBuYW1lID0gcG9zaXhJRC5zcGxpdCgnLycpLnBvcCgpLnNwbGl0KCcuJykuc2hpZnQoKTtcbiAgcmV0dXJuIGA8JHtjYXBpdGFsaXplKG5hbWUpfT5gO1xufVxuXG5mdW5jdGlvbiBncm91cFN0YXJ0KG1zZykge1xuICBjb25zb2xlLmdyb3VwICYmIGNvbnNvbGUuZ3JvdXAobXNnKTtcbn1cblxuZnVuY3Rpb24gZ3JvdXBFbmQoKSB7XG4gIGNvbnNvbGUuZ3JvdXBFbmQgJiYgY29uc29sZS5ncm91cEVuZCgpO1xufVxuXG5cbmV4cG9ydCB7IFJlZ2lzdHJ5IH07XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmUoX29wdGlvbnMpIHtcbiAgcHJveHlPcHRpb25zID0gT2JqZWN0LmFzc2lnbihwcm94eU9wdGlvbnMsIF9vcHRpb25zKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENvbmZpZygpIHtcbiAgcmV0dXJuIHByb3h5T3B0aW9ucztcbn1cblxuLypcbmNyZWF0ZXMgYSBwcm94eSBvYmplY3QgdGhhdFxuZGVjb3JhdGVzIHRoZSBvcmlnaW5hbCBjb21wb25lbnQgd2l0aCB0cmFja2Vyc1xuYW5kIGVuc3VyZXMgcmVzb2x1dGlvbiB0byB0aGVcbmxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBjb21wb25lbnRcbiovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJveHkoaWQpIHtcbiAgY29uc3QgaGFuZGxlZE1ldGhvZHMgPSAnX21vdW50LF91bm1vdW50LGRlc3Ryb3knLnNwbGl0KCcsJyk7XG4gIGNvbnN0IGZvcndhcmRlZE1ldGhvZHMgPSAnZ2V0LGZpcmUsb2JzZXJ2ZSxvbixzZXQsdGVhcmRvd24sX3JlY29tcHV0ZSxfc2V0Jy5zcGxpdCgnLCcpO1xuICBjbGFzcyBwcm94eUNvbXBvbmVudCB7XG5cbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgICB0aGlzLmlkID0gaWQ7XG4gICAgICB0aGlzLl9fbW91bnRwb2ludCA9IG51bGw7XG4gICAgICB0aGlzLl9fYW5jaG9yID0gbnVsbDtcbiAgICAgIHRoaXMuX19pbnNlcnRpb25Qb2ludCA9IG51bGw7XG4gICAgICB0aGlzLl9fbW91bnRlZCA9IGZhbHNlO1xuXG4gICAgICB0aGlzLl9yZWdpc3RlcihvcHRpb25zKTtcblxuICAgICAgdGhpcy5fZGVidWdOYW1lID0gdGhpcy5wcm94eVRhcmdldC5fZGVidWdOYW1lIHx8IGdldERlYnVnTmFtZSh0aGlzLmlkKTtcblxuICAgICAgLy8gLS0tLSBmb3J3YXJkZWQgbWV0aG9kcyAtLS0tXG4gICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgIGZvcndhcmRlZE1ldGhvZHMuZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgICAgc2VsZlttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHNlbGYucHJveHlUYXJnZXRbbWV0aG9kXS5hcHBseShzZWxmLnByb3h5VGFyZ2V0LCBhcmd1bWVudHMpO1xuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgICAvLyAtLS0tIEVORCBmb3J3YXJkZWQgbWV0aG9kcyAtLS0tXG4gICAgfVxuXG4gICAgLy8gLS0tLSBhdWdtZW50ZWQgbWV0aG9kcyAtLS0tXG5cbiAgICBfbW91bnQodGFyZ2V0LCBhbmNob3IsIGluc2VydGlvblBvaW50KSB7XG5cbiAgICAgIHRoaXMuX19tb3VudHBvaW50ID0gdGFyZ2V0O1xuICAgICAgdGhpcy5fX2FuY2hvciA9IGFuY2hvcjtcblxuICAgICAgaWYgKGluc2VydGlvblBvaW50KSB7XG4gICAgICAgIHRoaXMuX19pbnNlcnRpb25Qb2ludCA9IGluc2VydGlvblBvaW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgICAgIHRoaXMuX19pbnNlcnRpb25Qb2ludCA9IGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQodGhpcy5fZGVidWdOYW1lKTtcbiAgICAgICAgdGFyZ2V0Lmluc2VydEJlZm9yZSh0aGlzLl9faW5zZXJ0aW9uUG9pbnQsIGFuY2hvcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19pbnNlcnRpb25Qb2ludC5fX2NvbXBvbmVudF9fID0gdGhpcztcblxuICAgICAgYW5jaG9yID0gdGhpcy5fX2luc2VydGlvblBvaW50Lm5leHRTaWJsaW5nO1xuXG4gICAgICBpZiAodGFyZ2V0Lm5vZGVOYW1lID09ICcjZG9jdW1lbnQtZnJhZ21lbnQnICYmIGluc2VydGlvblBvaW50KSB7XG4gICAgICAgIC8vaGFuZGxlcyAjNCBieSBmb3JjaW5nIGEgdGFyZ2V0XG4gICAgICAgIC8vaWYgb3JpZ2luYWwgdGFyZ2V0IHdhcyBhIGRvY3VtZW50IGZyYWdtZW50XG4gICAgICAgIHRhcmdldCA9IHRoaXMuX19pbnNlcnRpb25Qb2ludC5wYXJlbnROb2RlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9fbW91bnRlZCA9IHRydWU7XG5cbiAgICAgIHJldHVybiB0aGlzLnByb3h5VGFyZ2V0Ll9tb3VudCh0YXJnZXQsIGFuY2hvcik7XG4gICAgfVxuXG4gICAgZGVzdHJveShkZXRhY2gsIGtlZXBJbnNlcnRpb25Qb2ludCkge1xuXG4gICAgICBSZWdpc3RyeS5kZVJlZ2lzdGVySW5zdGFuY2UodGhpcyk7XG5cbiAgICAgIGlmICgha2VlcEluc2VydGlvblBvaW50ICYmIHRoaXMuX19pbnNlcnRpb25Qb2ludCkge1xuICAgICAgICAvL2RlcmVmIGZvciBHQyBiZWZvcmUgcmVtb3ZhbCBvZiBub2RlXG4gICAgICAgIHRoaXMuX19pbnNlcnRpb25Qb2ludC5fX2NvbXBvbmVudF9fID0gbnVsbDtcbiAgICAgICAgY29uc3QgaXAgPSB0aGlzLl9faW5zZXJ0aW9uUG9pbnQ7XG4gICAgICAgIGlwICYmIGlwLnBhcmVudE5vZGUgJiYgaXAucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpcCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5wcm94eVRhcmdldC5kZXN0cm95KGRldGFjaCk7XG4gICAgfVxuXG4gICAgX3VubW91bnQoKSB7XG4gICAgICB0aGlzLl9fbW91bnRlZCA9IGZhbHNlO1xuICAgICAgcmV0dXJuIHRoaXMucHJveHlUYXJnZXQuX3VubW91bnQuYXBwbHkodGhpcy5wcm94eVRhcmdldCwgYXJndW1lbnRzKTtcbiAgICB9XG5cbiAgICAvLyAtLS0tIEVORCBhdWdtZW50ZWQgbWV0aG9kcyAtLS0tXG5cblxuICAgIC8vIC0tLS0gZXh0cmEgbWV0aG9kcyAtLS0tXG5cbiAgICBfcmVnaXN0ZXIob3B0aW9ucykge1xuXG4gICAgICBjb25zdCByZWNvcmQgPSBSZWdpc3RyeS5nZXQodGhpcy5pZCk7XG5cbiAgICAgIHRyeSB7XG5cbiAgICAgICAgLy9yZXNvbHZlIHRvIGxhdGVzdCB2ZXJzaW9uIG9mIGNvbXBvbmVudFxuICAgICAgICB0aGlzLnByb3h5VGFyZ2V0ID0gbmV3IHJlY29yZC5jb21wb25lbnQob3B0aW9ucyk7XG5cbiAgICAgIH0gY2F0Y2ggKGUpIHtcblxuICAgICAgICBjb25zdCByYiA9IHJlY29yZC5yb2xsYmFjaztcblxuICAgICAgICBpZiAoIXJiKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcbiAgICAgICAgICBjb25zb2xlLndhcm4oJ0Z1bGwgcmVsb2FkIHJlcXVpcmVkLiBQbGVhc2UgZml4IGNvbXBvbmVudCBlcnJvcnMgYW5kIHJlbG9hZCB0aGUgd2hvbGUgcGFnZScpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGdyb3VwU3RhcnQodGhpcy5fZGVidWdOYW1lICsgJyBFcnJvcnMnKTtcblxuICAgICAgICBjb25zb2xlLndhcm4oZSk7XG4gICAgICAgIGNvbnNvbGUud2Fybih0aGlzLl9kZWJ1Z05hbWUgKyAnIGNvdWxkIG5vdCBiZSBob3QtbG9hZGVkIGJlY2F1c2UgaXQgaGFzIGFuIGVycm9yJyk7XG5cbiAgICAgICAgLy9yZXNvbHZlIHRvIHByZXZpb3VzIHdvcmtpbmcgdmVyc2lvbiBvZiBjb21wb25lbnRcbiAgICAgICAgdGhpcy5wcm94eVRhcmdldCA9IG5ldyByYihvcHRpb25zKTtcbiAgICAgICAgY29uc29sZS5pbmZvKCclYycgKyB0aGlzLl9kZWJ1Z05hbWUgKyAnIHJvbGxlZCBiYWNrIHRvIHByZXZpb3VzIHdvcmtpbmcgdmVyc2lvbicsICdjb2xvcjpncmVlbicpO1xuXG4gICAgICAgIC8vc2V0IGxhdGVzdCB2ZXJzaW9uIGFzIHRoZSByb2xsZWQtYmFjayB2ZXJzaW9uXG4gICAgICAgIHJlY29yZC5jb21wb25lbnQgPSByYjtcblxuICAgICAgICBncm91cEVuZCgpO1xuXG4gICAgICB9XG5cbiAgICAgIFJlZ2lzdHJ5LnNldCh0aGlzLmlkLCByZWNvcmQpO1xuXG4gICAgICAvL3JlZ2lzdGVyIGN1cnJlbnQgaW5zdGFuY2UsIHNvIHRoYXRcbiAgICAgIC8vd2UgY2FuIHJlLXJlbmRlciBpdCB3aGVuIHJlcXVpcmVkXG4gICAgICBSZWdpc3RyeS5yZWdpc3Rlckluc3RhbmNlKHRoaXMpO1xuXG4gICAgICAvL3Byb3h5IGN1c3RvbSBtZXRob2RzXG4gICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgIGxldCBtZXRob2RzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoT2JqZWN0LmdldFByb3RvdHlwZU9mKHNlbGYucHJveHlUYXJnZXQpKTtcbiAgICAgIG1ldGhvZHMuZm9yRWFjaChmdW5jdGlvbihtZXRob2QpIHtcbiAgICAgICAgaWYgKCFoYW5kbGVkTWV0aG9kcy5pbmNsdWRlcyhtZXRob2QpICYmICFmb3J3YXJkZWRNZXRob2RzLmluY2x1ZGVzKG1ldGhvZCkpIHtcbiAgICAgICAgICBzZWxmW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBzZWxmLnByb3h5VGFyZ2V0W21ldGhvZF0uYXBwbHkoc2VsZi5wcm94eVRhcmdldCwgYXJndW1lbnRzKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8ocmUpZXhwb3NlIHByb3BlcnRpZXMgdGhhdCBtaWdodCBiZSB1c2VkIGZyb20gb3V0c2lkZVxuICAgICAgdGhpcy5yZWZzID0gdGhpcy5wcm94eVRhcmdldC5yZWZzIHx8IHt9O1xuICAgICAgdGhpcy5fZnJhZ21lbnQgPSB0aGlzLnByb3h5VGFyZ2V0Ll9mcmFnbWVudDtcbiAgICAgIHRoaXMuX3Nsb3R0ZWQgPSB0aGlzLnByb3h5VGFyZ2V0Ll9zbG90dGVkO1xuICAgICAgdGhpcy5yb290ID0gdGhpcy5wcm94eVRhcmdldC5yb290O1xuICAgICAgdGhpcy5zdG9yZSA9IHRoaXMucHJveHlUYXJnZXQuc3RvcmUgfHwgbnVsbDtcbiAgICB9XG5cbiAgICBfcmVyZW5kZXIoKSB7XG4gICAgICBjb25zdCBtb3VudHBvaW50ID0gdGhpcy5fX21vdW50cG9pbnQgfHwgbnVsbCxcbiAgICAgICAgYW5jaG9yID0gdGhpcy5fX2FuY2hvciB8fCBudWxsLFxuICAgICAgICBvcHRpb25zID0gdGhpcy5wcm94eVRhcmdldC5vcHRpb25zLFxuICAgICAgICBvbGRzdGF0ZSA9IHRoaXMuZ2V0KCksXG4gICAgICAgIGlzTW91bnRlZCA9IHRoaXMuX19tb3VudGVkLFxuICAgICAgICBpbnNlcnRpb25Qb2ludCA9IHRoaXMuX19pbnNlcnRpb25Qb2ludDtcblxuICAgICAgdGhpcy5kZXN0cm95KHRydWUsIHRydWUpO1xuXG4gICAgICB0aGlzLl9yZWdpc3RlcihvcHRpb25zKTtcblxuICAgICAgaWYgKG1vdW50cG9pbnQgJiYgaXNNb3VudGVkKSB7XG4gICAgICAgIHRoaXMucHJveHlUYXJnZXQuX2ZyYWdtZW50LmMoKTtcbiAgICAgICAgdGhpcy5fbW91bnQobW91bnRwb2ludCwgYW5jaG9yLCBpbnNlcnRpb25Qb2ludCk7XG5cbiAgICAgICAgLy9wcmVzZXJ2ZSBsb2NhbCBzdGF0ZSAodW5sZXNzIG5vUHJlc2VydmVTdGF0ZSBpcyB0cnVlKVxuICAgICAgICBpZiAoXG4gICAgICAgICAgIXRoaXMucHJveHlUYXJnZXQuY29uc3RydWN0b3Iubm9QcmVzZXJ2ZVN0YXRlXG4gICAgICAgICAgJiYgIXByb3h5T3B0aW9ucy5ub1ByZXNlcnZlU3RhdGUpIHtcbiAgICAgICAgICB0aGlzLnNldChvbGRzdGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAvL3dlIGhhdmUgdG8gY2FsbCAuc2V0KCkgaGVyZVxuICAgICAgICAgIC8vb3RoZXJ3aXNlIG9uY3JlYXRlIGlzIG5vdCBmaXJlZFxuICAgICAgICAgIHRoaXMuc2V0KHRoaXMuZ2V0KCkpO1xuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tIEVORCBleHRyYSBtZXRob2RzIC0tLS1cbiAgfVxuXG4gIC8vZm9yd2FyZCBzdGF0aWMgcHJvcGVydGllcyBhbmQgbWV0aG9kc1xuICBjb25zdCBvcmlnaW5hbENvbXBvbmVudCA9IFJlZ2lzdHJ5LmdldChpZCkuY29tcG9uZW50O1xuICBmb3IgKGxldCBrZXkgaW4gb3JpZ2luYWxDb21wb25lbnQpIHtcbiAgICBwcm94eUNvbXBvbmVudFtrZXldID0gb3JpZ2luYWxDb21wb25lbnRba2V5XTtcbiAgfVxuXG4gIHJldHVybiBwcm94eUNvbXBvbmVudDtcbn1cbiIsIlxuY2xhc3MgcmVnaXN0cnkge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9pdGVtcyA9IHt9O1xuICB9XG5cbiAgc2V0KGssIHYpIHtcbiAgICB0aGlzLl9pdGVtc1trXSA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgcm9sbGJhY2s6IG51bGwsXG4gICAgICBjb21wb25lbnQ6IG51bGwsXG4gICAgICBpbnN0YW5jZXM6IFtdXG4gICAgfSwgdik7XG4gIH1cblxuICBnZXQoaykge1xuICAgIHJldHVybiBrID8gdGhpcy5faXRlbXNba10gfHwgdW5kZWZpbmVkIDogdGhpcy5faXRlbXM7XG4gIH1cblxuICByZWdpc3Rlckluc3RhbmNlKGluc3RhbmNlKSB7XG4gICAgY29uc3QgaWQgPSBpbnN0YW5jZS5pZDtcbiAgICB0aGlzLl9pdGVtc1tpZF0gJiYgdGhpcy5faXRlbXNbaWRdLmluc3RhbmNlcy5wdXNoKGluc3RhbmNlKTtcbiAgfVxuXG4gIGRlUmVnaXN0ZXJJbnN0YW5jZShpbnN0YW5jZSkge1xuICAgIGNvbnN0IGlkID0gaW5zdGFuY2UuaWQ7XG4gICAgdGhpcy5faXRlbXNbaWRdICYmIHRoaXMuX2l0ZW1zW2lkXS5pbnN0YW5jZXMuZm9yRWFjaChmdW5jdGlvbihjb21wLCBpZHgsIGluc3RhbmNlcykge1xuICAgICAgaWYgKGNvbXAgPT0gaW5zdGFuY2UpIHtcbiAgICAgICAgaW5zdGFuY2VzLnNwbGljZShpZHgsIDEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbn1cblxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbmNvbnN0IGNvbXBvbmVudFJlZ2lzdHJ5ID0gKHdpbmRvdy5fX1NWRUxURV9SRUdJU1RSWV9fID0gbmV3IHJlZ2lzdHJ5KTtcblxuZXhwb3J0IGRlZmF1bHQgY29tcG9uZW50UmVnaXN0cnk7IiwiaW1wb3J0IHsgUmVnaXN0cnksIGNvbmZpZ3VyZSBhcyBjb25maWd1cmVQcm94eSwgY3JlYXRlUHJveHkgfSBmcm9tICdzdmVsdGUtZGV2LWhlbHBlcic7XG5cbmxldCBob3RPcHRpb25zID0ge1xuXHRub1ByZXNlcnZlU3RhdGU6IGZhbHNlXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKG9wdGlvbnMpIHtcblx0aG90T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oaG90T3B0aW9ucywgb3B0aW9ucyk7XG5cdGNvbmZpZ3VyZVByb3h5KGhvdE9wdGlvbnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXIoaWQsIGNvbXBvbmVudCkge1xuXG5cdC8vc3RvcmUgb3JpZ2luYWwgY29tcG9uZW50IGluIHJlZ2lzdHJ5XG5cdFJlZ2lzdHJ5LnNldChpZCwge1xuXHRcdHJvbGxiYWNrOiBudWxsLFxuXHRcdGNvbXBvbmVudCxcblx0XHRpbnN0YW5jZXM6IFtdXG5cdH0pO1xuXG5cdHJldHVybiBjcmVhdGVQcm94eShpZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWxvYWQoaWQsIGNvbXBvbmVudCkge1xuXG5cdGNvbnN0IHJlY29yZCA9IFJlZ2lzdHJ5LmdldChpZCk7XG5cblx0Ly9rZWVwIHJlZmVyZW5jZSB0byBwcmV2aW91cyB2ZXJzaW9uIHRvIGVuYWJsZSByb2xsYmFja1xuXHRyZWNvcmQucm9sbGJhY2sgPSByZWNvcmQuY29tcG9uZW50O1xuXG5cdC8vcmVwbGFjZSBjb21wb25lbnQgaW4gcmVnaXN0cnkgd2l0aCBuZXdseSBsb2FkZWQgY29tcG9uZW50XG5cdHJlY29yZC5jb21wb25lbnQgPSBjb21wb25lbnQ7XG5cblx0UmVnaXN0cnkuc2V0KGlkLCByZWNvcmQpO1xuXG5cdC8vcmUtcmVuZGVyIHRoZSBwcm94aWVzXG5cdHJlY29yZC5pbnN0YW5jZXMuc2xpY2UoKS5mb3JFYWNoKGZ1bmN0aW9uKGluc3RhbmNlKSB7XG5cdFx0aW5zdGFuY2UgJiYgaW5zdGFuY2UuX3JlcmVuZGVyKCk7XG5cdH0pO1xufSIsImZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5mdW5jdGlvbiBhc3NpZ24odGFyZ2V0KSB7XG5cdHZhciBrLFxuXHRcdHNvdXJjZSxcblx0XHRpID0gMSxcblx0XHRsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0c291cmNlID0gYXJndW1lbnRzW2ldO1xuXHRcdGZvciAoayBpbiBzb3VyY2UpIHRhcmdldFtrXSA9IHNvdXJjZVtrXTtcblx0fVxuXG5cdHJldHVybiB0YXJnZXQ7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZE5vZGUobm9kZSwgdGFyZ2V0KSB7XG5cdHRhcmdldC5hcHBlbmRDaGlsZChub2RlKTtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0Tm9kZShub2RlLCB0YXJnZXQsIGFuY2hvcikge1xuXHR0YXJnZXQuaW5zZXJ0QmVmb3JlKG5vZGUsIGFuY2hvcik7XG59XG5cbmZ1bmN0aW9uIGRldGFjaE5vZGUobm9kZSkge1xuXHRub2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZSk7XG59XG5cbmZ1bmN0aW9uIGRldGFjaEJldHdlZW4oYmVmb3JlLCBhZnRlcikge1xuXHR3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcblx0XHRiZWZvcmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChiZWZvcmUubmV4dFNpYmxpbmcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGRldGFjaEJlZm9yZShhZnRlcikge1xuXHR3aGlsZSAoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKSB7XG5cdFx0YWZ0ZXIucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChhZnRlci5wcmV2aW91c1NpYmxpbmcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGRldGFjaEFmdGVyKGJlZm9yZSkge1xuXHR3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB7XG5cdFx0YmVmb3JlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYmVmb3JlLm5leHRTaWJsaW5nKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZWluc2VydEJldHdlZW4oYmVmb3JlLCBhZnRlciwgdGFyZ2V0KSB7XG5cdHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuXHRcdHRhcmdldC5hcHBlbmRDaGlsZChiZWZvcmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChiZWZvcmUubmV4dFNpYmxpbmcpKTtcblx0fVxufVxuXG5mdW5jdGlvbiByZWluc2VydENoaWxkcmVuKHBhcmVudCwgdGFyZ2V0KSB7XG5cdHdoaWxlIChwYXJlbnQuZmlyc3RDaGlsZCkgdGFyZ2V0LmFwcGVuZENoaWxkKHBhcmVudC5maXJzdENoaWxkKTtcbn1cblxuZnVuY3Rpb24gcmVpbnNlcnRBZnRlcihiZWZvcmUsIHRhcmdldCkge1xuXHR3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nKSB0YXJnZXQuYXBwZW5kQ2hpbGQoYmVmb3JlLm5leHRTaWJsaW5nKTtcbn1cblxuZnVuY3Rpb24gcmVpbnNlcnRCZWZvcmUoYWZ0ZXIsIHRhcmdldCkge1xuXHR2YXIgcGFyZW50ID0gYWZ0ZXIucGFyZW50Tm9kZTtcblx0d2hpbGUgKHBhcmVudC5maXJzdENoaWxkICE9PSBhZnRlcikgdGFyZ2V0LmFwcGVuZENoaWxkKHBhcmVudC5maXJzdENoaWxkKTtcbn1cblxuZnVuY3Rpb24gZGVzdHJveUVhY2goaXRlcmF0aW9ucykge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGl0ZXJhdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRpZiAoaXRlcmF0aW9uc1tpXSkgaXRlcmF0aW9uc1tpXS5kKCk7XG5cdH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlRnJhZ21lbnQoKSB7XG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQobmFtZSkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlU3ZnRWxlbWVudChuYW1lKSB7XG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgbmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVRleHQoZGF0YSkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQoKSB7XG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVDb21tZW50KCcnKTtcbn1cblxuZnVuY3Rpb24gYWRkTGlzdGVuZXIobm9kZSwgZXZlbnQsIGhhbmRsZXIpIHtcblx0bm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKG5vZGUsIGV2ZW50LCBoYW5kbGVyKSB7XG5cdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBzZXRBdHRyaWJ1dGUobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuXHRub2RlLnNldEF0dHJpYnV0ZShhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gc2V0WGxpbmtBdHRyaWJ1dGUobm9kZSwgYXR0cmlidXRlLCB2YWx1ZSkge1xuXHRub2RlLnNldEF0dHJpYnV0ZU5TKCdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJywgYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGdldEJpbmRpbmdHcm91cFZhbHVlKGdyb3VwKSB7XG5cdHZhciB2YWx1ZSA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IGdyb3VwLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0aWYgKGdyb3VwW2ldLmNoZWNrZWQpIHZhbHVlLnB1c2goZ3JvdXBbaV0uX192YWx1ZSk7XG5cdH1cblx0cmV0dXJuIHZhbHVlO1xufVxuXG5mdW5jdGlvbiB0b051bWJlcih2YWx1ZSkge1xuXHRyZXR1cm4gdmFsdWUgPT09ICcnID8gdW5kZWZpbmVkIDogK3ZhbHVlO1xufVxuXG5mdW5jdGlvbiB0aW1lUmFuZ2VzVG9BcnJheShyYW5nZXMpIHtcblx0dmFyIGFycmF5ID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgcmFuZ2VzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0YXJyYXkucHVzaCh7IHN0YXJ0OiByYW5nZXMuc3RhcnQoaSksIGVuZDogcmFuZ2VzLmVuZChpKSB9KTtcblx0fVxuXHRyZXR1cm4gYXJyYXk7XG59XG5cbmZ1bmN0aW9uIGNoaWxkcmVuIChlbGVtZW50KSB7XG5cdHJldHVybiBBcnJheS5mcm9tKGVsZW1lbnQuY2hpbGROb2Rlcyk7XG59XG5cbmZ1bmN0aW9uIGNsYWltRWxlbWVudCAobm9kZXMsIG5hbWUsIGF0dHJpYnV0ZXMsIHN2Zykge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFyIG5vZGUgPSBub2Rlc1tpXTtcblx0XHRpZiAobm9kZS5ub2RlTmFtZSA9PT0gbmFtZSkge1xuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBub2RlLmF0dHJpYnV0ZXMubGVuZ3RoOyBqICs9IDEpIHtcblx0XHRcdFx0dmFyIGF0dHJpYnV0ZSA9IG5vZGUuYXR0cmlidXRlc1tqXTtcblx0XHRcdFx0aWYgKCFhdHRyaWJ1dGVzW2F0dHJpYnV0ZS5uYW1lXSkgbm9kZS5yZW1vdmVBdHRyaWJ1dGUoYXR0cmlidXRlLm5hbWUpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTsgLy8gVE9ETyBzdHJpcCB1bndhbnRlZCBhdHRyaWJ1dGVzXG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIHN2ZyA/IGNyZWF0ZVN2Z0VsZW1lbnQobmFtZSkgOiBjcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuXG5mdW5jdGlvbiBjbGFpbVRleHQgKG5vZGVzLCBkYXRhKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHR2YXIgbm9kZSA9IG5vZGVzW2ldO1xuXHRcdGlmIChub2RlLm5vZGVUeXBlID09PSAzKSB7XG5cdFx0XHRub2RlLmRhdGEgPSBkYXRhO1xuXHRcdFx0cmV0dXJuIG5vZGVzLnNwbGljZShpLCAxKVswXTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gY3JlYXRlVGV4dChkYXRhKTtcbn1cblxuZnVuY3Rpb24gc2V0SW5wdXRUeXBlKGlucHV0LCB0eXBlKSB7XG5cdHRyeSB7XG5cdFx0aW5wdXQudHlwZSA9IHR5cGU7XG5cdH0gY2F0Y2ggKGUpIHt9XG59XG5cbmZ1bmN0aW9uIHNldFN0eWxlKG5vZGUsIGtleSwgdmFsdWUpIHtcblx0bm9kZS5zdHlsZS5zZXRQcm9wZXJ0eShrZXksIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gc2VsZWN0T3B0aW9uKHNlbGVjdCwgdmFsdWUpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdHZhciBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcblxuXHRcdGlmIChvcHRpb24uX192YWx1ZSA9PT0gdmFsdWUpIHtcblx0XHRcdG9wdGlvbi5zZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIHNlbGVjdE9wdGlvbnMoc2VsZWN0LCB2YWx1ZSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFyIG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuXHRcdG9wdGlvbi5zZWxlY3RlZCA9IH52YWx1ZS5pbmRleE9mKG9wdGlvbi5fX3ZhbHVlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZWxlY3RWYWx1ZShzZWxlY3QpIHtcblx0dmFyIHNlbGVjdGVkT3B0aW9uID0gc2VsZWN0LnF1ZXJ5U2VsZWN0b3IoJzpjaGVja2VkJykgfHwgc2VsZWN0Lm9wdGlvbnNbMF07XG5cdHJldHVybiBzZWxlY3RlZE9wdGlvbiAmJiBzZWxlY3RlZE9wdGlvbi5fX3ZhbHVlO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RNdWx0aXBsZVZhbHVlKHNlbGVjdCkge1xuXHRyZXR1cm4gW10ubWFwLmNhbGwoc2VsZWN0LnF1ZXJ5U2VsZWN0b3JBbGwoJzpjaGVja2VkJyksIGZ1bmN0aW9uKG9wdGlvbikge1xuXHRcdHJldHVybiBvcHRpb24uX192YWx1ZTtcblx0fSk7XG59XG5cbmZ1bmN0aW9uIGxpbmVhcih0KSB7XG5cdHJldHVybiB0O1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVJ1bGUoXG5cdGEsXG5cdGIsXG5cdGRlbHRhLFxuXHRkdXJhdGlvbixcblx0ZWFzZSxcblx0Zm5cbikge1xuXHR2YXIga2V5ZnJhbWVzID0gJ3tcXG4nO1xuXG5cdGZvciAodmFyIHAgPSAwOyBwIDw9IDE7IHAgKz0gMTYuNjY2IC8gZHVyYXRpb24pIHtcblx0XHR2YXIgdCA9IGEgKyBkZWx0YSAqIGVhc2UocCk7XG5cdFx0a2V5ZnJhbWVzICs9IHAgKiAxMDAgKyAnJXsnICsgZm4odCkgKyAnfVxcbic7XG5cdH1cblxuXHRyZXR1cm4ga2V5ZnJhbWVzICsgJzEwMCUgeycgKyBmbihiKSArICd9XFxufSc7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9kYXJrc2t5YXBwL3N0cmluZy1oYXNoL2Jsb2IvbWFzdGVyL2luZGV4LmpzXG5mdW5jdGlvbiBoYXNoKHN0cikge1xuXHR2YXIgaGFzaCA9IDUzODE7XG5cdHZhciBpID0gc3RyLmxlbmd0aDtcblxuXHR3aGlsZSAoaS0tKSBoYXNoID0gKChoYXNoIDw8IDUpIC0gaGFzaCkgXiBzdHIuY2hhckNvZGVBdChpKTtcblx0cmV0dXJuIGhhc2ggPj4+IDA7XG59XG5cbmZ1bmN0aW9uIHdyYXBUcmFuc2l0aW9uKGNvbXBvbmVudCwgbm9kZSwgZm4sIHBhcmFtcywgaW50cm8sIG91dGdyb3VwKSB7XG5cdHZhciBvYmogPSBmbihub2RlLCBwYXJhbXMpO1xuXHR2YXIgZHVyYXRpb24gPSBvYmouZHVyYXRpb24gfHwgMzAwO1xuXHR2YXIgZWFzZSA9IG9iai5lYXNpbmcgfHwgbGluZWFyO1xuXHR2YXIgY3NzVGV4dDtcblxuXHQvLyBUT0RPIHNoYXJlIDxzdHlsZT4gdGFnIGJldHdlZW4gYWxsIHRyYW5zaXRpb25zP1xuXHRpZiAob2JqLmNzcyAmJiAhdHJhbnNpdGlvbk1hbmFnZXIuc3R5bGVzaGVldCkge1xuXHRcdHZhciBzdHlsZSA9IGNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG5cdFx0ZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG5cdFx0dHJhbnNpdGlvbk1hbmFnZXIuc3R5bGVzaGVldCA9IHN0eWxlLnNoZWV0O1xuXHR9XG5cblx0aWYgKGludHJvKSB7XG5cdFx0aWYgKG9iai5jc3MgJiYgb2JqLmRlbGF5KSB7XG5cdFx0XHRjc3NUZXh0ID0gbm9kZS5zdHlsZS5jc3NUZXh0O1xuXHRcdFx0bm9kZS5zdHlsZS5jc3NUZXh0ICs9IG9iai5jc3MoMCk7XG5cdFx0fVxuXG5cdFx0aWYgKG9iai50aWNrKSBvYmoudGljaygwKTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0dDogaW50cm8gPyAwIDogMSxcblx0XHRydW5uaW5nOiBmYWxzZSxcblx0XHRwcm9ncmFtOiBudWxsLFxuXHRcdHBlbmRpbmc6IG51bGwsXG5cdFx0cnVuOiBmdW5jdGlvbihpbnRybywgY2FsbGJhY2spIHtcblx0XHRcdHZhciBwcm9ncmFtID0ge1xuXHRcdFx0XHRzdGFydDogd2luZG93LnBlcmZvcm1hbmNlLm5vdygpICsgKG9iai5kZWxheSB8fCAwKSxcblx0XHRcdFx0aW50cm86IGludHJvLFxuXHRcdFx0XHRjYWxsYmFjazogY2FsbGJhY2tcblx0XHRcdH07XG5cblx0XHRcdGlmIChvYmouZGVsYXkpIHtcblx0XHRcdFx0dGhpcy5wZW5kaW5nID0gcHJvZ3JhbTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuc3RhcnQocHJvZ3JhbSk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghdGhpcy5ydW5uaW5nKSB7XG5cdFx0XHRcdHRoaXMucnVubmluZyA9IHRydWU7XG5cdFx0XHRcdHRyYW5zaXRpb25NYW5hZ2VyLmFkZCh0aGlzKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHN0YXJ0OiBmdW5jdGlvbihwcm9ncmFtKSB7XG5cdFx0XHRjb21wb25lbnQuZmlyZShwcm9ncmFtLmludHJvID8gJ2ludHJvLnN0YXJ0JyA6ICdvdXRyby5zdGFydCcsIHsgbm9kZTogbm9kZSB9KTtcblxuXHRcdFx0cHJvZ3JhbS5hID0gdGhpcy50O1xuXHRcdFx0cHJvZ3JhbS5iID0gcHJvZ3JhbS5pbnRybyA/IDEgOiAwO1xuXHRcdFx0cHJvZ3JhbS5kZWx0YSA9IHByb2dyYW0uYiAtIHByb2dyYW0uYTtcblx0XHRcdHByb2dyYW0uZHVyYXRpb24gPSBkdXJhdGlvbiAqIE1hdGguYWJzKHByb2dyYW0uYiAtIHByb2dyYW0uYSk7XG5cdFx0XHRwcm9ncmFtLmVuZCA9IHByb2dyYW0uc3RhcnQgKyBwcm9ncmFtLmR1cmF0aW9uO1xuXG5cdFx0XHRpZiAob2JqLmNzcykge1xuXHRcdFx0XHRpZiAob2JqLmRlbGF5KSBub2RlLnN0eWxlLmNzc1RleHQgPSBjc3NUZXh0O1xuXG5cdFx0XHRcdHByb2dyYW0ucnVsZSA9IGdlbmVyYXRlUnVsZShcblx0XHRcdFx0XHRwcm9ncmFtLmEsXG5cdFx0XHRcdFx0cHJvZ3JhbS5iLFxuXHRcdFx0XHRcdHByb2dyYW0uZGVsdGEsXG5cdFx0XHRcdFx0cHJvZ3JhbS5kdXJhdGlvbixcblx0XHRcdFx0XHRlYXNlLFxuXHRcdFx0XHRcdG9iai5jc3Ncblx0XHRcdFx0KTtcblxuXHRcdFx0XHR0cmFuc2l0aW9uTWFuYWdlci5hZGRSdWxlKHByb2dyYW0ucnVsZSwgcHJvZ3JhbS5uYW1lID0gJ19fc3ZlbHRlXycgKyBoYXNoKHByb2dyYW0ucnVsZSkpO1xuXG5cdFx0XHRcdG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gKG5vZGUuc3R5bGUuYW5pbWF0aW9uIHx8ICcnKVxuXHRcdFx0XHRcdC5zcGxpdCgnLCAnKVxuXHRcdFx0XHRcdC5maWx0ZXIoZnVuY3Rpb24oYW5pbSkge1xuXHRcdFx0XHRcdFx0Ly8gd2hlbiBpbnRyb2luZywgZGlzY2FyZCBvbGQgYW5pbWF0aW9ucyBpZiB0aGVyZSBhcmUgYW55XG5cdFx0XHRcdFx0XHRyZXR1cm4gYW5pbSAmJiAocHJvZ3JhbS5kZWx0YSA8IDAgfHwgIS9fX3N2ZWx0ZS8udGVzdChhbmltKSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuY29uY2F0KHByb2dyYW0ubmFtZSArICcgJyArIGR1cmF0aW9uICsgJ21zIGxpbmVhciAxIGZvcndhcmRzJylcblx0XHRcdFx0XHQuam9pbignLCAnKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5wcm9ncmFtID0gcHJvZ3JhbTtcblx0XHRcdHRoaXMucGVuZGluZyA9IG51bGw7XG5cdFx0fSxcblx0XHR1cGRhdGU6IGZ1bmN0aW9uKG5vdykge1xuXHRcdFx0dmFyIHByb2dyYW0gPSB0aGlzLnByb2dyYW07XG5cdFx0XHRpZiAoIXByb2dyYW0pIHJldHVybjtcblxuXHRcdFx0dmFyIHAgPSBub3cgLSBwcm9ncmFtLnN0YXJ0O1xuXHRcdFx0dGhpcy50ID0gcHJvZ3JhbS5hICsgcHJvZ3JhbS5kZWx0YSAqIGVhc2UocCAvIHByb2dyYW0uZHVyYXRpb24pO1xuXHRcdFx0aWYgKG9iai50aWNrKSBvYmoudGljayh0aGlzLnQpO1xuXHRcdH0sXG5cdFx0ZG9uZTogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgcHJvZ3JhbSA9IHRoaXMucHJvZ3JhbTtcblx0XHRcdHRoaXMudCA9IHByb2dyYW0uYjtcblx0XHRcdGlmIChvYmoudGljaykgb2JqLnRpY2sodGhpcy50KTtcblx0XHRcdGlmIChvYmouY3NzKSB0cmFuc2l0aW9uTWFuYWdlci5kZWxldGVSdWxlKG5vZGUsIHByb2dyYW0ubmFtZSk7XG5cdFx0XHRwcm9ncmFtLmNhbGxiYWNrKCk7XG5cdFx0XHRwcm9ncmFtID0gbnVsbDtcblx0XHRcdHRoaXMucnVubmluZyA9ICEhdGhpcy5wZW5kaW5nO1xuXHRcdH0sXG5cdFx0YWJvcnQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0aWYgKG9iai50aWNrKSBvYmoudGljaygxKTtcblx0XHRcdGlmIChvYmouY3NzKSB0cmFuc2l0aW9uTWFuYWdlci5kZWxldGVSdWxlKG5vZGUsIHRoaXMucHJvZ3JhbS5uYW1lKTtcblx0XHRcdHRoaXMucHJvZ3JhbSA9IHRoaXMucGVuZGluZyA9IG51bGw7XG5cdFx0XHR0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblx0XHR9XG5cdH07XG59XG5cbnZhciB0cmFuc2l0aW9uTWFuYWdlciA9IHtcblx0cnVubmluZzogZmFsc2UsXG5cdHRyYW5zaXRpb25zOiBbXSxcblx0Ym91bmQ6IG51bGwsXG5cdHN0eWxlc2hlZXQ6IG51bGwsXG5cdGFjdGl2ZVJ1bGVzOiB7fSxcblxuXHRhZGQ6IGZ1bmN0aW9uKHRyYW5zaXRpb24pIHtcblx0XHR0aGlzLnRyYW5zaXRpb25zLnB1c2godHJhbnNpdGlvbik7XG5cblx0XHRpZiAoIXRoaXMucnVubmluZykge1xuXHRcdFx0dGhpcy5ydW5uaW5nID0gdHJ1ZTtcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmJvdW5kIHx8ICh0aGlzLmJvdW5kID0gdGhpcy5uZXh0LmJpbmQodGhpcykpKTtcblx0XHR9XG5cdH0sXG5cblx0YWRkUnVsZTogZnVuY3Rpb24ocnVsZSwgbmFtZSkge1xuXHRcdGlmICghdGhpcy5hY3RpdmVSdWxlc1tuYW1lXSkge1xuXHRcdFx0dGhpcy5hY3RpdmVSdWxlc1tuYW1lXSA9IHRydWU7XG5cdFx0XHR0aGlzLnN0eWxlc2hlZXQuaW5zZXJ0UnVsZSgnQGtleWZyYW1lcyAnICsgbmFtZSArICcgJyArIHJ1bGUsIHRoaXMuc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGgpO1xuXHRcdH1cblx0fSxcblxuXHRuZXh0OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnJ1bm5pbmcgPSBmYWxzZTtcblxuXHRcdHZhciBub3cgPSB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCk7XG5cdFx0dmFyIGkgPSB0aGlzLnRyYW5zaXRpb25zLmxlbmd0aDtcblxuXHRcdHdoaWxlIChpLS0pIHtcblx0XHRcdHZhciB0cmFuc2l0aW9uID0gdGhpcy50cmFuc2l0aW9uc1tpXTtcblxuXHRcdFx0aWYgKHRyYW5zaXRpb24ucHJvZ3JhbSAmJiBub3cgPj0gdHJhbnNpdGlvbi5wcm9ncmFtLmVuZCkge1xuXHRcdFx0XHR0cmFuc2l0aW9uLmRvbmUoKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRyYW5zaXRpb24ucGVuZGluZyAmJiBub3cgPj0gdHJhbnNpdGlvbi5wZW5kaW5nLnN0YXJ0KSB7XG5cdFx0XHRcdHRyYW5zaXRpb24uc3RhcnQodHJhbnNpdGlvbi5wZW5kaW5nKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRyYW5zaXRpb24ucnVubmluZykge1xuXHRcdFx0XHR0cmFuc2l0aW9uLnVwZGF0ZShub3cpO1xuXHRcdFx0XHR0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIGlmICghdHJhbnNpdGlvbi5wZW5kaW5nKSB7XG5cdFx0XHRcdHRoaXMudHJhbnNpdGlvbnMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLnJ1bm5pbmcpIHtcblx0XHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLmJvdW5kKTtcblx0XHR9IGVsc2UgaWYgKHRoaXMuc3R5bGVzaGVldCkge1xuXHRcdFx0dmFyIGkgPSB0aGlzLnN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoO1xuXHRcdFx0d2hpbGUgKGktLSkgdGhpcy5zdHlsZXNoZWV0LmRlbGV0ZVJ1bGUoaSk7XG5cdFx0XHR0aGlzLmFjdGl2ZVJ1bGVzID0ge307XG5cdFx0fVxuXHR9LFxuXG5cdGRlbGV0ZVJ1bGU6IGZ1bmN0aW9uKG5vZGUsIG5hbWUpIHtcblx0XHRub2RlLnN0eWxlLmFuaW1hdGlvbiA9IG5vZGUuc3R5bGUuYW5pbWF0aW9uXG5cdFx0XHQuc3BsaXQoJywgJylcblx0XHRcdC5maWx0ZXIoZnVuY3Rpb24oYW5pbSkge1xuXHRcdFx0XHRyZXR1cm4gYW5pbS5zbGljZSgwLCBuYW1lLmxlbmd0aCkgIT09IG5hbWU7XG5cdFx0XHR9KVxuXHRcdFx0LmpvaW4oJywgJyk7XG5cdH1cbn07XG5cbmZ1bmN0aW9uIGJsYW5rT2JqZWN0KCkge1xuXHRyZXR1cm4gT2JqZWN0LmNyZWF0ZShudWxsKTtcbn1cblxuZnVuY3Rpb24gZGVzdHJveShkZXRhY2gpIHtcblx0dGhpcy5kZXN0cm95ID0gbm9vcDtcblx0dGhpcy5maXJlKCdkZXN0cm95Jyk7XG5cdHRoaXMuc2V0ID0gdGhpcy5nZXQgPSBub29wO1xuXG5cdGlmIChkZXRhY2ggIT09IGZhbHNlKSB0aGlzLl9mcmFnbWVudC51KCk7XG5cdHRoaXMuX2ZyYWdtZW50LmQoKTtcblx0dGhpcy5fZnJhZ21lbnQgPSB0aGlzLl9zdGF0ZSA9IG51bGw7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lEZXYoZGV0YWNoKSB7XG5cdGRlc3Ryb3kuY2FsbCh0aGlzLCBkZXRhY2gpO1xuXHR0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0XHRjb25zb2xlLndhcm4oJ0NvbXBvbmVudCB3YXMgYWxyZWFkeSBkZXN0cm95ZWQnKTtcblx0fTtcbn1cblxuZnVuY3Rpb24gX2RpZmZlcnMoYSwgYikge1xuXHRyZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYiB8fCAoKGEgJiYgdHlwZW9mIGEgPT09ICdvYmplY3QnKSB8fCB0eXBlb2YgYSA9PT0gJ2Z1bmN0aW9uJyk7XG59XG5cbmZ1bmN0aW9uIF9kaWZmZXJzSW1tdXRhYmxlKGEsIGIpIHtcblx0cmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGI7XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoT2JzZXJ2ZXJzKGNvbXBvbmVudCwgZ3JvdXAsIGNoYW5nZWQsIG5ld1N0YXRlLCBvbGRTdGF0ZSkge1xuXHRmb3IgKHZhciBrZXkgaW4gZ3JvdXApIHtcblx0XHRpZiAoIWNoYW5nZWRba2V5XSkgY29udGludWU7XG5cblx0XHR2YXIgbmV3VmFsdWUgPSBuZXdTdGF0ZVtrZXldO1xuXHRcdHZhciBvbGRWYWx1ZSA9IG9sZFN0YXRlW2tleV07XG5cblx0XHR2YXIgY2FsbGJhY2tzID0gZ3JvdXBba2V5XTtcblx0XHRpZiAoIWNhbGxiYWNrcykgY29udGludWU7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNhbGxiYWNrcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdFx0dmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2ldO1xuXHRcdFx0aWYgKGNhbGxiYWNrLl9fY2FsbGluZykgY29udGludWU7XG5cblx0XHRcdGNhbGxiYWNrLl9fY2FsbGluZyA9IHRydWU7XG5cdFx0XHRjYWxsYmFjay5jYWxsKGNvbXBvbmVudCwgbmV3VmFsdWUsIG9sZFZhbHVlKTtcblx0XHRcdGNhbGxiYWNrLl9fY2FsbGluZyA9IGZhbHNlO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBmaXJlKGV2ZW50TmFtZSwgZGF0YSkge1xuXHR2YXIgaGFuZGxlcnMgPVxuXHRcdGV2ZW50TmFtZSBpbiB0aGlzLl9oYW5kbGVycyAmJiB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdLnNsaWNlKCk7XG5cdGlmICghaGFuZGxlcnMpIHJldHVybjtcblxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGhhbmRsZXJzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0aGFuZGxlcnNbaV0uY2FsbCh0aGlzLCBkYXRhKTtcblx0fVxufVxuXG5mdW5jdGlvbiBnZXQoa2V5KSB7XG5cdHJldHVybiBrZXkgPyB0aGlzLl9zdGF0ZVtrZXldIDogdGhpcy5fc3RhdGU7XG59XG5cbmZ1bmN0aW9uIGluaXQoY29tcG9uZW50LCBvcHRpb25zKSB7XG5cdGNvbXBvbmVudC5fb2JzZXJ2ZXJzID0geyBwcmU6IGJsYW5rT2JqZWN0KCksIHBvc3Q6IGJsYW5rT2JqZWN0KCkgfTtcblx0Y29tcG9uZW50Ll9oYW5kbGVycyA9IGJsYW5rT2JqZWN0KCk7XG5cdGNvbXBvbmVudC5fYmluZCA9IG9wdGlvbnMuX2JpbmQ7XG5cblx0Y29tcG9uZW50Lm9wdGlvbnMgPSBvcHRpb25zO1xuXHRjb21wb25lbnQucm9vdCA9IG9wdGlvbnMucm9vdCB8fCBjb21wb25lbnQ7XG5cdGNvbXBvbmVudC5zdG9yZSA9IGNvbXBvbmVudC5yb290LnN0b3JlIHx8IG9wdGlvbnMuc3RvcmU7XG59XG5cbmZ1bmN0aW9uIG9ic2VydmUoa2V5LCBjYWxsYmFjaywgb3B0aW9ucykge1xuXHR2YXIgZ3JvdXAgPSBvcHRpb25zICYmIG9wdGlvbnMuZGVmZXJcblx0XHQ/IHRoaXMuX29ic2VydmVycy5wb3N0XG5cdFx0OiB0aGlzLl9vYnNlcnZlcnMucHJlO1xuXG5cdChncm91cFtrZXldIHx8IChncm91cFtrZXldID0gW10pKS5wdXNoKGNhbGxiYWNrKTtcblxuXHRpZiAoIW9wdGlvbnMgfHwgb3B0aW9ucy5pbml0ICE9PSBmYWxzZSkge1xuXHRcdGNhbGxiYWNrLl9fY2FsbGluZyA9IHRydWU7XG5cdFx0Y2FsbGJhY2suY2FsbCh0aGlzLCB0aGlzLl9zdGF0ZVtrZXldKTtcblx0XHRjYWxsYmFjay5fX2NhbGxpbmcgPSBmYWxzZTtcblx0fVxuXG5cdHJldHVybiB7XG5cdFx0Y2FuY2VsOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBpbmRleCA9IGdyb3VwW2tleV0uaW5kZXhPZihjYWxsYmFjayk7XG5cdFx0XHRpZiAofmluZGV4KSBncm91cFtrZXldLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBvYnNlcnZlRGV2KGtleSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0dmFyIGMgPSAoa2V5ID0gJycgKyBrZXkpLnNlYXJjaCgvWy5bXS8pO1xuXHRpZiAoYyA+IC0xKSB7XG5cdFx0dmFyIG1lc3NhZ2UgPVxuXHRcdFx0J1RoZSBmaXJzdCBhcmd1bWVudCB0byBjb21wb25lbnQub2JzZXJ2ZSguLi4pIG11c3QgYmUgdGhlIG5hbWUgb2YgYSB0b3AtbGV2ZWwgcHJvcGVydHknO1xuXHRcdGlmIChjID4gMClcblx0XHRcdG1lc3NhZ2UgKz0gXCIsIGkuZS4gJ1wiICsga2V5LnNsaWNlKDAsIGMpICsgXCInIHJhdGhlciB0aGFuICdcIiArIGtleSArIFwiJ1wiO1xuXG5cdFx0dGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuXHR9XG5cblx0cmV0dXJuIG9ic2VydmUuY2FsbCh0aGlzLCBrZXksIGNhbGxiYWNrLCBvcHRpb25zKTtcbn1cblxuZnVuY3Rpb24gb24oZXZlbnROYW1lLCBoYW5kbGVyKSB7XG5cdGlmIChldmVudE5hbWUgPT09ICd0ZWFyZG93bicpIHJldHVybiB0aGlzLm9uKCdkZXN0cm95JywgaGFuZGxlcik7XG5cblx0dmFyIGhhbmRsZXJzID0gdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSB8fCAodGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXSA9IFtdKTtcblx0aGFuZGxlcnMucHVzaChoYW5kbGVyKTtcblxuXHRyZXR1cm4ge1xuXHRcdGNhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaW5kZXggPSBoYW5kbGVycy5pbmRleE9mKGhhbmRsZXIpO1xuXHRcdFx0aWYgKH5pbmRleCkgaGFuZGxlcnMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIG9uRGV2KGV2ZW50TmFtZSwgaGFuZGxlcikge1xuXHRpZiAoZXZlbnROYW1lID09PSAndGVhcmRvd24nKSB7XG5cdFx0Y29uc29sZS53YXJuKFxuXHRcdFx0XCJVc2UgY29tcG9uZW50Lm9uKCdkZXN0cm95JywgLi4uKSBpbnN0ZWFkIG9mIGNvbXBvbmVudC5vbigndGVhcmRvd24nLCAuLi4pIHdoaWNoIGhhcyBiZWVuIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgdW5zdXBwb3J0ZWQgaW4gU3ZlbHRlIDJcIlxuXHRcdCk7XG5cdFx0cmV0dXJuIHRoaXMub24oJ2Rlc3Ryb3knLCBoYW5kbGVyKTtcblx0fVxuXG5cdHJldHVybiBvbi5jYWxsKHRoaXMsIGV2ZW50TmFtZSwgaGFuZGxlcik7XG59XG5cbmZ1bmN0aW9uIHNldChuZXdTdGF0ZSkge1xuXHR0aGlzLl9zZXQoYXNzaWduKHt9LCBuZXdTdGF0ZSkpO1xuXHRpZiAodGhpcy5yb290Ll9sb2NrKSByZXR1cm47XG5cdHRoaXMucm9vdC5fbG9jayA9IHRydWU7XG5cdGNhbGxBbGwodGhpcy5yb290Ll9iZWZvcmVjcmVhdGUpO1xuXHRjYWxsQWxsKHRoaXMucm9vdC5fb25jcmVhdGUpO1xuXHRjYWxsQWxsKHRoaXMucm9vdC5fYWZ0ZXJjcmVhdGUpO1xuXHR0aGlzLnJvb3QuX2xvY2sgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3NldChuZXdTdGF0ZSkge1xuXHR2YXIgb2xkU3RhdGUgPSB0aGlzLl9zdGF0ZSxcblx0XHRjaGFuZ2VkID0ge30sXG5cdFx0ZGlydHkgPSBmYWxzZTtcblxuXHRmb3IgKHZhciBrZXkgaW4gbmV3U3RhdGUpIHtcblx0XHRpZiAodGhpcy5fZGlmZmVycyhuZXdTdGF0ZVtrZXldLCBvbGRTdGF0ZVtrZXldKSkgY2hhbmdlZFtrZXldID0gZGlydHkgPSB0cnVlO1xuXHR9XG5cdGlmICghZGlydHkpIHJldHVybjtcblxuXHR0aGlzLl9zdGF0ZSA9IGFzc2lnbih7fSwgb2xkU3RhdGUsIG5ld1N0YXRlKTtcblx0dGhpcy5fcmVjb21wdXRlKGNoYW5nZWQsIHRoaXMuX3N0YXRlKTtcblx0aWYgKHRoaXMuX2JpbmQpIHRoaXMuX2JpbmQoY2hhbmdlZCwgdGhpcy5fc3RhdGUpO1xuXG5cdGlmICh0aGlzLl9mcmFnbWVudCkge1xuXHRcdGRpc3BhdGNoT2JzZXJ2ZXJzKHRoaXMsIHRoaXMuX29ic2VydmVycy5wcmUsIGNoYW5nZWQsIHRoaXMuX3N0YXRlLCBvbGRTdGF0ZSk7XG5cdFx0dGhpcy5fZnJhZ21lbnQucChjaGFuZ2VkLCB0aGlzLl9zdGF0ZSk7XG5cdFx0ZGlzcGF0Y2hPYnNlcnZlcnModGhpcywgdGhpcy5fb2JzZXJ2ZXJzLnBvc3QsIGNoYW5nZWQsIHRoaXMuX3N0YXRlLCBvbGRTdGF0ZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2V0RGV2KG5ld1N0YXRlKSB7XG5cdGlmICh0eXBlb2YgbmV3U3RhdGUgIT09ICdvYmplY3QnKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKFxuXHRcdFx0dGhpcy5fZGVidWdOYW1lICsgJy5zZXQgd2FzIGNhbGxlZCB3aXRob3V0IGFuIG9iamVjdCBvZiBkYXRhIGtleS12YWx1ZXMgdG8gdXBkYXRlLidcblx0XHQpO1xuXHR9XG5cblx0dGhpcy5fY2hlY2tSZWFkT25seShuZXdTdGF0ZSk7XG5cdHNldC5jYWxsKHRoaXMsIG5ld1N0YXRlKTtcbn1cblxuZnVuY3Rpb24gY2FsbEFsbChmbnMpIHtcblx0d2hpbGUgKGZucyAmJiBmbnMubGVuZ3RoKSBmbnMuc2hpZnQoKSgpO1xufVxuXG5mdW5jdGlvbiBfbW91bnQodGFyZ2V0LCBhbmNob3IpIHtcblx0dGhpcy5fZnJhZ21lbnRbdGhpcy5fZnJhZ21lbnQuaSA/ICdpJyA6ICdtJ10odGFyZ2V0LCBhbmNob3IgfHwgbnVsbCk7XG59XG5cbmZ1bmN0aW9uIF91bm1vdW50KCkge1xuXHRpZiAodGhpcy5fZnJhZ21lbnQpIHRoaXMuX2ZyYWdtZW50LnUoKTtcbn1cblxuZnVuY3Rpb24gaXNQcm9taXNlKHZhbHVlKSB7XG5cdHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn1cblxudmFyIFBFTkRJTkcgPSB7fTtcbnZhciBTVUNDRVNTID0ge307XG52YXIgRkFJTFVSRSA9IHt9O1xuXG5mdW5jdGlvbiByZW1vdmVGcm9tU3RvcmUoKSB7XG5cdHRoaXMuc3RvcmUuX3JlbW92ZSh0aGlzKTtcbn1cblxudmFyIHByb3RvID0ge1xuXHRkZXN0cm95OiBkZXN0cm95LFxuXHRnZXQ6IGdldCxcblx0ZmlyZTogZmlyZSxcblx0b2JzZXJ2ZTogb2JzZXJ2ZSxcblx0b246IG9uLFxuXHRzZXQ6IHNldCxcblx0dGVhcmRvd246IGRlc3Ryb3ksXG5cdF9yZWNvbXB1dGU6IG5vb3AsXG5cdF9zZXQ6IF9zZXQsXG5cdF9tb3VudDogX21vdW50LFxuXHRfdW5tb3VudDogX3VubW91bnQsXG5cdF9kaWZmZXJzOiBfZGlmZmVyc1xufTtcblxudmFyIHByb3RvRGV2ID0ge1xuXHRkZXN0cm95OiBkZXN0cm95RGV2LFxuXHRnZXQ6IGdldCxcblx0ZmlyZTogZmlyZSxcblx0b2JzZXJ2ZTogb2JzZXJ2ZURldixcblx0b246IG9uRGV2LFxuXHRzZXQ6IHNldERldixcblx0dGVhcmRvd246IGRlc3Ryb3lEZXYsXG5cdF9yZWNvbXB1dGU6IG5vb3AsXG5cdF9zZXQ6IF9zZXQsXG5cdF9tb3VudDogX21vdW50LFxuXHRfdW5tb3VudDogX3VubW91bnQsXG5cdF9kaWZmZXJzOiBfZGlmZmVyc1xufTtcblxuZXhwb3J0IHsgYmxhbmtPYmplY3QsIGRlc3Ryb3ksIGRlc3Ryb3lEZXYsIF9kaWZmZXJzLCBfZGlmZmVyc0ltbXV0YWJsZSwgZGlzcGF0Y2hPYnNlcnZlcnMsIGZpcmUsIGdldCwgaW5pdCwgb2JzZXJ2ZSwgb2JzZXJ2ZURldiwgb24sIG9uRGV2LCBzZXQsIF9zZXQsIHNldERldiwgY2FsbEFsbCwgX21vdW50LCBfdW5tb3VudCwgaXNQcm9taXNlLCBQRU5ESU5HLCBTVUNDRVNTLCBGQUlMVVJFLCByZW1vdmVGcm9tU3RvcmUsIHByb3RvLCBwcm90b0RldiwgYXBwZW5kTm9kZSwgaW5zZXJ0Tm9kZSwgZGV0YWNoTm9kZSwgZGV0YWNoQmV0d2VlbiwgZGV0YWNoQmVmb3JlLCBkZXRhY2hBZnRlciwgcmVpbnNlcnRCZXR3ZWVuLCByZWluc2VydENoaWxkcmVuLCByZWluc2VydEFmdGVyLCByZWluc2VydEJlZm9yZSwgZGVzdHJveUVhY2gsIGNyZWF0ZUZyYWdtZW50LCBjcmVhdGVFbGVtZW50LCBjcmVhdGVTdmdFbGVtZW50LCBjcmVhdGVUZXh0LCBjcmVhdGVDb21tZW50LCBhZGRMaXN0ZW5lciwgcmVtb3ZlTGlzdGVuZXIsIHNldEF0dHJpYnV0ZSwgc2V0WGxpbmtBdHRyaWJ1dGUsIGdldEJpbmRpbmdHcm91cFZhbHVlLCB0b051bWJlciwgdGltZVJhbmdlc1RvQXJyYXksIGNoaWxkcmVuLCBjbGFpbUVsZW1lbnQsIGNsYWltVGV4dCwgc2V0SW5wdXRUeXBlLCBzZXRTdHlsZSwgc2VsZWN0T3B0aW9uLCBzZWxlY3RPcHRpb25zLCBzZWxlY3RWYWx1ZSwgc2VsZWN0TXVsdGlwbGVWYWx1ZSwgbGluZWFyLCBnZW5lcmF0ZVJ1bGUsIGhhc2gsIHdyYXBUcmFuc2l0aW9uLCB0cmFuc2l0aW9uTWFuYWdlciwgbm9vcCwgYXNzaWduIH07XG4iLCI8TmF2IHBhZ2U9e3twYWdlfX0vPlxuXG48bWFpbj5cblx0PHNsb3Q+PC9zbG90PlxuPC9tYWluPlxuXG48c2NyaXB0PlxuXHRpbXBvcnQgTmF2IGZyb20gJy4vTmF2Lmh0bWwnO1xuXG5cdGV4cG9ydCBkZWZhdWx0IHtcblx0XHRjb21wb25lbnRzOiB7XG5cdFx0XHROYXZcblx0XHR9XG5cdH07XG48L3NjcmlwdD4iLCJ7eyNpZiB1c2VyfX1cbiAgPHA+e3t1c2VyLm5pY2tuYW1lfX08L3A+XG4gIGF1dGhSZXN1bHQuYWNjZXNzVG9rZW5cbnt7ZWxzZX19XG4gIDxidXR0b24gb246Y2xpY2s9XCJzZXQoeyBzdGF0ZTogc2hvd30pXCI+bG9naW48L2J1dHRvbj5cbnt7L2lmfX1cblxuPGRpdiBjbGFzcz1cInt7c3RhdGV9fVwiPlxuICA8cD5NYWdpYyBMaW5rIFNpZ24gSW46PC9wPlxuICA8aW5wdXQgY2xhc3M9XCJqcy1lbWFpbFwiIHR5cGU9XCJlbWFpbFwiIHBsYWNlaG9sZGVyPVwiZW1haWxcIj5cbiAgPGJ1dHRvbiBvbjpjbGljaz1cImxvZ2luKClcIj5TZW5kIEVtYWlsPC9idXR0b24+XG48L2Rpdj5cblxuPHNjcmlwdD5cbiAgZXhwb3J0IGRlZmF1bHQge1xuICAgIG9uY3JlYXRlICgpIHtcbiAgICAgIGxldCB1c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UudXNlcilcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIHRoaXMuc2V0KHt1c2VyOiB1c2VyfSlcbiAgICAgIH1cblxuICAgICAgdmFyIHdlYkF1dGggPSBuZXcgYXV0aDAuV2ViQXV0aCh7XG4gICAgICAgIGNsaWVudElEOiAnYVNYMDRLbFRQdENzV2NLSUtTai1GN0k4ZlhlWExHbk0nLFxuICAgICAgICBkb21haW46ICdkZXBhcnRtZW50LmF1dGgwLmNvbScsXG4gICAgICAgIHJlZGlyZWN0VXJpOiAnaHR0cDovL3BhcGVyY2x1Yi5sb2NhbDo4MDgwJyxcbiAgICAgICAgcmVzcG9uc2VUeXBlOiAndG9rZW4nLFxuICAgICAgICBzY29wZTogJ29wZW5pZCBwcm9maWxlJ1xuICAgICAgfSk7XG5cbiAgICAgIGlmKHdpbmRvdy5sb2NhdGlvbi5oYXNoKXtcbiAgICAgICAgd2ViQXV0aC5wYXJzZUhhc2god2luZG93LmxvY2F0aW9uLmhhc2gsIGZ1bmN0aW9uKGVyciwgYXV0aFJlc3VsdCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYXV0aFJlc3VsdCl7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWNjZXNzVG9rZW4nLCBhdXRoUmVzdWx0LmFjY2Vzc1Rva2VuKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF1dGhSZXN1bHQuYWNjZXNzVG9rZW4pXG5cbiAgICAgICAgICAgIHdlYkF1dGguY2xpZW50LnVzZXJJbmZvKGF1dGhSZXN1bHQuYWNjZXNzVG9rZW4sIGZ1bmN0aW9uKGVyciwgdXNlcikge1xuICAgICAgICAgICAgICBpZiAoZXJyKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyJyxlcnIpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgcmV0cmlldmluZyB5b3VyIHByb2ZpbGU6ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codXNlcilcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHVzZXIpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGF0YSAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZTogJ2hpZGUnXG4gICAgICB9XG4gICAgfSxcblxuICAgIG1ldGhvZHM6IHtcbiAgICAgIGxvZ2luKCkge1xuICAgICAgICB2YXIgd2ViQXV0aCA9IG5ldyBhdXRoMC5XZWJBdXRoKHtcbiAgICAgICAgICBjbGllbnRJRDogJ2FTWDA0S2xUUHRDc1djS0lLU2otRjdJOGZYZVhMR25NJyxcbiAgICAgICAgICBkb21haW46ICdkZXBhcnRtZW50LmF1dGgwLmNvbScsXG4gICAgICAgICAgcmVkaXJlY3RVcmk6ICdodHRwOi8vcGFwZXJjbHViLmxvY2FsOjgwODAnLFxuICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ3Rva2VuJyxcbiAgICAgICAgICBzY29wZTogJ29wZW5pZCBwcm9maWxlJ1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZW1haWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtZW1haWwnKS52YWx1ZVxuICAgICAgICB3ZWJBdXRoLnBhc3N3b3JkbGVzc1N0YXJ0KHtcbiAgICAgICAgICBjb25uZWN0aW9uOiAnZW1haWwnLFxuICAgICAgICAgIHNlbmQ6ICdsaW5rJyxcbiAgICAgICAgICBlbWFpbDogZW1haWxcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyLHJlcykge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdlcnJvciBzZW5kaW5nIGVtYWlsOiAnKyBlcnIuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhbGVydCgnRW1haWwgc2VudCEnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuPC9zY3JpcHQ+Il0sInNvdXJjZVJvb3QiOiIifQ==