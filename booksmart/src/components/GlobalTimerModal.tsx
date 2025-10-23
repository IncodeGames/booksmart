import React, { useEffect } from 'react';
import { useTimerStore } from '../stores/timerStore';
import TimerModal from './TimerModal';

/**
 * GlobalTimerModal
 * 
 * This component renders the TimerModal globally so it persists across all pages.
 * It manages the timer state from the Zustand store and updates the elapsed time
 * every second when the timer is running.
 */
const GlobalTimerModal = () => {
  const {
    isRunning,
    isModalOpen,
    isExpanded,
    startTime,
    elapsedTime,
    description,
    client,
    clients,
    setClient,
    setDescription,
    setExpanded,
    updateElapsedTime,
    logTime,
    discardTimer,
    fetchClients,
  } = useTimerStore();

  // Fetch clients when component mounts
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Update elapsed time every second when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && startTime) {
      // Update immediately
      updateElapsedTime();
      
      // Then update every second
      interval = setInterval(() => {
        updateElapsedTime();
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning, startTime, updateElapsedTime]);

  // Format time helper function
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle log time
  const handleLogTime = async () => {
    const success = await logTime();
    if (success) {
      // Optionally, show a success notification here
      console.log('Time logged successfully');
    } else {
      // Optionally, show an error notification here
      console.error('Failed to log time');
    }
  };

  // Only render if modal should be open or timer is running
  const shouldRender = isModalOpen || isRunning;

  return (
    <TimerModal
      isOpen={shouldRender}
      isExpanded={isExpanded}
      timer={{
        isRunning,
        startTime,
        elapsedTime,
        description,
        client,
      }}
      clients={clients}
      onClientSelect={setClient}
      onDescriptionChange={setDescription}
      onToggleExpand={() => setExpanded(!isExpanded)}
      onLogTime={handleLogTime}
      onDiscard={discardTimer}
      formatTime={formatTime}
    />
  );
};

export default GlobalTimerModal;
