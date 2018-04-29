(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "./node_modules/sapper/sapper-dev-client.js":
/*!**************************************************!*\
  !*** ./node_modules/sapper/sapper-dev-client.js ***!
  \**************************************************/
/*! exports provided: connect */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "connect", function() { return connect; });
let source;

function check() {
	if (module.hot.status() === 'idle') {
		module.hot.check(true).then(modules => {
			console.log(`[SAPPER] applied HMR update`);
		});
	}
}

function connect(port) {
	if (source || !window.EventSource) return;

	source = new EventSource(`http://localhost:${port}/__sapper__`);

	window.source = source;

	source.onopen = function(event) {
		console.log(`[SAPPER] dev client connected`);
	};

	source.onerror = function(error) {
		console.error(error);
	};

	source.onmessage = function(event) {
		const data = JSON.parse(event.data);
		if (!data) return; // just a heartbeat

		if (data.action === 'reload') {
			window.location.reload();
		}

		if (data.status === 'completed') {
			check();
		}
	};
}

/***/ })

}]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjazovLy93ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3NhcHBlci9zYXBwZXItZGV2LWNsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQUFBO0FBQUE7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTs7QUFFQTtBQUNBOztBQUVBLDhDQUE4QyxLQUFLOztBQUVuRDs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxvQkFBb0I7O0FBRXBCO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEMiLCJmaWxlIjoiNjljMTBlNWMyMTMwYzJkNjUxY2QvMC4wLmpzIiwic291cmNlc0NvbnRlbnQiOlsibGV0IHNvdXJjZTtcblxuZnVuY3Rpb24gY2hlY2soKSB7XG5cdGlmIChtb2R1bGUuaG90LnN0YXR1cygpID09PSAnaWRsZScpIHtcblx0XHRtb2R1bGUuaG90LmNoZWNrKHRydWUpLnRoZW4obW9kdWxlcyA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZyhgW1NBUFBFUl0gYXBwbGllZCBITVIgdXBkYXRlYCk7XG5cdFx0fSk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbm5lY3QocG9ydCkge1xuXHRpZiAoc291cmNlIHx8ICF3aW5kb3cuRXZlbnRTb3VyY2UpIHJldHVybjtcblxuXHRzb3VyY2UgPSBuZXcgRXZlbnRTb3VyY2UoYGh0dHA6Ly9sb2NhbGhvc3Q6JHtwb3J0fS9fX3NhcHBlcl9fYCk7XG5cblx0d2luZG93LnNvdXJjZSA9IHNvdXJjZTtcblxuXHRzb3VyY2Uub25vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRjb25zb2xlLmxvZyhgW1NBUFBFUl0gZGV2IGNsaWVudCBjb25uZWN0ZWRgKTtcblx0fTtcblxuXHRzb3VyY2Uub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG5cdFx0Y29uc29sZS5lcnJvcihlcnJvcik7XG5cdH07XG5cblx0c291cmNlLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0Y29uc3QgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG5cdFx0aWYgKCFkYXRhKSByZXR1cm47IC8vIGp1c3QgYSBoZWFydGJlYXRcblxuXHRcdGlmIChkYXRhLmFjdGlvbiA9PT0gJ3JlbG9hZCcpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcblx0XHR9XG5cblx0XHRpZiAoZGF0YS5zdGF0dXMgPT09ICdjb21wbGV0ZWQnKSB7XG5cdFx0XHRjaGVjaygpO1xuXHRcdH1cblx0fTtcbn0iXSwic291cmNlUm9vdCI6IiJ9