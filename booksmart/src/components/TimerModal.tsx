import React, { useState, useEffect, useRef } from 'react';
import { Client, TimerState } from '../types';
import { X, ChevronUp, ChevronDown, User, FileText, Clock } from 'lucide-react';
import './styles/TimerModal.css'

interface TimerModalProps {
    isOpen: boolean;
    timer: TimerState;
    clients: Client[];
    onClientSelect: (client: Client | null) => void;
    onDescriptionChange: (description: string) => void;
    onLogTime: () => void;
    onDiscard: () => void;
    formatTime: (seconds: number) => string;
}

const TimerModal: React.FC<TimerModalProps> = ({
    isOpen,
    timer,
    clients,
    onClientSelect,
    onDescriptionChange,
    onLogTime,
    onDiscard,
    formatTime,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowClientDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter clients based on search
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (!isOpen) return null;

    const handleHeaderClick = (e: React.MouseEvent) => {
        // Prevent expansion toggle when clicking buttons
        if ((e.target as HTMLElement).closest('button')) return;
        setIsExpanded(!isExpanded);
    };

    const handleClientSelect = (client: Client | null) => {
        onClientSelect(client);
        setShowClientDropdown(false);
        setSearchTerm('');
    };

    return (
        <div ref={modalRef} className={`timer-modal ${isExpanded ? 'expanded' : ''}`}>
            {/* Modal Header */}
            <div className="timer-modal__header" onClick={handleHeaderClick}>
                <div className="timer-modal__info">
                    <Clock className="timer-modal__icon" size={20} />
                    <span className="timer-modal__display">{formatTime(timer.elapsedTime)}</span>
                    {timer.client && (
                        <span className="timer-modal__client-badge">{timer.client.name}</span>
                    )}
                </div>
                <button
                    className="timer-modal__toggle"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    aria-label={isExpanded ? "Collapse timer" : "Expand timer"}
                >
                    {isExpanded ? <ChevronDown size={20} className={'timer-modal__select-icon'} /> : <ChevronUp size={20} className={'timer-modal__select-icon'} />}
                </button>
            </div>

            {/* Modal Content */}
            {isExpanded && (
                <div className="timer-modal__content">
                    {/* Client Selection */}
                    <div className="timer-modal__field">
                        <label className="timer-modal__label">
                            <User size={16} />
                            Client
                        </label>
                        <div className="timer-modal__client-select" ref={dropdownRef}>
                            <button
                                type="button"
                                className="timer-modal__select-btn"
                                onClick={() => setShowClientDropdown(!showClientDropdown)}
                            >
                                <span className="timer-modal__select-text">
                                    {timer.client ? timer.client.name : 'Select Client'}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`timer-modal__select-icon ${showClientDropdown ? 'open' : ''}`}
                                />
                            </button>

                            {showClientDropdown && (
                                <div className="timer-modal__dropdown">
                                    <div className="timer-modal__dropdown-search">
                                        <input
                                            type="text"
                                            className="timer-modal__search-input"
                                            placeholder="Search clients..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                    <div className="timer-modal__dropdown-list">
                                        <button
                                            type="button"
                                            className="timer-modal__dropdown-item"
                                            onClick={() => handleClientSelect(null)}
                                        >
                                            <span className="timer-modal__dropdown-text">Select Client</span>
                                        </button>
                                        {filteredClients.map(client => (
                                            <button
                                                key={client.id}
                                                type="button"
                                                className="timer-modal__dropdown-item"
                                                onClick={() => handleClientSelect(client)}
                                            >
                                                <span className="timer-modal__dropdown-text">
                                                    <span className="timer-modal__client-name">{client.name}</span>
                                                    {client.company && (
                                                        <span className="timer-modal__client-company">{client.company}</span>
                                                    )}
                                                </span>
                                            </button>
                                        ))}
                                        {filteredClients.length === 0 && searchTerm && (
                                            <div className="timer-modal__dropdown-empty">
                                                No clients found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description Field */}
                    <div className="timer-modal__field">
                        <label className="timer-modal__label">
                            <FileText size={16} />
                            Description
                        </label>
                        <textarea
                            className="timer-modal__textarea"
                            value={timer.description}
                            onChange={(e) => onDescriptionChange(e.target.value)}
                            placeholder="What are you working on?"
                            rows={3}
                        />
                    </div>

                    {/* Actions */}
                    <div className="timer-modal__actions">
                        <button
                            type="button"
                            className="timer-modal__btn timer-modal__btn--discard"
                            onClick={onDiscard}
                        >
                            <X size={16} />
                            Discard
                        </button>
                        <button
                            type="button"
                            className="timer-modal__btn timer-modal__btn--log"
                            onClick={onLogTime}
                        >
                            Log Time
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimerModal;