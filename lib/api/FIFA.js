'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _eventEmitterEs = require('event-emitter-es6');

var _eventEmitterEs2 = _interopRequireDefault(_eventEmitterEs);

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _FIFAMatch = require('./FIFAMatch.js');

var _FIFAMatch2 = _interopRequireDefault(_FIFAMatch);

var _FIFAMatchEvent = require('./FIFAMatchEvent.js');

var _FIFAMatchEvent2 = _interopRequireDefault(_FIFAMatchEvent);

var _common = require('./common.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var debug = (0, _debug2.default)('FIFA');

var FIFA = function (_EventEmitter) {
    _inherits(FIFA, _EventEmitter);

    function FIFA() {
        var competition = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '17';

        _classCallCheck(this, FIFA);

        var _this = _possibleConstructorReturn(this, (FIFA.__proto__ || Object.getPrototypeOf(FIFA)).call(this));

        _this.competition = competition;
        _this.matches = {};

        _this.on('match_end', _this.remove_match.bind(_this));
        return _this;
    }

    _createClass(FIFA, [{
        key: 'update_matches',
        value: function update_matches() {
            var _this2 = this;

            (0, _requestPromise2.default)(_common.ACTIVE_URL, { json: true }).then(function (json) {
                var active = json.Results;

                // No active matches.
                if (!active) {
                    _this2.matches = {};
                    return;
                }

                active.forEach(function (match) {
                    if (!(match.IdMatch in _this2.matches)) {
                        _this2.matches[match.IdMatch] = new _FIFAMatch2.default(match);
                        _this2.emit('match', _this2.matches[match.IdMatch]);
                    }
                });

                if (Object.keys(_this2.matches).length === 0) {
                    debug('No active matches.');
                }
            });
        }
    }, {
        key: 'remove_match',
        value: function remove_match(event) {
            this.matches[event.meta.match_id].stop();
        }
    }, {
        key: 'sleep',
        value: function sleep(ms) {
            return new Promise(function (resolve) {
                setTimeout(resolve, ms);
            });
        }
    }, {
        key: 'start',
        value: function () {
            var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                var _this3 = this;

                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                _context.next = 2;
                                return this.update_matches();

                            case 2:
                                _context.next = 4;
                                return Object.entries(this.matches).forEach(function (_ref2) {
                                    var _ref3 = _slicedToArray(_ref2, 2),
                                        id = _ref3[0],
                                        match = _ref3[1];

                                    if (!(match instanceof _FIFAMatch2.default)) throw new Error();

                                    match.getEvents().then(function (events) {
                                        events.forEach(function (event) {
                                            if (event.event) {
                                                event.event.type = event.type;
                                                _this3.emit(event.type, event.event);
                                            }
                                        });
                                    });
                                });

                            case 4:
                                _context.next = 6;
                                return this.sleep(15000);

                            case 6:
                                return _context.abrupt('return', this.start());

                            case 7:
                            case 'end':
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));

            function start() {
                return _ref.apply(this, arguments);
            }

            return start;
        }()
    }]);

    return FIFA;
}(_eventEmitterEs2.default);

exports.default = FIFA;