// featurefacts: admin-export
export function mountAdmin(app: { post: Function }) {
  app.post('/api/admin/export', () => undefined);
}
