'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var BASE_URL = exports.BASE_URL = 'https://api.fifa.com/api/v1';
var ACTIVE_URL = exports.ACTIVE_URL = BASE_URL + '/live/football/now';
var COMPETITION_URL = exports.COMPETITION_URL = function COMPETITION_URL(competition) {
    return BASE_URL + '/competitions/' + competition;
};
var MATCH_URL = exports.MATCH_URL = function MATCH_URL(competition, season, stage, match) {
    return BASE_URL + '/timelines/' + competition + '/' + season + '/' + stage + '/' + match;
};