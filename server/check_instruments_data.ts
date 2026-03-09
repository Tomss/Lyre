import pool from './db';

async function checkInstruments() {
    try {
        const [instruments] = await pool.query('SELECT name, photo_url FROM instruments');
        console.log('START_DATA');
        // @ts-ignore
        instruments.forEach(i => {
            console.log(`InstrumentName:${i.name}|PhotoURL:${i.photo_url}`);
        });
        console.log('END_DATA');
        process.exit(0);
    } catch (error) {
        console.error('Error fetching instruments:', error);
        process.exit(1);
    }
}

checkInstruments();
