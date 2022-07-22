import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import {useDoc} from '@docusaurus/theme-common/internal';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import TagsListInline from '@theme/TagsListInline';
import LastUpdated from '@theme/LastUpdated';
import styles from './styles.module.css';

function TagsRow(props) {
  return (
    <div className={clsx('col', styles.headerTags)}>
      <TagsListInline {...props} />
    </div>
  );
}

function DocPublishInfo() {
  const {metadata} = useDoc();

  const {lastUpdatedAt, formattedLastUpdatedAt, lastUpdatedBy, tags} = metadata;
  const canDisplayTagsRow = tags.length > 0;

  const canDisplayEditMetaRow = !!(lastUpdatedAt || lastUpdatedBy);
  const canDisplayPublishInfo = canDisplayEditMetaRow;
  if (!canDisplayPublishInfo) {
    return null;
  }
  return (
    <section className="docPublishInfo">
      <div className={clsx(ThemeClassNames.docs.docFooterEditMetaRow, 'row')}>

        <div className={clsx('col', styles.lastUpdated)}>
          {(lastUpdatedAt || lastUpdatedBy) && (
            <LastUpdated
              lastUpdatedAt={lastUpdatedAt}
              formattedLastUpdatedAt={formattedLastUpdatedAt}
              lastUpdatedBy={lastUpdatedBy}
            />
          )}
        </div>
        {canDisplayTagsRow && <TagsRow tags={tags} />}
      </div>
      {/* I hate this space but I need it or this heading will sit right against the first paragraph.*/}
      <p></p>
    </section>
  );
}
/**
 Title can be declared inside md content or declared through
 front matter and added manually. To make both cases consistent,
 the added title is added under the same div.markdown block
 See https://github.com/facebook/docusaurus/pull/4882#issuecomment-853021120

 We render a "synthetic title" if:
 - user doesn't ask to hide it with front matter
 - the markdown content does not already contain a top-level h1 heading
*/
function useSyntheticTitle() {
  const {metadata, frontMatter, contentTitle} = useDoc();
  const shouldRender =
    !frontMatter.hide_title && typeof contentTitle === 'undefined';
  if (!shouldRender) {
    return null;
  }
  return metadata.title;
}
export default function DocItemContent({children}) {
  const syntheticTitle = useSyntheticTitle();
  return (
    <div className={clsx(ThemeClassNames.docs.docMarkdown, 'markdown')}>
      {syntheticTitle && (
        <header>
          <Heading as="h1">{syntheticTitle}</Heading>
          <DocPublishInfo />
        </header>
      )}
      <MDXContent>{children}</MDXContent>
    </div>
  );
}
