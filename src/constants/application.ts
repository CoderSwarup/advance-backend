export const EApplicationEnvironment = Object.freeze({
    PRODUCTION: 'production',
    DEVELOPMENT: 'development',
} as const);

export type ApplicationEnvironment =
    (typeof EApplicationEnvironment)[keyof typeof EApplicationEnvironment];
