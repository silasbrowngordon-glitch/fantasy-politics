import React from 'react';

export default function PartyBadge({ party }: { party: string }) {
  const cls =
    party === 'DEM' ? 'badge-dem' :
    party === 'REP' ? 'badge-rep' :
    party === 'IND' ? 'badge-ind' :
    'badge-other';

  return <span className={cls}>{party}</span>;
}
