'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTypes;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _FIFAMatch = require('./FIFAMatch.js');

var _FIFAMatch2 = _interopRequireDefault(_FIFAMatch);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var debug = (0, _debug2.default)('FIFAMatchEvent');
var EventTypes = (_EventTypes = {}, _defineProperty(_EventTypes, 0, 'goal'), _defineProperty(_EventTypes, 1, 'unknown'), _defineProperty(_EventTypes, 2, 'yellow_card'), _defineProperty(_EventTypes, 3, 'red_card'), _defineProperty(_EventTypes, 4, 'yellow_card'), _defineProperty(_EventTypes, 5, 'substitution'), _defineProperty(_EventTypes, 7, 'period_start'), _defineProperty(_EventTypes, 8, 'period_end'), _defineProperty(_EventTypes, 12, 'blocked_shot'), _defineProperty(_EventTypes, 13, 'goal_missed'), _defineProperty(_EventTypes, 14, 'foul'), _defineProperty(_EventTypes, 15, 'offside'), _defineProperty(_EventTypes, 16, 'corner_kick'), _defineProperty(_EventTypes, 17, 'blocked_shot'), _defineProperty(_EventTypes, 18, 'foul'), _defineProperty(_EventTypes, 19, 'unknown'), _defineProperty(_EventTypes, 22, 'unknown'), _defineProperty(_EventTypes, 26, 'match_end'), _defineProperty(_EventTypes, 32, 'crossbar'), _defineProperty(_EventTypes, 33, 'crossbar'), _defineProperty(_EventTypes, 37, 'foul'), _defineProperty(_EventTypes, 34, 'goal'), _defineProperty(_EventTypes, 39, 'goal'), _defineProperty(_EventTypes, 41, 'goal'), _defineProperty(_EventTypes, 60, 'penalty_missed'), _defineProperty(_EventTypes, 65, 'penalty_missed'), _EventTypes);

