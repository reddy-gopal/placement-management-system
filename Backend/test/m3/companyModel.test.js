import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Company from '../../src/entity/Company.js';

const validCompany = (overrides = {}) => new Company({
  recruiterId: new mongoose.Types.ObjectId(),
  name: 'Example Labs',
  website: 'https://example.com',
  industry: 'Software',
  logoUrl: 'https://example.com/logo.png',
  contactEmail: 'HIRING@EXAMPLE.COM',
  contactPhone: '+91 90000 00000',
  ...overrides
});

test('company model accepts and normalizes a valid company', async () => {
  const company = validCompany({ name: '  Example Labs  ' });
  await company.validate();

  assert.equal(company.name, 'Example Labs');
  assert.equal(company.contactEmail, 'hiring@example.com');
});

test('company model requires an M1 recruiter relationship and company name', async () => {
  const company = new Company({});

  await assert.rejects(
    () => company.validate(),
    (error) => Boolean(error.errors.recruiterId) && Boolean(error.errors.name)
  );
});

test('company model rejects invalid website, logo, and contact email values', async () => {
  const company = validCompany({
    website: 'invalid-website',
    logoUrl: 'ftp://example.com/logo.png',
    contactEmail: 'invalid-email'
  });

  await assert.rejects(
    () => company.validate(),
    (error) => (
      Boolean(error.errors.website)
      && Boolean(error.errors.logoUrl)
      && Boolean(error.errors.contactEmail)
    )
  );
});

test('company schema declares one unique company per recruiter', () => {
  const recruiterIndex = Company.schema.indexes().find(([fields]) => fields.recruiterId === 1);

  assert.ok(recruiterIndex);
  assert.equal(recruiterIndex[1].unique, true);
});

test('company JSON output does not expose the mongoose version key', () => {
  const company = validCompany();
  company.$__.version = 4;
  const output = company.toJSON();

  assert.equal(output.__v, undefined);
});
