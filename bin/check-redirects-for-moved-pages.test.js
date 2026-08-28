const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  filePathToUrlPath,
  extractFrontMatter,
  resolveOldUrl,
  vercelPatternToRegex,
  findMatchingRedirect,
  loadRedirects,
} = require('./check-redirects-for-moved-pages.js');

describe('filePathToUrlPath', () => {
  it('strips docs/ prefix and extension', () => {
    assert.strictEqual(
      filePathToUrlPath('docs/tutorials/go/build-an-ecommerce-app/setup.md'),
      '/tutorials/go/build-an-ecommerce-app/setup',
    );
  });

  it('handles .mdx extension', () => {
    assert.strictEqual(
      filePathToUrlPath('docs/tutorials/go/background-check/introduction.mdx'),
      '/tutorials/go/background-check/introduction',
    );
  });

  it('strips /index from directory pages', () => {
    assert.strictEqual(
      filePathToUrlPath('docs/getting_started/go/dev_environment/index.md'),
      '/getting_started/go/dev_environment',
    );
  });
});

describe('extractFrontMatter', () => {
  it('extracts slug', () => {
    const content = '---\nslug: /\ntitle: Home\n---\nBody text';
    assert.deepStrictEqual(extractFrontMatter(content), { slug: '/' });
  });

  it('does not extract id (Docusaurus 2.x: id does not affect URL)', () => {
    const content = '---\nid: go-dev-env\ntitle: Dev Env\n---\n';
    assert.deepStrictEqual(extractFrontMatter(content), {});
  });

  it('returns empty object when no frontmatter', () => {
    assert.deepStrictEqual(extractFrontMatter('Just body text'), {});
  });
});

describe('resolveOldUrl against real repo pages', () => {
  it('file path only (no slug, no id)', () => {
    const url = resolveOldUrl(
      'docs/getting_started/go/dev_environment/index.md',
      'HEAD',
    );
    assert.strictEqual(url, '/getting_started/go/dev_environment');
  });

  it('ignores id field (Docusaurus 2.x behavior)', () => {
    // This file has id: go-dev-env but the URL should come from file path
    const url = resolveOldUrl(
      'docs/getting_started/go/dev_environment/index.md',
      'HEAD',
    );
    assert.strictEqual(url, '/getting_started/go/dev_environment');
    assert.notStrictEqual(url, '/getting_started/go/go-dev-env');
  });

  it('absolute slug override', () => {
    const url = resolveOldUrl('docs/intro.md', 'HEAD');
    assert.strictEqual(url, '/');
  });

  it('page-to-folder rename resolves to same URL', () => {
    const oldUrl = filePathToUrlPath('docs/tutorials/go/build-an-ecommerce-app.md');
    const newUrl = filePathToUrlPath('docs/tutorials/go/build-an-ecommerce-app/index.md');
    assert.strictEqual(oldUrl, newUrl);
    assert.strictEqual(oldUrl, '/tutorials/go/build-an-ecommerce-app');
  });
});

describe('vercelPatternToRegex', () => {
  it('matches wildcard patterns', () => {
    const regex = vercelPatternToRegex('/tutorials/go/:path*');
    assert.ok(regex.test('/tutorials/go/build-an-ecommerce-app'));
    assert.ok(regex.test('/tutorials/go/some/deep/path'));
    assert.ok(!regex.test('/tutorials/python/something'));
  });

  it('matches exact paths', () => {
    const regex = vercelPatternToRegex('/tutorials/go/ecommerce/');
    assert.ok(regex.test('/tutorials/go/ecommerce/'));
    assert.ok(!regex.test('/tutorials/go/ecommerce/extra'));
  });
});

describe('findMatchingRedirect', () => {
  it('returns undefined for paths with no redirect', () => {
    const redirects = loadRedirects();
    const match = findMatchingRedirect(
      '/this/path/does/not/exist',
      redirects,
    );
    assert.strictEqual(match, undefined);
  });
});
