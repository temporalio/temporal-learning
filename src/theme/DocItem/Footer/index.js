import React from 'react';
import Footer from '@theme-original/DocItem/Footer';
import {useDoc} from '@docusaurus/theme-common/internal';
import GetHelp from '@site/src/components/hub/GetHelp/GetHelp';

export default function FooterWrapper(props) {
  const {metadata} = useDoc();
  const isCoursePage = metadata?.permalink?.startsWith('/courses/');

  return (
    <>
      <Footer {...props} />
      {isCoursePage && <GetHelp />}
    </>
  );
}
