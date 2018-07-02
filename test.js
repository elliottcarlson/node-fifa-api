import emoji from 'node-emoji';
import FIFA from './lib/api/FIFA.js';
import colors from 'colors';

const print = (string) => {
    console.log(emoji.emojify(string));
};

const eventToString = (string) => {
    return `_${string}`.replace(/_([a-z])/g, g => ' ' + g[1].toUpperCase());
};

class FIFAClient {
    constructor() {
        const api = new FIFA();

        api.on('match', this.watchMatch);

        api.on('goal', this.doGoal);
        api.on('yellow_card', this.doCard);
        api.on('red_card', this.doCard);
        api.on('substitution', this.doSubstitution);
        api.on('period_start', this.doPeriodStart);
        api.on('period_end', this.doPeriodEnd);
        api.on('match_end', this.doMatchEnd);
        api.on('penalty_missed', this.doPenaltyMissed);
        api.on('foul', this.doFoul);
        api.on('blocked_shot', this.doBlockedShot);
        api.start();
    }

    watchMatch(match) {
        match.watch();
    }

    doPeriodStart(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let home = colors.bold(event.home_team);
        let away = colors.bold(event.away_team);
        let str = '';
        switch(event.period) {
            case 'first':
                str = `The match between ${home} and ${away} has begun!`;
                break;
            case 'second':
                str = 'The second half of the match has begun!';
                break;
            case 'shootout':
                str = 'A penalty shootout has begun!';
                break;
        }
        print(`${match} :clock12:  ${str}`);
    }

    doPeriodEnd(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let home = event.home_team;
        let score = colors.bold(event.home_score) + ':' + colors.bold(event.away_score);
        let away = event.away_team;
        let str = '';
        switch(event.period) {
            case 'first':
                str = 'End of the first half.';
                break;
            case 'second':
                str = 'End of the second half.';
                break;
            case 'shootout':
                str = 'End of the penalty shootout.';
                break;
        }
        print(`${match} :clock12:  ${str} ${home} ${score} ${away}`);
    }

    doMatchEnd(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let home = event.home_team;
        let score = colors.bold(event.home_score) + ':' + colors.bold(event.away_score);
        let away = event.away_team;
        print(`${match} :clock12:  The match has ended. ${home} ${score} ${away}`);
    }

    doGoal(event) {
        let goal_types = {
            'goal': '',
            'own': 'Own ',
            'free_kick': 'Free kick ',
            'penalty': 'Penalty ',
        };

        let match = colors.dim(`${event.match} (${event.competition})`);
        let time = event.time;
        let home = event.home_team;
        let score = colors.bold(event.home_score) + ':' + colors.bold(event.away_score);
        let away = event.away_team;
        let player = event.player_name;
        let team = event.team_name;
        let goal_type = goal_types[event.goal_type];
        let source = `${colors.bold(player || team)}${player ? ` (${team})` : ''}`;

        print(`${match} :soccer:  ${time} ${goal_type}GOOOOAAAALLL by ${source}!! ${home} ${score} ${away}`);
    }

    doFoul(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let time = event.time;
        let player = event.player_name;
        let against = event.against ? colors.bold(event.against) : '';
        let team = event.player_team;
        let source = `${colors.bold(player || team)}${player ? ` (${team})` : ''}`;

        print(`${match} Foul by ${source} ${against ? `against ${against}` : ''}`);
    }

    doSubstitution(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let time = event.time;
        let _in = colors.bold(event.player_name_in);
        let out = colors.bold(event.player_name_out);

        print(`${match} :arrows_counterclockwise:  ${time} ${_in} comes in for ${out}`);
    }

    doCard(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let time = event.time;
        let card = eventToString(event.type).trim();
        let player = event.player_name;
        let team = event.player_team;
        let source = `${colors.bold(player || team)}${player ? ` (${team})` : ''}`;

        print(`${match} :triangular_flag_on_post:  ${time} ${card} for ${source}`);
    }

    doPenaltyMissed(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let time = event.time;
        let player = event.player_name;
        let team = event.player_team;
        let source = `${colors.bold(player || team)}${player ? ` (${team})` : ''}`;

        print(`${match} :no_entry_sign:  ${time} Penalty missed by ${source}`);
    }

    doBlockedShot(event) {
        let match = colors.dim(`${event.match} (${event.competition})`);
        let time = event.time;
        let player = event.player_name;
        let team = event.player_team;
        let source = `${colors.bold(player || team)}${player ? ` (${team})` : ''}`;

        print(`${match} :no_entry_sign:  ${time} Shot blocked by ${source}`);
    }
}

new FIFAClient();
