import React from 'react';
import { TimeEntry } from '../types';
import { Clock, User, Calendar, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './styles/TimeEntryList.css';

interface TimeEntryListProps {
    timeEntries: TimeEntry[];
    onRefresh: () => void;
}

const TimeEntryList = ({ timeEntries, onRefresh }: TimeEntryListProps) => {
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const deleteEntry = async (id: string) => {
        const { error } = await supabase
            .from('time_entries')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting entry:', error);
        } else {
            onRefresh();
        }
    };

    if (timeEntries.length === 0) {
        return (
            <div className="empty-state">
                <Clock size={48} />
                <h3>No time entries yet</h3>
                <p>Start tracking your time to see entries here</p>
            </div>
        );
    }

    return (
        <div className="time-entries-list">
            <h2>Recent Entries</h2>
            <div className="entries-grid">
                {timeEntries.map((entry) => (
                    <div key={entry.id} className="time-entry-card">
                        <div className="entry-header">
                            <div className="entry-time">
                                <Clock size={16} />
                                {formatTime(entry.duration || 0)}
                            </div>
                            <button
                                className="delete-btn"
                                onClick={() => deleteEntry(entry.id)}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>

                        <div className="entry-content">
                            {entry.client && (
                                <div className="entry-client">
                                    <User size={14} />
                                    <span>{entry.client.name}</span>
                                </div>
                            )}

                            {entry.description && (
                                <p className="entry-description">{entry.description}</p>
                            )}

                            <div className="entry-date">
                                <Calendar size={14} />
                                {formatDate(entry.created_at || '')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TimeEntryList;