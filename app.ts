import fastify from 'fastify';
import { IncomingMessage } from 'http';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const FITBIT_API_TOKEN = process.env.FITBIT_API_TOKEN;

type RequestBody = {
    amount: number | undefined
};

const server = fastify({
    rewriteUrl: (req: IncomingMessage): string => {
        return '/';
    }
});

server.get('/', async (request, reply) => {
    return 'OK';
});

server.post('/', async (request, reply) => {
    const body: RequestBody = request.body as RequestBody;
    if (body && body.amount) {
        const date = new Date();
        const timestamp = date.toISOString().split('T')[0];
        axios.post(`https://api.fitbit.com/1/user/-/foods/log/water.json?amount=${body.amount}&date=${timestamp}`, null, {
            headers: {
                'Authorization': `Bearer ${FITBIT_API_TOKEN}`
            }
        }).then(() => {
            console.log(`Log Water amount: ${body.amount} ml.`);
        })
    }
    return 'OK';
});

server.listen(3000, '0.0.0.0', (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }

    console.log(`Server listening at ${address}`);
});