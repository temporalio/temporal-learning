import React, { useEffect, useRef } from 'react';
import { Highlight, Snippet } from 'react-instantsearch';
import { useHistory } from '@docusaurus/router';
import { PageIcon, AnchorIcon, TreeBranch } from './Icons';

interface HitProps {
  hit: any;
  isSelected: boolean;
  onNavigate: () => void;
  isAnchor?: boolean;
  isLastAnchor?: boolean;
  parentTitle?: string;
}

// Get the appropriate hierarchy attribute based on hit type
function getHierarchyAttribute(hit: any): string {
  // The hit.type field indicates the hierarchy level (e.g., "lvl1", "lvl2", "lvl3")
  if (hit.type && hit.type.startsWith('lvl')) {
    return `hierarchy.${hit.type}`;
  }
  // Fallback: find the deepest populated hierarchy level
  const levels = ['lvl6', 'lvl5', 'lvl4', 'lvl3', 'lvl2', 'lvl1'];
  for (const level of levels) {
    if (hit.hierarchy?.[level]) {
      return `hierarchy.${level}`;
    }
  }
  return 'hierarchy.lvl1';
}

export function Hit({ hit, isSelected, onNavigate, isAnchor, isLastAnchor, parentTitle }: HitProps) {
  const history = useHistory();
  const hitRef = useRef<HTMLAnchorElement>(null);

  const hierarchyAttribute = getHierarchyAttribute(hit);

  const fullUrl = hit.url || hit.objectID;

  // Determine if this URL is internal to the learn site or external (e.g. docs.temporal.io)
  // Algolia stores absolute URLs with the production domain (learn.temporal.io),
  // so we can't just compare origins (would break in Vercel previews).
  const LEARN_SITE_HOST = 'learn.temporal.io';
  let isExternal = false;
  let internalPath = '';
  try {
    const parsed = new URL(fullUrl, window.location.origin);
    if (parsed.hostname === LEARN_SITE_HOST || parsed.origin === window.location.origin) {
      // Internal: either matches production domain or current origin (local dev)
      internalPath = parsed.pathname + parsed.hash;
    } else {
      isExternal = true;
    }
  } catch {
    internalPath = fullUrl;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isExternal) {
      window.open(fullUrl, '_blank', 'noopener,noreferrer');
    } else {
      history.push(internalPath);
    }
    onNavigate();
  };

  // Scroll into view when selected
  useEffect(() => {
    if (isSelected && hitRef.current) {
      hitRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [isSelected]);

  const hitClassName = [
    'custom-search-hit',
    isSelected ? 'custom-search-hit--selected' : '',
    isAnchor ? 'custom-search-hit--anchor' : 'custom-search-hit--page',
  ].filter(Boolean).join(' ');

  return (
    <a
      ref={hitRef}
      href={fullUrl}
      onClick={handleClick}
      className={hitClassName}
      tabIndex={-1}
      role="option"
      aria-selected={isSelected}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {isAnchor ? (
        <div className="custom-search-hit-icon-wrapper">
          <TreeBranch isLast={isLastAnchor ?? true} />
          <AnchorIcon />
        </div>
      ) : (
        <div className="custom-search-hit-icon-wrapper">
          <PageIcon />
        </div>
      )}
      <div className="custom-search-hit-content">
        <div className="custom-search-hit-title">
          <Highlight attribute={hierarchyAttribute} hit={hit} />
        </div>
        {isAnchor && parentTitle && (
          <div className="custom-search-hit-path">
            {parentTitle}
          </div>
        )}
        {!isAnchor && hit.content && (
          <div className="custom-search-hit-text">
            <Snippet attribute="content" hit={hit} />
          </div>
        )}
      </div>
    </a>
  );
}
