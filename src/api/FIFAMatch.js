// @flow
import rq from 'request-promise';
import Debug from 'debug';

import FIFAMatchEvent from './FIFAMatchEvent.js';
import { COMPETITION_URL, MATCH_URL } from './common.js';

const debug = Debug('FIFAMatch');

export default class FIFAMatch {
    competition_id: string;
    competition_name: string;
    season_id: string;
    stage_id: string;
    match_id: string;
    home_team_id: string;
    home_team: string;
    away_team_id: string;
    away_team: string;
    players: Object;
    last_event: number;
    period: string;

    constructor(match: Object) {
        this.competition_id = match.IdCompetition;
        this.season_id = match.IdSeason;
        this.stage_id = match.IdStage;
        this.match_id = match.IdMatch;
        this.period = match.Period;
        this.players = {};
        this.last_event = Date.now();// - 3600000;

        this.home_team_id = match.HomeTeam.IdTeam;
        match.HomeTeam.TeamName.forEach((team) => {
            this.home_team = team.Description;
        });
        match.HomeTeam.Players.forEach((player) => {
            player.ShortName.forEach((info) => {
                this.players[player.IdPlayer] = info.Description;
            });
        });

        this.away_team_id = match.AwayTeam.IdTeam;
        match.AwayTeam.TeamName.forEach((team) => {
            this.away_team = team.Description;
        });
        match.AwayTeam.Players.forEach((player) => {
            player.ShortName.forEach((info) => {
                this.players[player.IdPlayer] = info.Description;
            });
        });

        rq(COMPETITION_URL(this.competition_id), {
            json: true,
        }).then((json) => {
            json.Name.forEach((name) => {
                this.competition_name = name.Description;
            });
        });

        debug('Watching match %s', this.name);
    }

    get name() {
        return `${this.home_team} v ${this.away_team}`;
    }

    getPlayerName(id: string) {
        return this.players[id] || null;
    }

    getTeamName(id: string) {
        if (id == this.home_team_id) {
            return this.home_team;
        }

        return this.away_team;
    }

    getEvents() {
        return new Promise((resolve) => {
            let events = [];

            rq(MATCH_URL(this.competition_id, this.season_id, this.stage_id, this.match_id), {
                json: true
            }).then((json) => {
                json.Event.forEach((event) => {
                    if (!(event.Timestamp) || Date.parse(event.Timestamp) <= this.last_event) {
                        return;
                    }

                    events.push(new FIFAMatchEvent(this, event));
                    this.last_event = Date.parse(event.Timestamp);
                });

                resolve(events);
            });
        });
    }
}
