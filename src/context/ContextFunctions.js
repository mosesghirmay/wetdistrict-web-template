import React, { useContext } from 'react';
import { useMyContext } from './StateHolder';

// Create the context to hold shared functions
const MyContextFunctions = React.createContext();

// ContextFunctions component to provide shared functions
const ContextFunctions = (props) => {
  // Get state functions from another context
  const { onOpenMobileSearchFilterModal } = useMyContext();

  // This component just passes through the function

  return (
    <MyContextFunctions.Provider value={{ onOpenMobileSearchFilterModal }}>
      {props.children}
    </MyContextFunctions.Provider>
  );
};

export const useMyContextFunctions = () => {
  const context = useMyContext();
  
  // Add extra safety check
  if (!context || !context.onOpenMobileSearchFilterModal) {
    console.error("Context or onOpenMobileSearchFilterModal is not available");
    
    // Return a fallback implementation if the real one isn't available
    return {
      onOpenMobileSearchFilterModal: (isOpen) => {
        console.log(`Fallback implementation - setting isOpen: ${isOpen}`);
        // If we can find the modal directly, try to manipulate it
        if (typeof document !== 'undefined') {
          const modal = document.getElementById('SearchFiltersMobile.filters');
          if (modal) {
            modal.style.display = isOpen ? 'block' : 'none';
          }
        }
      }
    };
  }
  
  return {
    onOpenMobileSearchFilterModal: context.onOpenMobileSearchFilterModal,
  };
};

export default ContextFunctions;
