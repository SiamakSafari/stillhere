import { useState, useEffect, useCallback } from 'react';
import { getStoredData, setStoredData } from '../utils/storage';

export const useLocalStorage = () => {
  const [data, setData] = useState(() => getStoredData());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const updateData = useCallback((updates) => {
    setData(prevData => {
      const newData = { ...prevData, ...updates };
      setStoredData(newData);
      return newData;
    });
  }, []);

  const resetData = useCallback(() => {
    const freshData = {
      userId: null,
      name: '',
      contactName: '',
      contactEmail: '',
      petName: '',
      petNotes: '',
      streak: 0,
      lastCheckIn: null,
      vacationUntil: null,
      onboardingComplete: false,
      checkInHistory: [],
      createdAt: null
    };
    setData(freshData);
    setStoredData(freshData);
  }, []);

  return { data, updateData, resetData, isLoading };
};
