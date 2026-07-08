/**
 * firestore.rules unit tests
 *
 * Run with:
 *   npx jest firestore.test.js --no-coverage
 *
 * Requires the Firestore emulator to be running on port 8080 (default) OR
 * @firebase/rules-unit-testing handles spin-up automatically.
 */

const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require('@firebase/rules-unit-testing');

const fs   = require('fs');
const path = require('path');

let testEnv;

// ── Bootstrap ────────────────────────────────────────────────────────────────
beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'artway-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, 'firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const asAdmin = () =>
  testEnv.authenticatedContext('admin-uid', { admin: true }).firestore();

const asUser = (uid = 'user-uid') =>
  testEnv.authenticatedContext(uid).firestore();

const asGuest = () =>
  testEnv.unauthenticatedContext().firestore();

// ── isAdmin() — the core fix ─────────────────────────────────────────────────
describe('isAdmin() relies only on custom claim', () => {
  test('user with admin: true claim can read artist docs', async () => {
    await assertSucceeds(
      asAdmin().collection('artists').get()
    );
  });

  test('regular user WITHOUT admin claim cannot read artist docs', async () => {
    await assertFails(
      asUser().collection('artists').get()
    );
  });

  test('unauthenticated cannot read artist docs', async () => {
    await assertFails(
      asGuest().collection('artists').get()
    );
  });
});

// ── /users/{uid} — anti-escalation rules ────────────────────────────────────
describe('/users/{uid} role write protection', () => {
  test('user can create their own doc without role field', async () => {
    const db = asUser('alice');
    await assertSucceeds(
      db.collection('users').doc('alice').set({ displayName: 'Alice' })
    );
  });

  test('user CANNOT create their own doc with role field', async () => {
    const db = asUser('alice');
    await assertFails(
      db.collection('users').doc('alice').set({ displayName: 'Alice', role: 'admin' })
    );
  });

  test('user CANNOT create their own doc with isAdmin field', async () => {
    const db = asUser('alice');
    await assertFails(
      db.collection('users').doc('alice').set({ displayName: 'Alice', isAdmin: true })
    );
  });

  test('user CANNOT create doc for another uid', async () => {
    const db = asUser('alice');
    await assertFails(
      db.collection('users').doc('bob').set({ displayName: 'Bob' })
    );
  });

  test('user can update their own non-role fields', async () => {
    // Seed the doc via admin SDK (no rules)
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('users').doc('alice').set({ displayName: 'Old Name', email: 'a@b.com' });
    });

    const db = asUser('alice');
    await assertSucceeds(
      db.collection('users').doc('alice').update({ displayName: 'New Name' })
    );
  });

  test('user CANNOT update the role field on their own doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('users').doc('alice').set({ displayName: 'Alice', role: 'user' });
    });

    const db = asUser('alice');
    await assertFails(
      db.collection('users').doc('alice').update({ role: 'admin' })
    );
  });

  test('user CANNOT update isAdmin field on their own doc', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('users').doc('alice').set({ displayName: 'Alice' });
    });

    const db = asUser('alice');
    await assertFails(
      db.collection('users').doc('alice').update({ isAdmin: true })
    );
  });

  test('admin can update any user doc including role field', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('users').doc('alice').set({ displayName: 'Alice', role: 'user' });
    });

    // Admin SDK writes bypass rules, but we verify an admin-claimed token can update
    await assertSucceeds(
      asAdmin().collection('users').doc('alice').update({ role: 'admin' })
    );
  });
});

