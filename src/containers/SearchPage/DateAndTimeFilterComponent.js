import React from 'react';
import PropTypes from 'prop-types';
import { Form } from 'react-final-form';

// Component imports
import FieldDateAndTimeFilter from '../../components/SearchFilters/FieldDateAndTimeFilter/FieldDateAndTimeFilter';

/**
 * `DateAndTimeFilterComponent` extracts date & time filtering logic
 * from `FilterComponent.js` to prevent conflicts with other filters.
 */
const DateAndTimeFilterComponent = ({
  availableStartTimes,
  availableEndTimes,
  initialValues,
  getHandleChangedValueFn,
  liveEdit,
  intl,
  ...rest
}) => {
  // Debugging logs to confirm received props
  console.log("🚀 Rendering DateAndTimeFilterComponent with:", { availableStartTimes, availableEndTimes });

  // Ensure start and end times are defined before passing
  const safeAvailableStartTimes = Array.isArray(availableStartTimes) && availableStartTimes.length > 0
    ? availableStartTimes
    : [{ timestamp: '10:00 AM', timeOfDay: '10:00 AM' }];

  const safeAvailableEndTimes = Array.isArray(availableEndTimes) && availableEndTimes.length > 0
    ? availableEndTimes
    : [{ timestamp: '6:00 PM', timeOfDay: '6:00 PM' }];

  console.log("✅ Safe Start Times:", safeAvailableStartTimes);
  console.log("✅ Safe End Times:", safeAvailableEndTimes);

  return (
    <Form
      onSubmit={values => console.log("🕒 Submitted form values:", values)}
      render={({ handleSubmit }) => (
        <form onSubmit={handleSubmit}>
          <FieldDateAndTimeFilter
            id="SearchFiltersPrimary.startTime"
            name="startTime"
            queryParamNames={['startTime']}
            initialValues={initialValues(['startTime'], liveEdit)}
            onSubmit={getHandleChangedValueFn()}
            availableStartTimes={safeAvailableStartTimes} // ✅ Pass safe start times
            availableEndTimes={safeAvailableEndTimes} // ✅ Pass safe end times
            
            // 🛠 FIX: Ensure required change handlers are passed
            onBookingStartDateChange={value => console.log("📅 Start Date Changed:", value)}
            onBookingStartTimeChange={value => console.log("⏰ Start Time Changed:", value)}
            onBookingEndTimeChange={value => console.log("🕛 End Time Changed:", value)}

            {...rest} // Pass any additional props
          />
        </form>
      )}
    />
  );
};

// **Prop Validation**
DateAndTimeFilterComponent.propTypes = {
  availableStartTimes: PropTypes.array,
  availableEndTimes: PropTypes.array,
  initialValues: PropTypes.func.isRequired,
  getHandleChangedValueFn: PropTypes.func.isRequired,
  liveEdit: PropTypes.bool,
  intl: PropTypes.object.isRequired,
};

// **Export Component**
export default DateAndTimeFilterComponent;
