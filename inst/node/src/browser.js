const {
  FastifyInstance,
  RawServerDefault,
  FastifyBaseLogger,
  FastifyTypeProvider,
  FastifyRequest,
  FastifyReply,
} = require("fastify");
const { IncomingMessage, ServerResponse } = require("http");
const { objs, camelCaseRecursive } = require("./vars");
const Browser = require("./response/browser");
const { camelCase } = require("lodash");
const importTypes = require("./import-types");

/**
 *
 * @param {FastifyInstance<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, FastifyBaseLogger, FastifyTypeProvider>} instance
 * @param {{ prefix: string; }} opts
 * @param {(err?: Error | undefined) => void} next
 */
exports.browserPlugin = (instance, opts, next) => {
  instance.post(
    "/new",
    async function (request, reply) {
      if (!["chromium", "firefox", "webkit"].includes(request.body.type)) {
        reply
          .type("application/json")
          .send({
            error: true,
            message: `Browser ${request.body.type} is not supported`,
          });
      }

      const b = new Browser();
      
      // MODIFICAR: Leer headless del body, usar true por defecto
      const headless = request.body.headless !== undefined 
        ? request.body.headless 
        : true;
      
      // MODIFICAR: Pasar headless al método launch
      await b.launch(request?.body?.type, { headless: headless })
      
      objs[b.id] = b;
      reply.type("application/json").send(b);
    }
  );

  instance.post("/:command", async function (request, reply) {
    try {
      let command = camelCase(request.params?.command || "");
      let { id, args = [] } = request.body || {};
      args = camelCaseRecursive(args);

      try {
        args = args.map((arg) => eval(arg));
      } catch (err) {}

      /** @type {Browser} */
      let browser = objs[id];
      let ret = null;

      if (browser) {
        const types = await importTypes()
        ret = browser.invoke(types, command, ...args);
      }

      reply.type("application/json").send(ret);
    } catch (err) {
      reply.type("application/json").send({ type: 'Error', value: err?.message || '' });
    }
  });

  next();
};
