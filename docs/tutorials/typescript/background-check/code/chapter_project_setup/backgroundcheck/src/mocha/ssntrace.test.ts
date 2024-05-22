// @@@SNIPSTART typescript-project-setup-chapter-backgroundcheck-activity-test
import { MockActivityEnvironment } from '@temporalio/testing';
import { describe, it } from 'mocha';
import * as activities from '../activities';
import assert from 'assert';

describe('ssnTrace activity', async () => {
  it('successfully passes the ssn trace', async () => {
    const env = new MockActivityEnvironment();
    const ssn = '111-22-3333';
    const result = await env.run(activities.ssnTrace, ssn);
    assert.equal(result, 'pass');
  });
});

// @@@SNIPEND
