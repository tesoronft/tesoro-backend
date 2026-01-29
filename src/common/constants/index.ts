export const authContants = {
  PASSWORD_REGEX_PATTERN:
    /^(?=[A-Za-z@#$%^&*()+!={}~`_\[\]'\\/:;,.<>?"|\-\[\]]+$)(?=.*[a-z])(?=.*[@#$%^&*()+!={}~`_\[\]'\\/:;,.<>?"|\-\[\]]).{8,}$/,
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
