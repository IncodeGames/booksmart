import {
    Client,
    ClientSearchFilters,
    ClientFilterField,
    ClientSortField,
    SortDirection,
} from '../types';

/**
 * Filters clients based on search term and filter field
 */
export function filterClients(
    clients: Client[],
    searchTerm: string,
    filterField: ClientFilterField
): Client[] {
    if (!searchTerm.trim()) {
        return clients;
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();

    return clients.filter((client) => {
        switch (filterField) {
            case ClientFilterField.Name:
                return client.name.toLowerCase().includes(normalizedSearch);
            case ClientFilterField.Email:
                return client.email.toLowerCase().includes(normalizedSearch);
            case ClientFilterField.Phone:
                return client.phone?.toLowerCase().includes(normalizedSearch) ?? false;
            case ClientFilterField.Company:
                return client.company?.toLowerCase().includes(normalizedSearch) ?? false;
            case ClientFilterField.All:
            default:
                return (
                    client.name.toLowerCase().includes(normalizedSearch) ||
                    client.email.toLowerCase().includes(normalizedSearch) ||
                    (client.phone?.toLowerCase().includes(normalizedSearch) ?? false) ||
                    (client.company?.toLowerCase().includes(normalizedSearch) ?? false)
                );
        }
    });
}

/**
 * Filters clients by outstanding balance status
 */
export function filterByOutstandingBalance(
    clients: Client[],
    hasOutstandingBalance: boolean | null
): Client[] {
    if (hasOutstandingBalance === null) {
        return clients;
    }

    return clients.filter((client) => {
        if (hasOutstandingBalance) {
            return client.outstanding_amount > 0;
        }
        return client.outstanding_amount === 0;
    });
}

/**
 * Sorts clients based on field and direction
 */
export function sortClients(
    clients: Client[],
    sortField: ClientSortField,
    sortDirection: SortDirection
): Client[] {
    const sorted = [...clients].sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
            case ClientSortField.Name:
                comparison = a.name.localeCompare(b.name);
                break;
            case ClientSortField.Email:
                comparison = a.email.localeCompare(b.email);
                break;
            case ClientSortField.Company:
                comparison = (a.company ?? '').localeCompare(b.company ?? '');
                break;
            case ClientSortField.CreatedAt:
                comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                break;
            case ClientSortField.OutstandingAmount:
                comparison = a.outstanding_amount - b.outstanding_amount;
                break;
            default:
                comparison = 0;
        }

        return sortDirection === SortDirection.Ascending ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Applies all filters and sorting to clients list
 */
export function applyClientFilters(
    clients: Client[],
    filters: ClientSearchFilters
): Client[] {
    let result = clients;

    // Apply search filter
    result = filterClients(result, filters.searchTerm, filters.filterField);

    // Apply outstanding balance filter
    result = filterByOutstandingBalance(result, filters.hasOutstandingBalance);

    // Apply sorting
    result = sortClients(result, filters.sortField, filters.sortDirection);

    return result;
}

/**
 * Creates default search filters
 */
export function createDefaultFilters(): ClientSearchFilters {
    return {
        searchTerm: '',
        filterField: ClientFilterField.All,
        sortField: ClientSortField.Name,
        sortDirection: SortDirection.Ascending,
        hasOutstandingBalance: null,
    };
}
