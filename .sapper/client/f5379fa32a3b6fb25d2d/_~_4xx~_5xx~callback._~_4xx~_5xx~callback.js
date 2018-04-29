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
	var p, text_value = state.user.nickname, text;

	return {
		c: function create() {
			p = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("p");
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])(text_value);
		},

		l: function claim(nodes) {
			p = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "P", {}, false);
			var p_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(p);

			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(p_nodes, text_value);
			p_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
		},

		m: function mount(target, anchor) {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(p, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text, p);
		},

		p: function update(changed, state) {
			if ((changed.user) && text_value !== (text_value = state.user.nickname)) {
				text.data = text_value;
			}
		},

		u: function unmount() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(p);
		},

		d: svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["noop"]
	};
}

// (3:0) {{else}}
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvc3ZlbHRlLWRldi1oZWxwZXIvbGliL3Byb3h5LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9zdmVsdGUtZGV2LWhlbHBlci9saWIvcmVnaXN0cnkuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS1sb2FkZXIvbGliL2hvdC1hcGkuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS9zaGFyZWQuanMiLCJ3ZWJwYWNrOi8vLy4vcm91dGVzL19jb21wb25lbnRzL0xheW91dC5odG1sIiwid2VicGFjazovLy8uL3JvdXRlcy9fY29tcG9uZW50cy9Mb2dpbi5odG1sIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsYUFBYSxpQkFBaUI7QUFDOUI7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR1E7O0FBRVI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsT0FBTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOzs7QUFHQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBLE9BQU87O0FBRVA7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUzs7QUFFVDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7QUM1TkE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMOztBQUVBOzs7QUFHQTtBQUNBOztBQUVBLGtGOzs7Ozs7Ozs7Ozs7Ozs7OztBQ3RDNkQ7O0FBRTdEO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsRUFBRTs7QUFFRjtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxFQUFFO0FBQ0YsQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN2Q0E7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7QUFD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YTMyYTNiNmZiMjVkMmQvX35fNHh4fl81eHh+Y2FsbGJhY2suX35fNHh4fl81eHh+Y2FsbGJhY2suanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVnaXN0cnkgZnJvbSAnLi9yZWdpc3RyeSc7XG5cbmxldCBwcm94eU9wdGlvbnMgPSB7XG4gIG5vUHJlc2VydmVTdGF0ZTogZmFsc2Vcbn07XG5cbmZ1bmN0aW9uIGNhcGl0YWxpemUoc3RyKSB7XG4gIHJldHVybiBzdHJbMF0udG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKTtcbn1cblxuZnVuY3Rpb24gZ2V0RGVidWdOYW1lKGlkKSB7XG4gIGNvbnN0IHBvc2l4SUQgPSBpZC5yZXBsYWNlKC9bL1xcXFxdL2csICcvJyk7XG4gIGNvbnN0IG5hbWUgPSBwb3NpeElELnNwbGl0KCcvJykucG9wKCkuc3BsaXQoJy4nKS5zaGlmdCgpO1xuICByZXR1cm4gYDwke2NhcGl0YWxpemUobmFtZSl9PmA7XG59XG5cbmZ1bmN0aW9uIGdyb3VwU3RhcnQobXNnKSB7XG4gIGNvbnNvbGUuZ3JvdXAgJiYgY29uc29sZS5ncm91cChtc2cpO1xufVxuXG5mdW5jdGlvbiBncm91cEVuZCgpIHtcbiAgY29uc29sZS5ncm91cEVuZCAmJiBjb25zb2xlLmdyb3VwRW5kKCk7XG59XG5cblxuZXhwb3J0IHsgUmVnaXN0cnkgfTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZShfb3B0aW9ucykge1xuICBwcm94eU9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHByb3h5T3B0aW9ucywgX29wdGlvbnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q29uZmlnKCkge1xuICByZXR1cm4gcHJveHlPcHRpb25zO1xufVxuXG4vKlxuY3JlYXRlcyBhIHByb3h5IG9iamVjdCB0aGF0XG5kZWNvcmF0ZXMgdGhlIG9yaWdpbmFsIGNvbXBvbmVudCB3aXRoIHRyYWNrZXJzXG5hbmQgZW5zdXJlcyByZXNvbHV0aW9uIHRvIHRoZVxubGF0ZXN0IHZlcnNpb24gb2YgdGhlIGNvbXBvbmVudFxuKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcm94eShpZCkge1xuICBjb25zdCBoYW5kbGVkTWV0aG9kcyA9ICdfbW91bnQsX3VubW91bnQsZGVzdHJveScuc3BsaXQoJywnKTtcbiAgY29uc3QgZm9yd2FyZGVkTWV0aG9kcyA9ICdnZXQsZmlyZSxvYnNlcnZlLG9uLHNldCx0ZWFyZG93bixfcmVjb21wdXRlLF9zZXQnLnNwbGl0KCcsJyk7XG4gIGNsYXNzIHByb3h5Q29tcG9uZW50IHtcblxuICAgIGNvbnN0cnVjdG9yKG9wdGlvbnMpIHtcbiAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgIHRoaXMuX19tb3VudHBvaW50ID0gbnVsbDtcbiAgICAgIHRoaXMuX19hbmNob3IgPSBudWxsO1xuICAgICAgdGhpcy5fX2luc2VydGlvblBvaW50ID0gbnVsbDtcbiAgICAgIHRoaXMuX19tb3VudGVkID0gZmFsc2U7XG5cbiAgICAgIHRoaXMuX3JlZ2lzdGVyKG9wdGlvbnMpO1xuXG4gICAgICB0aGlzLl9kZWJ1Z05hbWUgPSB0aGlzLnByb3h5VGFyZ2V0Ll9kZWJ1Z05hbWUgfHwgZ2V0RGVidWdOYW1lKHRoaXMuaWQpO1xuXG4gICAgICAvLyAtLS0tIGZvcndhcmRlZCBtZXRob2RzIC0tLS1cbiAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgZm9yd2FyZGVkTWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICBzZWxmW21ldGhvZF0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gc2VsZi5wcm94eVRhcmdldFttZXRob2RdLmFwcGx5KHNlbGYucHJveHlUYXJnZXQsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICAgIC8vIC0tLS0gRU5EIGZvcndhcmRlZCBtZXRob2RzIC0tLS1cbiAgICB9XG5cbiAgICAvLyAtLS0tIGF1Z21lbnRlZCBtZXRob2RzIC0tLS1cblxuICAgIF9tb3VudCh0YXJnZXQsIGFuY2hvciwgaW5zZXJ0aW9uUG9pbnQpIHtcblxuICAgICAgdGhpcy5fX21vdW50cG9pbnQgPSB0YXJnZXQ7XG4gICAgICB0aGlzLl9fYW5jaG9yID0gYW5jaG9yO1xuXG4gICAgICBpZiAoaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICAgICAgdGhpcy5fX2luc2VydGlvblBvaW50ID0gaW5zZXJ0aW9uUG9pbnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW5kZWZcbiAgICAgICAgdGhpcy5fX2luc2VydGlvblBvaW50ID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCh0aGlzLl9kZWJ1Z05hbWUpO1xuICAgICAgICB0YXJnZXQuaW5zZXJ0QmVmb3JlKHRoaXMuX19pbnNlcnRpb25Qb2ludCwgYW5jaG9yKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX2luc2VydGlvblBvaW50Ll9fY29tcG9uZW50X18gPSB0aGlzO1xuXG4gICAgICBhbmNob3IgPSB0aGlzLl9faW5zZXJ0aW9uUG9pbnQubmV4dFNpYmxpbmc7XG5cbiAgICAgIGlmICh0YXJnZXQubm9kZU5hbWUgPT0gJyNkb2N1bWVudC1mcmFnbWVudCcgJiYgaW5zZXJ0aW9uUG9pbnQpIHtcbiAgICAgICAgLy9oYW5kbGVzICM0IGJ5IGZvcmNpbmcgYSB0YXJnZXRcbiAgICAgICAgLy9pZiBvcmlnaW5hbCB0YXJnZXQgd2FzIGEgZG9jdW1lbnQgZnJhZ21lbnRcbiAgICAgICAgdGFyZ2V0ID0gdGhpcy5fX2luc2VydGlvblBvaW50LnBhcmVudE5vZGU7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX19tb3VudGVkID0gdHJ1ZTtcblxuICAgICAgcmV0dXJuIHRoaXMucHJveHlUYXJnZXQuX21vdW50KHRhcmdldCwgYW5jaG9yKTtcbiAgICB9XG5cbiAgICBkZXN0cm95KGRldGFjaCwga2VlcEluc2VydGlvblBvaW50KSB7XG5cbiAgICAgIFJlZ2lzdHJ5LmRlUmVnaXN0ZXJJbnN0YW5jZSh0aGlzKTtcblxuICAgICAgaWYgKCFrZWVwSW5zZXJ0aW9uUG9pbnQgJiYgdGhpcy5fX2luc2VydGlvblBvaW50KSB7XG4gICAgICAgIC8vZGVyZWYgZm9yIEdDIGJlZm9yZSByZW1vdmFsIG9mIG5vZGVcbiAgICAgICAgdGhpcy5fX2luc2VydGlvblBvaW50Ll9fY29tcG9uZW50X18gPSBudWxsO1xuICAgICAgICBjb25zdCBpcCA9IHRoaXMuX19pbnNlcnRpb25Qb2ludDtcbiAgICAgICAgaXAgJiYgaXAucGFyZW50Tm9kZSAmJiBpcC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlwKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnByb3h5VGFyZ2V0LmRlc3Ryb3koZGV0YWNoKTtcbiAgICB9XG5cbiAgICBfdW5tb3VudCgpIHtcbiAgICAgIHRoaXMuX19tb3VudGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gdGhpcy5wcm94eVRhcmdldC5fdW5tb3VudC5hcHBseSh0aGlzLnByb3h5VGFyZ2V0LCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIC8vIC0tLS0gRU5EIGF1Z21lbnRlZCBtZXRob2RzIC0tLS1cblxuXG4gICAgLy8gLS0tLSBleHRyYSBtZXRob2RzIC0tLS1cblxuICAgIF9yZWdpc3RlcihvcHRpb25zKSB7XG5cbiAgICAgIGNvbnN0IHJlY29yZCA9IFJlZ2lzdHJ5LmdldCh0aGlzLmlkKTtcblxuICAgICAgdHJ5IHtcblxuICAgICAgICAvL3Jlc29sdmUgdG8gbGF0ZXN0IHZlcnNpb24gb2YgY29tcG9uZW50XG4gICAgICAgIHRoaXMucHJveHlUYXJnZXQgPSBuZXcgcmVjb3JkLmNvbXBvbmVudChvcHRpb25zKTtcblxuICAgICAgfSBjYXRjaCAoZSkge1xuXG4gICAgICAgIGNvbnN0IHJiID0gcmVjb3JkLnJvbGxiYWNrO1xuXG4gICAgICAgIGlmICghcmIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgIGNvbnNvbGUud2FybignRnVsbCByZWxvYWQgcmVxdWlyZWQuIFBsZWFzZSBmaXggY29tcG9uZW50IGVycm9ycyBhbmQgcmVsb2FkIHRoZSB3aG9sZSBwYWdlJyk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3JvdXBTdGFydCh0aGlzLl9kZWJ1Z05hbWUgKyAnIEVycm9ycycpO1xuXG4gICAgICAgIGNvbnNvbGUud2FybihlKTtcbiAgICAgICAgY29uc29sZS53YXJuKHRoaXMuX2RlYnVnTmFtZSArICcgY291bGQgbm90IGJlIGhvdC1sb2FkZWQgYmVjYXVzZSBpdCBoYXMgYW4gZXJyb3InKTtcblxuICAgICAgICAvL3Jlc29sdmUgdG8gcHJldmlvdXMgd29ya2luZyB2ZXJzaW9uIG9mIGNvbXBvbmVudFxuICAgICAgICB0aGlzLnByb3h5VGFyZ2V0ID0gbmV3IHJiKG9wdGlvbnMpO1xuICAgICAgICBjb25zb2xlLmluZm8oJyVjJyArIHRoaXMuX2RlYnVnTmFtZSArICcgcm9sbGVkIGJhY2sgdG8gcHJldmlvdXMgd29ya2luZyB2ZXJzaW9uJywgJ2NvbG9yOmdyZWVuJyk7XG5cbiAgICAgICAgLy9zZXQgbGF0ZXN0IHZlcnNpb24gYXMgdGhlIHJvbGxlZC1iYWNrIHZlcnNpb25cbiAgICAgICAgcmVjb3JkLmNvbXBvbmVudCA9IHJiO1xuXG4gICAgICAgIGdyb3VwRW5kKCk7XG5cbiAgICAgIH1cblxuICAgICAgUmVnaXN0cnkuc2V0KHRoaXMuaWQsIHJlY29yZCk7XG5cbiAgICAgIC8vcmVnaXN0ZXIgY3VycmVudCBpbnN0YW5jZSwgc28gdGhhdFxuICAgICAgLy93ZSBjYW4gcmUtcmVuZGVyIGl0IHdoZW4gcmVxdWlyZWRcbiAgICAgIFJlZ2lzdHJ5LnJlZ2lzdGVySW5zdGFuY2UodGhpcyk7XG5cbiAgICAgIC8vcHJveHkgY3VzdG9tIG1ldGhvZHNcbiAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgICAgbGV0IG1ldGhvZHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhPYmplY3QuZ2V0UHJvdG90eXBlT2Yoc2VsZi5wcm94eVRhcmdldCkpO1xuICAgICAgbWV0aG9kcy5mb3JFYWNoKGZ1bmN0aW9uKG1ldGhvZCkge1xuICAgICAgICBpZiAoIWhhbmRsZWRNZXRob2RzLmluY2x1ZGVzKG1ldGhvZCkgJiYgIWZvcndhcmRlZE1ldGhvZHMuaW5jbHVkZXMobWV0aG9kKSkge1xuICAgICAgICAgIHNlbGZbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYucHJveHlUYXJnZXRbbWV0aG9kXS5hcHBseShzZWxmLnByb3h5VGFyZ2V0LCBhcmd1bWVudHMpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyhyZSlleHBvc2UgcHJvcGVydGllcyB0aGF0IG1pZ2h0IGJlIHVzZWQgZnJvbSBvdXRzaWRlXG4gICAgICB0aGlzLnJlZnMgPSB0aGlzLnByb3h5VGFyZ2V0LnJlZnMgfHwge307XG4gICAgICB0aGlzLl9mcmFnbWVudCA9IHRoaXMucHJveHlUYXJnZXQuX2ZyYWdtZW50O1xuICAgICAgdGhpcy5fc2xvdHRlZCA9IHRoaXMucHJveHlUYXJnZXQuX3Nsb3R0ZWQ7XG4gICAgICB0aGlzLnJvb3QgPSB0aGlzLnByb3h5VGFyZ2V0LnJvb3Q7XG4gICAgICB0aGlzLnN0b3JlID0gdGhpcy5wcm94eVRhcmdldC5zdG9yZSB8fCBudWxsO1xuICAgIH1cblxuICAgIF9yZXJlbmRlcigpIHtcbiAgICAgIGNvbnN0IG1vdW50cG9pbnQgPSB0aGlzLl9fbW91bnRwb2ludCB8fCBudWxsLFxuICAgICAgICBhbmNob3IgPSB0aGlzLl9fYW5jaG9yIHx8IG51bGwsXG4gICAgICAgIG9wdGlvbnMgPSB0aGlzLnByb3h5VGFyZ2V0Lm9wdGlvbnMsXG4gICAgICAgIG9sZHN0YXRlID0gdGhpcy5nZXQoKSxcbiAgICAgICAgaXNNb3VudGVkID0gdGhpcy5fX21vdW50ZWQsXG4gICAgICAgIGluc2VydGlvblBvaW50ID0gdGhpcy5fX2luc2VydGlvblBvaW50O1xuXG4gICAgICB0aGlzLmRlc3Ryb3kodHJ1ZSwgdHJ1ZSk7XG5cbiAgICAgIHRoaXMuX3JlZ2lzdGVyKG9wdGlvbnMpO1xuXG4gICAgICBpZiAobW91bnRwb2ludCAmJiBpc01vdW50ZWQpIHtcbiAgICAgICAgdGhpcy5wcm94eVRhcmdldC5fZnJhZ21lbnQuYygpO1xuICAgICAgICB0aGlzLl9tb3VudChtb3VudHBvaW50LCBhbmNob3IsIGluc2VydGlvblBvaW50KTtcblxuICAgICAgICAvL3ByZXNlcnZlIGxvY2FsIHN0YXRlICh1bmxlc3Mgbm9QcmVzZXJ2ZVN0YXRlIGlzIHRydWUpXG4gICAgICAgIGlmIChcbiAgICAgICAgICAhdGhpcy5wcm94eVRhcmdldC5jb25zdHJ1Y3Rvci5ub1ByZXNlcnZlU3RhdGVcbiAgICAgICAgICAmJiAhcHJveHlPcHRpb25zLm5vUHJlc2VydmVTdGF0ZSkge1xuICAgICAgICAgIHRoaXMuc2V0KG9sZHN0YXRlKTtcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgIC8vd2UgaGF2ZSB0byBjYWxsIC5zZXQoKSBoZXJlXG4gICAgICAgICAgLy9vdGhlcndpc2Ugb25jcmVhdGUgaXMgbm90IGZpcmVkXG4gICAgICAgICAgdGhpcy5zZXQodGhpcy5nZXQoKSk7XG5cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0gRU5EIGV4dHJhIG1ldGhvZHMgLS0tLVxuICB9XG5cbiAgLy9mb3J3YXJkIHN0YXRpYyBwcm9wZXJ0aWVzIGFuZCBtZXRob2RzXG4gIGNvbnN0IG9yaWdpbmFsQ29tcG9uZW50ID0gUmVnaXN0cnkuZ2V0KGlkKS5jb21wb25lbnQ7XG4gIGZvciAobGV0IGtleSBpbiBvcmlnaW5hbENvbXBvbmVudCkge1xuICAgIHByb3h5Q29tcG9uZW50W2tleV0gPSBvcmlnaW5hbENvbXBvbmVudFtrZXldO1xuICB9XG5cbiAgcmV0dXJuIHByb3h5Q29tcG9uZW50O1xufVxuIiwiXG5jbGFzcyByZWdpc3RyeSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2l0ZW1zID0ge307XG4gIH1cblxuICBzZXQoaywgdikge1xuICAgIHRoaXMuX2l0ZW1zW2tdID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICByb2xsYmFjazogbnVsbCxcbiAgICAgIGNvbXBvbmVudDogbnVsbCxcbiAgICAgIGluc3RhbmNlczogW11cbiAgICB9LCB2KTtcbiAgfVxuXG4gIGdldChrKSB7XG4gICAgcmV0dXJuIGsgPyB0aGlzLl9pdGVtc1trXSB8fCB1bmRlZmluZWQgOiB0aGlzLl9pdGVtcztcbiAgfVxuXG4gIHJlZ2lzdGVySW5zdGFuY2UoaW5zdGFuY2UpIHtcbiAgICBjb25zdCBpZCA9IGluc3RhbmNlLmlkO1xuICAgIHRoaXMuX2l0ZW1zW2lkXSAmJiB0aGlzLl9pdGVtc1tpZF0uaW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpO1xuICB9XG5cbiAgZGVSZWdpc3Rlckluc3RhbmNlKGluc3RhbmNlKSB7XG4gICAgY29uc3QgaWQgPSBpbnN0YW5jZS5pZDtcbiAgICB0aGlzLl9pdGVtc1tpZF0gJiYgdGhpcy5faXRlbXNbaWRdLmluc3RhbmNlcy5mb3JFYWNoKGZ1bmN0aW9uKGNvbXAsIGlkeCwgaW5zdGFuY2VzKSB7XG4gICAgICBpZiAoY29tcCA9PSBpbnN0YW5jZSkge1xuICAgICAgICBpbnN0YW5jZXMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxufVxuXG5cbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuY29uc3QgY29tcG9uZW50UmVnaXN0cnkgPSAod2luZG93Ll9fU1ZFTFRFX1JFR0lTVFJZX18gPSBuZXcgcmVnaXN0cnkpO1xuXG5leHBvcnQgZGVmYXVsdCBjb21wb25lbnRSZWdpc3RyeTsiLCJpbXBvcnQgeyBSZWdpc3RyeSwgY29uZmlndXJlIGFzIGNvbmZpZ3VyZVByb3h5LCBjcmVhdGVQcm94eSB9IGZyb20gJ3N2ZWx0ZS1kZXYtaGVscGVyJztcblxubGV0IGhvdE9wdGlvbnMgPSB7XG5cdG5vUHJlc2VydmVTdGF0ZTogZmFsc2Vcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmUob3B0aW9ucykge1xuXHRob3RPcHRpb25zID0gT2JqZWN0LmFzc2lnbihob3RPcHRpb25zLCBvcHRpb25zKTtcblx0Y29uZmlndXJlUHJveHkoaG90T3B0aW9ucyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlcihpZCwgY29tcG9uZW50KSB7XG5cblx0Ly9zdG9yZSBvcmlnaW5hbCBjb21wb25lbnQgaW4gcmVnaXN0cnlcblx0UmVnaXN0cnkuc2V0KGlkLCB7XG5cdFx0cm9sbGJhY2s6IG51bGwsXG5cdFx0Y29tcG9uZW50LFxuXHRcdGluc3RhbmNlczogW11cblx0fSk7XG5cblx0cmV0dXJuIGNyZWF0ZVByb3h5KGlkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbG9hZChpZCwgY29tcG9uZW50KSB7XG5cblx0Y29uc3QgcmVjb3JkID0gUmVnaXN0cnkuZ2V0KGlkKTtcblxuXHQvL2tlZXAgcmVmZXJlbmNlIHRvIHByZXZpb3VzIHZlcnNpb24gdG8gZW5hYmxlIHJvbGxiYWNrXG5cdHJlY29yZC5yb2xsYmFjayA9IHJlY29yZC5jb21wb25lbnQ7XG5cblx0Ly9yZXBsYWNlIGNvbXBvbmVudCBpbiByZWdpc3RyeSB3aXRoIG5ld2x5IGxvYWRlZCBjb21wb25lbnRcblx0cmVjb3JkLmNvbXBvbmVudCA9IGNvbXBvbmVudDtcblxuXHRSZWdpc3RyeS5zZXQoaWQsIHJlY29yZCk7XG5cblx0Ly9yZS1yZW5kZXIgdGhlIHByb3hpZXNcblx0cmVjb3JkLmluc3RhbmNlcy5zbGljZSgpLmZvckVhY2goZnVuY3Rpb24oaW5zdGFuY2UpIHtcblx0XHRpbnN0YW5jZSAmJiBpbnN0YW5jZS5fcmVyZW5kZXIoKTtcblx0fSk7XG59IiwiZnVuY3Rpb24gbm9vcCgpIHt9XG5cbmZ1bmN0aW9uIGFzc2lnbih0YXJnZXQpIHtcblx0dmFyIGssXG5cdFx0c291cmNlLFxuXHRcdGkgPSAxLFxuXHRcdGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRzb3VyY2UgPSBhcmd1bWVudHNbaV07XG5cdFx0Zm9yIChrIGluIHNvdXJjZSkgdGFyZ2V0W2tdID0gc291cmNlW2tdO1xuXHR9XG5cblx0cmV0dXJuIHRhcmdldDtcbn1cblxuZnVuY3Rpb24gYXBwZW5kTm9kZShub2RlLCB0YXJnZXQpIHtcblx0dGFyZ2V0LmFwcGVuZENoaWxkKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBpbnNlcnROb2RlKG5vZGUsIHRhcmdldCwgYW5jaG9yKSB7XG5cdHRhcmdldC5pbnNlcnRCZWZvcmUobm9kZSwgYW5jaG9yKTtcbn1cblxuZnVuY3Rpb24gZGV0YWNoTm9kZShub2RlKSB7XG5cdG5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChub2RlKTtcbn1cblxuZnVuY3Rpb24gZGV0YWNoQmV0d2VlbihiZWZvcmUsIGFmdGVyKSB7XG5cdHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcgJiYgYmVmb3JlLm5leHRTaWJsaW5nICE9PSBhZnRlcikge1xuXHRcdGJlZm9yZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJlZm9yZS5uZXh0U2libGluZyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZGV0YWNoQmVmb3JlKGFmdGVyKSB7XG5cdHdoaWxlIChhZnRlci5wcmV2aW91c1NpYmxpbmcpIHtcblx0XHRhZnRlci5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGFmdGVyLnByZXZpb3VzU2libGluZyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZGV0YWNoQWZ0ZXIoYmVmb3JlKSB7XG5cdHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHtcblx0XHRiZWZvcmUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChiZWZvcmUubmV4dFNpYmxpbmcpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlaW5zZXJ0QmV0d2VlbihiZWZvcmUsIGFmdGVyLCB0YXJnZXQpIHtcblx0d2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG5cdFx0dGFyZ2V0LmFwcGVuZENoaWxkKGJlZm9yZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJlZm9yZS5uZXh0U2libGluZykpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHJlaW5zZXJ0Q2hpbGRyZW4ocGFyZW50LCB0YXJnZXQpIHtcblx0d2hpbGUgKHBhcmVudC5maXJzdENoaWxkKSB0YXJnZXQuYXBwZW5kQ2hpbGQocGFyZW50LmZpcnN0Q2hpbGQpO1xufVxuXG5mdW5jdGlvbiByZWluc2VydEFmdGVyKGJlZm9yZSwgdGFyZ2V0KSB7XG5cdHdoaWxlIChiZWZvcmUubmV4dFNpYmxpbmcpIHRhcmdldC5hcHBlbmRDaGlsZChiZWZvcmUubmV4dFNpYmxpbmcpO1xufVxuXG5mdW5jdGlvbiByZWluc2VydEJlZm9yZShhZnRlciwgdGFyZ2V0KSB7XG5cdHZhciBwYXJlbnQgPSBhZnRlci5wYXJlbnROb2RlO1xuXHR3aGlsZSAocGFyZW50LmZpcnN0Q2hpbGQgIT09IGFmdGVyKSB0YXJnZXQuYXBwZW5kQ2hpbGQocGFyZW50LmZpcnN0Q2hpbGQpO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95RWFjaChpdGVyYXRpb25zKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgaXRlcmF0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGlmIChpdGVyYXRpb25zW2ldKSBpdGVyYXRpb25zW2ldLmQoKTtcblx0fVxufVxuXG5mdW5jdGlvbiBjcmVhdGVGcmFnbWVudCgpIHtcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlRWxlbWVudChuYW1lKSB7XG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVTdmdFbGVtZW50KG5hbWUpIHtcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUygnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLCBuYW1lKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVGV4dChkYXRhKSB7XG5cdHJldHVybiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlQ29tbWVudCgpIHtcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZUNvbW1lbnQoJycpO1xufVxuXG5mdW5jdGlvbiBhZGRMaXN0ZW5lcihub2RlLCBldmVudCwgaGFuZGxlcikge1xuXHRub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gcmVtb3ZlTGlzdGVuZXIobm9kZSwgZXZlbnQsIGhhbmRsZXIpIHtcblx0bm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBoYW5kbGVyLCBmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIHNldEF0dHJpYnV0ZShub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG5cdG5vZGUuc2V0QXR0cmlidXRlKGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBzZXRYbGlua0F0dHJpYnV0ZShub2RlLCBhdHRyaWJ1dGUsIHZhbHVlKSB7XG5cdG5vZGUuc2V0QXR0cmlidXRlTlMoJ2h0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsnLCBhdHRyaWJ1dGUsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0QmluZGluZ0dyb3VwVmFsdWUoZ3JvdXApIHtcblx0dmFyIHZhbHVlID0gW107XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXAubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRpZiAoZ3JvdXBbaV0uY2hlY2tlZCkgdmFsdWUucHVzaChncm91cFtpXS5fX3ZhbHVlKTtcblx0fVxuXHRyZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRvTnVtYmVyKHZhbHVlKSB7XG5cdHJldHVybiB2YWx1ZSA9PT0gJycgPyB1bmRlZmluZWQgOiArdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRpbWVSYW5nZXNUb0FycmF5KHJhbmdlcykge1xuXHR2YXIgYXJyYXkgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRhcnJheS5wdXNoKHsgc3RhcnQ6IHJhbmdlcy5zdGFydChpKSwgZW5kOiByYW5nZXMuZW5kKGkpIH0pO1xuXHR9XG5cdHJldHVybiBhcnJheTtcbn1cblxuZnVuY3Rpb24gY2hpbGRyZW4gKGVsZW1lbnQpIHtcblx0cmV0dXJuIEFycmF5LmZyb20oZWxlbWVudC5jaGlsZE5vZGVzKTtcbn1cblxuZnVuY3Rpb24gY2xhaW1FbGVtZW50IChub2RlcywgbmFtZSwgYXR0cmlidXRlcywgc3ZnKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHR2YXIgbm9kZSA9IG5vZGVzW2ldO1xuXHRcdGlmIChub2RlLm5vZGVOYW1lID09PSBuYW1lKSB7XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IG5vZGUuYXR0cmlidXRlcy5sZW5ndGg7IGogKz0gMSkge1xuXHRcdFx0XHR2YXIgYXR0cmlidXRlID0gbm9kZS5hdHRyaWJ1dGVzW2pdO1xuXHRcdFx0XHRpZiAoIWF0dHJpYnV0ZXNbYXR0cmlidXRlLm5hbWVdKSBub2RlLnJlbW92ZUF0dHJpYnV0ZShhdHRyaWJ1dGUubmFtZSk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdOyAvLyBUT0RPIHN0cmlwIHVud2FudGVkIGF0dHJpYnV0ZXNcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gc3ZnID8gY3JlYXRlU3ZnRWxlbWVudChuYW1lKSA6IGNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNsYWltVGV4dCAobm9kZXMsIGRhdGEpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdHZhciBub2RlID0gbm9kZXNbaV07XG5cdFx0aWYgKG5vZGUubm9kZVR5cGUgPT09IDMpIHtcblx0XHRcdG5vZGUuZGF0YSA9IGRhdGE7XG5cdFx0XHRyZXR1cm4gbm9kZXMuc3BsaWNlKGksIDEpWzBdO1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBjcmVhdGVUZXh0KGRhdGEpO1xufVxuXG5mdW5jdGlvbiBzZXRJbnB1dFR5cGUoaW5wdXQsIHR5cGUpIHtcblx0dHJ5IHtcblx0XHRpbnB1dC50eXBlID0gdHlwZTtcblx0fSBjYXRjaCAoZSkge31cbn1cblxuZnVuY3Rpb24gc2V0U3R5bGUobm9kZSwga2V5LCB2YWx1ZSkge1xuXHRub2RlLnN0eWxlLnNldFByb3BlcnR5KGtleSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBzZWxlY3RPcHRpb24oc2VsZWN0LCB2YWx1ZSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHNlbGVjdC5vcHRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFyIG9wdGlvbiA9IHNlbGVjdC5vcHRpb25zW2ldO1xuXG5cdFx0aWYgKG9wdGlvbi5fX3ZhbHVlID09PSB2YWx1ZSkge1xuXHRcdFx0b3B0aW9uLnNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gc2VsZWN0T3B0aW9ucyhzZWxlY3QsIHZhbHVlKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHR2YXIgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG5cdFx0b3B0aW9uLnNlbGVjdGVkID0gfnZhbHVlLmluZGV4T2Yob3B0aW9uLl9fdmFsdWUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNlbGVjdFZhbHVlKHNlbGVjdCkge1xuXHR2YXIgc2VsZWN0ZWRPcHRpb24gPSBzZWxlY3QucXVlcnlTZWxlY3RvcignOmNoZWNrZWQnKSB8fCBzZWxlY3Qub3B0aW9uc1swXTtcblx0cmV0dXJuIHNlbGVjdGVkT3B0aW9uICYmIHNlbGVjdGVkT3B0aW9uLl9fdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdE11bHRpcGxlVmFsdWUoc2VsZWN0KSB7XG5cdHJldHVybiBbXS5tYXAuY2FsbChzZWxlY3QucXVlcnlTZWxlY3RvckFsbCgnOmNoZWNrZWQnKSwgZnVuY3Rpb24ob3B0aW9uKSB7XG5cdFx0cmV0dXJuIG9wdGlvbi5fX3ZhbHVlO1xuXHR9KTtcbn1cblxuZnVuY3Rpb24gbGluZWFyKHQpIHtcblx0cmV0dXJuIHQ7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlUnVsZShcblx0YSxcblx0Yixcblx0ZGVsdGEsXG5cdGR1cmF0aW9uLFxuXHRlYXNlLFxuXHRmblxuKSB7XG5cdHZhciBrZXlmcmFtZXMgPSAne1xcbic7XG5cblx0Zm9yICh2YXIgcCA9IDA7IHAgPD0gMTsgcCArPSAxNi42NjYgLyBkdXJhdGlvbikge1xuXHRcdHZhciB0ID0gYSArIGRlbHRhICogZWFzZShwKTtcblx0XHRrZXlmcmFtZXMgKz0gcCAqIDEwMCArICcleycgKyBmbih0KSArICd9XFxuJztcblx0fVxuXG5cdHJldHVybiBrZXlmcmFtZXMgKyAnMTAwJSB7JyArIGZuKGIpICsgJ31cXG59Jztcbn1cblxuLy8gaHR0cHM6Ly9naXRodWIuY29tL2Rhcmtza3lhcHAvc3RyaW5nLWhhc2gvYmxvYi9tYXN0ZXIvaW5kZXguanNcbmZ1bmN0aW9uIGhhc2goc3RyKSB7XG5cdHZhciBoYXNoID0gNTM4MTtcblx0dmFyIGkgPSBzdHIubGVuZ3RoO1xuXG5cdHdoaWxlIChpLS0pIGhhc2ggPSAoKGhhc2ggPDwgNSkgLSBoYXNoKSBeIHN0ci5jaGFyQ29kZUF0KGkpO1xuXHRyZXR1cm4gaGFzaCA+Pj4gMDtcbn1cblxuZnVuY3Rpb24gd3JhcFRyYW5zaXRpb24oY29tcG9uZW50LCBub2RlLCBmbiwgcGFyYW1zLCBpbnRybywgb3V0Z3JvdXApIHtcblx0dmFyIG9iaiA9IGZuKG5vZGUsIHBhcmFtcyk7XG5cdHZhciBkdXJhdGlvbiA9IG9iai5kdXJhdGlvbiB8fCAzMDA7XG5cdHZhciBlYXNlID0gb2JqLmVhc2luZyB8fCBsaW5lYXI7XG5cdHZhciBjc3NUZXh0O1xuXG5cdC8vIFRPRE8gc2hhcmUgPHN0eWxlPiB0YWcgYmV0d2VlbiBhbGwgdHJhbnNpdGlvbnM/XG5cdGlmIChvYmouY3NzICYmICF0cmFuc2l0aW9uTWFuYWdlci5zdHlsZXNoZWV0KSB7XG5cdFx0dmFyIHN0eWxlID0gY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcblx0XHRkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHN0eWxlKTtcblx0XHR0cmFuc2l0aW9uTWFuYWdlci5zdHlsZXNoZWV0ID0gc3R5bGUuc2hlZXQ7XG5cdH1cblxuXHRpZiAoaW50cm8pIHtcblx0XHRpZiAob2JqLmNzcyAmJiBvYmouZGVsYXkpIHtcblx0XHRcdGNzc1RleHQgPSBub2RlLnN0eWxlLmNzc1RleHQ7XG5cdFx0XHRub2RlLnN0eWxlLmNzc1RleHQgKz0gb2JqLmNzcygwKTtcblx0XHR9XG5cblx0XHRpZiAob2JqLnRpY2spIG9iai50aWNrKDApO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHR0OiBpbnRybyA/IDAgOiAxLFxuXHRcdHJ1bm5pbmc6IGZhbHNlLFxuXHRcdHByb2dyYW06IG51bGwsXG5cdFx0cGVuZGluZzogbnVsbCxcblx0XHRydW46IGZ1bmN0aW9uKGludHJvLCBjYWxsYmFjaykge1xuXHRcdFx0dmFyIHByb2dyYW0gPSB7XG5cdFx0XHRcdHN0YXJ0OiB3aW5kb3cucGVyZm9ybWFuY2Uubm93KCkgKyAob2JqLmRlbGF5IHx8IDApLFxuXHRcdFx0XHRpbnRybzogaW50cm8sXG5cdFx0XHRcdGNhbGxiYWNrOiBjYWxsYmFja1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKG9iai5kZWxheSkge1xuXHRcdFx0XHR0aGlzLnBlbmRpbmcgPSBwcm9ncmFtO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5zdGFydChwcm9ncmFtKTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCF0aGlzLnJ1bm5pbmcpIHtcblx0XHRcdFx0dGhpcy5ydW5uaW5nID0gdHJ1ZTtcblx0XHRcdFx0dHJhbnNpdGlvbk1hbmFnZXIuYWRkKHRoaXMpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0c3RhcnQ6IGZ1bmN0aW9uKHByb2dyYW0pIHtcblx0XHRcdGNvbXBvbmVudC5maXJlKHByb2dyYW0uaW50cm8gPyAnaW50cm8uc3RhcnQnIDogJ291dHJvLnN0YXJ0JywgeyBub2RlOiBub2RlIH0pO1xuXG5cdFx0XHRwcm9ncmFtLmEgPSB0aGlzLnQ7XG5cdFx0XHRwcm9ncmFtLmIgPSBwcm9ncmFtLmludHJvID8gMSA6IDA7XG5cdFx0XHRwcm9ncmFtLmRlbHRhID0gcHJvZ3JhbS5iIC0gcHJvZ3JhbS5hO1xuXHRcdFx0cHJvZ3JhbS5kdXJhdGlvbiA9IGR1cmF0aW9uICogTWF0aC5hYnMocHJvZ3JhbS5iIC0gcHJvZ3JhbS5hKTtcblx0XHRcdHByb2dyYW0uZW5kID0gcHJvZ3JhbS5zdGFydCArIHByb2dyYW0uZHVyYXRpb247XG5cblx0XHRcdGlmIChvYmouY3NzKSB7XG5cdFx0XHRcdGlmIChvYmouZGVsYXkpIG5vZGUuc3R5bGUuY3NzVGV4dCA9IGNzc1RleHQ7XG5cblx0XHRcdFx0cHJvZ3JhbS5ydWxlID0gZ2VuZXJhdGVSdWxlKFxuXHRcdFx0XHRcdHByb2dyYW0uYSxcblx0XHRcdFx0XHRwcm9ncmFtLmIsXG5cdFx0XHRcdFx0cHJvZ3JhbS5kZWx0YSxcblx0XHRcdFx0XHRwcm9ncmFtLmR1cmF0aW9uLFxuXHRcdFx0XHRcdGVhc2UsXG5cdFx0XHRcdFx0b2JqLmNzc1xuXHRcdFx0XHQpO1xuXG5cdFx0XHRcdHRyYW5zaXRpb25NYW5hZ2VyLmFkZFJ1bGUocHJvZ3JhbS5ydWxlLCBwcm9ncmFtLm5hbWUgPSAnX19zdmVsdGVfJyArIGhhc2gocHJvZ3JhbS5ydWxlKSk7XG5cblx0XHRcdFx0bm9kZS5zdHlsZS5hbmltYXRpb24gPSAobm9kZS5zdHlsZS5hbmltYXRpb24gfHwgJycpXG5cdFx0XHRcdFx0LnNwbGl0KCcsICcpXG5cdFx0XHRcdFx0LmZpbHRlcihmdW5jdGlvbihhbmltKSB7XG5cdFx0XHRcdFx0XHQvLyB3aGVuIGludHJvaW5nLCBkaXNjYXJkIG9sZCBhbmltYXRpb25zIGlmIHRoZXJlIGFyZSBhbnlcblx0XHRcdFx0XHRcdHJldHVybiBhbmltICYmIChwcm9ncmFtLmRlbHRhIDwgMCB8fCAhL19fc3ZlbHRlLy50ZXN0KGFuaW0pKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5jb25jYXQocHJvZ3JhbS5uYW1lICsgJyAnICsgZHVyYXRpb24gKyAnbXMgbGluZWFyIDEgZm9yd2FyZHMnKVxuXHRcdFx0XHRcdC5qb2luKCcsICcpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnByb2dyYW0gPSBwcm9ncmFtO1xuXHRcdFx0dGhpcy5wZW5kaW5nID0gbnVsbDtcblx0XHR9LFxuXHRcdHVwZGF0ZTogZnVuY3Rpb24obm93KSB7XG5cdFx0XHR2YXIgcHJvZ3JhbSA9IHRoaXMucHJvZ3JhbTtcblx0XHRcdGlmICghcHJvZ3JhbSkgcmV0dXJuO1xuXG5cdFx0XHR2YXIgcCA9IG5vdyAtIHByb2dyYW0uc3RhcnQ7XG5cdFx0XHR0aGlzLnQgPSBwcm9ncmFtLmEgKyBwcm9ncmFtLmRlbHRhICogZWFzZShwIC8gcHJvZ3JhbS5kdXJhdGlvbik7XG5cdFx0XHRpZiAob2JqLnRpY2spIG9iai50aWNrKHRoaXMudCk7XG5cdFx0fSxcblx0XHRkb25lOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBwcm9ncmFtID0gdGhpcy5wcm9ncmFtO1xuXHRcdFx0dGhpcy50ID0gcHJvZ3JhbS5iO1xuXHRcdFx0aWYgKG9iai50aWNrKSBvYmoudGljayh0aGlzLnQpO1xuXHRcdFx0aWYgKG9iai5jc3MpIHRyYW5zaXRpb25NYW5hZ2VyLmRlbGV0ZVJ1bGUobm9kZSwgcHJvZ3JhbS5uYW1lKTtcblx0XHRcdHByb2dyYW0uY2FsbGJhY2soKTtcblx0XHRcdHByb2dyYW0gPSBudWxsO1xuXHRcdFx0dGhpcy5ydW5uaW5nID0gISF0aGlzLnBlbmRpbmc7XG5cdFx0fSxcblx0XHRhYm9ydDogZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAob2JqLnRpY2spIG9iai50aWNrKDEpO1xuXHRcdFx0aWYgKG9iai5jc3MpIHRyYW5zaXRpb25NYW5hZ2VyLmRlbGV0ZVJ1bGUobm9kZSwgdGhpcy5wcm9ncmFtLm5hbWUpO1xuXHRcdFx0dGhpcy5wcm9ncmFtID0gdGhpcy5wZW5kaW5nID0gbnVsbDtcblx0XHRcdHRoaXMucnVubmluZyA9IGZhbHNlO1xuXHRcdH1cblx0fTtcbn1cblxudmFyIHRyYW5zaXRpb25NYW5hZ2VyID0ge1xuXHRydW5uaW5nOiBmYWxzZSxcblx0dHJhbnNpdGlvbnM6IFtdLFxuXHRib3VuZDogbnVsbCxcblx0c3R5bGVzaGVldDogbnVsbCxcblx0YWN0aXZlUnVsZXM6IHt9LFxuXG5cdGFkZDogZnVuY3Rpb24odHJhbnNpdGlvbikge1xuXHRcdHRoaXMudHJhbnNpdGlvbnMucHVzaCh0cmFuc2l0aW9uKTtcblxuXHRcdGlmICghdGhpcy5ydW5uaW5nKSB7XG5cdFx0XHR0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuXHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuYm91bmQgfHwgKHRoaXMuYm91bmQgPSB0aGlzLm5leHQuYmluZCh0aGlzKSkpO1xuXHRcdH1cblx0fSxcblxuXHRhZGRSdWxlOiBmdW5jdGlvbihydWxlLCBuYW1lKSB7XG5cdFx0aWYgKCF0aGlzLmFjdGl2ZVJ1bGVzW25hbWVdKSB7XG5cdFx0XHR0aGlzLmFjdGl2ZVJ1bGVzW25hbWVdID0gdHJ1ZTtcblx0XHRcdHRoaXMuc3R5bGVzaGVldC5pbnNlcnRSdWxlKCdAa2V5ZnJhbWVzICcgKyBuYW1lICsgJyAnICsgcnVsZSwgdGhpcy5zdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XG5cdFx0fVxuXHR9LFxuXG5cdG5leHQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucnVubmluZyA9IGZhbHNlO1xuXG5cdFx0dmFyIG5vdyA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcblx0XHR2YXIgaSA9IHRoaXMudHJhbnNpdGlvbnMubGVuZ3RoO1xuXG5cdFx0d2hpbGUgKGktLSkge1xuXHRcdFx0dmFyIHRyYW5zaXRpb24gPSB0aGlzLnRyYW5zaXRpb25zW2ldO1xuXG5cdFx0XHRpZiAodHJhbnNpdGlvbi5wcm9ncmFtICYmIG5vdyA+PSB0cmFuc2l0aW9uLnByb2dyYW0uZW5kKSB7XG5cdFx0XHRcdHRyYW5zaXRpb24uZG9uZSgpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHJhbnNpdGlvbi5wZW5kaW5nICYmIG5vdyA+PSB0cmFuc2l0aW9uLnBlbmRpbmcuc3RhcnQpIHtcblx0XHRcdFx0dHJhbnNpdGlvbi5zdGFydCh0cmFuc2l0aW9uLnBlbmRpbmcpO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAodHJhbnNpdGlvbi5ydW5uaW5nKSB7XG5cdFx0XHRcdHRyYW5zaXRpb24udXBkYXRlKG5vdyk7XG5cdFx0XHRcdHRoaXMucnVubmluZyA9IHRydWU7XG5cdFx0XHR9IGVsc2UgaWYgKCF0cmFuc2l0aW9uLnBlbmRpbmcpIHtcblx0XHRcdFx0dGhpcy50cmFuc2l0aW9ucy5zcGxpY2UoaSwgMSk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMucnVubmluZykge1xuXHRcdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lKHRoaXMuYm91bmQpO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5zdHlsZXNoZWV0KSB7XG5cdFx0XHR2YXIgaSA9IHRoaXMuc3R5bGVzaGVldC5jc3NSdWxlcy5sZW5ndGg7XG5cdFx0XHR3aGlsZSAoaS0tKSB0aGlzLnN0eWxlc2hlZXQuZGVsZXRlUnVsZShpKTtcblx0XHRcdHRoaXMuYWN0aXZlUnVsZXMgPSB7fTtcblx0XHR9XG5cdH0sXG5cblx0ZGVsZXRlUnVsZTogZnVuY3Rpb24obm9kZSwgbmFtZSkge1xuXHRcdG5vZGUuc3R5bGUuYW5pbWF0aW9uID0gbm9kZS5zdHlsZS5hbmltYXRpb25cblx0XHRcdC5zcGxpdCgnLCAnKVxuXHRcdFx0LmZpbHRlcihmdW5jdGlvbihhbmltKSB7XG5cdFx0XHRcdHJldHVybiBhbmltLnNsaWNlKDAsIG5hbWUubGVuZ3RoKSAhPT0gbmFtZTtcblx0XHRcdH0pXG5cdFx0XHQuam9pbignLCAnKTtcblx0fVxufTtcblxuZnVuY3Rpb24gYmxhbmtPYmplY3QoKSB7XG5cdHJldHVybiBPYmplY3QuY3JlYXRlKG51bGwpO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95KGRldGFjaCkge1xuXHR0aGlzLmRlc3Ryb3kgPSBub29wO1xuXHR0aGlzLmZpcmUoJ2Rlc3Ryb3knKTtcblx0dGhpcy5zZXQgPSB0aGlzLmdldCA9IG5vb3A7XG5cblx0aWYgKGRldGFjaCAhPT0gZmFsc2UpIHRoaXMuX2ZyYWdtZW50LnUoKTtcblx0dGhpcy5fZnJhZ21lbnQuZCgpO1xuXHR0aGlzLl9mcmFnbWVudCA9IHRoaXMuX3N0YXRlID0gbnVsbDtcbn1cblxuZnVuY3Rpb24gZGVzdHJveURldihkZXRhY2gpIHtcblx0ZGVzdHJveS5jYWxsKHRoaXMsIGRldGFjaCk7XG5cdHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuXHRcdGNvbnNvbGUud2FybignQ29tcG9uZW50IHdhcyBhbHJlYWR5IGRlc3Ryb3llZCcpO1xuXHR9O1xufVxuXG5mdW5jdGlvbiBfZGlmZmVycyhhLCBiKSB7XG5cdHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiIHx8ICgoYSAmJiB0eXBlb2YgYSA9PT0gJ29iamVjdCcpIHx8IHR5cGVvZiBhID09PSAnZnVuY3Rpb24nKTtcbn1cblxuZnVuY3Rpb24gX2RpZmZlcnNJbW11dGFibGUoYSwgYikge1xuXHRyZXR1cm4gYSAhPSBhID8gYiA9PSBiIDogYSAhPT0gYjtcbn1cblxuZnVuY3Rpb24gZGlzcGF0Y2hPYnNlcnZlcnMoY29tcG9uZW50LCBncm91cCwgY2hhbmdlZCwgbmV3U3RhdGUsIG9sZFN0YXRlKSB7XG5cdGZvciAodmFyIGtleSBpbiBncm91cCkge1xuXHRcdGlmICghY2hhbmdlZFtrZXldKSBjb250aW51ZTtcblxuXHRcdHZhciBuZXdWYWx1ZSA9IG5ld1N0YXRlW2tleV07XG5cdFx0dmFyIG9sZFZhbHVlID0gb2xkU3RhdGVba2V5XTtcblxuXHRcdHZhciBjYWxsYmFja3MgPSBncm91cFtrZXldO1xuXHRcdGlmICghY2FsbGJhY2tzKSBjb250aW51ZTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0XHR2YXIgY2FsbGJhY2sgPSBjYWxsYmFja3NbaV07XG5cdFx0XHRpZiAoY2FsbGJhY2suX19jYWxsaW5nKSBjb250aW51ZTtcblxuXHRcdFx0Y2FsbGJhY2suX19jYWxsaW5nID0gdHJ1ZTtcblx0XHRcdGNhbGxiYWNrLmNhbGwoY29tcG9uZW50LCBuZXdWYWx1ZSwgb2xkVmFsdWUpO1xuXHRcdFx0Y2FsbGJhY2suX19jYWxsaW5nID0gZmFsc2U7XG5cdFx0fVxuXHR9XG59XG5cbmZ1bmN0aW9uIGZpcmUoZXZlbnROYW1lLCBkYXRhKSB7XG5cdHZhciBoYW5kbGVycyA9XG5cdFx0ZXZlbnROYW1lIGluIHRoaXMuX2hhbmRsZXJzICYmIHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0uc2xpY2UoKTtcblx0aWYgKCFoYW5kbGVycykgcmV0dXJuO1xuXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgaGFuZGxlcnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRoYW5kbGVyc1tpXS5jYWxsKHRoaXMsIGRhdGEpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGdldChrZXkpIHtcblx0cmV0dXJuIGtleSA/IHRoaXMuX3N0YXRlW2tleV0gOiB0aGlzLl9zdGF0ZTtcbn1cblxuZnVuY3Rpb24gaW5pdChjb21wb25lbnQsIG9wdGlvbnMpIHtcblx0Y29tcG9uZW50Ll9vYnNlcnZlcnMgPSB7IHByZTogYmxhbmtPYmplY3QoKSwgcG9zdDogYmxhbmtPYmplY3QoKSB9O1xuXHRjb21wb25lbnQuX2hhbmRsZXJzID0gYmxhbmtPYmplY3QoKTtcblx0Y29tcG9uZW50Ll9iaW5kID0gb3B0aW9ucy5fYmluZDtcblxuXHRjb21wb25lbnQub3B0aW9ucyA9IG9wdGlvbnM7XG5cdGNvbXBvbmVudC5yb290ID0gb3B0aW9ucy5yb290IHx8IGNvbXBvbmVudDtcblx0Y29tcG9uZW50LnN0b3JlID0gY29tcG9uZW50LnJvb3Quc3RvcmUgfHwgb3B0aW9ucy5zdG9yZTtcbn1cblxuZnVuY3Rpb24gb2JzZXJ2ZShrZXksIGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdHZhciBncm91cCA9IG9wdGlvbnMgJiYgb3B0aW9ucy5kZWZlclxuXHRcdD8gdGhpcy5fb2JzZXJ2ZXJzLnBvc3Rcblx0XHQ6IHRoaXMuX29ic2VydmVycy5wcmU7XG5cblx0KGdyb3VwW2tleV0gfHwgKGdyb3VwW2tleV0gPSBbXSkpLnB1c2goY2FsbGJhY2spO1xuXG5cdGlmICghb3B0aW9ucyB8fCBvcHRpb25zLmluaXQgIT09IGZhbHNlKSB7XG5cdFx0Y2FsbGJhY2suX19jYWxsaW5nID0gdHJ1ZTtcblx0XHRjYWxsYmFjay5jYWxsKHRoaXMsIHRoaXMuX3N0YXRlW2tleV0pO1xuXHRcdGNhbGxiYWNrLl9fY2FsbGluZyA9IGZhbHNlO1xuXHR9XG5cblx0cmV0dXJuIHtcblx0XHRjYW5jZWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4ID0gZ3JvdXBba2V5XS5pbmRleE9mKGNhbGxiYWNrKTtcblx0XHRcdGlmICh+aW5kZXgpIGdyb3VwW2tleV0uc3BsaWNlKGluZGV4LCAxKTtcblx0XHR9XG5cdH07XG59XG5cbmZ1bmN0aW9uIG9ic2VydmVEZXYoa2V5LCBjYWxsYmFjaywgb3B0aW9ucykge1xuXHR2YXIgYyA9IChrZXkgPSAnJyArIGtleSkuc2VhcmNoKC9bLltdLyk7XG5cdGlmIChjID4gLTEpIHtcblx0XHR2YXIgbWVzc2FnZSA9XG5cdFx0XHQnVGhlIGZpcnN0IGFyZ3VtZW50IHRvIGNvbXBvbmVudC5vYnNlcnZlKC4uLikgbXVzdCBiZSB0aGUgbmFtZSBvZiBhIHRvcC1sZXZlbCBwcm9wZXJ0eSc7XG5cdFx0aWYgKGMgPiAwKVxuXHRcdFx0bWVzc2FnZSArPSBcIiwgaS5lLiAnXCIgKyBrZXkuc2xpY2UoMCwgYykgKyBcIicgcmF0aGVyIHRoYW4gJ1wiICsga2V5ICsgXCInXCI7XG5cblx0XHR0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG5cdH1cblxuXHRyZXR1cm4gb2JzZXJ2ZS5jYWxsKHRoaXMsIGtleSwgY2FsbGJhY2ssIG9wdGlvbnMpO1xufVxuXG5mdW5jdGlvbiBvbihldmVudE5hbWUsIGhhbmRsZXIpIHtcblx0aWYgKGV2ZW50TmFtZSA9PT0gJ3RlYXJkb3duJykgcmV0dXJuIHRoaXMub24oJ2Rlc3Ryb3knLCBoYW5kbGVyKTtcblxuXHR2YXIgaGFuZGxlcnMgPSB0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdIHx8ICh0aGlzLl9oYW5kbGVyc1tldmVudE5hbWVdID0gW10pO1xuXHRoYW5kbGVycy5wdXNoKGhhbmRsZXIpO1xuXG5cdHJldHVybiB7XG5cdFx0Y2FuY2VsOiBmdW5jdGlvbigpIHtcblx0XHRcdHZhciBpbmRleCA9IGhhbmRsZXJzLmluZGV4T2YoaGFuZGxlcik7XG5cdFx0XHRpZiAofmluZGV4KSBoYW5kbGVycy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gb25EZXYoZXZlbnROYW1lLCBoYW5kbGVyKSB7XG5cdGlmIChldmVudE5hbWUgPT09ICd0ZWFyZG93bicpIHtcblx0XHRjb25zb2xlLndhcm4oXG5cdFx0XHRcIlVzZSBjb21wb25lbnQub24oJ2Rlc3Ryb3knLCAuLi4pIGluc3RlYWQgb2YgY29tcG9uZW50Lm9uKCd0ZWFyZG93bicsIC4uLikgd2hpY2ggaGFzIGJlZW4gZGVwcmVjYXRlZCBhbmQgd2lsbCBiZSB1bnN1cHBvcnRlZCBpbiBTdmVsdGUgMlwiXG5cdFx0KTtcblx0XHRyZXR1cm4gdGhpcy5vbignZGVzdHJveScsIGhhbmRsZXIpO1xuXHR9XG5cblx0cmV0dXJuIG9uLmNhbGwodGhpcywgZXZlbnROYW1lLCBoYW5kbGVyKTtcbn1cblxuZnVuY3Rpb24gc2V0KG5ld1N0YXRlKSB7XG5cdHRoaXMuX3NldChhc3NpZ24oe30sIG5ld1N0YXRlKSk7XG5cdGlmICh0aGlzLnJvb3QuX2xvY2spIHJldHVybjtcblx0dGhpcy5yb290Ll9sb2NrID0gdHJ1ZTtcblx0Y2FsbEFsbCh0aGlzLnJvb3QuX2JlZm9yZWNyZWF0ZSk7XG5cdGNhbGxBbGwodGhpcy5yb290Ll9vbmNyZWF0ZSk7XG5cdGNhbGxBbGwodGhpcy5yb290Ll9hZnRlcmNyZWF0ZSk7XG5cdHRoaXMucm9vdC5fbG9jayA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBfc2V0KG5ld1N0YXRlKSB7XG5cdHZhciBvbGRTdGF0ZSA9IHRoaXMuX3N0YXRlLFxuXHRcdGNoYW5nZWQgPSB7fSxcblx0XHRkaXJ0eSA9IGZhbHNlO1xuXG5cdGZvciAodmFyIGtleSBpbiBuZXdTdGF0ZSkge1xuXHRcdGlmICh0aGlzLl9kaWZmZXJzKG5ld1N0YXRlW2tleV0sIG9sZFN0YXRlW2tleV0pKSBjaGFuZ2VkW2tleV0gPSBkaXJ0eSA9IHRydWU7XG5cdH1cblx0aWYgKCFkaXJ0eSkgcmV0dXJuO1xuXG5cdHRoaXMuX3N0YXRlID0gYXNzaWduKHt9LCBvbGRTdGF0ZSwgbmV3U3RhdGUpO1xuXHR0aGlzLl9yZWNvbXB1dGUoY2hhbmdlZCwgdGhpcy5fc3RhdGUpO1xuXHRpZiAodGhpcy5fYmluZCkgdGhpcy5fYmluZChjaGFuZ2VkLCB0aGlzLl9zdGF0ZSk7XG5cblx0aWYgKHRoaXMuX2ZyYWdtZW50KSB7XG5cdFx0ZGlzcGF0Y2hPYnNlcnZlcnModGhpcywgdGhpcy5fb2JzZXJ2ZXJzLnByZSwgY2hhbmdlZCwgdGhpcy5fc3RhdGUsIG9sZFN0YXRlKTtcblx0XHR0aGlzLl9mcmFnbWVudC5wKGNoYW5nZWQsIHRoaXMuX3N0YXRlKTtcblx0XHRkaXNwYXRjaE9ic2VydmVycyh0aGlzLCB0aGlzLl9vYnNlcnZlcnMucG9zdCwgY2hhbmdlZCwgdGhpcy5fc3RhdGUsIG9sZFN0YXRlKTtcblx0fVxufVxuXG5mdW5jdGlvbiBzZXREZXYobmV3U3RhdGUpIHtcblx0aWYgKHR5cGVvZiBuZXdTdGF0ZSAhPT0gJ29iamVjdCcpIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0XHR0aGlzLl9kZWJ1Z05hbWUgKyAnLnNldCB3YXMgY2FsbGVkIHdpdGhvdXQgYW4gb2JqZWN0IG9mIGRhdGEga2V5LXZhbHVlcyB0byB1cGRhdGUuJ1xuXHRcdCk7XG5cdH1cblxuXHR0aGlzLl9jaGVja1JlYWRPbmx5KG5ld1N0YXRlKTtcblx0c2V0LmNhbGwodGhpcywgbmV3U3RhdGUpO1xufVxuXG5mdW5jdGlvbiBjYWxsQWxsKGZucykge1xuXHR3aGlsZSAoZm5zICYmIGZucy5sZW5ndGgpIGZucy5zaGlmdCgpKCk7XG59XG5cbmZ1bmN0aW9uIF9tb3VudCh0YXJnZXQsIGFuY2hvcikge1xuXHR0aGlzLl9mcmFnbWVudFt0aGlzLl9mcmFnbWVudC5pID8gJ2knIDogJ20nXSh0YXJnZXQsIGFuY2hvciB8fCBudWxsKTtcbn1cblxuZnVuY3Rpb24gX3VubW91bnQoKSB7XG5cdGlmICh0aGlzLl9mcmFnbWVudCkgdGhpcy5fZnJhZ21lbnQudSgpO1xufVxuXG5mdW5jdGlvbiBpc1Byb21pc2UodmFsdWUpIHtcblx0cmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS50aGVuID09PSAnZnVuY3Rpb24nO1xufVxuXG52YXIgUEVORElORyA9IHt9O1xudmFyIFNVQ0NFU1MgPSB7fTtcbnZhciBGQUlMVVJFID0ge307XG5cbmZ1bmN0aW9uIHJlbW92ZUZyb21TdG9yZSgpIHtcblx0dGhpcy5zdG9yZS5fcmVtb3ZlKHRoaXMpO1xufVxuXG52YXIgcHJvdG8gPSB7XG5cdGRlc3Ryb3k6IGRlc3Ryb3ksXG5cdGdldDogZ2V0LFxuXHRmaXJlOiBmaXJlLFxuXHRvYnNlcnZlOiBvYnNlcnZlLFxuXHRvbjogb24sXG5cdHNldDogc2V0LFxuXHR0ZWFyZG93bjogZGVzdHJveSxcblx0X3JlY29tcHV0ZTogbm9vcCxcblx0X3NldDogX3NldCxcblx0X21vdW50OiBfbW91bnQsXG5cdF91bm1vdW50OiBfdW5tb3VudCxcblx0X2RpZmZlcnM6IF9kaWZmZXJzXG59O1xuXG52YXIgcHJvdG9EZXYgPSB7XG5cdGRlc3Ryb3k6IGRlc3Ryb3lEZXYsXG5cdGdldDogZ2V0LFxuXHRmaXJlOiBmaXJlLFxuXHRvYnNlcnZlOiBvYnNlcnZlRGV2LFxuXHRvbjogb25EZXYsXG5cdHNldDogc2V0RGV2LFxuXHR0ZWFyZG93bjogZGVzdHJveURldixcblx0X3JlY29tcHV0ZTogbm9vcCxcblx0X3NldDogX3NldCxcblx0X21vdW50OiBfbW91bnQsXG5cdF91bm1vdW50OiBfdW5tb3VudCxcblx0X2RpZmZlcnM6IF9kaWZmZXJzXG59O1xuXG5leHBvcnQgeyBibGFua09iamVjdCwgZGVzdHJveSwgZGVzdHJveURldiwgX2RpZmZlcnMsIF9kaWZmZXJzSW1tdXRhYmxlLCBkaXNwYXRjaE9ic2VydmVycywgZmlyZSwgZ2V0LCBpbml0LCBvYnNlcnZlLCBvYnNlcnZlRGV2LCBvbiwgb25EZXYsIHNldCwgX3NldCwgc2V0RGV2LCBjYWxsQWxsLCBfbW91bnQsIF91bm1vdW50LCBpc1Byb21pc2UsIFBFTkRJTkcsIFNVQ0NFU1MsIEZBSUxVUkUsIHJlbW92ZUZyb21TdG9yZSwgcHJvdG8sIHByb3RvRGV2LCBhcHBlbmROb2RlLCBpbnNlcnROb2RlLCBkZXRhY2hOb2RlLCBkZXRhY2hCZXR3ZWVuLCBkZXRhY2hCZWZvcmUsIGRldGFjaEFmdGVyLCByZWluc2VydEJldHdlZW4sIHJlaW5zZXJ0Q2hpbGRyZW4sIHJlaW5zZXJ0QWZ0ZXIsIHJlaW5zZXJ0QmVmb3JlLCBkZXN0cm95RWFjaCwgY3JlYXRlRnJhZ21lbnQsIGNyZWF0ZUVsZW1lbnQsIGNyZWF0ZVN2Z0VsZW1lbnQsIGNyZWF0ZVRleHQsIGNyZWF0ZUNvbW1lbnQsIGFkZExpc3RlbmVyLCByZW1vdmVMaXN0ZW5lciwgc2V0QXR0cmlidXRlLCBzZXRYbGlua0F0dHJpYnV0ZSwgZ2V0QmluZGluZ0dyb3VwVmFsdWUsIHRvTnVtYmVyLCB0aW1lUmFuZ2VzVG9BcnJheSwgY2hpbGRyZW4sIGNsYWltRWxlbWVudCwgY2xhaW1UZXh0LCBzZXRJbnB1dFR5cGUsIHNldFN0eWxlLCBzZWxlY3RPcHRpb24sIHNlbGVjdE9wdGlvbnMsIHNlbGVjdFZhbHVlLCBzZWxlY3RNdWx0aXBsZVZhbHVlLCBsaW5lYXIsIGdlbmVyYXRlUnVsZSwgaGFzaCwgd3JhcFRyYW5zaXRpb24sIHRyYW5zaXRpb25NYW5hZ2VyLCBub29wLCBhc3NpZ24gfTtcbiIsIjxOYXYgcGFnZT17e3BhZ2V9fS8+XG5cbjxtYWluPlxuXHQ8c2xvdD48L3Nsb3Q+XG48L21haW4+XG5cbjxzY3JpcHQ+XG5cdGltcG9ydCBOYXYgZnJvbSAnLi9OYXYuaHRtbCc7XG5cblx0ZXhwb3J0IGRlZmF1bHQge1xuXHRcdGNvbXBvbmVudHM6IHtcblx0XHRcdE5hdlxuXHRcdH1cblx0fTtcbjwvc2NyaXB0PiIsInt7I2lmIHVzZXJ9fVxuICA8cD57e3VzZXIubmlja25hbWV9fTwvcD5cbnt7ZWxzZX19XG4gIDxidXR0b24gb246Y2xpY2s9XCJzZXQoeyBzdGF0ZTogc2hvd30pXCI+bG9naW48L2J1dHRvbj5cbnt7L2lmfX1cblxuPGRpdiBjbGFzcz1cInt7c3RhdGV9fVwiPlxuICA8cD5NYWdpYyBMaW5rIFNpZ24gSW46PC9wPlxuICA8aW5wdXQgY2xhc3M9XCJqcy1lbWFpbFwiIHR5cGU9XCJlbWFpbFwiIHBsYWNlaG9sZGVyPVwiZW1haWxcIj5cbiAgPGJ1dHRvbiBvbjpjbGljaz1cImxvZ2luKClcIj5TZW5kIEVtYWlsPC9idXR0b24+XG48L2Rpdj5cblxuPHNjcmlwdD5cbiAgZXhwb3J0IGRlZmF1bHQge1xuICAgIG9uY3JlYXRlICgpIHtcbiAgICAgIGxldCB1c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UudXNlcilcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIHRoaXMuc2V0KHt1c2VyOiB1c2VyfSlcbiAgICAgIH1cblxuICAgICAgdmFyIHdlYkF1dGggPSBuZXcgYXV0aDAuV2ViQXV0aCh7XG4gICAgICAgIGNsaWVudElEOiAnYVNYMDRLbFRQdENzV2NLSUtTai1GN0k4ZlhlWExHbk0nLFxuICAgICAgICBkb21haW46ICdkZXBhcnRtZW50LmF1dGgwLmNvbScsXG4gICAgICAgIHJlZGlyZWN0VXJpOiAnaHR0cDovL3BhcGVyY2x1Yi5sb2NhbDo4MDgwJyxcbiAgICAgICAgcmVzcG9uc2VUeXBlOiAndG9rZW4nLFxuICAgICAgICBzY29wZTogJ29wZW5pZCBwcm9maWxlJ1xuICAgICAgfSk7XG5cbiAgICAgIGlmKHdpbmRvdy5sb2NhdGlvbi5oYXNoKXtcbiAgICAgICAgd2ViQXV0aC5wYXJzZUhhc2god2luZG93LmxvY2F0aW9uLmhhc2gsIGZ1bmN0aW9uKGVyciwgYXV0aFJlc3VsdCkge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoYXV0aFJlc3VsdCl7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnYWNjZXNzVG9rZW4nLCBhdXRoUmVzdWx0LmFjY2Vzc1Rva2VuKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGF1dGhSZXN1bHQuYWNjZXNzVG9rZW4pXG5cbiAgICAgICAgICAgIHdlYkF1dGguY2xpZW50LnVzZXJJbmZvKGF1dGhSZXN1bHQuYWNjZXNzVG9rZW4sIGZ1bmN0aW9uKGVyciwgdXNlcikge1xuICAgICAgICAgICAgICBpZiAoZXJyKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyJyxlcnIpO1xuICAgICAgICAgICAgICAgIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgcmV0cmlldmluZyB5b3VyIHByb2ZpbGU6ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2codXNlcilcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHVzZXIpKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgZGF0YSAoKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0ZTogJ2hpZGUnXG4gICAgICB9XG4gICAgfSxcblxuICAgIG1ldGhvZHM6IHtcbiAgICAgIGxvZ2luKCkge1xuICAgICAgICB2YXIgd2ViQXV0aCA9IG5ldyBhdXRoMC5XZWJBdXRoKHtcbiAgICAgICAgICBjbGllbnRJRDogJ2FTWDA0S2xUUHRDc1djS0lLU2otRjdJOGZYZVhMR25NJyxcbiAgICAgICAgICBkb21haW46ICdkZXBhcnRtZW50LmF1dGgwLmNvbScsXG4gICAgICAgICAgcmVkaXJlY3RVcmk6ICdodHRwOi8vcGFwZXJjbHViLmxvY2FsOjgwODAnLFxuICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ3Rva2VuJyxcbiAgICAgICAgICBzY29wZTogJ29wZW5pZCBwcm9maWxlJ1xuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZW1haWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuanMtZW1haWwnKS52YWx1ZVxuICAgICAgICB3ZWJBdXRoLnBhc3N3b3JkbGVzc1N0YXJ0KHtcbiAgICAgICAgICBjb25uZWN0aW9uOiAnZW1haWwnLFxuICAgICAgICAgIHNlbmQ6ICdsaW5rJyxcbiAgICAgICAgICBlbWFpbDogZW1haWxcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyLHJlcykge1xuICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgIGFsZXJ0KCdlcnJvciBzZW5kaW5nIGVtYWlsOiAnKyBlcnIuZGVzY3JpcHRpb24pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBhbGVydCgnRW1haWwgc2VudCEnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuPC9zY3JpcHQ+Il0sInNvdXJjZVJvb3QiOiIifQ==