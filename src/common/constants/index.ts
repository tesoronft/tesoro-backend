export const authContants = {
  PASSWORD_REGEX_PATTERN:
    /^(?=[A-Za-z0-9@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]+$)(?=.*[a-z])(?=.*[0-9])(?=.*[@#$%^&*()+!={}~`_\[\]\'\\/:;,.<>?~"|\-\[\]]).{8,}$/,
};

export const pagination = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 15,
};

export enum ROLE {
  ADMIN = 'Admin',
  USER = 'User',
}
