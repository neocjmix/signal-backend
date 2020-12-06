const ALLOW_ORIGIN = '*';

const response = (statusCode, body) => ({
  statusCode: statusCode,
  headers: {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN
  },
  body: body.toString(),
});

const error = (statusCode, err) => {
  console.error(err);
  return response(statusCode, err);
};

exports.serverError = err => error(500, err || "internal server error");
exports.forbidden = err => error(403, err || "forbidden");
exports.notFound = err => error(404, err || "not found");
exports.ok = body => response(200, body);