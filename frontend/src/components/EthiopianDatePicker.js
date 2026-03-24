import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useTranslation } from 'react-i18next';
import { toEthiopianDate, getEthiopianMonths } from '../utils/ethiopianCalendar';
import './EthiopianDatePicker.css';

/**
 * Ethiopian Calendar Date Picker Component
 * Displays Ethiopian calendar when language is Amharic, standard HTML input when English
 */
const EthiopianDatePicker = ({ value, onChange, name, required, placeholder, className = '' }) => {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language === 'am';
  
  // Always declare all hooks (React requirement - must be consistent across renders)
  const [showPicker, setShowPicker] = useState(false);
  const [displayValue, setDisplayValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const pickerRef = useRef(null);
  const inputRef = useRef(null);
  const [ethYear, setEthYear] = useState(2016);
  const [ethMonth, setEthMonth] = useState(1);
  const [ethDay, setEthDay] = useState(1);

  const ethiopianMonths = getEthiopianMonths();

  // Update display value when value changes (for Amharic mode)
  useEffect(() => {
    if (isAmharic) {
      if (value) {
        const date = new Date(value);
        const ethDate = toEthiopianDate(date);
        if (ethDate) {
          setEthYear(ethDate.year);
          setEthMonth(ethDate.month);
          setEthDay(ethDate.day);
          setDisplayValue(`${String(ethDate.day).padStart(2, '0')}/${String(ethDate.month).padStart(2, '0')}/${ethDate.year}`);
        }
      } else {
        // Clear display when value is empty
        setDisplayValue('');
      }
    }
  }, [value, isAmharic]);

  // Handle click outside to close picker (for Amharic mode)
  useEffect(() => {
    if (!isAmharic) return;
    
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAmharic]);

  // Convert Ethiopian date to Gregorian
  const ethiopianToGregorian = (ethYear, ethMonth, ethDay) => {
    const gregYear = ethYear + 7 + (ethMonth > 4 ? 1 : 0);
    const isLeapYear = (gregYear % 4 === 0 && gregYear % 100 !== 0) || (gregYear % 400 === 0);
    
    const ethDayOfYear = (ethMonth - 1) * 30 + ethDay;
    let gregDayOfYear = ethDayOfYear + 252 + (isLeapYear ? 1 : 0);
    
    if (gregDayOfYear > (isLeapYear ? 366 : 365)) {
      gregDayOfYear -= (isLeapYear ? 366 : 365);
    }

    const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gregMonth = 0;
    let gregDay = gregDayOfYear;

    for (let i = 0; i < 12; i++) {
      if (gregDay <= daysInMonth[i]) {
        gregMonth = i;
        break;
      }
      gregDay -= daysInMonth[i];
    }

    return new Date(gregYear, gregMonth, gregDay);
  };

  const handleEthiopianDateSelect = (day) => {
    setEthDay(day);
    const gregDate = ethiopianToGregorian(ethYear, ethMonth, day);
    const isoDate = gregDate.toISOString().split('T')[0];
    
    // Update display value immediately
    const newDisplayValue = `${String(day).padStart(2, '0')}/${String(ethMonth).padStart(2, '0')}/${ethYear}`;
    setDisplayValue(newDisplayValue);
    
    // Notify parent component
    if (onChange) {
      onChange({ target: { name, value: isoDate } });
    }
    
    setShowPicker(false);
  };

  const handleTogglePicker = () => {
    if (!showPicker && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX
      });
    }
    setShowPicker(!showPicker);
  };

  // If English, render standard HTML date input
  if (!isAmharic) {
    return (
      <input
        type="date"
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        className={className}
      />
    );
  }

  // Render Ethiopian calendar picker for Amharic
  const daysInMonth = ethMonth === 13 ? 5 : 30;
  const days = [];

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(
      <button
        key={i}
        type="button"
        className={`eth-cal-day ${i === ethDay ? 'selected' : ''}`}
        onClick={() => handleEthiopianDateSelect(i)}
      >
        {i}
      </button>
    );
  }

  // Render calendar dropdown using portal to avoid overflow issues
  const renderDropdown = () => {
    if (!showPicker) return null;

    const dropdown = (
      <div 
        className="date-picker-dropdown"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`
        }}
      >
        <div className="eth-calendar-picker">
          <div className="eth-cal-header">
            <button type="button" onClick={() => setEthYear(ethYear - 1)}>‹</button>
            <span>{ethYear}</span>
            <button type="button" onClick={() => setEthYear(ethYear + 1)}>›</button>
          </div>
          <div className="eth-cal-month-selector">
            <select value={ethMonth} onChange={(e) => setEthMonth(Number(e.target.value))}>
              {ethiopianMonths.map((month, idx) => (
                <option key={idx} value={idx + 1}>{month}</option>
              ))}
            </select>
          </div>
          <div className="eth-cal-days-grid">
            {days}
          </div>
          <div className="eth-cal-footer">
            <button type="button" onClick={() => {
              const today = new Date();
              const ethToday = toEthiopianDate(today);
              if (ethToday) {
                setEthYear(ethToday.year);
                setEthMonth(ethToday.month);
                handleEthiopianDateSelect(ethToday.day);
              }
            }}>
              ዛሬ (Today)
            </button>
            <button type="button" onClick={() => setShowPicker(false)}>
              ዝጋ (Close)
            </button>
          </div>
        </div>
      </div>
    );

    return ReactDOM.createPortal(dropdown, document.body);
  };

  return (
    <div className={`date-picker-wrapper ${className}`} ref={pickerRef}>
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        onClick={handleTogglePicker}
        placeholder={placeholder || 'ቀን/ወር/ዓመት'}
        readOnly
        required={required}
        className="date-picker-input"
      />
      {renderDropdown()}
    </div>
  );
};

export default EthiopianDatePicker;
