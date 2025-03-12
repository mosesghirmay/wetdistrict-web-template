import React, { useContext } from 'react';
import { useMyContext } from './StateHolder';

// Create the context to hold shared functions
const MyContextFunctions = React.createContext();

// ContextFunctions component to provide shared functions
const ContextFunctions = (props) => {
  // Get state functions from another context
  const { setMobileSearchFilterOpen } = useMyContext();

  // Function to toggle the mobile search filter modal
  const onOpenMobileSearchFilterModal = (boolean) => {
    setMobileSearchFilterOpen(boolean);
  };

  return (
    <MyContextFunctions.Provider value={{ onOpenMobileSearchFilterModal }}>
      {props.children}
    </MyContextFunctions.Provider>
  );
};

export const useMyContextFunctions = () => {
  const { onOpenMobileSearchFilterModal } = useMyContext();
  
  return {
    onOpenMobileSearchFilterModal,
  };
};

export default ContextFunctions;