// ── submissions (public create) ──────────────────────────────────────────────
describe('/submissions collection', () => {
  const validSubmission = {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    formType: 'REGISTRY',
    submitterUid: 'anonymous',
  };

  test('anonymous user can create a valid submission', async () => {
    await assertSucceeds(
      asGuest().collection('submissions').add(validSubmission)
    );
  });

  test('submission with invalid email is rejected', async () => {
    await assertFails(
      asGuest().collection('submissions').add({ ...validSubmission, email: 'not-an-email' })
    );
  });

  test('submission missing required fields is rejected', async () => {
    await assertFails(
      asGuest().collection('submissions').add({ firstName: 'Jane' })
    );
  });

  test('anonymous user cannot read submissions', async () => {
    await assertFails(
      asGuest().collection('submissions').get()
    );
  });

  test('regular user cannot read submissions', async () => {
    await assertFails(
      asUser().collection('submissions').get()
    );
  });

  test('admin can read submissions', async () => {
    await assertSucceeds(
      asAdmin().collection('submissions').get()
    );
  });
});

// ── audit_logs ───────────────────────────────────────────────────────────────
describe('/audit_logs collection', () => {
  test('authenticated user can write to audit_logs', async () => {
    await assertSucceeds(
      asUser().collection('audit_logs').add({ action: 'TEST', timestamp: Date.now() })
    );
  });

  test('unauthenticated cannot write audit_logs', async () => {
    await assertFails(
      asGuest().collection('audit_logs').add({ action: 'TEST' })
    );
  });

  test('only admin can read audit_logs', async () => {
    await assertFails(asUser().collection('audit_logs').get());
    await assertSucceeds(asAdmin().collection('audit_logs').get());
  });

  test('no one can delete audit_logs', async () => {
    // Seed a doc
    let docId;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = await ctx.firestore().collection('audit_logs').add({ action: 'OLD' });
      docId = ref.id;
    });

    await assertFails(asAdmin().collection('audit_logs').doc(docId).delete());
    await assertFails(asUser().collection('audit_logs').doc(docId).delete());
  });
});

// ── crmContacts ──────────────────────────────────────────────────────────────
describe('/crmContacts collection security rules', () => {
  test('unauthenticated users cannot read or write crmContacts', async () => {
    const db = asGuest();
    await assertFails(db.collection('crmContacts').get());
    await assertFails(db.collection('crmContacts').add({ name: 'VIP', ownerId: 'some-uid' }));
  });

  test('authenticated users can read and write their own crmContacts', async () => {
    const db = asUser('alice');
    await assertSucceeds(
      db.collection('crmContacts').doc('contact-1').set({ name: 'Bob Collector', ownerId: 'alice' })
    );
    await assertSucceeds(
      db.collection('crmContacts').doc('contact-1').get()
    );
  });

  test('authenticated users cannot read or write another user\'s crmContacts', async () => {
    // Seed doc for bob
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('crmContacts').doc('contact-2').set({ name: 'VIP Buyer', ownerId: 'bob' });
    });

    const db = asUser('alice');
    await assertFails(
      db.collection('crmContacts').doc('contact-2').get()
    );
    await assertFails(
      db.collection('crmContacts').doc('contact-2').update({ name: 'Hacked name' })
    );
  });

  test('admin can read and write any crmContacts', async () => {
    // Seed doc for bob
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('crmContacts').doc('contact-3').set({ name: 'VIP Curator', ownerId: 'bob' });
    });

    const db = asAdmin();
    await assertSucceeds(
      db.collection('crmContacts').doc('contact-3').get()
    );
    await assertSucceeds(
      db.collection('crmContacts').doc('contact-3').update({ name: 'Updated by Admin' })
    );
  });

  test('developer email (faal@eazy.media) can read and write any crmContacts as admin', async () => {
    // Authenticate as faal@eazy.media
    const db = testEnv.authenticatedContext('dev-uid', { email: 'faal@eazy.media' }).firestore();
    
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await ctx.firestore().collection('crmContacts').doc('contact-4').set({ name: 'Art Collector', ownerId: 'bob' });
    });

    await assertSucceeds(
      db.collection('crmContacts').doc('contact-4').get()
    );
    await assertSucceeds(
      db.collection('crmContacts').doc('contact-4').update({ name: 'Updated by Dev' })
    );
  });
});
