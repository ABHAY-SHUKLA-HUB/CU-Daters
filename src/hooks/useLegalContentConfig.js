import React from 'react';
import publicLegalApi from '../services/publicLegalApi';
import { defaultLegalContent } from '../utils/legalContentDefaults';

export default function useLegalContentConfig() {
  const [legalContent, setLegalContent] = React.useState(defaultLegalContent);

  React.useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await publicLegalApi.getLegalContentConfig();
      if (!mounted) {
        return;
      }
      setLegalContent(data);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return legalContent;
}
