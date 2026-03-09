import pool from '../db';

const eventsData = [
    // Janvier
    { date: '2026-01-24 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-01-31 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    // Février
    { date: '2026-02-14 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    // 16 au 20 Fev
    { date: '2026-02-16 09:00:00', title: 'Orchestre Départemental 52 à Chaumont', description: 'Du Lundi 16 au Vendredi 20 février', type: 'autre', location: 'Chaumont' },
    // Mars
    { date: '2026-03-07 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-03-14 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-03-21 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-03-27 19:30:00', title: 'Répétition générale', location: 'Centre socioculturel', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-03-28 20:00:00', title: 'CONCERT ANNUEL', description: "Avec en orchestre invité l'harmonie d'Is Sur Tille", location: 'Centre socioculturel', type: 'concert', orchestras: ['Harmonie'] },
    // Avril
    { date: '2026-04-04 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-04-07 09:00:00', title: 'Evaluations instrumentales', description: "Du Mardi 7 au Samedi 11 avril à l'école de musique", location: 'École de musique', type: 'autre' },
    { date: '2026-04-10 19:30:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] }, // 19h30-21h30
    // Mai
    { date: '2026-05-02 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-05-08 10:00:00', title: 'Cérémonies patriotiques', type: 'concert', orchestras: ['Harmonie', 'Sortilèges'] },
    { date: '2026-05-09 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    // Pont Ascension 16 mai sans repet
    { date: '2026-05-22 19:30:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-05-23 17:00:00', title: 'Répétition du GRAND ORCHESTRE (Optionnelle)', description: 'Ou Vendredi 22', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-05-30 17:00:00', title: 'Répétition du GRAND ORCHESTRE', type: 'repetition', orchestras: ['Harmonie'] },
    { date: '2026-05-31 10:00:00', title: "Fête de l’amitié", location: 'Fayl-Billot', type: 'concert', orchestras: ['Harmonie'] },
    // Juin
    { date: '2026-06-13 10:00:00', title: "Rencontre des classes d’orchestre", description: "Samedi 13 et Dimanche 14 juin. Avec Bourbonne, Chalindrey, Saint Appolinaire, Arcis sur Aube et Brienne Le Château. Présence T.Deleruyelle.", location: 'Bourbonne Les Bains', type: 'concert' },
    { date: '2026-06-20 18:00:00', title: "Fête de la musique", location: 'Chalindrey', type: 'concert' },
    { date: '2026-06-28 10:00:00', title: "5ème ESTIVAL DE CORGIRNON", description: "Toutes activités (sauf grand orchestre). Soirée animée par les professeurs.", location: 'Corgirnon', type: 'concert' },
    // Juillet
    { date: '2026-07-06 09:00:00', title: "31ème STAGE D’ORCHESTRE", description: "Du Lundi 6 au Vendredi 10 juillet", type: 'autre' },
    { date: '2026-07-13 21:00:00', title: "Retraite aux flambeaux", type: 'concert', orchestras: ['Harmonie', 'Sortilèges', 'Batucada'] }
];

const seed = async () => {
    try {
        console.log("Seeding events...");

        // 1. Fetch Orchestras to Map names
        const [orchRows] = await pool.query('SELECT id, name FROM orchestras');
        const orchestras = orchRows as { id: string, name: string }[];

        const getOrchId = (keyword: string) => {
            const found = orchestras.find(o => o.name.toLowerCase().includes(keyword.toLowerCase()));
            return found ? found.id : null;
        };

        const harmonieId = getOrchId('Harmonie') || getOrchId('Lyre'); // "Grand Orchestre" -> Harmonie usually
        const sortilegesId = getOrchId('Sortilèges') || getOrchId('Sortileges');
        const batucadaId = getOrchId('Batucada');

        console.log("Orchestra IDs Found:", { harmonieId, sortilegesId, batucadaId });

        for (const evt of eventsData) {
            // Insert Event
            // Note: Using UUID() in SQL or generating here? Let's use SQL UUID()
            // Wait, schema uses varchar(36). I should better generate UUID here or let DB handle if default... Schema says NO DEFAULT for ID usually in my previous view? 
            // Let's check schema provided by user: `id` varchar(36) NOT NULL. No default.
            // I need to generate UUIDs.

            // Simple UUID generator since crypto.randomUUID might need node 14.17+. 
            // Assuming environment supports it or I import it.
            // `import { v4 as uuidv4 } from 'uuid'` is safer if package exists, but crypto is standard.
            // User has `crypto` in `server/routes/orchestras.ts` so it is available.

            const eventId = require('crypto').randomUUID();

            await pool.query(
                'INSERT INTO events (id, title, description, event_type, event_date, location, practical_info) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [eventId, evt.title, evt.description || null, evt.type, evt.date, evt.location || null, null]
            );

            // Link Orchestras
            if (evt.orchestras) {
                for (const orchKey of evt.orchestras) {
                    let targetId = null;
                    if (orchKey === 'Harmonie') targetId = harmonieId;
                    if (orchKey === 'Sortilèges') targetId = sortilegesId;
                    if (orchKey === 'Batucada') targetId = batucadaId;

                    if (targetId) {
                        const linkId = require('crypto').randomUUID();
                        await pool.query(
                            'INSERT INTO event_orchestras (id, event_id, orchestra_id) VALUES (?, ?, ?)',
                            [linkId, eventId, targetId]
                        );
                    }
                }
            }
        }

        console.log(`Successfully inserted ${eventsData.length} events.`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding events:', error);
        process.exit(1);
    }
};

seed();
