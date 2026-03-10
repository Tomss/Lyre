fetch('https://lyre-frontend.pages.dev/assets/index-CwGKzXCg.js')
  .then(res => res.text())
  .then(text => {
    console.log('--- FRONTEND BUNDLE INSPECTION ---');
    console.log('Contains localhost:', text.includes('localhost:3001'));
    console.log('Contains render.com:', text.includes('render.com'));
    const exactMatch = text.match(/https:\/\/lyre-b45q\.onrender\.com[a-zA-Z0-9\/]*/g);
    console.log('Exact Render URLs in bundle:', exactMatch);
  })
  .catch(err => console.error(err));
