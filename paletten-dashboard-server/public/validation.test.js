import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSnapshot, bearerToken } from '../src/validation.js';
const state={schemaVersion:14,employees:[],palettes:[],loads:[],errors:[],audits:[],closures:[],exportPlans:[],kanbanProducts:[],kanbanMovements:[],replenishmentRequests:[],tdsCustomers:[],tdsPreparations:[],inboundDeliveries:[]};
test('accepts valid empty V3.9.3 snapshot',()=>assert.equal(validateSnapshot({revision:0,state}),null));
test('rejects invalid revision',()=>assert.match(validateSnapshot({revision:-1,state}),/revision/));
test('rejects missing arrays',()=>assert.match(validateSnapshot({revision:0,state:{...state,palettes:null}}),/palettes/));
test('rejects wrong schema',()=>assert.match(validateSnapshot({revision:0,state:{...state,schemaVersion:13}}),/schemaVersion/));
test('extracts bearer token',()=>assert.equal(bearerToken('Bearer abc'),'abc'));
