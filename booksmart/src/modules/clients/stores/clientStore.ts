import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import {
    Client,
    ClientFormData,
    ClientSearchFilters,
    InvoiceStatus,
} from '../types';
import { applyClientFilters, createDefaultFilters } from '../utils/clientSearch';

interface ClientStore {
    // State
    clients: Client[];
    filteredClients: Client[];
    loading: boolean;
    error: string | null;
    filters: ClientSearchFilters;
    selectedClient: Client | null;

    // Actions
    fetchClients: () => Promise<void>;
    createClient: (data: ClientFormData) => Promise<Client>;
    updateClient: (id: number, data: ClientFormData) => Promise<Client>;
    deleteClient: (id: number) => Promise<void>;
    setFilters: (filters: Partial<ClientSearchFilters>) => void;
    resetFilters: () => void;
    setSelectedClient: (client: Client | null) => void;
    clearError: () => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
    // Initial State
    clients: [],
    filteredClients: [],
    loading: false,
    error: null,
    filters: createDefaultFilters(),
    selectedClient: null,

    // Actions
    fetchClients: async () => {
        try {
            set({ loading: true, error: null });

            // Fetch clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('id, name, email, phone, company, created_at, user_id');

            if (clientsError) throw clientsError;

            // Calculate invoice counts and outstanding amounts for each client
            const clientsWithInvoiceData = await Promise.all(
                (clientsData || []).map(async (client) => {
                    // Fetch all invoices for this client
                    const { data: invoices, error: invoiceError } = await supabase
                        .from('invoices')
                        .select('amount, invoice_status')
                        .eq('client_id', client.id);

                    if (invoiceError) {
                        console.error('Error fetching invoices for client:', client.id, invoiceError);
                        return {
                            ...client,
                            outstanding_amount: 0,
                            outstanding_invoice_count: 0,
                            paid_invoice_count: 0,
                        };
                    }

                    const outstandingInvoices = invoices?.filter(
                        (inv) => inv.invoice_status === InvoiceStatus.Unpaid || inv.invoice_status === InvoiceStatus.Overdue
                    ) || [];
                    const paidInvoices = invoices?.filter(
                        (inv) => inv.invoice_status === InvoiceStatus.Paid
                    ) || [];

                    const outstandingAmount = outstandingInvoices.reduce(
                        (sum, inv) => sum + (inv.amount || 0),
                        0
                    );

                    return {
                        ...client,
                        outstanding_amount: outstandingAmount,
                        outstanding_invoice_count: outstandingInvoices.length,
                        paid_invoice_count: paidInvoices.length,
                    };
                })
            );

            const { filters } = get();
            const filteredClients = applyClientFilters(clientsWithInvoiceData, filters);

            set({
                clients: clientsWithInvoiceData,
                filteredClients,
                loading: false,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load clients';
            console.error('Error fetching clients:', error);
            set({ error: errorMessage, loading: false });
        }
    },

    createClient: async (data: ClientFormData) => {
        try {
            set({ error: null });

            const { data: newClient, error } = await supabase
                .from('clients')
                .insert([
                    {
                        name: data.name,
                        email: data.email,
                        phone: data.phone || null,
                        company: data.company || null,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            const clientWithInvoiceData: Client = {
                ...newClient,
                outstanding_amount: 0,
                outstanding_invoice_count: 0,
                paid_invoice_count: 0,
            };

            const { clients, filters } = get();
            const updatedClients = [...clients, clientWithInvoiceData];
            const filteredClients = applyClientFilters(updatedClients, filters);

            set({
                clients: updatedClients,
                filteredClients,
            });

            return clientWithInvoiceData;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create client';
            console.error('Error creating client:', error);
            set({ error: errorMessage });
            throw error;
        }
    },

    updateClient: async (id: string, data: ClientFormData) => {
        try {
            set({ error: null });

            const { data: updatedClient, error } = await supabase
                .from('clients')
                .update({
                    name: data.name,
                    email: data.email,
                    phone: data.phone || null,
                    company: data.company || null,
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            const { clients, filters } = get();
            const existingClient = clients.find((c) => c.id === id);

            const clientWithInvoiceData: Client = {
                ...updatedClient,
                outstanding_amount: existingClient?.outstanding_amount || 0,
                outstanding_invoice_count: existingClient?.outstanding_invoice_count || 0,
                paid_invoice_count: existingClient?.paid_invoice_count || 0,
            };

            const updatedClients = clients.map((c) =>
                c.id === id ? clientWithInvoiceData : c
            );
            const filteredClients = applyClientFilters(updatedClients, filters);

            set({
                clients: updatedClients,
                filteredClients,
                selectedClient: null,
            });

            return clientWithInvoiceData;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update client';
            console.error('Error updating client:', error);
            set({ error: errorMessage });
            throw error;
        }
    },

    deleteClient: async (id: string) => {
        try {
            set({ error: null });

            const { error } = await supabase.from('clients').delete().eq('id', id);

            if (error) throw error;

            const { clients, filters } = get();
            const updatedClients = clients.filter((c) => c.id !== id);
            const filteredClients = applyClientFilters(updatedClients, filters);

            set({
                clients: updatedClients,
                filteredClients,
                selectedClient: null,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete client';
            console.error('Error deleting client:', error);
            set({ error: errorMessage });
            throw error;
        }
    },

    setFilters: (newFilters: Partial<ClientSearchFilters>) => {
        const { clients, filters } = get();
        const updatedFilters = { ...filters, ...newFilters };
        const filteredClients = applyClientFilters(clients, updatedFilters);

        set({
            filters: updatedFilters,
            filteredClients,
        });
    },

    resetFilters: () => {
        const { clients } = get();
        const defaultFilters = createDefaultFilters();
        const filteredClients = applyClientFilters(clients, defaultFilters);

        set({
            filters: defaultFilters,
            filteredClients,
        });
    },

    setSelectedClient: (client: Client | null) => {
        set({ selectedClient: client });
    },

    clearError: () => {
        set({ error: null });
    },
}));
