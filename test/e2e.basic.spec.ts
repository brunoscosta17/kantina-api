import request from 'supertest';

const BASE = 'http://localhost:3000';
const TENANT = process.env.DEMO_TENANT_ID || ''; // opcional: exporte do seed.demo
const ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'admin@demo.com';
const ADMIN_PASS = process.env.DEMO_ADMIN_PASS || 'admin123';

describe('E2E (smoke)', () => {
  let token = '';
  let studentId = '';

  it('login', async () => {
    const res = await request(BASE)
      .post('/auth/login')
      .set('x-tenant', TENANT)
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASS })
      .expect(201);
    token = res.body.accessToken;
    expect(token).toBeTruthy();
  });

  it('catalog (authed)', async () => {
    await request(BASE).get('/catalog').set('Authorization', `Bearer ${token}`).expect(200);
  });

  it('students list and pick one', async () => {
    const res = await request(BASE)
      .get('/reports/orders?limit=1') // só para forçar authed route
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    // como não temos students endpoint listado aqui, pegue via seed se necessário
  });

  it('wallet topup idempotente', async () => {
    // substitua pelo ID do student do seed.demo
    studentId = process.env.DEMO_STUDENT_ID || '';
    const requestId = `test-topup-${Date.now()}`;

    const r1 = await request(BASE)
      .post(`/wallets/${studentId}/topup`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 100, requestId })
      .expect(201);

    const r2 = await request(BASE)
      .post(`/wallets/${studentId}/topup`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amountCents: 100, requestId }) // replay
      .expect(201);

    expect(r2.body.balanceCents).toBe(r1.body.balanceCents); // não duplica
  });
});
