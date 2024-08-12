import mongoose from 'mongoose';
import { VPLAYER } from '../constansts.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URI}/${VPLAYER}`
        );

        console.log(
            `Database is connected! DB HOST: ${connectionInstance.connection.host} `
        );
    } catch (error) {
        console.log('MONGO_DB ERROR: ', error);
        process.exit(1);
    }
};

export { connectDB };
