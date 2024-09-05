export enum Errors {
    TooManyRequests = "Too Many Requests",
    InvalidSignature = "invalid signature",
    UserNotAdded = "User not added in group!",
    MaxParticipantsReached = "Total number of participants reached!",
    UserNotRemoved = "User was not removed from the group!",
    NoGroupsWereDeletes = "No groups were deleted!",
    UnableToCreateBot = "Unable to create bot!",
    UnableToDeleteBot = "Unable to delete bot!",
    InternalServerError = "Internal server error!",
    UserNotFound = "User not found!",
    BotNotFound = "Bot not found!",
    InvalidUsernameOrPassword = "Invalid username/password!",
    CouldNotDeleteItem = "Could not delete item!",
    InvalidToken = "Invalid token!",
    JwtMustBeProvided = "jwt must be provided",
    NoDocumentsMatchedQuery = "No documents matched the query.",
    TheBotIsAlreadyRunning = "The bot is already running.",
    ThisBotIsUnableToPerformThisAction = "This bot is unable to perform this action.",
    JwtExpired = "jwt expired"
}