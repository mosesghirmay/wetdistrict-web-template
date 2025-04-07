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
    
    // Additionally, set a global variable for components that can't access context
    if (typeof window !== 'undefined') {
      window.__isMobileFilterOpen = isOpen;
      
      // If we're closing, also try direct DOM manipulation
      if (!isOpen && typeof document !== 'undefined') {
        setTimeout(() => {
          // Try to find and close the modal directly
          const modal = document.getElementById('SearchFiltersMobile.filters');
          if (modal) {
            modal.style.display = 'none';
          }
          
          // Force send an escape key event to close modal
          document.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            which: 27,
            bubbles: true
          }));
        }, 100);
      }
    }
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