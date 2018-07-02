'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _FIFAMatchEvent = require('./FIFAMatchEvent.js');

var _FIFAMatchEvent2 = _interopRequireDefault(_FIFAMatchEvent);

var _common = require('./common.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('FIFAMatch');

var FIFAMatch = function () {
    function FIFAMatch(match) {
        var _this = this;

        _classCallCheck(this, FIFAMatch);

        this.competition_id = match.IdCompetition;
        this.season_id = match.IdSeason;
        this.stage_id = match.IdStage;
        this.match_id = match.IdMatch;
        this.period = match.Period;
        this.players = {};
        this.last_event = Date.now(); // - 3600000;
        this.watching = false;

        this.home_team_id = match.HomeTeam.IdTeam;
        match.HomeTeam.TeamName.forEach(function (team) {
            _this.home_team = team.Description;
        });
        match.HomeTeam.Players.forEach(function (player) {
            player.PlayerName.forEach(function (info) {
                _this.players[player.IdPlayer] = {
                    name: info.Description,
                    team: _this.home_team
                };
            });
        });

        this.away_team_id = match.AwayTeam.IdTeam;
        match.AwayTeam.TeamName.forEach(function (team) {
            _this.away_team = team.Description;
        });
        match.AwayTeam.Players.forEach(function (player) {
            player.PlayerName.forEach(function (info) {
                _this.players[player.IdPlayer] = {
                    name: info.Description,
                    team: _this.away_team
                };
            });
        });

        (0, _requestPromise2.default)((0, _common.COMPETITION_URL)(this.competition_id), {
            json: true
        }).then(function (json) {
            json.Name.forEach(function (name) {
                _this.competition_name = name.Description;
            });
        });

        debug('New match available: %s', this.name);
    }

    _createClass(FIFAMatch, [{
        key: 'getEvents',
        value: function getEvents() {
            var _this2 = this;

            return new Promise(function (resolve) {
                if (!_this2.watching) {
                    resolve([]);
                }

                var events = [];

                (0, _requestPromise2.default)((0, _common.MATCH_URL)(_this2.competition_id, _this2.season_id, _this2.stage_id, _this2.match_id), {
                    json: true
                }).then(function (json) {
                    json.Event.forEach(function (event) {
                        if (!event.Timestamp || Date.parse(event.Timestamp) <= _this2.last_event) {
                            return;
                        }

                        events.push(new _FIFAMatchEvent2.default(_this2, event));
                        _this2.last_event = Date.parse(event.Timestamp);
                    });

                    resolve(events);
                });
            });
        }
    }, {
        key: 'getPlayerName',
        value: function getPlayerName(id) {
            return (id in this.players ? this.players[id].name : null) || null;
        }
    }, {
        key: 'getPlayerTeam',
        value: function getPlayerTeam(id) {
            return (id in this.players ? this.players[id].team : null) || null;
        }
    }, {
        key: 'getTeamName',
        value: function getTeamName(id) {
            if (id == this.home_team_id) {
                return this.home_team;
            }

            return this.away_team;
        }
    }, {
        key: 'watch',
        value: function watch() {
            this.watching = true;
            debug('Watching match %s', this.name);
        }
    }, {
        key: 'stop',
        value: function stop() {
            this.watching = false;
            debug('No longer watching %s', this.name);
        }
    }, {
        key: 'name',
        get: function get() {
            return this.home_team + ' v ' + this.away_team;
        }
    }]);

    return FIFAMatch;
}();

exports.default = FIFAMatch;