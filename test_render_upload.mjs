import jwt from 'jsonwebtoken';
import fs from 'fs';

const JWT_SECRET = 'dc4b109fc2ecc6c68040793d6e3c2b7b57cf00fc675833dee10a4187e1cb81dabf5137ebbd78e014ed9d24cdb06a80e7e';

const token = jwt.sign({ id: 1, role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });

const fileBuffer = fs.readFileSync('./test_image.png');
const blob = new Blob([fileBuffer], { type: 'image/png' });

const form = new FormData();
form.append('file', blob, 'test_image.png');

fetch('http://localhost:3001/api/upload', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: form
})
.then(res => res.text().then(text => console.log('Local Auth test - Status:', res.status, 'Response:', text)))
.catch(err => console.error(err));
