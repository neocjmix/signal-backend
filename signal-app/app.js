const {notFound} = require("./response");
const {forbidden} = require("./response");
const {get, save} = require("./service/roomService");
const {ok, serverError} = require("./response");

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.createRoom = async (event, context) => {
  try {
    const {roomPassword, roomType, connectionId} = JSON.parse(event.body)
    const roomId = await save({roomPassword, roomType, connectionId});
    return ok(roomId);
  } catch (err) {
    return serverError(err);
  }
};

exports.getRoom = async (event, context) => {
  try {
    const {roomId} = event.pathParameters;
    const {roomPassword: roomPasswordInput} = JSON.parse(event.body) || {}
    const room = await get(roomId);

    if(room == null) return notFound()

    const {roomPassword, roomType, connectionId} = JSON.parse(room);

    if (roomPassword && roomPassword !== roomPasswordInput) return forbidden();

    return ok(JSON.stringify({roomType, connectionId}));
  } catch (err) {
    return serverError(err);
  }
};
