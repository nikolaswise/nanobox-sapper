(window["webpackJsonp"] = window["webpackJsonp"] || []).push([["_"],{

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

/***/ "./routes/_components/Nav.html":
/*!*************************************!*\
  !*** ./routes/_components/Nav.html ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/shared.js */ "./node_modules/svelte/shared.js");
/* routes/_components/Nav.html generated by Svelte v1.56.3 */


function create_main_fragment(component, state) {
	var nav, a, text, a_class_value, text_1, a_1, text_2, a_1_class_value, text_3, a_2, text_4;

	return {
		c: function create() {
			nav = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("nav");
			a = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("a");
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("Index");
			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n\n\t");
			a_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("a");
			text_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("page");
			text_3 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n\n  ");
			a_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("a");
			text_4 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("login");
			this.h();
		},

		l: function claim(nodes) {
			nav = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "NAV", {}, false);
			var nav_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(nav);

			a = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nav_nodes, "A", { class: true, rel: true, href: true }, false);
			var a_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(a);

			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(a_nodes, "Index");
			a_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nav_nodes, "\n\n\t");

			a_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nav_nodes, "A", { class: true, rel: true, href: true }, false);
			var a_1_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(a_1);

			text_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(a_1_nodes, "page");
			a_1_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			text_3 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nav_nodes, "\n\n  ");

			a_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nav_nodes, "A", { href: true, rel: true }, false);
			var a_2_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(a_2);

			text_4 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(a_2_nodes, "login");
			a_2_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			nav_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			this.h();
		},

		h: function hydrate() {
			a.className = a_class_value = state.page === "home"  ? "is-active" : "";
			a.rel = "prefetch";
			a.href = "/";
			a_1.className = a_1_class_value = state.page === "page"  ? "is-active" : "";
			a_1.rel = "prefetch";
			a_1.href = "/page";
			a_2.href = "/login";
			a_2.rel = "prefetch";
		},

		m: function mount(target, anchor) {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(nav, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(a, nav);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text, a);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_1, nav);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(a_1, nav);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_2, a_1);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_3, nav);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(a_2, nav);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_4, a_2);
		},

		p: function update(changed, state) {
			if ((changed.page) && a_class_value !== (a_class_value = state.page === "home"  ? "is-active" : "")) {
				a.className = a_class_value;
			}

			if ((changed.page) && a_1_class_value !== (a_1_class_value = state.page === "page"  ? "is-active" : "")) {
				a_1.className = a_1_class_value;
			}
		},

		u: function unmount() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(nav);
		},

		d: svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["noop"]
	};
}

function Nav(options) {
	Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["init"])(this, options);
	this._state = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])({}, options.data);

	this._fragment = create_main_fragment(this, this._state);

	if (options.target) {
		var nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(options.target);
		options.hydrate ? this._fragment.l(nodes) : this._fragment.c();
		nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
		this._mount(options.target, options.anchor);
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


/***/ }),

/***/ "./routes/index.html":
/*!***************************!*\
  !*** ./routes/index.html ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! svelte/shared.js */ "./node_modules/svelte/shared.js");
/* harmony import */ var _components_Layout_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_components/Layout.html */ "./routes/_components/Layout.html");
/* routes/index.html generated by Svelte v1.56.3 */



function preload({ params, query }) {};

function create_main_fragment(component, state) {
	var text, text_1, h1, text_2, text_3;

	var layout = new _components_Layout_html__WEBPACK_IMPORTED_MODULE_1__["default"]({
		root: component.root,
		slots: { default: Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createFragment"])() },
		data: { page: "home" }
	});

	return {
		c: function create() {
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n\n");
			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n\t");
			h1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createElement"])("h1");
			text_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("Paper Club");
			text_3 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["createText"])("\n");
			layout._fragment.c();
			this.h();
		},

		l: function claim(nodes) {
			text = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nodes, "\n\n");
			text_1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nodes, "\n\t");

			h1 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimElement"])(nodes, "H1", {}, false);
			var h1_nodes = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["children"])(h1);

			text_2 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(h1_nodes, "Paper Club");
			h1_nodes.forEach(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"]);
			text_3 = Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["claimText"])(nodes, "\n");
			layout._fragment.l(nodes);
			this.h();
		},

		h: function hydrate() {
			document.title = "Sapper project template";
		},

		m: function mount(target, anchor) {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["insertNode"])(text, target, anchor);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_1, layout._slotted.default);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(h1, layout._slotted.default);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_2, h1);
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["appendNode"])(text_3, layout._slotted.default);
			layout._mount(target, anchor);
		},

		p: svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["noop"],

		u: function unmount() {
			Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["detachNode"])(text);
			layout._unmount();
		},

		d: function destroy() {
			layout.destroy(false);
		}
	};
}

