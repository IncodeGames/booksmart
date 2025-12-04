import {
    filterClients,
    filterByOutstandingBalance,
    sortClients,
    applyClientFilters,
    createDefaultFilters,
} from '../utils/clientSearch';
import {
    Client,
    ClientFilterField,
    ClientSortField,
    SortDirection,
    ClientSearchFilters,
} from '../types';

const mockClients: Client[] = [
    {
        id: 'client-uuid-1',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        phone: '555-1234',
        company: 'Tech Corp',
        created_at: '2024-01-15T10:00:00Z',
        outstanding_amount: 500,
        outstanding_invoice_count: 2,
        paid_invoice_count: 3,
    },
    {
        id: 'client-uuid-2',
        name: 'Bob Smith',
        email: 'bob@testcompany.com',
        phone: '555-5678',
        company: 'Design Studio',
        created_at: '2024-02-20T14:30:00Z',
        outstanding_amount: 0,
        outstanding_invoice_count: 0,
        paid_invoice_count: 5,
    },
    {
        id: 'client-uuid-3',
        name: 'Carol Williams',
        email: 'carol@widgets.io',
        phone: undefined,
        company: undefined,
        created_at: '2024-03-10T09:15:00Z',
        outstanding_amount: 1200,
        outstanding_invoice_count: 1,
        paid_invoice_count: 0,
    },
    {
        id: 'client-uuid-4',
        name: 'David Brown',
        email: 'david@tech.com',
        phone: '555-9999',
        company: 'Tech Corp',
        created_at: '2024-01-05T08:00:00Z',
        outstanding_amount: 250,
        outstanding_invoice_count: 1,
        paid_invoice_count: 10,
    },
];

describe('filterClients', () => {
    describe('with ClientFilterField.All', () => {
        it('should return all clients when search term is empty', () => {
            const result = filterClients(mockClients, '', ClientFilterField.All);
            expect(result).toHaveLength(4);
        });

        it('should return all clients when search term is whitespace', () => {
            const result = filterClients(mockClients, '   ', ClientFilterField.All);
            expect(result).toHaveLength(4);
        });

        it('should filter by name (case insensitive)', () => {
            const result = filterClients(mockClients, 'alice', ClientFilterField.All);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Alice Johnson');
        });

        it('should filter by email', () => {
            const result = filterClients(mockClients, 'testcompany', ClientFilterField.All);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Bob Smith');
        });

        it('should filter by phone', () => {
            const result = filterClients(mockClients, '555-1234', ClientFilterField.All);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Alice Johnson');
        });

        it('should filter by company', () => {
            const result = filterClients(mockClients, 'Tech Corp', ClientFilterField.All);
            expect(result).toHaveLength(2);
            expect(result.map(c => c.name)).toContain('Alice Johnson');
            expect(result.map(c => c.name)).toContain('David Brown');
        });

        it('should return empty array when no matches found', () => {
            const result = filterClients(mockClients, 'xyz123', ClientFilterField.All);
            expect(result).toHaveLength(0);
        });
    });

    describe('with ClientFilterField.Name', () => {
        it('should only filter by name field', () => {
            const result = filterClients(mockClients, 'smith', ClientFilterField.Name);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Bob Smith');
        });

        it('should not match email when filtering by name', () => {
            const result = filterClients(mockClients, 'testcompany', ClientFilterField.Name);
            expect(result).toHaveLength(0);
        });
    });

    describe('with ClientFilterField.Email', () => {
        it('should only filter by email field', () => {
            const result = filterClients(mockClients, 'widgets', ClientFilterField.Email);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Carol Williams');
        });

        it('should not match name when filtering by email', () => {
            // "Williams" appears only in name, not in email
            const result = filterClients(mockClients, 'Williams', ClientFilterField.Email);
            expect(result).toHaveLength(0);
        });
    });

    describe('with ClientFilterField.Phone', () => {
        it('should only filter by phone field', () => {
            const result = filterClients(mockClients, '5678', ClientFilterField.Phone);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Bob Smith');
        });

        it('should handle clients without phone', () => {
            const result = filterClients(mockClients, '555', ClientFilterField.Phone);
            expect(result).toHaveLength(3); // Alice, Bob, David have phones with 555
            expect(result.map(c => c.name)).not.toContain('Carol Williams');
        });
    });

    describe('with ClientFilterField.Company', () => {
        it('should only filter by company field', () => {
            const result = filterClients(mockClients, 'Design', ClientFilterField.Company);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Bob Smith');
        });

        it('should handle clients without company', () => {
            const result = filterClients(mockClients, 'Corp', ClientFilterField.Company);
            expect(result).toHaveLength(2);
            expect(result.map(c => c.name)).not.toContain('Carol Williams');
        });
    });
});

describe('filterByOutstandingBalance', () => {
    it('should return all clients when filter is null', () => {
        const result = filterByOutstandingBalance(mockClients, null);
        expect(result).toHaveLength(4);
    });

    it('should return only clients with outstanding balance when true', () => {
        const result = filterByOutstandingBalance(mockClients, true);
        expect(result).toHaveLength(3);
        expect(result.every(c => c.outstanding_amount > 0)).toBe(true);
    });

    it('should return only clients without outstanding balance when false', () => {
        const result = filterByOutstandingBalance(mockClients, false);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Bob Smith');
        expect(result[0].outstanding_amount).toBe(0);
    });
});

