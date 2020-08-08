import fastify from "fastify";
import { IncomingMessage } from "http";

const server = fastify({
    rewriteUrl: (req: IncomingMessage): string => {
        return '/';
    }
});

server.get('/', async (request, reply) => {
    return 'OK';
});

server.post('/', async (request, reply) => {
    console.log(request.body);
    return 'OK';
});

server.listen(3000, '0.0.0.0', (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`Server listening at ${address}`);
});