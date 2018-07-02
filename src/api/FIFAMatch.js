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
    watching: boolean;

    constructor(match: Object) {
        this.competition_id = match.IdCompetition;
        this.season_id = match.IdSeason;
        this.stage_id = match.IdStage;
        this.match_id = match.IdMatch;
        this.period = match.Period;
        this.players = {};
        this.last_event = Date.now();// - 3600000;
        this.watching = false;

        this.home_team_id = match.HomeTeam.IdTeam;
        match.HomeTeam.TeamName.forEach((team) => {
            this.home_team = team.Description;
        });
        match.HomeTeam.Players.forEach((player) => {
            player.PlayerName.forEach((info) => {
                this.players[player.IdPlayer] = {
                    name: info.Description,
                    team: this.home_team,
                };
            });
        });

        this.away_team_id = match.AwayTeam.IdTeam;
        match.AwayTeam.TeamName.forEach((team) => {
            this.away_team = team.Description;
        });
        match.AwayTeam.Players.forEach((player) => {
            player.PlayerName.forEach((info) => {
                this.players[player.IdPlayer] = {
                    name: info.Description,
                    team: this.away_team,
                };
            });
        });

        rq(COMPETITION_URL(this.competition_id), {
            json: true,
        }).then((json) => {
            json.Name.forEach((name) => {
                this.competition_name = name.Description;
            });
        });

        debug('New match available: %s', this.name);
    }

    get name() {
        return `${this.home_team} v ${this.away_team}`;
    }

    getEvents() {
        return new Promise((resolve) => {
            if (!this.watching) {
                resolve([]);
            }

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

    getPlayerName(id: string) {
        return (id in this.players ? this.players[id].name : null) || null;
    }

    getPlayerTeam(id: string) {
        return (id in this.players ? this.players[id].team : null) || null;
    }

    getTeamName(id: string) {
        if (id == this.home_team_id) {
            return this.home_team;
        }

        return this.away_team;
    }

    watch() {
        this.watching = true;
        debug('Watching match %s', this.name);
    }

    stop() {
        this.watching = false;
        debug('No longer watching %s', this.name);
    }
}
