import { SchemaCompilerService } from './schema-compiler.service';
import { GeneratedSchema } from '@common/ai';

/**
 * L4 / hardening-medium-low — fieldsHash collision coverage.
 *
 * REQ-L4-1: a different fieldsHash MUST drop the in-memory map entry AND call
 *           connection.deleteModel(name) before re-registering, so subsequent
 *           connection.model(name) calls return the NEW Mongoose model.
 * REQ-L4-2: an equal fieldsHash MUST be idempotent (no unregister, no churn).
 * REQ-L4-3: DYNAMIC_SCHEMA_LEGACY=true MUST short-circuit the Mongoose
 *           deleteModel call.
 */
describe('SchemaCompilerService — fieldsHash collision (L4)', () => {
  function makeSchemaA(): GeneratedSchema {
    return {
      collectionName: 'coll_a',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'count', type: 'number' },
      ],
    };
  }

  function makeSchemaB(): GeneratedSchema {
    return {
      collectionName: 'coll_a',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'count', type: 'number' },
        { name: 'description', type: 'string' },
      ],
    };
  }

  function makeMockConnection() {
    // Minimal Mongoose Connection double: model(name, schema?) registers a
    // model; model(name) looks it up; modelNames() reflects what's registered;
    // deleteModel(name) drops the entry.
    const registered = new Map<string, unknown>();
    return {
      model: jest.fn((name: string, schema?: unknown) => {
        if (schema !== undefined) registered.set(name, schema);
        return registered.get(name);
      }),
      modelNames: jest.fn(() => Array.from(registered.keys())),
      deleteModel: jest.fn((name: string) => {
        registered.delete(name);
      }),
    } as any;
  }

  it('replaces the Mongoose model when fieldsHash changes (REQ-L4-1)', () => {
    const connection = makeMockConnection();
    const svc = new SchemaCompilerService(connection);

    const a = svc.compileAndRegister(makeSchemaA(), 'coll_a');
    expect(a.success).toBe(true);
    expect(a.idempotent).toBeUndefined();
    // After first compile, connection.model MUST have been called once.
    expect(connection.model).toHaveBeenCalledTimes(1);
    expect(connection.model).toHaveBeenLastCalledWith(
      'coll_a',
      expect.anything(),
    );

    const firstRegistered = connection.model('coll_a');
    expect(firstRegistered).toBeDefined();
    // The lookup above is a 2nd mock call (jest.fn() with implementation).
    // Reset the call tracker so we can isolate the SECOND compile's behavior.
    (connection.model as jest.Mock).mockClear();

    const b = svc.compileAndRegister(makeSchemaB(), 'coll_a');
    expect(b.success).toBe(true);

    // deleteModel MUST have been called for the stale registration.
    expect(connection.deleteModel).toHaveBeenCalledWith('coll_a');
    // connection.model MUST have been called once for the second compile.
    expect(connection.model).toHaveBeenCalledTimes(1);
    expect(connection.model).toHaveBeenLastCalledWith(
      'coll_a',
      expect.anything(),
    );
    // After re-registering, connection.model('coll_a') returns the NEW model
    // (different identity from the first).
    const secondRegistered = connection.model('coll_a');
    expect(secondRegistered).toBeDefined();
    expect(secondRegistered).not.toBe(firstRegistered);
  });

  it('is idempotent when fieldsHash matches (REQ-L4-2)', () => {
    const connection = makeMockConnection();
    const svc = new SchemaCompilerService(connection);

    const a1 = svc.compileAndRegister(makeSchemaA(), 'coll_b');
    expect(a1.success).toBe(true);
    expect(a1.idempotent).toBeUndefined();

    // Second compile of the SAME schema MUST return idempotent=true and
    // NOT call deleteModel or re-register a Mongoose model.
    connection.modelNames.mockReturnValue(['coll_b']);
    const a2 = svc.compileAndRegister(makeSchemaA(), 'coll_b');
    expect(a2.success).toBe(true);
    expect(a2.idempotent).toBe(true);

    // connection.model was only called once (the first compile).
    expect(connection.model).toHaveBeenCalledTimes(1);
    expect(connection.deleteModel).not.toHaveBeenCalled();
  });

  it('skips Mongoose deleteModel when DYNAMIC_SCHEMA_LEGACY=true (REQ-L4-3)', () => {
    const original = process.env.DYNAMIC_SCHEMA_LEGACY;
    process.env.DYNAMIC_SCHEMA_LEGACY = 'true';
    try {
      const connection = makeMockConnection();
      const svc = new SchemaCompilerService(connection);

      const a = svc.compileAndRegister(makeSchemaA(), 'coll_c');
      expect(a.success).toBe(true);
      // Legacy mode: connection.model() MUST NOT be called.
      expect(connection.model).not.toHaveBeenCalled();

      // Even if something claims the collection is registered, the legacy
      // short-circuit means deleteModel MUST NOT be called.
      connection.modelNames.mockReturnValue(['coll_c']);
      const b = svc.compileAndRegister(makeSchemaB(), 'coll_c');
      expect(b.success).toBe(true);
      expect(connection.deleteModel).not.toHaveBeenCalled();
      expect(connection.model).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) {
        delete process.env.DYNAMIC_SCHEMA_LEGACY;
      } else {
        process.env.DYNAMIC_SCHEMA_LEGACY = original;
      }
    }
  });
});
