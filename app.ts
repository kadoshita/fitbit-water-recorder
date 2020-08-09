import fastify from 'fastify';
import { IncomingMessage } from 'http';
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const FITBIT_API_BASIC_TOKEN = process.env.FITBIT_API_BASIC_TOKEN;
const FITBIT_API_BEARER_TOKEN = process.env.FITBIT_API_BEARER_TOKEN;
const FITBIT_REFRESH_TOKEN = process.env.FITBIT_REFRESH_TOKEN;

type RequestBody = {
    amount: number | undefined
};

type SecretsJSONData = {
    basic_token: string,
    bearer_token: string,
    refresh_token: string
};

const server = fastify({
    rewriteUrl: (req: IncomingMessage): string => {
        return '/';
    }
});

const readSecretsAsJSON = (): Promise<SecretsJSONData> => {
    return new Promise((resolve, reject) => {
        fs.readFile('secrets.json', (err, data) => {
            if (err) {
                return reject(err);
            }

            const jsonData: SecretsJSONData = JSON.parse(data.toString());
            return resolve(jsonData);
        });
    });
};
const storeNewSecrets = (data: SecretsJSONData) => {
    return new Promise((resolve, reject) => {
        fs.writeFile('secrets.json', JSON.stringify(data), err => {
            if (err) {
                return reject(err);
            }

            return resolve();
        });
    });
};
server.get('/', async (request, reply) => {
    return 'OK';
});

server.post('/', async (request, reply) => {
    const body: RequestBody = request.body as RequestBody;
    const envData: SecretsJSONData = await readSecretsAsJSON();

    if (body && body.amount) {
        const date = new Date();
        const timestamp = date.toISOString().split('T')[0];
        const basic_token: string = envData.basic_token || FITBIT_API_BASIC_TOKEN || '';
        const bearer_token: string = envData.bearer_token || FITBIT_API_BEARER_TOKEN || '';
        const refresh_token: string = envData.refresh_token || FITBIT_REFRESH_TOKEN || '';
        axios.post(`https://api.fitbit.com/1/user/-/foods/log/water.json?amount=${body.amount}&date=${timestamp}`, null, {
            headers: {
                'Authorization': `Bearer ${bearer_token}`
            }
        }).then(() => {
            console.log(`[${date.toISOString()}] Log Water amount: ${body.amount} ml.`);
        }).catch(e => {
            if (e.response.data.errors[0].errorType === 'expired_token') {
                console.log('refresh_token');
                axios.post(`https://api.fitbit.com/oauth2/token?grant_type=refresh_token&refresh_token=${refresh_token}`, null, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Basic ${basic_token}`
                    }
                }).then(async res => {
                    const new_access_token = res.data.access_token;
                    const new_refresh_token = res.data.refresh_token;
                    const newSecrets: SecretsJSONData = {
                        basic_token: basic_token,
                        bearer_token: new_access_token,
                        refresh_token: new_refresh_token
                    };
                    await storeNewSecrets(newSecrets);
                    axios.post(`https://api.fitbit.com/1/user/-/foods/log/water.json?amount=${body.amount}&date=${timestamp}`, null, {
                        headers: {
                            'Authorization': `Bearer ${new_access_token}`
                        }
                    }).then(() => {
                        console.log(`[${date.toISOString()}] Log Water amount: ${body.amount} ml.`);
                    }).catch(e => {
                    });
                }).catch(e => {
                    console.error(e.response.data);
                });
            } else {
                console.error(e.response.data);
            }
        });
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