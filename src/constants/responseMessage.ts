export const responseMessage = Object.freeze({
    SUCCESS: 'Success',
    ERROR: {
        NOT_FOUND: 'Resource not found',
        SOMETHING_WENT_WRONG: 'Something went wrong',
    },
} as const);
