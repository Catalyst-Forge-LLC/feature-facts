// featurefacts: resume-importer
export function mount(app: { post: Function; get: Function }) {
  app.post('/api/import', () => undefined);
  app.get('/api/import/status', () => undefined);
}
