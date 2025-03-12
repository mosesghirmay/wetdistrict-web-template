import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

const MyContext = createContext();

export const MyContextProvider = ({ children }) => {
  const [isMobileSearchFilerOpen, setIsMobileSearchFilerOpen] = useState(false);
  const timeoutRef = useRef(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onOpenMobileSearchFilterModal = (isOpen) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    console.log(`StateHolder: Setting filter modal to ${isOpen ? 'open' : 'closed'}`);
    
    // Set state immediately without debounce
    setIsMobileSearchFilerOpen(isOpen);
  };

  return (
    <MyContext.Provider
      value={{
        isMobileSearchFilerOpen,
        onOpenMobileSearchFilterModal,
      }}
    >
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => useContext(MyContext);

// Default export for compatibility with existing imports
export default MyContextProvider;