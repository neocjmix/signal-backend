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
    const {roomPassword, roomType, connectionId, clientId} = JSON.parse(event.body)
    const roomId = await save({
      roomPassword,
      roomType,
      members: {
        [clientId]: connectionId
      }
    });
    return ok(roomId);
  } catch (err) {
    return serverError(err);
  }
};

const authorize = (room, password, clientId) => (
  !room.roomPassword ||
  (room.roomPassword === password) ||
  Object.keys(room.members).includes(clientId)
);

exports.getRoom = async (event, context) => {
  try {
    const {roomId} = event.pathParameters;
    const {password: passwordInput, clientId: clientIdInput, connectionId} = JSON.parse(event.body) || {}
    const room = await get(roomId);

    if (room == null) {
      return notFound()
    }

    const roomInfo = JSON.parse(room);

    if (!roomInfo.members[clientIdInput] && Object.keys(roomInfo.members).length >= 2) {
      console.log(roomInfo);
      return forbidden("ROOM_IS_FULL");
    }

    if (authorize(roomInfo, passwordInput, clientIdInput)) {
      const updatedRoom = {
        roomId,
        ...roomInfo,
        members: {
          ...roomInfo.members,
          [clientIdInput]: connectionId
        }
      };

      await save(updatedRoom);

      return ok(JSON.stringify({
        roomType: updatedRoom.roomType,
        members: updatedRoom.members
      }));
    }

    return forbidden();
  } catch (err) {
    return serverError(err);
  }
};
