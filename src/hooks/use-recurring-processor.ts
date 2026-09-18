import { useEffect } from 'react';

export function useRecurringProcessor() {
  useEffect(() => {
    console.log('Checking for recurring expenses to process...');
    // Future enhancement: Auto-log recurring expenses when due
  }, []);
}
