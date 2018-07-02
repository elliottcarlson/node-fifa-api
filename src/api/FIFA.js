// @flow
import EventEmitter from 'event-emitter-es6';
import rq from 'request-promise';
import Debug from 'debug';

import FIFAMatch from './FIFAMatch.js';
import FIFAMatchEvent from './FIFAMatchEvent.js';
import { ACTIVE_URL } from './common.js';

const debug = Debug('FIFA');

export default class FIFA extends EventEmitter {
    competition: string;
    matches: Object;

    constructor(competition: string = '17') {
        super();

        this.competition = competition;
        this.matches = {};

        this.on('match_end', this.remove_match.bind(this));
    };

    update_matches() {
        rq(ACTIVE_URL, { json: true }).then((json) => {
            const active = json.Results;

            // No active matches.
            if (!active) {
                this.matches = {};
                return;
            }

            active.forEach((match) => {
                if (!(match.IdMatch in this.matches)) {
                    this.matches[match.IdMatch] = new FIFAMatch(match);
                    this.emit('match', this.matches[match.IdMatch]);
                }
            });

            if (Object.keys(this.matches).length === 0) {
                debug('No active matches.');
            }
        });
    }

    remove_match(event: FIFAMatchEvent) {
        this.matches[event.meta.match_id].stop();
    }

    sleep(ms: number) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async start() {
        await this.update_matches();

        await Object.entries(this.matches).forEach(([id: number, match: FIFAMatch]) => {
            if (!(match instanceof FIFAMatch)) throw new Error();

            match.getEvents().then((events) => {
                events.forEach((event) => {
                    if (event.event) {
                        event.event.type = event.type;
                        this.emit(event.type, event.event);
                    }
                });
            });
        });

        await this.sleep(15000);
        return this.start();
    }
}
