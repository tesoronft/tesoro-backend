export const authContants = {
  PASSWORD_REGEX_PATTERN:
    /^(?=.*[a-z])(?=.*\d)(?=.*[@#$%^&*()+!={}~`_\[\]'\\/:;,.<>?"|\-||]).{8,}$/,
};

export const pagination = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 15,
};

export enum ROLE {
  ADMIN = 'Admin',
  USER = 'User',
}

export enum TreasureScope {
  ALL = 'all',
  MINE = 'mine',
}
