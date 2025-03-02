import React, { useState, useContext } from 'react';

// First create the context
const MyContext = React.createContext();

// Then create a StateHolder wrapper component
// to hold the state that the components need.

const StateHolder = props => {
  const [isMobileSearchFilerOpen, setMobileSearchFilterOpen] = useState(false);

  return (
    <MyContext.Provider
      value={{
        isMobileSearchFilerOpen,
        setMobileSearchFilterOpen,
      }}
    >
      {props.children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => useContext(MyContext);

export default StateHolder;