function Index(options) {
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

Object(svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["assign"])(Index.prototype, svelte_shared_js__WEBPACK_IMPORTED_MODULE_0__["proto"]);

Index.preload = preload;


let proxyComponent = Index;

if (true) {

	const { configure, register, reload } = __webpack_require__(/*! svelte-loader/lib/hot-api */ "./node_modules/svelte-loader/lib/hot-api.js");

	module.hot.accept();

	if (!module.hot.data) {
		// initial load
		configure({});
		proxyComponent = register("routes/index.html", Index);
	} else {
		// hot update
		reload("routes/index.html", proxyComponent);
	}
}

/* harmony default export */ __webpack_exports__["default"] = (proxyComponent);


/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvc3ZlbHRlLWRldi1oZWxwZXIvbGliL3Byb3h5LmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy9zdmVsdGUtZGV2LWhlbHBlci9saWIvcmVnaXN0cnkuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS1sb2FkZXIvbGliL2hvdC1hcGkuanMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3N2ZWx0ZS9zaGFyZWQuanMiLCJ3ZWJwYWNrOi8vLy4vcm91dGVzL19jb21wb25lbnRzL0xheW91dC5odG1sIiwid2VicGFjazovLy8uL3JvdXRlcy9fY29tcG9uZW50cy9OYXYuaHRtbCIsIndlYnBhY2s6Ly8vLi9yb3V0ZXMvaW5kZXguaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLGFBQWEsaUJBQWlCO0FBQzlCOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdROztBQUVSO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBOztBQUVBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE9BQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7O0FBR0E7O0FBRUE7O0FBRUE7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQSxPQUFPOztBQUVQOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FBTzs7QUFFUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7O0FBRVQ7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7Ozs7O0FDNU5BO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTs7O0FBR0E7QUFDQTs7QUFFQSxrRjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUN0QzZEOztBQUU3RDtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEVBQUU7O0FBRUY7QUFDQTs7QUFFQTs7QUFFQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0EsRUFBRTtBQUNGLEM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7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ZmViYzgyZDFiYTJmYTc4YTM0L18uXy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBSZWdpc3RyeSBmcm9tICcuL3JlZ2lzdHJ5JztcblxubGV0IHByb3h5T3B0aW9ucyA9IHtcbiAgbm9QcmVzZXJ2ZVN0YXRlOiBmYWxzZVxufTtcblxuZnVuY3Rpb24gY2FwaXRhbGl6ZShzdHIpIHtcbiAgcmV0dXJuIHN0clswXS50b1VwcGVyQ2FzZSgpICsgc3RyLnNsaWNlKDEpO1xufVxuXG5mdW5jdGlvbiBnZXREZWJ1Z05hbWUoaWQpIHtcbiAgY29uc3QgcG9zaXhJRCA9IGlkLnJlcGxhY2UoL1svXFxcXF0vZywgJy8nKTtcbiAgY29uc3QgbmFtZSA9IHBvc2l4SUQuc3BsaXQoJy8nKS5wb3AoKS5zcGxpdCgnLicpLnNoaWZ0KCk7XG4gIHJldHVybiBgPCR7Y2FwaXRhbGl6ZShuYW1lKX0+YDtcbn1cblxuZnVuY3Rpb24gZ3JvdXBTdGFydChtc2cpIHtcbiAgY29uc29sZS5ncm91cCAmJiBjb25zb2xlLmdyb3VwKG1zZyk7XG59XG5cbmZ1bmN0aW9uIGdyb3VwRW5kKCkge1xuICBjb25zb2xlLmdyb3VwRW5kICYmIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbn1cblxuXG5leHBvcnQgeyBSZWdpc3RyeSB9O1xuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKF9vcHRpb25zKSB7XG4gIHByb3h5T3B0aW9ucyA9IE9iamVjdC5hc3NpZ24ocHJveHlPcHRpb25zLCBfb3B0aW9ucyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDb25maWcoKSB7XG4gIHJldHVybiBwcm94eU9wdGlvbnM7XG59XG5cbi8qXG5jcmVhdGVzIGEgcHJveHkgb2JqZWN0IHRoYXRcbmRlY29yYXRlcyB0aGUgb3JpZ2luYWwgY29tcG9uZW50IHdpdGggdHJhY2tlcnNcbmFuZCBlbnN1cmVzIHJlc29sdXRpb24gdG8gdGhlXG5sYXRlc3QgdmVyc2lvbiBvZiB0aGUgY29tcG9uZW50XG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVByb3h5KGlkKSB7XG4gIGNvbnN0IGhhbmRsZWRNZXRob2RzID0gJ19tb3VudCxfdW5tb3VudCxkZXN0cm95Jy5zcGxpdCgnLCcpO1xuICBjb25zdCBmb3J3YXJkZWRNZXRob2RzID0gJ2dldCxmaXJlLG9ic2VydmUsb24sc2V0LHRlYXJkb3duLF9yZWNvbXB1dGUsX3NldCcuc3BsaXQoJywnKTtcbiAgY2xhc3MgcHJveHlDb21wb25lbnQge1xuXG4gICAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgdGhpcy5fX21vdW50cG9pbnQgPSBudWxsO1xuICAgICAgdGhpcy5fX2FuY2hvciA9IG51bGw7XG4gICAgICB0aGlzLl9faW5zZXJ0aW9uUG9pbnQgPSBudWxsO1xuICAgICAgdGhpcy5fX21vdW50ZWQgPSBmYWxzZTtcblxuICAgICAgdGhpcy5fcmVnaXN0ZXIob3B0aW9ucyk7XG5cbiAgICAgIHRoaXMuX2RlYnVnTmFtZSA9IHRoaXMucHJveHlUYXJnZXQuX2RlYnVnTmFtZSB8fCBnZXREZWJ1Z05hbWUodGhpcy5pZCk7XG5cbiAgICAgIC8vIC0tLS0gZm9yd2FyZGVkIG1ldGhvZHMgLS0tLVxuICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICBmb3J3YXJkZWRNZXRob2RzLmZvckVhY2goZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIHNlbGZbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBzZWxmLnByb3h5VGFyZ2V0W21ldGhvZF0uYXBwbHkoc2VsZi5wcm94eVRhcmdldCwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgLy8gLS0tLSBFTkQgZm9yd2FyZGVkIG1ldGhvZHMgLS0tLVxuICAgIH1cblxuICAgIC8vIC0tLS0gYXVnbWVudGVkIG1ldGhvZHMgLS0tLVxuXG4gICAgX21vdW50KHRhcmdldCwgYW5jaG9yLCBpbnNlcnRpb25Qb2ludCkge1xuXG4gICAgICB0aGlzLl9fbW91bnRwb2ludCA9IHRhcmdldDtcbiAgICAgIHRoaXMuX19hbmNob3IgPSBhbmNob3I7XG5cbiAgICAgIGlmIChpbnNlcnRpb25Qb2ludCkge1xuICAgICAgICB0aGlzLl9faW5zZXJ0aW9uUG9pbnQgPSBpbnNlcnRpb25Qb2ludDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby11bmRlZlxuICAgICAgICB0aGlzLl9faW5zZXJ0aW9uUG9pbnQgPSBkb2N1bWVudC5jcmVhdGVDb21tZW50KHRoaXMuX2RlYnVnTmFtZSk7XG4gICAgICAgIHRhcmdldC5pbnNlcnRCZWZvcmUodGhpcy5fX2luc2VydGlvblBvaW50LCBhbmNob3IpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9faW5zZXJ0aW9uUG9pbnQuX19jb21wb25lbnRfXyA9IHRoaXM7XG5cbiAgICAgIGFuY2hvciA9IHRoaXMuX19pbnNlcnRpb25Qb2ludC5uZXh0U2libGluZztcblxuICAgICAgaWYgKHRhcmdldC5ub2RlTmFtZSA9PSAnI2RvY3VtZW50LWZyYWdtZW50JyAmJiBpbnNlcnRpb25Qb2ludCkge1xuICAgICAgICAvL2hhbmRsZXMgIzQgYnkgZm9yY2luZyBhIHRhcmdldFxuICAgICAgICAvL2lmIG9yaWdpbmFsIHRhcmdldCB3YXMgYSBkb2N1bWVudCBmcmFnbWVudFxuICAgICAgICB0YXJnZXQgPSB0aGlzLl9faW5zZXJ0aW9uUG9pbnQucGFyZW50Tm9kZTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fX21vdW50ZWQgPSB0cnVlO1xuXG4gICAgICByZXR1cm4gdGhpcy5wcm94eVRhcmdldC5fbW91bnQodGFyZ2V0LCBhbmNob3IpO1xuICAgIH1cblxuICAgIGRlc3Ryb3koZGV0YWNoLCBrZWVwSW5zZXJ0aW9uUG9pbnQpIHtcblxuICAgICAgUmVnaXN0cnkuZGVSZWdpc3Rlckluc3RhbmNlKHRoaXMpO1xuXG4gICAgICBpZiAoIWtlZXBJbnNlcnRpb25Qb2ludCAmJiB0aGlzLl9faW5zZXJ0aW9uUG9pbnQpIHtcbiAgICAgICAgLy9kZXJlZiBmb3IgR0MgYmVmb3JlIHJlbW92YWwgb2Ygbm9kZVxuICAgICAgICB0aGlzLl9faW5zZXJ0aW9uUG9pbnQuX19jb21wb25lbnRfXyA9IG51bGw7XG4gICAgICAgIGNvbnN0IGlwID0gdGhpcy5fX2luc2VydGlvblBvaW50O1xuICAgICAgICBpcCAmJiBpcC5wYXJlbnROb2RlICYmIGlwLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaXApO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMucHJveHlUYXJnZXQuZGVzdHJveShkZXRhY2gpO1xuICAgIH1cblxuICAgIF91bm1vdW50KCkge1xuICAgICAgdGhpcy5fX21vdW50ZWQgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0aGlzLnByb3h5VGFyZ2V0Ll91bm1vdW50LmFwcGx5KHRoaXMucHJveHlUYXJnZXQsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgLy8gLS0tLSBFTkQgYXVnbWVudGVkIG1ldGhvZHMgLS0tLVxuXG5cbiAgICAvLyAtLS0tIGV4dHJhIG1ldGhvZHMgLS0tLVxuXG4gICAgX3JlZ2lzdGVyKG9wdGlvbnMpIHtcblxuICAgICAgY29uc3QgcmVjb3JkID0gUmVnaXN0cnkuZ2V0KHRoaXMuaWQpO1xuXG4gICAgICB0cnkge1xuXG4gICAgICAgIC8vcmVzb2x2ZSB0byBsYXRlc3QgdmVyc2lvbiBvZiBjb21wb25lbnRcbiAgICAgICAgdGhpcy5wcm94eVRhcmdldCA9IG5ldyByZWNvcmQuY29tcG9uZW50KG9wdGlvbnMpO1xuXG4gICAgICB9IGNhdGNoIChlKSB7XG5cbiAgICAgICAgY29uc3QgcmIgPSByZWNvcmQucm9sbGJhY2s7XG5cbiAgICAgICAgaWYgKCFyYikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgICAgY29uc29sZS53YXJuKCdGdWxsIHJlbG9hZCByZXF1aXJlZC4gUGxlYXNlIGZpeCBjb21wb25lbnQgZXJyb3JzIGFuZCByZWxvYWQgdGhlIHdob2xlIHBhZ2UnKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBncm91cFN0YXJ0KHRoaXMuX2RlYnVnTmFtZSArICcgRXJyb3JzJyk7XG5cbiAgICAgICAgY29uc29sZS53YXJuKGUpO1xuICAgICAgICBjb25zb2xlLndhcm4odGhpcy5fZGVidWdOYW1lICsgJyBjb3VsZCBub3QgYmUgaG90LWxvYWRlZCBiZWNhdXNlIGl0IGhhcyBhbiBlcnJvcicpO1xuXG4gICAgICAgIC8vcmVzb2x2ZSB0byBwcmV2aW91cyB3b3JraW5nIHZlcnNpb24gb2YgY29tcG9uZW50XG4gICAgICAgIHRoaXMucHJveHlUYXJnZXQgPSBuZXcgcmIob3B0aW9ucyk7XG4gICAgICAgIGNvbnNvbGUuaW5mbygnJWMnICsgdGhpcy5fZGVidWdOYW1lICsgJyByb2xsZWQgYmFjayB0byBwcmV2aW91cyB3b3JraW5nIHZlcnNpb24nLCAnY29sb3I6Z3JlZW4nKTtcblxuICAgICAgICAvL3NldCBsYXRlc3QgdmVyc2lvbiBhcyB0aGUgcm9sbGVkLWJhY2sgdmVyc2lvblxuICAgICAgICByZWNvcmQuY29tcG9uZW50ID0gcmI7XG5cbiAgICAgICAgZ3JvdXBFbmQoKTtcblxuICAgICAgfVxuXG4gICAgICBSZWdpc3RyeS5zZXQodGhpcy5pZCwgcmVjb3JkKTtcblxuICAgICAgLy9yZWdpc3RlciBjdXJyZW50IGluc3RhbmNlLCBzbyB0aGF0XG4gICAgICAvL3dlIGNhbiByZS1yZW5kZXIgaXQgd2hlbiByZXF1aXJlZFxuICAgICAgUmVnaXN0cnkucmVnaXN0ZXJJbnN0YW5jZSh0aGlzKTtcblxuICAgICAgLy9wcm94eSBjdXN0b20gbWV0aG9kc1xuICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICBsZXQgbWV0aG9kcyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKE9iamVjdC5nZXRQcm90b3R5cGVPZihzZWxmLnByb3h5VGFyZ2V0KSk7XG4gICAgICBtZXRob2RzLmZvckVhY2goZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIGlmICghaGFuZGxlZE1ldGhvZHMuaW5jbHVkZXMobWV0aG9kKSAmJiAhZm9yd2FyZGVkTWV0aG9kcy5pbmNsdWRlcyhtZXRob2QpKSB7XG4gICAgICAgICAgc2VsZlttZXRob2RdID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gc2VsZi5wcm94eVRhcmdldFttZXRob2RdLmFwcGx5KHNlbGYucHJveHlUYXJnZXQsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vKHJlKWV4cG9zZSBwcm9wZXJ0aWVzIHRoYXQgbWlnaHQgYmUgdXNlZCBmcm9tIG91dHNpZGVcbiAgICAgIHRoaXMucmVmcyA9IHRoaXMucHJveHlUYXJnZXQucmVmcyB8fCB7fTtcbiAgICAgIHRoaXMuX2ZyYWdtZW50ID0gdGhpcy5wcm94eVRhcmdldC5fZnJhZ21lbnQ7XG4gICAgICB0aGlzLl9zbG90dGVkID0gdGhpcy5wcm94eVRhcmdldC5fc2xvdHRlZDtcbiAgICAgIHRoaXMucm9vdCA9IHRoaXMucHJveHlUYXJnZXQucm9vdDtcbiAgICAgIHRoaXMuc3RvcmUgPSB0aGlzLnByb3h5VGFyZ2V0LnN0b3JlIHx8IG51bGw7XG4gICAgfVxuXG4gICAgX3JlcmVuZGVyKCkge1xuICAgICAgY29uc3QgbW91bnRwb2ludCA9IHRoaXMuX19tb3VudHBvaW50IHx8IG51bGwsXG4gICAgICAgIGFuY2hvciA9IHRoaXMuX19hbmNob3IgfHwgbnVsbCxcbiAgICAgICAgb3B0aW9ucyA9IHRoaXMucHJveHlUYXJnZXQub3B0aW9ucyxcbiAgICAgICAgb2xkc3RhdGUgPSB0aGlzLmdldCgpLFxuICAgICAgICBpc01vdW50ZWQgPSB0aGlzLl9fbW91bnRlZCxcbiAgICAgICAgaW5zZXJ0aW9uUG9pbnQgPSB0aGlzLl9faW5zZXJ0aW9uUG9pbnQ7XG5cbiAgICAgIHRoaXMuZGVzdHJveSh0cnVlLCB0cnVlKTtcblxuICAgICAgdGhpcy5fcmVnaXN0ZXIob3B0aW9ucyk7XG5cbiAgICAgIGlmIChtb3VudHBvaW50ICYmIGlzTW91bnRlZCkge1xuICAgICAgICB0aGlzLnByb3h5VGFyZ2V0Ll9mcmFnbWVudC5jKCk7XG4gICAgICAgIHRoaXMuX21vdW50KG1vdW50cG9pbnQsIGFuY2hvciwgaW5zZXJ0aW9uUG9pbnQpO1xuXG4gICAgICAgIC8vcHJlc2VydmUgbG9jYWwgc3RhdGUgKHVubGVzcyBub1ByZXNlcnZlU3RhdGUgaXMgdHJ1ZSlcbiAgICAgICAgaWYgKFxuICAgICAgICAgICF0aGlzLnByb3h5VGFyZ2V0LmNvbnN0cnVjdG9yLm5vUHJlc2VydmVTdGF0ZVxuICAgICAgICAgICYmICFwcm94eU9wdGlvbnMubm9QcmVzZXJ2ZVN0YXRlKSB7XG4gICAgICAgICAgdGhpcy5zZXQob2xkc3RhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgLy93ZSBoYXZlIHRvIGNhbGwgLnNldCgpIGhlcmVcbiAgICAgICAgICAvL290aGVyd2lzZSBvbmNyZWF0ZSBpcyBub3QgZmlyZWRcbiAgICAgICAgICB0aGlzLnNldCh0aGlzLmdldCgpKTtcblxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gLS0tLSBFTkQgZXh0cmEgbWV0aG9kcyAtLS0tXG4gIH1cblxuICAvL2ZvcndhcmQgc3RhdGljIHByb3BlcnRpZXMgYW5kIG1ldGhvZHNcbiAgY29uc3Qgb3JpZ2luYWxDb21wb25lbnQgPSBSZWdpc3RyeS5nZXQoaWQpLmNvbXBvbmVudDtcbiAgZm9yIChsZXQga2V5IGluIG9yaWdpbmFsQ29tcG9uZW50KSB7XG4gICAgcHJveHlDb21wb25lbnRba2V5XSA9IG9yaWdpbmFsQ29tcG9uZW50W2tleV07XG4gIH1cblxuICByZXR1cm4gcHJveHlDb21wb25lbnQ7XG59XG4iLCJcbmNsYXNzIHJlZ2lzdHJ5IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5faXRlbXMgPSB7fTtcbiAgfVxuXG4gIHNldChrLCB2KSB7XG4gICAgdGhpcy5faXRlbXNba10gPSBPYmplY3QuYXNzaWduKHtcbiAgICAgIHJvbGxiYWNrOiBudWxsLFxuICAgICAgY29tcG9uZW50OiBudWxsLFxuICAgICAgaW5zdGFuY2VzOiBbXVxuICAgIH0sIHYpO1xuICB9XG5cbiAgZ2V0KGspIHtcbiAgICByZXR1cm4gayA/IHRoaXMuX2l0ZW1zW2tdIHx8IHVuZGVmaW5lZCA6IHRoaXMuX2l0ZW1zO1xuICB9XG5cbiAgcmVnaXN0ZXJJbnN0YW5jZShpbnN0YW5jZSkge1xuICAgIGNvbnN0IGlkID0gaW5zdGFuY2UuaWQ7XG4gICAgdGhpcy5faXRlbXNbaWRdICYmIHRoaXMuX2l0ZW1zW2lkXS5pbnN0YW5jZXMucHVzaChpbnN0YW5jZSk7XG4gIH1cblxuICBkZVJlZ2lzdGVySW5zdGFuY2UoaW5zdGFuY2UpIHtcbiAgICBjb25zdCBpZCA9IGluc3RhbmNlLmlkO1xuICAgIHRoaXMuX2l0ZW1zW2lkXSAmJiB0aGlzLl9pdGVtc1tpZF0uaW5zdGFuY2VzLmZvckVhY2goZnVuY3Rpb24oY29tcCwgaWR4LCBpbnN0YW5jZXMpIHtcbiAgICAgIGlmIChjb21wID09IGluc3RhbmNlKSB7XG4gICAgICAgIGluc3RhbmNlcy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59XG5cblxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG5jb25zdCBjb21wb25lbnRSZWdpc3RyeSA9ICh3aW5kb3cuX19TVkVMVEVfUkVHSVNUUllfXyA9IG5ldyByZWdpc3RyeSk7XG5cbmV4cG9ydCBkZWZhdWx0IGNvbXBvbmVudFJlZ2lzdHJ5OyIsImltcG9ydCB7IFJlZ2lzdHJ5LCBjb25maWd1cmUgYXMgY29uZmlndXJlUHJveHksIGNyZWF0ZVByb3h5IH0gZnJvbSAnc3ZlbHRlLWRldi1oZWxwZXInO1xuXG5sZXQgaG90T3B0aW9ucyA9IHtcblx0bm9QcmVzZXJ2ZVN0YXRlOiBmYWxzZVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZShvcHRpb25zKSB7XG5cdGhvdE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKGhvdE9wdGlvbnMsIG9wdGlvbnMpO1xuXHRjb25maWd1cmVQcm94eShob3RPcHRpb25zKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyKGlkLCBjb21wb25lbnQpIHtcblxuXHQvL3N0b3JlIG9yaWdpbmFsIGNvbXBvbmVudCBpbiByZWdpc3RyeVxuXHRSZWdpc3RyeS5zZXQoaWQsIHtcblx0XHRyb2xsYmFjazogbnVsbCxcblx0XHRjb21wb25lbnQsXG5cdFx0aW5zdGFuY2VzOiBbXVxuXHR9KTtcblxuXHRyZXR1cm4gY3JlYXRlUHJveHkoaWQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVsb2FkKGlkLCBjb21wb25lbnQpIHtcblxuXHRjb25zdCByZWNvcmQgPSBSZWdpc3RyeS5nZXQoaWQpO1xuXG5cdC8va2VlcCByZWZlcmVuY2UgdG8gcHJldmlvdXMgdmVyc2lvbiB0byBlbmFibGUgcm9sbGJhY2tcblx0cmVjb3JkLnJvbGxiYWNrID0gcmVjb3JkLmNvbXBvbmVudDtcblxuXHQvL3JlcGxhY2UgY29tcG9uZW50IGluIHJlZ2lzdHJ5IHdpdGggbmV3bHkgbG9hZGVkIGNvbXBvbmVudFxuXHRyZWNvcmQuY29tcG9uZW50ID0gY29tcG9uZW50O1xuXG5cdFJlZ2lzdHJ5LnNldChpZCwgcmVjb3JkKTtcblxuXHQvL3JlLXJlbmRlciB0aGUgcHJveGllc1xuXHRyZWNvcmQuaW5zdGFuY2VzLnNsaWNlKCkuZm9yRWFjaChmdW5jdGlvbihpbnN0YW5jZSkge1xuXHRcdGluc3RhbmNlICYmIGluc3RhbmNlLl9yZXJlbmRlcigpO1xuXHR9KTtcbn0iLCJmdW5jdGlvbiBub29wKCkge31cblxuZnVuY3Rpb24gYXNzaWduKHRhcmdldCkge1xuXHR2YXIgayxcblx0XHRzb3VyY2UsXG5cdFx0aSA9IDEsXG5cdFx0bGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdHNvdXJjZSA9IGFyZ3VtZW50c1tpXTtcblx0XHRmb3IgKGsgaW4gc291cmNlKSB0YXJnZXRba10gPSBzb3VyY2Vba107XG5cdH1cblxuXHRyZXR1cm4gdGFyZ2V0O1xufVxuXG5mdW5jdGlvbiBhcHBlbmROb2RlKG5vZGUsIHRhcmdldCkge1xuXHR0YXJnZXQuYXBwZW5kQ2hpbGQobm9kZSk7XG59XG5cbmZ1bmN0aW9uIGluc2VydE5vZGUobm9kZSwgdGFyZ2V0LCBhbmNob3IpIHtcblx0dGFyZ2V0Lmluc2VydEJlZm9yZShub2RlLCBhbmNob3IpO1xufVxuXG5mdW5jdGlvbiBkZXRhY2hOb2RlKG5vZGUpIHtcblx0bm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xufVxuXG5mdW5jdGlvbiBkZXRhY2hCZXR3ZWVuKGJlZm9yZSwgYWZ0ZXIpIHtcblx0d2hpbGUgKGJlZm9yZS5uZXh0U2libGluZyAmJiBiZWZvcmUubmV4dFNpYmxpbmcgIT09IGFmdGVyKSB7XG5cdFx0YmVmb3JlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYmVmb3JlLm5leHRTaWJsaW5nKTtcblx0fVxufVxuXG5mdW5jdGlvbiBkZXRhY2hCZWZvcmUoYWZ0ZXIpIHtcblx0d2hpbGUgKGFmdGVyLnByZXZpb3VzU2libGluZykge1xuXHRcdGFmdGVyLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYWZ0ZXIucHJldmlvdXNTaWJsaW5nKTtcblx0fVxufVxuXG5mdW5jdGlvbiBkZXRhY2hBZnRlcihiZWZvcmUpIHtcblx0d2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykge1xuXHRcdGJlZm9yZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGJlZm9yZS5uZXh0U2libGluZyk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVpbnNlcnRCZXR3ZWVuKGJlZm9yZSwgYWZ0ZXIsIHRhcmdldCkge1xuXHR3aGlsZSAoYmVmb3JlLm5leHRTaWJsaW5nICYmIGJlZm9yZS5uZXh0U2libGluZyAhPT0gYWZ0ZXIpIHtcblx0XHR0YXJnZXQuYXBwZW5kQ2hpbGQoYmVmb3JlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoYmVmb3JlLm5leHRTaWJsaW5nKSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gcmVpbnNlcnRDaGlsZHJlbihwYXJlbnQsIHRhcmdldCkge1xuXHR3aGlsZSAocGFyZW50LmZpcnN0Q2hpbGQpIHRhcmdldC5hcHBlbmRDaGlsZChwYXJlbnQuZmlyc3RDaGlsZCk7XG59XG5cbmZ1bmN0aW9uIHJlaW5zZXJ0QWZ0ZXIoYmVmb3JlLCB0YXJnZXQpIHtcblx0d2hpbGUgKGJlZm9yZS5uZXh0U2libGluZykgdGFyZ2V0LmFwcGVuZENoaWxkKGJlZm9yZS5uZXh0U2libGluZyk7XG59XG5cbmZ1bmN0aW9uIHJlaW5zZXJ0QmVmb3JlKGFmdGVyLCB0YXJnZXQpIHtcblx0dmFyIHBhcmVudCA9IGFmdGVyLnBhcmVudE5vZGU7XG5cdHdoaWxlIChwYXJlbnQuZmlyc3RDaGlsZCAhPT0gYWZ0ZXIpIHRhcmdldC5hcHBlbmRDaGlsZChwYXJlbnQuZmlyc3RDaGlsZCk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3lFYWNoKGl0ZXJhdGlvbnMpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBpdGVyYXRpb25zLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0aWYgKGl0ZXJhdGlvbnNbaV0pIGl0ZXJhdGlvbnNbaV0uZCgpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUZyYWdtZW50KCkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVFbGVtZW50KG5hbWUpIHtcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSk7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVN2Z0VsZW1lbnQobmFtZSkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKCdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZycsIG5hbWUpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUZXh0KGRhdGEpIHtcblx0cmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVDb21tZW50KCkge1xuXHRyZXR1cm4gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgnJyk7XG59XG5cbmZ1bmN0aW9uIGFkZExpc3RlbmVyKG5vZGUsIGV2ZW50LCBoYW5kbGVyKSB7XG5cdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgaGFuZGxlciwgZmFsc2UpO1xufVxuXG5mdW5jdGlvbiByZW1vdmVMaXN0ZW5lcihub2RlLCBldmVudCwgaGFuZGxlcikge1xuXHRub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIGhhbmRsZXIsIGZhbHNlKTtcbn1cblxuZnVuY3Rpb24gc2V0QXR0cmlidXRlKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcblx0bm9kZS5zZXRBdHRyaWJ1dGUoYXR0cmlidXRlLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHNldFhsaW5rQXR0cmlidXRlKG5vZGUsIGF0dHJpYnV0ZSwgdmFsdWUpIHtcblx0bm9kZS5zZXRBdHRyaWJ1dGVOUygnaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluaycsIGF0dHJpYnV0ZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBnZXRCaW5kaW5nR3JvdXBWYWx1ZShncm91cCkge1xuXHR2YXIgdmFsdWUgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBncm91cC5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGlmIChncm91cFtpXS5jaGVja2VkKSB2YWx1ZS5wdXNoKGdyb3VwW2ldLl9fdmFsdWUpO1xuXHR9XG5cdHJldHVybiB2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdG9OdW1iZXIodmFsdWUpIHtcblx0cmV0dXJuIHZhbHVlID09PSAnJyA/IHVuZGVmaW5lZCA6ICt2YWx1ZTtcbn1cblxuZnVuY3Rpb24gdGltZVJhbmdlc1RvQXJyYXkocmFuZ2VzKSB7XG5cdHZhciBhcnJheSA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHJhbmdlcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGFycmF5LnB1c2goeyBzdGFydDogcmFuZ2VzLnN0YXJ0KGkpLCBlbmQ6IHJhbmdlcy5lbmQoaSkgfSk7XG5cdH1cblx0cmV0dXJuIGFycmF5O1xufVxuXG5mdW5jdGlvbiBjaGlsZHJlbiAoZWxlbWVudCkge1xuXHRyZXR1cm4gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xufVxuXG5mdW5jdGlvbiBjbGFpbUVsZW1lbnQgKG5vZGVzLCBuYW1lLCBhdHRyaWJ1dGVzLCBzdmcpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdHZhciBub2RlID0gbm9kZXNbaV07XG5cdFx0aWYgKG5vZGUubm9kZU5hbWUgPT09IG5hbWUpIHtcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgbm9kZS5hdHRyaWJ1dGVzLmxlbmd0aDsgaiArPSAxKSB7XG5cdFx0XHRcdHZhciBhdHRyaWJ1dGUgPSBub2RlLmF0dHJpYnV0ZXNbal07XG5cdFx0XHRcdGlmICghYXR0cmlidXRlc1thdHRyaWJ1dGUubmFtZV0pIG5vZGUucmVtb3ZlQXR0cmlidXRlKGF0dHJpYnV0ZS5uYW1lKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07IC8vIFRPRE8gc3RyaXAgdW53YW50ZWQgYXR0cmlidXRlc1xuXHRcdH1cblx0fVxuXG5cdHJldHVybiBzdmcgPyBjcmVhdGVTdmdFbGVtZW50KG5hbWUpIDogY3JlYXRlRWxlbWVudChuYW1lKTtcbn1cblxuZnVuY3Rpb24gY2xhaW1UZXh0IChub2RlcywgZGF0YSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IG5vZGVzLmxlbmd0aDsgaSArPSAxKSB7XG5cdFx0dmFyIG5vZGUgPSBub2Rlc1tpXTtcblx0XHRpZiAobm9kZS5ub2RlVHlwZSA9PT0gMykge1xuXHRcdFx0bm9kZS5kYXRhID0gZGF0YTtcblx0XHRcdHJldHVybiBub2Rlcy5zcGxpY2UoaSwgMSlbMF07XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIGNyZWF0ZVRleHQoZGF0YSk7XG59XG5cbmZ1bmN0aW9uIHNldElucHV0VHlwZShpbnB1dCwgdHlwZSkge1xuXHR0cnkge1xuXHRcdGlucHV0LnR5cGUgPSB0eXBlO1xuXHR9IGNhdGNoIChlKSB7fVxufVxuXG5mdW5jdGlvbiBzZXRTdHlsZShub2RlLCBrZXksIHZhbHVlKSB7XG5cdG5vZGUuc3R5bGUuc2V0UHJvcGVydHkoa2V5LCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIHNlbGVjdE9wdGlvbihzZWxlY3QsIHZhbHVlKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0Lm9wdGlvbnMubGVuZ3RoOyBpICs9IDEpIHtcblx0XHR2YXIgb3B0aW9uID0gc2VsZWN0Lm9wdGlvbnNbaV07XG5cblx0XHRpZiAob3B0aW9uLl9fdmFsdWUgPT09IHZhbHVlKSB7XG5cdFx0XHRvcHRpb24uc2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0fVxufVxuXG5mdW5jdGlvbiBzZWxlY3RPcHRpb25zKHNlbGVjdCwgdmFsdWUpIHtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3Qub3B0aW9ucy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdHZhciBvcHRpb24gPSBzZWxlY3Qub3B0aW9uc1tpXTtcblx0XHRvcHRpb24uc2VsZWN0ZWQgPSB+dmFsdWUuaW5kZXhPZihvcHRpb24uX192YWx1ZSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gc2VsZWN0VmFsdWUoc2VsZWN0KSB7XG5cdHZhciBzZWxlY3RlZE9wdGlvbiA9IHNlbGVjdC5xdWVyeVNlbGVjdG9yKCc6Y2hlY2tlZCcpIHx8IHNlbGVjdC5vcHRpb25zWzBdO1xuXHRyZXR1cm4gc2VsZWN0ZWRPcHRpb24gJiYgc2VsZWN0ZWRPcHRpb24uX192YWx1ZTtcbn1cblxuZnVuY3Rpb24gc2VsZWN0TXVsdGlwbGVWYWx1ZShzZWxlY3QpIHtcblx0cmV0dXJuIFtdLm1hcC5jYWxsKHNlbGVjdC5xdWVyeVNlbGVjdG9yQWxsKCc6Y2hlY2tlZCcpLCBmdW5jdGlvbihvcHRpb24pIHtcblx0XHRyZXR1cm4gb3B0aW9uLl9fdmFsdWU7XG5cdH0pO1xufVxuXG5mdW5jdGlvbiBsaW5lYXIodCkge1xuXHRyZXR1cm4gdDtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVSdWxlKFxuXHRhLFxuXHRiLFxuXHRkZWx0YSxcblx0ZHVyYXRpb24sXG5cdGVhc2UsXG5cdGZuXG4pIHtcblx0dmFyIGtleWZyYW1lcyA9ICd7XFxuJztcblxuXHRmb3IgKHZhciBwID0gMDsgcCA8PSAxOyBwICs9IDE2LjY2NiAvIGR1cmF0aW9uKSB7XG5cdFx0dmFyIHQgPSBhICsgZGVsdGEgKiBlYXNlKHApO1xuXHRcdGtleWZyYW1lcyArPSBwICogMTAwICsgJyV7JyArIGZuKHQpICsgJ31cXG4nO1xuXHR9XG5cblx0cmV0dXJuIGtleWZyYW1lcyArICcxMDAlIHsnICsgZm4oYikgKyAnfVxcbn0nO1xufVxuXG4vLyBodHRwczovL2dpdGh1Yi5jb20vZGFya3NreWFwcC9zdHJpbmctaGFzaC9ibG9iL21hc3Rlci9pbmRleC5qc1xuZnVuY3Rpb24gaGFzaChzdHIpIHtcblx0dmFyIGhhc2ggPSA1MzgxO1xuXHR2YXIgaSA9IHN0ci5sZW5ndGg7XG5cblx0d2hpbGUgKGktLSkgaGFzaCA9ICgoaGFzaCA8PCA1KSAtIGhhc2gpIF4gc3RyLmNoYXJDb2RlQXQoaSk7XG5cdHJldHVybiBoYXNoID4+PiAwO1xufVxuXG5mdW5jdGlvbiB3cmFwVHJhbnNpdGlvbihjb21wb25lbnQsIG5vZGUsIGZuLCBwYXJhbXMsIGludHJvLCBvdXRncm91cCkge1xuXHR2YXIgb2JqID0gZm4obm9kZSwgcGFyYW1zKTtcblx0dmFyIGR1cmF0aW9uID0gb2JqLmR1cmF0aW9uIHx8IDMwMDtcblx0dmFyIGVhc2UgPSBvYmouZWFzaW5nIHx8IGxpbmVhcjtcblx0dmFyIGNzc1RleHQ7XG5cblx0Ly8gVE9ETyBzaGFyZSA8c3R5bGU+IHRhZyBiZXR3ZWVuIGFsbCB0cmFuc2l0aW9ucz9cblx0aWYgKG9iai5jc3MgJiYgIXRyYW5zaXRpb25NYW5hZ2VyLnN0eWxlc2hlZXQpIHtcblx0XHR2YXIgc3R5bGUgPSBjcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuXHRcdGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xuXHRcdHRyYW5zaXRpb25NYW5hZ2VyLnN0eWxlc2hlZXQgPSBzdHlsZS5zaGVldDtcblx0fVxuXG5cdGlmIChpbnRybykge1xuXHRcdGlmIChvYmouY3NzICYmIG9iai5kZWxheSkge1xuXHRcdFx0Y3NzVGV4dCA9IG5vZGUuc3R5bGUuY3NzVGV4dDtcblx0XHRcdG5vZGUuc3R5bGUuY3NzVGV4dCArPSBvYmouY3NzKDApO1xuXHRcdH1cblxuXHRcdGlmIChvYmoudGljaykgb2JqLnRpY2soMCk7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdHQ6IGludHJvID8gMCA6IDEsXG5cdFx0cnVubmluZzogZmFsc2UsXG5cdFx0cHJvZ3JhbTogbnVsbCxcblx0XHRwZW5kaW5nOiBudWxsLFxuXHRcdHJ1bjogZnVuY3Rpb24oaW50cm8sIGNhbGxiYWNrKSB7XG5cdFx0XHR2YXIgcHJvZ3JhbSA9IHtcblx0XHRcdFx0c3RhcnQ6IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKSArIChvYmouZGVsYXkgfHwgMCksXG5cdFx0XHRcdGludHJvOiBpbnRybyxcblx0XHRcdFx0Y2FsbGJhY2s6IGNhbGxiYWNrXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAob2JqLmRlbGF5KSB7XG5cdFx0XHRcdHRoaXMucGVuZGluZyA9IHByb2dyYW07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLnN0YXJ0KHByb2dyYW0pO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIXRoaXMucnVubmluZykge1xuXHRcdFx0XHR0aGlzLnJ1bm5pbmcgPSB0cnVlO1xuXHRcdFx0XHR0cmFuc2l0aW9uTWFuYWdlci5hZGQodGhpcyk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRzdGFydDogZnVuY3Rpb24ocHJvZ3JhbSkge1xuXHRcdFx0Y29tcG9uZW50LmZpcmUocHJvZ3JhbS5pbnRybyA/ICdpbnRyby5zdGFydCcgOiAnb3V0cm8uc3RhcnQnLCB7IG5vZGU6IG5vZGUgfSk7XG5cblx0XHRcdHByb2dyYW0uYSA9IHRoaXMudDtcblx0XHRcdHByb2dyYW0uYiA9IHByb2dyYW0uaW50cm8gPyAxIDogMDtcblx0XHRcdHByb2dyYW0uZGVsdGEgPSBwcm9ncmFtLmIgLSBwcm9ncmFtLmE7XG5cdFx0XHRwcm9ncmFtLmR1cmF0aW9uID0gZHVyYXRpb24gKiBNYXRoLmFicyhwcm9ncmFtLmIgLSBwcm9ncmFtLmEpO1xuXHRcdFx0cHJvZ3JhbS5lbmQgPSBwcm9ncmFtLnN0YXJ0ICsgcHJvZ3JhbS5kdXJhdGlvbjtcblxuXHRcdFx0aWYgKG9iai5jc3MpIHtcblx0XHRcdFx0aWYgKG9iai5kZWxheSkgbm9kZS5zdHlsZS5jc3NUZXh0ID0gY3NzVGV4dDtcblxuXHRcdFx0XHRwcm9ncmFtLnJ1bGUgPSBnZW5lcmF0ZVJ1bGUoXG5cdFx0XHRcdFx0cHJvZ3JhbS5hLFxuXHRcdFx0XHRcdHByb2dyYW0uYixcblx0XHRcdFx0XHRwcm9ncmFtLmRlbHRhLFxuXHRcdFx0XHRcdHByb2dyYW0uZHVyYXRpb24sXG5cdFx0XHRcdFx0ZWFzZSxcblx0XHRcdFx0XHRvYmouY3NzXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0dHJhbnNpdGlvbk1hbmFnZXIuYWRkUnVsZShwcm9ncmFtLnJ1bGUsIHByb2dyYW0ubmFtZSA9ICdfX3N2ZWx0ZV8nICsgaGFzaChwcm9ncmFtLnJ1bGUpKTtcblxuXHRcdFx0XHRub2RlLnN0eWxlLmFuaW1hdGlvbiA9IChub2RlLnN0eWxlLmFuaW1hdGlvbiB8fCAnJylcblx0XHRcdFx0XHQuc3BsaXQoJywgJylcblx0XHRcdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKGFuaW0pIHtcblx0XHRcdFx0XHRcdC8vIHdoZW4gaW50cm9pbmcsIGRpc2NhcmQgb2xkIGFuaW1hdGlvbnMgaWYgdGhlcmUgYXJlIGFueVxuXHRcdFx0XHRcdFx0cmV0dXJuIGFuaW0gJiYgKHByb2dyYW0uZGVsdGEgPCAwIHx8ICEvX19zdmVsdGUvLnRlc3QoYW5pbSkpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmNvbmNhdChwcm9ncmFtLm5hbWUgKyAnICcgKyBkdXJhdGlvbiArICdtcyBsaW5lYXIgMSBmb3J3YXJkcycpXG5cdFx0XHRcdFx0LmpvaW4oJywgJyk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucHJvZ3JhbSA9IHByb2dyYW07XG5cdFx0XHR0aGlzLnBlbmRpbmcgPSBudWxsO1xuXHRcdH0sXG5cdFx0dXBkYXRlOiBmdW5jdGlvbihub3cpIHtcblx0XHRcdHZhciBwcm9ncmFtID0gdGhpcy5wcm9ncmFtO1xuXHRcdFx0aWYgKCFwcm9ncmFtKSByZXR1cm47XG5cblx0XHRcdHZhciBwID0gbm93IC0gcHJvZ3JhbS5zdGFydDtcblx0XHRcdHRoaXMudCA9IHByb2dyYW0uYSArIHByb2dyYW0uZGVsdGEgKiBlYXNlKHAgLyBwcm9ncmFtLmR1cmF0aW9uKTtcblx0XHRcdGlmIChvYmoudGljaykgb2JqLnRpY2sodGhpcy50KTtcblx0XHR9LFxuXHRcdGRvbmU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIHByb2dyYW0gPSB0aGlzLnByb2dyYW07XG5cdFx0XHR0aGlzLnQgPSBwcm9ncmFtLmI7XG5cdFx0XHRpZiAob2JqLnRpY2spIG9iai50aWNrKHRoaXMudCk7XG5cdFx0XHRpZiAob2JqLmNzcykgdHJhbnNpdGlvbk1hbmFnZXIuZGVsZXRlUnVsZShub2RlLCBwcm9ncmFtLm5hbWUpO1xuXHRcdFx0cHJvZ3JhbS5jYWxsYmFjaygpO1xuXHRcdFx0cHJvZ3JhbSA9IG51bGw7XG5cdFx0XHR0aGlzLnJ1bm5pbmcgPSAhIXRoaXMucGVuZGluZztcblx0XHR9LFxuXHRcdGFib3J0OiBmdW5jdGlvbigpIHtcblx0XHRcdGlmIChvYmoudGljaykgb2JqLnRpY2soMSk7XG5cdFx0XHRpZiAob2JqLmNzcykgdHJhbnNpdGlvbk1hbmFnZXIuZGVsZXRlUnVsZShub2RlLCB0aGlzLnByb2dyYW0ubmFtZSk7XG5cdFx0XHR0aGlzLnByb2dyYW0gPSB0aGlzLnBlbmRpbmcgPSBudWxsO1xuXHRcdFx0dGhpcy5ydW5uaW5nID0gZmFsc2U7XG5cdFx0fVxuXHR9O1xufVxuXG52YXIgdHJhbnNpdGlvbk1hbmFnZXIgPSB7XG5cdHJ1bm5pbmc6IGZhbHNlLFxuXHR0cmFuc2l0aW9uczogW10sXG5cdGJvdW5kOiBudWxsLFxuXHRzdHlsZXNoZWV0OiBudWxsLFxuXHRhY3RpdmVSdWxlczoge30sXG5cblx0YWRkOiBmdW5jdGlvbih0cmFuc2l0aW9uKSB7XG5cdFx0dGhpcy50cmFuc2l0aW9ucy5wdXNoKHRyYW5zaXRpb24pO1xuXG5cdFx0aWYgKCF0aGlzLnJ1bm5pbmcpIHtcblx0XHRcdHRoaXMucnVubmluZyA9IHRydWU7XG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5ib3VuZCB8fCAodGhpcy5ib3VuZCA9IHRoaXMubmV4dC5iaW5kKHRoaXMpKSk7XG5cdFx0fVxuXHR9LFxuXG5cdGFkZFJ1bGU6IGZ1bmN0aW9uKHJ1bGUsIG5hbWUpIHtcblx0XHRpZiAoIXRoaXMuYWN0aXZlUnVsZXNbbmFtZV0pIHtcblx0XHRcdHRoaXMuYWN0aXZlUnVsZXNbbmFtZV0gPSB0cnVlO1xuXHRcdFx0dGhpcy5zdHlsZXNoZWV0Lmluc2VydFJ1bGUoJ0BrZXlmcmFtZXMgJyArIG5hbWUgKyAnICcgKyBydWxlLCB0aGlzLnN0eWxlc2hlZXQuY3NzUnVsZXMubGVuZ3RoKTtcblx0XHR9XG5cdH0sXG5cblx0bmV4dDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5ydW5uaW5nID0gZmFsc2U7XG5cblx0XHR2YXIgbm93ID0gd2luZG93LnBlcmZvcm1hbmNlLm5vdygpO1xuXHRcdHZhciBpID0gdGhpcy50cmFuc2l0aW9ucy5sZW5ndGg7XG5cblx0XHR3aGlsZSAoaS0tKSB7XG5cdFx0XHR2YXIgdHJhbnNpdGlvbiA9IHRoaXMudHJhbnNpdGlvbnNbaV07XG5cblx0XHRcdGlmICh0cmFuc2l0aW9uLnByb2dyYW0gJiYgbm93ID49IHRyYW5zaXRpb24ucHJvZ3JhbS5lbmQpIHtcblx0XHRcdFx0dHJhbnNpdGlvbi5kb25lKCk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0cmFuc2l0aW9uLnBlbmRpbmcgJiYgbm93ID49IHRyYW5zaXRpb24ucGVuZGluZy5zdGFydCkge1xuXHRcdFx0XHR0cmFuc2l0aW9uLnN0YXJ0KHRyYW5zaXRpb24ucGVuZGluZyk7XG5cdFx0XHR9XG5cblx0XHRcdGlmICh0cmFuc2l0aW9uLnJ1bm5pbmcpIHtcblx0XHRcdFx0dHJhbnNpdGlvbi51cGRhdGUobm93KTtcblx0XHRcdFx0dGhpcy5ydW5uaW5nID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSBpZiAoIXRyYW5zaXRpb24ucGVuZGluZykge1xuXHRcdFx0XHR0aGlzLnRyYW5zaXRpb25zLnNwbGljZShpLCAxKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAodGhpcy5ydW5uaW5nKSB7XG5cdFx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUodGhpcy5ib3VuZCk7XG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0eWxlc2hlZXQpIHtcblx0XHRcdHZhciBpID0gdGhpcy5zdHlsZXNoZWV0LmNzc1J1bGVzLmxlbmd0aDtcblx0XHRcdHdoaWxlIChpLS0pIHRoaXMuc3R5bGVzaGVldC5kZWxldGVSdWxlKGkpO1xuXHRcdFx0dGhpcy5hY3RpdmVSdWxlcyA9IHt9O1xuXHRcdH1cblx0fSxcblxuXHRkZWxldGVSdWxlOiBmdW5jdGlvbihub2RlLCBuYW1lKSB7XG5cdFx0bm9kZS5zdHlsZS5hbmltYXRpb24gPSBub2RlLnN0eWxlLmFuaW1hdGlvblxuXHRcdFx0LnNwbGl0KCcsICcpXG5cdFx0XHQuZmlsdGVyKGZ1bmN0aW9uKGFuaW0pIHtcblx0XHRcdFx0cmV0dXJuIGFuaW0uc2xpY2UoMCwgbmFtZS5sZW5ndGgpICE9PSBuYW1lO1xuXHRcdFx0fSlcblx0XHRcdC5qb2luKCcsICcpO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBibGFua09iamVjdCgpIHtcblx0cmV0dXJuIE9iamVjdC5jcmVhdGUobnVsbCk7XG59XG5cbmZ1bmN0aW9uIGRlc3Ryb3koZGV0YWNoKSB7XG5cdHRoaXMuZGVzdHJveSA9IG5vb3A7XG5cdHRoaXMuZmlyZSgnZGVzdHJveScpO1xuXHR0aGlzLnNldCA9IHRoaXMuZ2V0ID0gbm9vcDtcblxuXHRpZiAoZGV0YWNoICE9PSBmYWxzZSkgdGhpcy5fZnJhZ21lbnQudSgpO1xuXHR0aGlzLl9mcmFnbWVudC5kKCk7XG5cdHRoaXMuX2ZyYWdtZW50ID0gdGhpcy5fc3RhdGUgPSBudWxsO1xufVxuXG5mdW5jdGlvbiBkZXN0cm95RGV2KGRldGFjaCkge1xuXHRkZXN0cm95LmNhbGwodGhpcywgZGV0YWNoKTtcblx0dGhpcy5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cdFx0Y29uc29sZS53YXJuKCdDb21wb25lbnQgd2FzIGFscmVhZHkgZGVzdHJveWVkJyk7XG5cdH07XG59XG5cbmZ1bmN0aW9uIF9kaWZmZXJzKGEsIGIpIHtcblx0cmV0dXJuIGEgIT0gYSA/IGIgPT0gYiA6IGEgIT09IGIgfHwgKChhICYmIHR5cGVvZiBhID09PSAnb2JqZWN0JykgfHwgdHlwZW9mIGEgPT09ICdmdW5jdGlvbicpO1xufVxuXG5mdW5jdGlvbiBfZGlmZmVyc0ltbXV0YWJsZShhLCBiKSB7XG5cdHJldHVybiBhICE9IGEgPyBiID09IGIgOiBhICE9PSBiO1xufVxuXG5mdW5jdGlvbiBkaXNwYXRjaE9ic2VydmVycyhjb21wb25lbnQsIGdyb3VwLCBjaGFuZ2VkLCBuZXdTdGF0ZSwgb2xkU3RhdGUpIHtcblx0Zm9yICh2YXIga2V5IGluIGdyb3VwKSB7XG5cdFx0aWYgKCFjaGFuZ2VkW2tleV0pIGNvbnRpbnVlO1xuXG5cdFx0dmFyIG5ld1ZhbHVlID0gbmV3U3RhdGVba2V5XTtcblx0XHR2YXIgb2xkVmFsdWUgPSBvbGRTdGF0ZVtrZXldO1xuXG5cdFx0dmFyIGNhbGxiYWNrcyA9IGdyb3VwW2tleV07XG5cdFx0aWYgKCFjYWxsYmFja3MpIGNvbnRpbnVlO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpICs9IDEpIHtcblx0XHRcdHZhciBjYWxsYmFjayA9IGNhbGxiYWNrc1tpXTtcblx0XHRcdGlmIChjYWxsYmFjay5fX2NhbGxpbmcpIGNvbnRpbnVlO1xuXG5cdFx0XHRjYWxsYmFjay5fX2NhbGxpbmcgPSB0cnVlO1xuXHRcdFx0Y2FsbGJhY2suY2FsbChjb21wb25lbnQsIG5ld1ZhbHVlLCBvbGRWYWx1ZSk7XG5cdFx0XHRjYWxsYmFjay5fX2NhbGxpbmcgPSBmYWxzZTtcblx0XHR9XG5cdH1cbn1cblxuZnVuY3Rpb24gZmlyZShldmVudE5hbWUsIGRhdGEpIHtcblx0dmFyIGhhbmRsZXJzID1cblx0XHRldmVudE5hbWUgaW4gdGhpcy5faGFuZGxlcnMgJiYgdGhpcy5faGFuZGxlcnNbZXZlbnROYW1lXS5zbGljZSgpO1xuXHRpZiAoIWhhbmRsZXJzKSByZXR1cm47XG5cblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBoYW5kbGVycy5sZW5ndGg7IGkgKz0gMSkge1xuXHRcdGhhbmRsZXJzW2ldLmNhbGwodGhpcywgZGF0YSk7XG5cdH1cbn1cblxuZnVuY3Rpb24gZ2V0KGtleSkge1xuXHRyZXR1cm4ga2V5ID8gdGhpcy5fc3RhdGVba2V5XSA6IHRoaXMuX3N0YXRlO1xufVxuXG5mdW5jdGlvbiBpbml0KGNvbXBvbmVudCwgb3B0aW9ucykge1xuXHRjb21wb25lbnQuX29ic2VydmVycyA9IHsgcHJlOiBibGFua09iamVjdCgpLCBwb3N0OiBibGFua09iamVjdCgpIH07XG5cdGNvbXBvbmVudC5faGFuZGxlcnMgPSBibGFua09iamVjdCgpO1xuXHRjb21wb25lbnQuX2JpbmQgPSBvcHRpb25zLl9iaW5kO1xuXG5cdGNvbXBvbmVudC5vcHRpb25zID0gb3B0aW9ucztcblx0Y29tcG9uZW50LnJvb3QgPSBvcHRpb25zLnJvb3QgfHwgY29tcG9uZW50O1xuXHRjb21wb25lbnQuc3RvcmUgPSBjb21wb25lbnQucm9vdC5zdG9yZSB8fCBvcHRpb25zLnN0b3JlO1xufVxuXG5mdW5jdGlvbiBvYnNlcnZlKGtleSwgY2FsbGJhY2ssIG9wdGlvbnMpIHtcblx0dmFyIGdyb3VwID0gb3B0aW9ucyAmJiBvcHRpb25zLmRlZmVyXG5cdFx0PyB0aGlzLl9vYnNlcnZlcnMucG9zdFxuXHRcdDogdGhpcy5fb2JzZXJ2ZXJzLnByZTtcblxuXHQoZ3JvdXBba2V5XSB8fCAoZ3JvdXBba2V5XSA9IFtdKSkucHVzaChjYWxsYmFjayk7XG5cblx0aWYgKCFvcHRpb25zIHx8IG9wdGlvbnMuaW5pdCAhPT0gZmFsc2UpIHtcblx0XHRjYWxsYmFjay5fX2NhbGxpbmcgPSB0cnVlO1xuXHRcdGNhbGxiYWNrLmNhbGwodGhpcywgdGhpcy5fc3RhdGVba2V5XSk7XG5cdFx0Y2FsbGJhY2suX19jYWxsaW5nID0gZmFsc2U7XG5cdH1cblxuXHRyZXR1cm4ge1xuXHRcdGNhbmNlbDogZnVuY3Rpb24oKSB7XG5cdFx0XHR2YXIgaW5kZXggPSBncm91cFtrZXldLmluZGV4T2YoY2FsbGJhY2spO1xuXHRcdFx0aWYgKH5pbmRleCkgZ3JvdXBba2V5XS5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdH1cblx0fTtcbn1cblxuZnVuY3Rpb24gb2JzZXJ2ZURldihrZXksIGNhbGxiYWNrLCBvcHRpb25zKSB7XG5cdHZhciBjID0gKGtleSA9ICcnICsga2V5KS5zZWFyY2goL1suW10vKTtcblx0aWYgKGMgPiAtMSkge1xuXHRcdHZhciBtZXNzYWdlID1cblx0XHRcdCdUaGUgZmlyc3QgYXJndW1lbnQgdG8gY29tcG9uZW50Lm9ic2VydmUoLi4uKSBtdXN0IGJlIHRoZSBuYW1lIG9mIGEgdG9wLWxldmVsIHByb3BlcnR5Jztcblx0XHRpZiAoYyA+IDApXG5cdFx0XHRtZXNzYWdlICs9IFwiLCBpLmUuICdcIiArIGtleS5zbGljZSgwLCBjKSArIFwiJyByYXRoZXIgdGhhbiAnXCIgKyBrZXkgKyBcIidcIjtcblxuXHRcdHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcblx0fVxuXG5cdHJldHVybiBvYnNlcnZlLmNhbGwodGhpcywga2V5LCBjYWxsYmFjaywgb3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIG9uKGV2ZW50TmFtZSwgaGFuZGxlcikge1xuXHRpZiAoZXZlbnROYW1lID09PSAndGVhcmRvd24nKSByZXR1cm4gdGhpcy5vbignZGVzdHJveScsIGhhbmRsZXIpO1xuXG5cdHZhciBoYW5kbGVycyA9IHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0gfHwgKHRoaXMuX2hhbmRsZXJzW2V2ZW50TmFtZV0gPSBbXSk7XG5cdGhhbmRsZXJzLnB1c2goaGFuZGxlcik7XG5cblx0cmV0dXJuIHtcblx0XHRjYW5jZWw6IGZ1bmN0aW9uKCkge1xuXHRcdFx0dmFyIGluZGV4ID0gaGFuZGxlcnMuaW5kZXhPZihoYW5kbGVyKTtcblx0XHRcdGlmICh+aW5kZXgpIGhhbmRsZXJzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0fVxuXHR9O1xufVxuXG5mdW5jdGlvbiBvbkRldihldmVudE5hbWUsIGhhbmRsZXIpIHtcblx0aWYgKGV2ZW50TmFtZSA9PT0gJ3RlYXJkb3duJykge1xuXHRcdGNvbnNvbGUud2Fybihcblx0XHRcdFwiVXNlIGNvbXBvbmVudC5vbignZGVzdHJveScsIC4uLikgaW5zdGVhZCBvZiBjb21wb25lbnQub24oJ3RlYXJkb3duJywgLi4uKSB3aGljaCBoYXMgYmVlbiBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHVuc3VwcG9ydGVkIGluIFN2ZWx0ZSAyXCJcblx0XHQpO1xuXHRcdHJldHVybiB0aGlzLm9uKCdkZXN0cm95JywgaGFuZGxlcik7XG5cdH1cblxuXHRyZXR1cm4gb24uY2FsbCh0aGlzLCBldmVudE5hbWUsIGhhbmRsZXIpO1xufVxuXG5mdW5jdGlvbiBzZXQobmV3U3RhdGUpIHtcblx0dGhpcy5fc2V0KGFzc2lnbih7fSwgbmV3U3RhdGUpKTtcblx0aWYgKHRoaXMucm9vdC5fbG9jaykgcmV0dXJuO1xuXHR0aGlzLnJvb3QuX2xvY2sgPSB0cnVlO1xuXHRjYWxsQWxsKHRoaXMucm9vdC5fYmVmb3JlY3JlYXRlKTtcblx0Y2FsbEFsbCh0aGlzLnJvb3QuX29uY3JlYXRlKTtcblx0Y2FsbEFsbCh0aGlzLnJvb3QuX2FmdGVyY3JlYXRlKTtcblx0dGhpcy5yb290Ll9sb2NrID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIF9zZXQobmV3U3RhdGUpIHtcblx0dmFyIG9sZFN0YXRlID0gdGhpcy5fc3RhdGUsXG5cdFx0Y2hhbmdlZCA9IHt9LFxuXHRcdGRpcnR5ID0gZmFsc2U7XG5cblx0Zm9yICh2YXIga2V5IGluIG5ld1N0YXRlKSB7XG5cdFx0aWYgKHRoaXMuX2RpZmZlcnMobmV3U3RhdGVba2V5XSwgb2xkU3RhdGVba2V5XSkpIGNoYW5nZWRba2V5XSA9IGRpcnR5ID0gdHJ1ZTtcblx0fVxuXHRpZiAoIWRpcnR5KSByZXR1cm47XG5cblx0dGhpcy5fc3RhdGUgPSBhc3NpZ24oe30sIG9sZFN0YXRlLCBuZXdTdGF0ZSk7XG5cdHRoaXMuX3JlY29tcHV0ZShjaGFuZ2VkLCB0aGlzLl9zdGF0ZSk7XG5cdGlmICh0aGlzLl9iaW5kKSB0aGlzLl9iaW5kKGNoYW5nZWQsIHRoaXMuX3N0YXRlKTtcblxuXHRpZiAodGhpcy5fZnJhZ21lbnQpIHtcblx0XHRkaXNwYXRjaE9ic2VydmVycyh0aGlzLCB0aGlzLl9vYnNlcnZlcnMucHJlLCBjaGFuZ2VkLCB0aGlzLl9zdGF0ZSwgb2xkU3RhdGUpO1xuXHRcdHRoaXMuX2ZyYWdtZW50LnAoY2hhbmdlZCwgdGhpcy5fc3RhdGUpO1xuXHRcdGRpc3BhdGNoT2JzZXJ2ZXJzKHRoaXMsIHRoaXMuX29ic2VydmVycy5wb3N0LCBjaGFuZ2VkLCB0aGlzLl9zdGF0ZSwgb2xkU3RhdGUpO1xuXHR9XG59XG5cbmZ1bmN0aW9uIHNldERldihuZXdTdGF0ZSkge1xuXHRpZiAodHlwZW9mIG5ld1N0YXRlICE9PSAnb2JqZWN0Jykge1xuXHRcdHRocm93IG5ldyBFcnJvcihcblx0XHRcdHRoaXMuX2RlYnVnTmFtZSArICcuc2V0IHdhcyBjYWxsZWQgd2l0aG91dCBhbiBvYmplY3Qgb2YgZGF0YSBrZXktdmFsdWVzIHRvIHVwZGF0ZS4nXG5cdFx0KTtcblx0fVxuXG5cdHRoaXMuX2NoZWNrUmVhZE9ubHkobmV3U3RhdGUpO1xuXHRzZXQuY2FsbCh0aGlzLCBuZXdTdGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGNhbGxBbGwoZm5zKSB7XG5cdHdoaWxlIChmbnMgJiYgZm5zLmxlbmd0aCkgZm5zLnNoaWZ0KCkoKTtcbn1cblxuZnVuY3Rpb24gX21vdW50KHRhcmdldCwgYW5jaG9yKSB7XG5cdHRoaXMuX2ZyYWdtZW50W3RoaXMuX2ZyYWdtZW50LmkgPyAnaScgOiAnbSddKHRhcmdldCwgYW5jaG9yIHx8IG51bGwpO1xufVxuXG5mdW5jdGlvbiBfdW5tb3VudCgpIHtcblx0aWYgKHRoaXMuX2ZyYWdtZW50KSB0aGlzLl9mcmFnbWVudC51KCk7XG59XG5cbmZ1bmN0aW9uIGlzUHJvbWlzZSh2YWx1ZSkge1xuXHRyZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLnRoZW4gPT09ICdmdW5jdGlvbic7XG59XG5cbnZhciBQRU5ESU5HID0ge307XG52YXIgU1VDQ0VTUyA9IHt9O1xudmFyIEZBSUxVUkUgPSB7fTtcblxuZnVuY3Rpb24gcmVtb3ZlRnJvbVN0b3JlKCkge1xuXHR0aGlzLnN0b3JlLl9yZW1vdmUodGhpcyk7XG59XG5cbnZhciBwcm90byA9IHtcblx0ZGVzdHJveTogZGVzdHJveSxcblx0Z2V0OiBnZXQsXG5cdGZpcmU6IGZpcmUsXG5cdG9ic2VydmU6IG9ic2VydmUsXG5cdG9uOiBvbixcblx0c2V0OiBzZXQsXG5cdHRlYXJkb3duOiBkZXN0cm95LFxuXHRfcmVjb21wdXRlOiBub29wLFxuXHRfc2V0OiBfc2V0LFxuXHRfbW91bnQ6IF9tb3VudCxcblx0X3VubW91bnQ6IF91bm1vdW50LFxuXHRfZGlmZmVyczogX2RpZmZlcnNcbn07XG5cbnZhciBwcm90b0RldiA9IHtcblx0ZGVzdHJveTogZGVzdHJveURldixcblx0Z2V0OiBnZXQsXG5cdGZpcmU6IGZpcmUsXG5cdG9ic2VydmU6IG9ic2VydmVEZXYsXG5cdG9uOiBvbkRldixcblx0c2V0OiBzZXREZXYsXG5cdHRlYXJkb3duOiBkZXN0cm95RGV2LFxuXHRfcmVjb21wdXRlOiBub29wLFxuXHRfc2V0OiBfc2V0LFxuXHRfbW91bnQ6IF9tb3VudCxcblx0X3VubW91bnQ6IF91bm1vdW50LFxuXHRfZGlmZmVyczogX2RpZmZlcnNcbn07XG5cbmV4cG9ydCB7IGJsYW5rT2JqZWN0LCBkZXN0cm95LCBkZXN0cm95RGV2LCBfZGlmZmVycywgX2RpZmZlcnNJbW11dGFibGUsIGRpc3BhdGNoT2JzZXJ2ZXJzLCBmaXJlLCBnZXQsIGluaXQsIG9ic2VydmUsIG9ic2VydmVEZXYsIG9uLCBvbkRldiwgc2V0LCBfc2V0LCBzZXREZXYsIGNhbGxBbGwsIF9tb3VudCwgX3VubW91bnQsIGlzUHJvbWlzZSwgUEVORElORywgU1VDQ0VTUywgRkFJTFVSRSwgcmVtb3ZlRnJvbVN0b3JlLCBwcm90bywgcHJvdG9EZXYsIGFwcGVuZE5vZGUsIGluc2VydE5vZGUsIGRldGFjaE5vZGUsIGRldGFjaEJldHdlZW4sIGRldGFjaEJlZm9yZSwgZGV0YWNoQWZ0ZXIsIHJlaW5zZXJ0QmV0d2VlbiwgcmVpbnNlcnRDaGlsZHJlbiwgcmVpbnNlcnRBZnRlciwgcmVpbnNlcnRCZWZvcmUsIGRlc3Ryb3lFYWNoLCBjcmVhdGVGcmFnbWVudCwgY3JlYXRlRWxlbWVudCwgY3JlYXRlU3ZnRWxlbWVudCwgY3JlYXRlVGV4dCwgY3JlYXRlQ29tbWVudCwgYWRkTGlzdGVuZXIsIHJlbW92ZUxpc3RlbmVyLCBzZXRBdHRyaWJ1dGUsIHNldFhsaW5rQXR0cmlidXRlLCBnZXRCaW5kaW5nR3JvdXBWYWx1ZSwgdG9OdW1iZXIsIHRpbWVSYW5nZXNUb0FycmF5LCBjaGlsZHJlbiwgY2xhaW1FbGVtZW50LCBjbGFpbVRleHQsIHNldElucHV0VHlwZSwgc2V0U3R5bGUsIHNlbGVjdE9wdGlvbiwgc2VsZWN0T3B0aW9ucywgc2VsZWN0VmFsdWUsIHNlbGVjdE11bHRpcGxlVmFsdWUsIGxpbmVhciwgZ2VuZXJhdGVSdWxlLCBoYXNoLCB3cmFwVHJhbnNpdGlvbiwgdHJhbnNpdGlvbk1hbmFnZXIsIG5vb3AsIGFzc2lnbiB9O1xuIiwiPE5hdiBwYWdlPXt7cGFnZX19Lz5cblxuPG1haW4+XG5cdDxzbG90Pjwvc2xvdD5cbjwvbWFpbj5cblxuPHNjcmlwdD5cblx0aW1wb3J0IE5hdiBmcm9tICcuL05hdi5odG1sJztcblxuXHRleHBvcnQgZGVmYXVsdCB7XG5cdFx0Y29tcG9uZW50czoge1xuXHRcdFx0TmF2XG5cdFx0fVxuXHR9O1xuPC9zY3JpcHQ+IiwiPG5hdj5cblx0PGEgY2xhc3M9J3t7cGFnZSA9PT0gXCJob21lXCIgID8gXCJpcy1hY3RpdmVcIiA6IFwiXCJ9fScgIHJlbD1wcmVmZXRjaCBocmVmPScvJz5JbmRleDwvYT5cblxuXHQ8YSBjbGFzcz0ne3twYWdlID09PSBcInBhZ2VcIiAgPyBcImlzLWFjdGl2ZVwiIDogXCJcIn19JyByZWw9cHJlZmV0Y2ggaHJlZj0nL3BhZ2UnPnBhZ2U8L2E+XG5cbiAgPGEgaHJlZj1cIi9sb2dpblwiIHJlbD1wcmVmZXRjaD5sb2dpbjwvYT5cbjwvbmF2PlxuIiwiPDpIZWFkPlxuXHQ8dGl0bGU+U2FwcGVyIHByb2plY3QgdGVtcGxhdGU8L3RpdGxlPlxuPC86SGVhZD5cblxuPExheW91dCBwYWdlPSdob21lJz5cblx0PGgxPlBhcGVyIENsdWI8L2gxPlxuPC9MYXlvdXQ+XG5cbjxzdHlsZT5cblxuPC9zdHlsZT5cblxuPHNjcmlwdD5cblx0aW1wb3J0IExheW91dCBmcm9tICcuL19jb21wb25lbnRzL0xheW91dC5odG1sJztcblxuXHRleHBvcnQgZGVmYXVsdCB7XG5cdFx0Y29tcG9uZW50czoge1xuXHRcdFx0TGF5b3V0XG5cdFx0fSxcbiAgICBwcmVsb2FkKHsgcGFyYW1zLCBxdWVyeSB9KSB7fVxuXHR9O1xuPC9zY3JpcHQ+XG4iXSwic291cmNlUm9vdCI6IiJ9