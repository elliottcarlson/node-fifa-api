// @flow
export const BASE_URL = 'https://api.fifa.com/api/v1';
export const ACTIVE_URL = `${BASE_URL}/live/football/now`;
export const COMPETITION_URL = (competition: string) =>
    `${BASE_URL}/competitions/${competition}`;
export const MATCH_URL = (competition: string, season: string, stage: string, match: string) =>
    `${BASE_URL}/timelines/${competition}/${season}/${stage}/${match}`;