describe('sortClients', () => {
    describe('by name', () => {
        it('should sort ascending by name', () => {
            const result = sortClients(mockClients, ClientSortField.Name, SortDirection.Ascending);
            expect(result[0].name).toBe('Alice Johnson');
            expect(result[1].name).toBe('Bob Smith');
            expect(result[2].name).toBe('Carol Williams');
            expect(result[3].name).toBe('David Brown');
        });

        it('should sort descending by name', () => {
            const result = sortClients(mockClients, ClientSortField.Name, SortDirection.Descending);
            expect(result[0].name).toBe('David Brown');
            expect(result[1].name).toBe('Carol Williams');
            expect(result[2].name).toBe('Bob Smith');
            expect(result[3].name).toBe('Alice Johnson');
        });
    });

    describe('by email', () => {
        it('should sort ascending by email', () => {
            const result = sortClients(mockClients, ClientSortField.Email, SortDirection.Ascending);
            expect(result[0].email).toBe('alice@example.com');
            expect(result[1].email).toBe('bob@testcompany.com');
        });

        it('should sort descending by email', () => {
            const result = sortClients(mockClients, ClientSortField.Email, SortDirection.Descending);
            expect(result[0].email).toBe('david@tech.com');
        });
    });

    describe('by company', () => {
        it('should sort ascending by company (empty companies first)', () => {
            const result = sortClients(mockClients, ClientSortField.Company, SortDirection.Ascending);
            // Empty company should come first
            expect(result[0].company).toBeUndefined();
            expect(result[1].company).toBe('Design Studio');
        });

        it('should sort descending by company', () => {
            const result = sortClients(mockClients, ClientSortField.Company, SortDirection.Descending);
            expect(result[0].company).toBe('Tech Corp');
        });
    });

    describe('by created_at', () => {
        it('should sort ascending by created date (oldest first)', () => {
            const result = sortClients(mockClients, ClientSortField.CreatedAt, SortDirection.Ascending);
            expect(result[0].name).toBe('David Brown'); // Jan 5
            expect(result[1].name).toBe('Alice Johnson'); // Jan 15
            expect(result[2].name).toBe('Bob Smith'); // Feb 20
            expect(result[3].name).toBe('Carol Williams'); // Mar 10
        });

        it('should sort descending by created date (newest first)', () => {
            const result = sortClients(mockClients, ClientSortField.CreatedAt, SortDirection.Descending);
            expect(result[0].name).toBe('Carol Williams'); // Mar 10
            expect(result[3].name).toBe('David Brown'); // Jan 5
        });
    });

    describe('by outstanding amount', () => {
        it('should sort ascending by outstanding amount', () => {
            const result = sortClients(mockClients, ClientSortField.OutstandingAmount, SortDirection.Ascending);
            expect(result[0].outstanding_amount).toBe(0);
            expect(result[1].outstanding_amount).toBe(250);
            expect(result[2].outstanding_amount).toBe(500);
            expect(result[3].outstanding_amount).toBe(1200);
        });

        it('should sort descending by outstanding amount', () => {
            const result = sortClients(mockClients, ClientSortField.OutstandingAmount, SortDirection.Descending);
            expect(result[0].outstanding_amount).toBe(1200);
            expect(result[3].outstanding_amount).toBe(0);
        });
    });

    it('should not mutate the original array', () => {
        const original = [...mockClients];
        sortClients(mockClients, ClientSortField.Name, SortDirection.Descending);
        expect(mockClients).toEqual(original);
    });
});

describe('applyClientFilters', () => {
    it('should apply all filters and sorting together', () => {
        const filters: ClientSearchFilters = {
            searchTerm: 'Tech',
            filterField: ClientFilterField.Company,
            sortField: ClientSortField.OutstandingAmount,
            sortDirection: SortDirection.Descending,
            hasOutstandingBalance: true,
        };

        const result = applyClientFilters(mockClients, filters);

        // Should match Tech Corp clients with outstanding balance
        expect(result).toHaveLength(2);
        // Should be sorted by outstanding amount descending
        expect(result[0].name).toBe('Alice Johnson'); // 500
        expect(result[1].name).toBe('David Brown'); // 250
    });

    it('should work with default filters', () => {
        const filters = createDefaultFilters();
        const result = applyClientFilters(mockClients, filters);

        // All clients, sorted by name ascending
        expect(result).toHaveLength(4);
        expect(result[0].name).toBe('Alice Johnson');
    });

    it('should return empty when no matches', () => {
        const filters: ClientSearchFilters = {
            searchTerm: 'nonexistent',
            filterField: ClientFilterField.All,
            sortField: ClientSortField.Name,
            sortDirection: SortDirection.Ascending,
            hasOutstandingBalance: null,
        };

        const result = applyClientFilters(mockClients, filters);
        expect(result).toHaveLength(0);
    });
});

describe('createDefaultFilters', () => {
    it('should return default filter values', () => {
        const defaults = createDefaultFilters();

        expect(defaults.searchTerm).toBe('');
        expect(defaults.filterField).toBe(ClientFilterField.All);
        expect(defaults.sortField).toBe(ClientSortField.Name);
        expect(defaults.sortDirection).toBe(SortDirection.Ascending);
        expect(defaults.hasOutstandingBalance).toBeNull();
    });
});
