import { app } from './app.js';
import { connectDB } from './database/index.js';
import dotenv from 'dotenv';

dotenv.config();

connectDB()
    .then(() => {
        const PORT = process.env.PORT;
        app.listen(PORT, () => {
            console.log(`Servier is connected at: ${PORT}`);
        });
        app.on('error', (err) =>
            console.log('Error while connecting to server !!', err)
        );
    })
    .catch((err) => console.log('MongoDB connection failed !!!', err));