var FIFAMatchEvent = function () {
    function FIFAMatchEvent(match, event) {
        _classCallCheck(this, FIFAMatchEvent);

        this.match = match;
        this.type = EventTypes[event.Type] || 'nothing';
        this.type_id = event.Type;
        this.timestamp = event.Timestamp;
        this.event_time = event.MatchMinute;
        this.event = undefined;

        var method = ('do_' + this.type).replace(/_([a-z])/g, function (g) {
            return g[1].toUpperCase();
        });
        if (method in this) {
            this[method](event);
            if (this.event) {
                this.event.time = this.event_time;
                this.event.competition = this.match.competition_name;
                this.event.match = this.match.name;
                this.event.meta = {
                    competition_id: this.match.competition_id,
                    season_id: this.match.season_id,
                    stage_id: this.match.stage_id,
                    match_id: this.match.match_id
                };
                debug('Sending: %o', this.event);
            }
        } else {
            debug('%s: Missing method for event (%s, %s)', this.match.name, method, this.type_id);
        }

        // Show the event data
        event.IdPlayer = this.match.getPlayerName(event.IdPlayer);
        event.IdSubPlayer = this.match.getPlayerName(event.IdSubPlayer);
        debug('%o', event);
    }

    _createClass(FIFAMatchEvent, [{
        key: 'doNothing',
        value: function doNothing(event) {
            debug('%s (%s): Unknown event received (%s)', this.match.name, this.match.competition_name, this.type_id);
        }
    }, {
        key: 'doGoal',
        value: function doGoal(event) {
            var _goal_types;

            var goal_types = (_goal_types = {}, _defineProperty(_goal_types, 0, 'goal'), _defineProperty(_goal_types, 34, 'own'), _defineProperty(_goal_types, 39, 'free_kick'), _defineProperty(_goal_types, 41, 'penalty'), _goal_types);

            this.event = {
                home_team: this.match.home_team,
                home_score: event.HomeGoals,
                away_team: this.match.away_team,
                away_score: event.AwayGoals,
                player_name: this.match.getPlayerName(this.type_id == '34' ? event.IdPlayer : event.IdSubPlayer),
                team_name: this.match.getTeamName(event.IdTeam),
                goal_type: goal_types[this.type_id]
            };

            debug('%s (%s): %s GOOOOAL! %s *%s:%s* %s', this.match.name, this.match.competition_name, this.event_time, this.event.home_team, this.event.home_score, this.event.away_score, this.event.away_team);
            if (this.event.player) {
                debug('> %s (%s)', this.event.player_name, this.event.team_name);
            } else {
                debug('> %s', this.event.team_name);
            }
        }
    }, {
        key: 'doYellowCard',
        value: function doYellowCard(event) {
            this.event = {
                player_name: this.match.getPlayerName(event.IdPlayer),
                player_team: this.match.getTeamName(event.IdTeam),
                second: this.type_id == '2' ? false : true
            };

            debug('%s (%s): %s %sYellow Card for %s (%s)', this.match.name, this.match.competition_name, this.event_time, this.event.second ? 'Second ' : '', this.event.player_name, this.event.player_team);
        }
    }, {
        key: 'doRedCard',
        value: function doRedCard(event) {
            this.event = {
                player_name: this.match.getPlayerName(event.IdPlayer),
                player_team: this.match.getTeamName(event.IdTeam)
            };

            debug('%s (%s): %s Red Card for %s (%s)', this.match.name, this.match.competition_name, this.event_time, this.event.player_name, this.event.player_team);
        }
    }, {
        key: 'doSubstitution',
        value: function doSubstitution(event) {
            this.event = {
                player_name_in: this.match.getPlayerName(event.IdPlayer),
                player_name_out: this.match.getPlayerName(event.IdSubPlayer),
                player_team: this.match.getTeamName(event.IdTeam)
            };

            debug('%s (%s): %s Substitution for %s', this.match.name, this.match.competition_name, this.event_time, this.event.player_team);
            debug('> %s comes on for %s', this.event.player_name_in, this.event.player_name_out);
        }
    }, {
        key: 'doPeriodStart',
        value: function doPeriodStart(event) {
            var _periods;

            var periods = (_periods = {}, _defineProperty(_periods, 3, 'first'), _defineProperty(_periods, 5, 'second'), _defineProperty(_periods, 11, 'shootout'), _periods);

            this.event = {
                home_team: this.match.home_team,
                away_team: this.match.away_team,
                period: periods[event.Period]
            };

            var debug_str = '%s (%s): Invalid period value!';
            switch (this.event.period) {
                case 'first':
                    debug_str = '%s (%s): The match has begun!';
                    break;
                case 'second':
                    debug_str = '%s (%s): The second half of the match has begun!';
                    break;
                case 'shootout':
                    debug_str = '%s (%s): A penalty shootout has begun!';
                    break;
            }
            debug(debug_str, this.match.name, this.match.competition_name);
        }
    }, {
        key: 'doPeriodEnd',
        value: function doPeriodEnd(event) {
            var _periods2;

            var periods = (_periods2 = {}, _defineProperty(_periods2, 3, 'first'), _defineProperty(_periods2, 5, 'second'), _defineProperty(_periods2, 11, 'shootout'), _periods2);

            this.event = {
                home_team: this.match.home_team,
                home_score: event.HomeGoals,
                away_team: this.match.away_team,
                away_score: event.AwayGoals,
                period: periods[event.Period]
            };

            var debug_str = '%s (%s): Invalid period value!';
            switch (this.event.period) {
                case 'first':
                    debug_str = '%s (%s): End of the first half. %s *%s:%s* %s';
                    break;
                case 'second':
                    debug_str = '%s (%s): End of the second half. %s *%s:%s* %s';
                    break;
                case 'shootout':
                    debug_str = '%s (%s): End of the penalty shootout. %s *%s:%s* %s';
                    break;
            }
            debug(debug_str, this.match.name, this.match.competition_name, this.event.home_team, this.event.home_score, this.event.away_score, this.event.away_team);
        }
    }, {
        key: 'doPenaltyMissed',
        value: function doPenaltyMissed(event) {
            this.event = {
                player_name: this.match.getPlayerName(event.IdPlayer),
                player_team: this.match.getTeamName(event.IdName)
            };

            debug('%s (%s): %s Penalty missed by %s (%s)', this.match.name, this.match.competition_name, this.event_time, this.event.player_name, this.event.player_team);
        }
    }, {
        key: 'doCornerKick',
        value: function doCornerKick(event) {
            this.event = {
                player_name: this.match.getPlayerName(event.IdPlayer),
                player_team: this.match.getTeamName(event.IdName)
            };

            debug('%s (%s): %s Corner Kick by %s (%s)', this.match.name, this.match.competition_name, this.event_time, this.event.player_name, this.event.player_team);
        }
    }, {
        key: 'doFoul',
        value: function doFoul(event) {
            if (!event.IdPlayer) return;

            this.event = {
                player_name: this.match.getPlayerName(event.IdPlayer),
                against: this.match.getPlayerName(event.IdSubPlayer),
                player_team: this.match.getTeamName(event.IdName)
            };

            debug('%s (%s): %s Foul by %s (%s)', this.match.name, this.match.competition_name, this.event_time, this.event.player_name, this.event.player_team);
        }
    }, {
        key: 'doBlockedShot',
        value: function doBlockedShot(event) {
            this.event = {
                player_name: this.match.getPlayerName(event.IdPlayer),
                player_team: this.match.getTeamName(event.IdName)
            };

            debug('%s (%s): %s Shot blocked by %s (%s)', this.match.name, this.match.competition_name, this.event_time, this.event.player_name, this.event.player_team);
        }
    }, {
        key: 'doMatchEnd',
        value: function doMatchEnd(event) {
            this.event = {
                home_team: this.match.home_team,
                home_score: event.HomeGoals,
                away_team: this.match.away_team,
                away_score: event.AwayGoals
            };

            debug('%s (%s): The match has ended. %s *%s:%s* %s', this.match.name, this.match.competition_name, this.event.home_team, this.event.home_score, this.event.away_score, this.event.away_team);
        }
    }]);

    return FIFAMatchEvent;
}();

exports.default = FIFAMatchEvent;