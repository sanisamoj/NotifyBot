import { ErrorResponse } from "../data/models/interfaces/ErrorResponse"
import { Errors } from "../data/models/enums/Errors"

export function errorResponse(error: string): ErrorResponse {
    switch (error) {
        case Errors.UnableToCreateBot:
            return {
                statusCode: 500,
                error: Errors.UnableToCreateBot,
                details: "There was an error creating the bot."
            }
        case Errors.UnableToDeleteBot:
            return {
                statusCode: 422,
                error: Errors.UnableToDeleteBot,
                details: "There was an error deleting the bot."
            }
        case Errors.BotNotFound:
            return {
                statusCode: 404,
                error: Errors.BotNotFound,
                details: null
            }
        case Errors.TheBotIsAlreadyRunning:
            return {
                statusCode: 403,
                error: Errors.TheBotIsAlreadyRunning,
                details: null
            }
        case Errors.MaxParticipantsReached:
            return {
                statusCode: 409,
                error: Errors.MaxParticipantsReached,
                details: "The maximum number of participants in the group has been reached [1003]."
            }
        case Errors.UserNotRemoved:
            return {
                statusCode: 400,
                error: Errors.UserNotRemoved,
                details: "User has not been removed."
            }
        case Errors.UserNotAdded:
            return {
                statusCode: 400,
                error: Errors.UserNotAdded,
                details: "User has not been added."
            }
        case Errors.NoGroupsWereDeletes:
            return {
                statusCode: 400,
                error: Errors.NoGroupsWereDeletes,
                details: "There are no groups to be deleted."
            }
        case Errors.InvalidUsernameOrPassword:
            return {
                statusCode: 401,
                error: Errors.InvalidUsernameOrPassword,
                details: null
            }
        case Errors.JwtMustBeProvided:
            return {
                statusCode: 401,
                error: Errors.JwtMustBeProvided,
                details: null
            }
        case Errors.JwtExpired:
            return {
                statusCode: 401,
                error: Errors.JwtExpired,
                details: null
            }
        case Errors.InvalidToken:
            return {
                statusCode: 401,
                error: Errors.InvalidToken,
                details: null
            }
        case Errors.CouldNotDeleteItem:
            return {
                statusCode: 404,
                error: Errors.CouldNotDeleteItem,
                details: "No items found matching the provided conditions."
            }
        case Errors.InvalidSignature:
            return {
                statusCode: 401,
                error: Errors.InvalidSignature,
                details: null
            }
        case Errors.TooManyRequests:
            return {
                statusCode: 429,
                error: Errors.TooManyRequests,
                details: null
            }
        case Errors.ThisBotIsUnableToPerformThisAction:
            return {
                statusCode: 422,
                error: Errors.ThisBotIsUnableToPerformThisAction,
                details: "Emergency bots are limited in certain functionalities."
            }
        default:
            if (error.includes(Errors.RateLimitExceeded)) {
                return {
                    statusCode: 422,
                    error: Errors.RateLimitExceeded,
                    details: "Emergency bots are limited in certain functionalities."
                }
            }
            return {
                statusCode: 500,
                error: error,
                details: Errors.InternalServerError
            }
    }
}
