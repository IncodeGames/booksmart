import React from 'react';
import {
    ClientSearchFilters,
    ClientFilterField,
    ClientSortField,
    SortDirection,
} from '../types';

interface ClientSearchBarProps {
    filters: ClientSearchFilters;
    onFiltersChange: (filters: Partial<ClientSearchFilters>) => void;
    onReset: () => void;
    totalCount: number;
    filteredCount: number;
}

const FILTER_FIELD_OPTIONS: { value: ClientFilterField; label: string }[] = [
    { value: ClientFilterField.All, label: 'All Fields' },
    { value: ClientFilterField.Name, label: 'Name' },
    { value: ClientFilterField.Email, label: 'Email' },
    { value: ClientFilterField.Phone, label: 'Phone' },
    { value: ClientFilterField.Company, label: 'Company' },
];

const SORT_FIELD_OPTIONS: { value: ClientSortField; label: string }[] = [
    { value: ClientSortField.Name, label: 'Name' },
    { value: ClientSortField.Email, label: 'Email' },
    { value: ClientSortField.Company, label: 'Company' },
    { value: ClientSortField.CreatedAt, label: 'Date Created' },
    { value: ClientSortField.OutstandingAmount, label: 'Outstanding Amount' },
];

const BALANCE_FILTER_OPTIONS: { value: string; label: string }[] = [
    { value: 'all', label: 'All Clients' },
    { value: 'has-balance', label: 'With Outstanding Balance' },
    { value: 'no-balance', label: 'No Outstanding Balance' },
];

const ClientSearchBar: React.FC<ClientSearchBarProps> = ({
    filters,
    onFiltersChange,
    onReset,
    totalCount,
    filteredCount,
}) => {
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        onFiltersChange({ searchTerm: e.target.value });
    };

    const handleFilterFieldChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        onFiltersChange({ filterField: e.target.value as ClientFilterField });
    };

    const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        onFiltersChange({ sortField: e.target.value as ClientSortField });
    };

    const handleSortDirectionToggle = (): void => {
        const newDirection =
            filters.sortDirection === SortDirection.Ascending
                ? SortDirection.Descending
                : SortDirection.Ascending;
        onFiltersChange({ sortDirection: newDirection });
    };

    const handleBalanceFilterChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
        const value = e.target.value;
        let hasOutstandingBalance: boolean | null = null;
        if (value === 'has-balance') {
            hasOutstandingBalance = true;
        } else if (value === 'no-balance') {
            hasOutstandingBalance = false;
        }
        onFiltersChange({ hasOutstandingBalance });
    };

    const getBalanceFilterValue = (): string => {
        if (filters.hasOutstandingBalance === true) return 'has-balance';
        if (filters.hasOutstandingBalance === false) return 'no-balance';
        return 'all';
    };

    const hasActiveFilters =
        filters.searchTerm ||
        filters.filterField !== ClientFilterField.All ||
        filters.hasOutstandingBalance !== null;

    return (
        <div className="client-search-bar">
            <div className="search-row">
                <div className="search-input-wrapper">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search clients..."
                        value={filters.searchTerm}
                        onChange={handleSearchChange}
                        aria-label="Search clients"
                    />
                    <span className="search-icon">🔍</span>
                </div>

                <select
                    className="filter-select"
                    value={filters.filterField}
                    onChange={handleFilterFieldChange}
                    aria-label="Filter by field"
                >
                    {FILTER_FIELD_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    className="filter-select"
                    value={getBalanceFilterValue()}
                    onChange={handleBalanceFilterChange}
                    aria-label="Filter by balance"
                >
                    {BALANCE_FILTER_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            <div className="sort-row">
                <div className="sort-controls">
                    <label className="sort-label">Sort by:</label>
                    <select
                        className="sort-select"
                        value={filters.sortField}
                        onChange={handleSortFieldChange}
                        aria-label="Sort by field"
                    >
                        {SORT_FIELD_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="sort-direction-btn"
                        onClick={handleSortDirectionToggle}
                        aria-label={`Sort ${
                            filters.sortDirection === SortDirection.Ascending
                                ? 'descending'
                                : 'ascending'
                        }`}
                        title={
                            filters.sortDirection === SortDirection.Ascending
                                ? 'Sort Ascending'
                                : 'Sort Descending'
                        }
                    >
                        {filters.sortDirection === SortDirection.Ascending ? '↑' : '↓'}
                    </button>
                </div>

                <div className="filter-info">
                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="reset-filters-btn"
                            onClick={onReset}
                        >
                            Clear Filters
                        </button>
                    )}
                    <span className="results-count">
                        {filteredCount === totalCount
                            ? `${totalCount} client${totalCount !== 1 ? 's' : ''}`
                            : `${filteredCount} of ${totalCount} clients`}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ClientSearchBar;
