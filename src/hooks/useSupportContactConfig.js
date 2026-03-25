import React from 'react';
import publicConfigApi from '../services/publicConfigApi';
import { defaultSupportContact } from '../utils/supportContactDefaults';

export default function useSupportContactConfig() {
  const [contactConfig, setContactConfig] = React.useState(defaultSupportContact);

  React.useEffect(() => {
    let mounted = true;

    const loadConfig = async () => {
      const data = await publicConfigApi.getSupportContactConfig();
      if (!mounted) {
        return;
      }
      setContactConfig(data);
    };

    void loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  return contactConfig;
}
