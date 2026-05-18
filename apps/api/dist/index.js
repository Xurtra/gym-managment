import { createServer } from "node:http";
import { createApp, createPostgresServices } from "./app.js";
import { loadConfig } from "./config/env.js";
const config = loadConfig();
const services = config.persistenceDriver === "postgres" ? createPostgresServices(config) : undefined;
const server = createServer(createApp(config, services));
server.listen(config.port, config.host, () => {
    console.log(`Gym Platform API listening on http://${config.host}:${config.port}`);
});
//# sourceMappingURL=index.js.map