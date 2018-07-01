// @flow
import Debug from 'debug';

import FIFAMatch from './FIFAMatch.js';

const debug = Debug('FIFAMatchEvent');
const EventTypes = {
    [0]: 'goal',
    [1]: 'unknown',
    [2]: 'yellow_card',
    [3]: 'red_card',
    [4]: 'yellow_card',
    [5]: 'substitution',
    [7]: 'period_start',
    [8]: 'period_end',
    [12]: 'blocked_shot',
    [13]: 'goal_missed',
    [14]: 'foul',
    [15]: 'offside',
    [16]: 'corner_kick',
    [17]: 'blocked_shot',
    [18]: 'foul',
    [19]: 'unknown', // Unknown, only happens before match starts.
    [22]: 'unknown', // Unknown, contains IdSubPlayer??
    [26]: 'match_end',
    [32]: 'crossbar',
    [33]: 'crossbar',
    [37]: 'foul', // Handball
    [34]: 'goal', // Own goal
    [39]: 'goal', // Free kick goal
    [41]: 'goal', // Penalty goal
    [60]: 'penalty_missed',
    [65]: 'penalty_missed',

};

export default class FIFAMatchEvent {
    match: FIFAMatch;
    type: string;
    type_id: string;
    timestamp: number;
    event_time: number;
    event: any;

    constructor(match: FIFAMatch, event: Object) {
        this.match = match;
        this.type = EventTypes[event.Type] || 'nothing';
        this.type_id = event.Type;
        this.timestamp = event.Timestamp;
        this.event_time = event.MatchMinute;
        this.event = undefined;

        let method = `do_${this.type}`.replace(/_([a-z])/g, g => g[1].toUpperCase());
        if (method in this) {
            (this: Object)[method](event);
            if (this.event) {
                this.event.time = this.event_time;
                this.event.competition = this.match.competition_name;
                this.event.match = this.match.name;
                this.event.meta = {
                    competition_id: this.match.competition_id,
                    season_id: this.match.season_id,
                    stage_id: this.match.stage_id,
                    match_id: this.match.match_id,
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

    doNothing(event: Object) {
        debug('%s (%s): Unknown event received (%s)',
            this.match.name, this.match.competition_name, this.type_id);
    }

    doGoal(event: Object) {
        const goal_types = {
            [0]: 'goal',
            [34]: 'own',
            [39]: 'free_kick',
            [41]: 'penalty',
        };

        this.event = {
            home_team: this.match.home_team,
            home_score: event.HomeGoals,
            away_team: this.match.away_team,
            away_score: event.AwayGoals,
            player_name: this.match.getPlayerName(this.type_id == '34' ? event.IdPlayer : event.IdSubPlayer),
            team_name: this.match.getTeamName(event.IdTeam),
            goal_type: goal_types[this.type_id],
        };

        debug('%s (%s): %s GOOOOAL! %s *%s:%s* %s',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.home_team, this.event.home_score, this.event.away_score,
            this.event.away_team
        );
        if (this.event.player) {
            debug('> %s (%s)' , this.event.player_name, this.event.team_name);
        } else {
            debug('> %s', this.event.team_name);
        }
    }

    doYellowCard(event: Object) {
        this.event = {
            player_name: this.match.getPlayerName(event.IdPlayer),
            player_team: this.match.getTeamName(event.IdTeam),
            second: this.type_id == '2' ? false : true,
        };

        debug('%s (%s): %s %sYellow Card for %s (%s)',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.second ? 'Second ' : '', this.event.player_name,
            this.event.player_team
        );
    }

    doRedCard(event: Object) {
        this.event = {
            player_name: this.match.getPlayerName(event.IdPlayer),
            player_team: this.match.getTeamName(event.IdTeam),
        };

        debug('%s (%s): %s Red Card for %s (%s)',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.player_name, this.event.player_team
        );
    }

    doSubstitution(event: Object) {
        this.event = {
            player_name_in: this.match.getPlayerName(event.IdPlayer),
            player_name_out: this.match.getPlayerName(event.IdSubPlayer),
            player_team: this.match.getTeamName(event.IdTeam),
        };

        debug('%s (%s): %s Substitution for %s',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.player_team
        );
        debug('> %s comes on for %s',
            this.event.player_name_in, this.event.player_name_out
        );
    }

    doPeriodStart(event: Object) {
        const periods = {
            [3]: 'first',
            [5]: 'second',
            [11]: 'shootout',
        };

        this.event = {
            home_team: this.match.home_team,
            away_team: this.match.away_team,
            period: periods[event.Period],
        };

        let debug_str = '%s (%s): Invalid period value!';
        switch(this.event.period) {
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

    doPeriodEnd(event: Object) {
        const periods = {
            [3]: 'first',
            [5]: 'second',
            [11]: 'shootout',
        };

        this.event = {
            home_team: this.match.home_team,
            home_score: event.HomeGoals,
            away_team: this.match.away_team,
            away_score: event.AwayGoals,
            period: periods[event.Period],
        };

        let debug_str = '%s (%s): Invalid period value!';
        switch(this.event.period) {
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
        debug(debug_str,
            this.match.name, this.match.competition_name, this.event.home_team,
            this.event.home_score, this.event.away_score, this.event.away_team
        );
    }

    doPenaltyMissed(event: Object) {
        this.event = {
            player_name: this.match.getPlayerName(event.IdPlayer),
            player_team: this.match.getTeamName(event.IdName),
        };

        debug('%s (%s): %s Penalty missed by %s (%s)',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.player_name, this.event.player_team
        );
    }

    doCornerKick(event: Object) {
        this.event = {
            player_name: this.match.getPlayerName(event.IdPlayer),
            player_team: this.match.getTeamName(event.IdName),
        };

        debug('%s (%s): %s Corner Kick by %s (%s)',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.player_name, this.event.player_team
        );
    }

    doFoul(event: Object) {
        if (!event.IdPlayer) return;

        this.event = {
            player_name: this.match.getPlayerName(event.IdPlayer),
            against: this.match.getPlayerName(event.IdSubPlayer),
            player_team: this.match.getTeamName(event.IdName),
        };

        debug('%s (%s): %s Foul by %s (%s)',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.player_name, this.event.player_team
        );
    }

    doBlockedShot(event: Object) {
        this.event = {
            player_name: this.match.getPlayerName(event.IdPlayer),
            player_team: this.match.getTeamName(event.IdName),
        };

        debug('%s (%s): %s Shot blocked by %s (%s)',
            this.match.name, this.match.competition_name, this.event_time,
            this.event.player_name, this.event.player_team
        );
    }

    doMatchEnd(event: Object) {
        this.event = {
            home_team: this.match.home_team,
            home_score: event.HomeGoals,
            away_team: this.match.away_team,
            away_score: event.AwayGoals,
        };

        debug('%s (%s): The match has ended. %s *%s:%s* %s',
            this.match.name, this.match.competition_name, this.event.home_team,
            this.event.home_score, this.event.away_score, this.event.away_team
        );
    }
}
