import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Designer } from '@pdfme/ui';
import { BLANK_A4_PDF, Template, checkTemplate } from '@pdfme/common';
import './styles/InvoiceTemplate.css';

interface User {
    email?: string;
}

interface InvoiceTemplateProps {
    user: User;
    onBack: () => void;
}

interface SavedTemplate {
    id: string;
    name: string;
    template_data: Template;
    created_at: string;
    updated_at: string;
}

const InvoiceTemplate = ({ user, onBack }: InvoiceTemplateProps) => {
    const [designer, setDesigner] = useState<Designer | null>(null);
    const [currentTemplate, setCurrentTemplate] = useState<Template | null>(null);
    const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
    const [templateName, setTemplateName] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

    // Default template structure
    const defaultTemplate: Template = {
        basePdf: BLANK_A4_PDF,
        schemas: [
            [
                {
                    name: 'company_name',
                    type: 'text',
                    position: { x: 10, y: 10 },
                    width: 100,
                    height: 20,
                    content: "Company Name",
                    fontSize: 20,
                    fontColor: '#000000'
                },
                {
                    name: 'company_address',
                    type: 'text',
                    position: { x: 150, y: 10 },
                    width: 50,
                    height: 10,
                    content: "Company Address",
                    fontSize: 12,
                    fontColor: '#000000'
                },
                {
                    name: 'invoice_number',
                    type: 'text',
                    position: { x: 10, y: 64 },
                    width: 100,
                    height: 10,
                    content: "Invoice Number #",
                    fontSize: 14,
                    fontColor: '#000000'
                },
                {
                    name: 'invoice_date',
                    type: 'text',
                    position: { x: 150, y: 20 },
                    width: 50,
                    height: 10,
                    content: String(new Date().toDateString()),
                    fontSize: 12,
                    fontColor: '#000000'
                },
                {
                    name: 'client_name',
                    type: 'text',
                    position: { x: 10, y: 40 },
                    width: 100,
                    height: 20,
                    content: "Client Name",
                    fontSize: 14,
                    fontColor: '#000000'
                },
                {
                    name: 'client_address',
                    type: 'text',
                    position: { x: 140, y: 40 },
                    width: 60,
                    height: 40,
                    content: "Client Address",
                    fontSize: 12,
                    fontColor: '#000000'
                },
                {
                    name: 'items',
                    type: 'text',
                    position: { x: 10, y: 110 },
                    width: 190,
                    height: 80,
                    content: "Items",
                    fontSize: 12,
                    fontColor: '#000000'
                },
                {
                    name: 'total_amount',
                    type: 'text',
                    position: { x: 10, y: 200 },
                    width: 100,
                    height: 60,
                    content: "Total Amount",
                    fontSize: 16,
                    fontColor: '#000000'
                },
            ],
        ]
    };

    useEffect(() => {
        loadSavedTemplates();
        initializeDesigner();

        return () => {
            if (designer) {
                designer.destroy();
            }
        };
    }, []);

    const initializeDesigner = () => {
        const container = document.getElementById('designer-container');
        if (container) {
            const designerInstance = new Designer({
                domContainer: container,
                template: defaultTemplate,

            });

            setDesigner(designerInstance);
            setCurrentTemplate(defaultTemplate);
        }
    };

    const loadSavedTemplates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('invoice_templates')
                .select('*')
                .eq('user_email', user.email)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setSavedTemplates(data || []);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveTemplate = async () => {
        if (!designer || !templateName.trim()) {
            alert('Please enter a template name');
            return;
        }

        try {
            setLoading(true);
            const template = designer.getTemplate();

            // Validate template
            try {
                checkTemplate(template);
            } catch (error) {
                alert('Invalid template structure');
                return;
            }

            const templateData = {
                name: templateName,
                template_data: template,
                user_email: user.email,
                updated_at: new Date().toISOString()
            };

            let result;
            if (selectedTemplateId) {
                // Update existing template
                result = await supabase
                    .from('invoice_templates')
                    .update(templateData)
                    .eq('id', selectedTemplateId)
                    .eq('user_email', user.email);
            } else {
                // Create new template
                result = await supabase
                    .from('invoice_templates')
                    .insert([{
                        ...templateData,
                        created_at: new Date().toISOString()
                    }]);
            }

            if (result.error) throw result.error;

            alert('Template saved successfully!');
            loadSavedTemplates();
            setTemplateName('');
            setSelectedTemplateId('');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Error saving template');
        } finally {
            setLoading(false);
        }
    };

    const loadTemplate = async (templateId: string) => {
        const template = savedTemplates.find(t => t.id === templateId);
        if (template && designer) {
            try {
                designer.updateTemplate(template.template_data);
                setCurrentTemplate(template.template_data);
                setTemplateName(template.name);
                setSelectedTemplateId(templateId);
            } catch (error) {
                console.error('Error loading template:', error);
                alert('Error loading template');
            }
        }
    };

    const deleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('invoice_templates')
                .delete()
                .eq('id', templateId)
                .eq('user_email', user.email);

            if (error) throw error;

            alert('Template deleted successfully!');
            loadSavedTemplates();

            if (selectedTemplateId === templateId) {
                setSelectedTemplateId('');
                setTemplateName('');
                if (designer) {
                    designer.updateTemplate(defaultTemplate);
                }
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            alert('Error deleting template');
        } finally {
            setLoading(false);
        }
    };

    const createNewTemplate = () => {
        if (designer) {
            designer.updateTemplate(defaultTemplate);
            setCurrentTemplate(defaultTemplate);
            setTemplateName('');
            setSelectedTemplateId('');
        }
    };

    return (
        <div className="invoice-template-page">
            <div className="template-header">
                <div className="header-left">
                    <button className="back-btn" onClick={onBack}>
                        ← Back to Dashboard
                    </button>
                    <h1>Invoice Template Editor</h1>
                </div>
                <div className="header-right">
                    <span className="user-email">{user.email}</span>
                </div>
            </div>

            <div className="template-content">
                <div className="template-sidebar">
                    <div className="template-controls">
                        <h3>Template Controls</h3>

                        <div className="control-group">
                            <label htmlFor="template-name">Template Name:</label>
                            <input
                                id="template-name"
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="Enter template name"
                                className="template-input"
                            />
                        </div>

                        <div className="control-buttons">
                            <button
                                className="btn btn-primary"
                                onClick={saveTemplate}
                                disabled={loading || !templateName.trim()}
                            >
                                {loading ? 'Saving...' : selectedTemplateId ? 'Update Template' : 'Save Template'}
                            </button>

                            <button
                                className="btn btn-secondary"
                                onClick={createNewTemplate}
                            >
                                New Template
                            </button>
                        </div>
                    </div>

                    <div className="saved-templates">
                        <h3>Saved Templates</h3>
                        {loading ? (
                            <div className="loading">Loading templates...</div>
                        ) : savedTemplates.length === 0 ? (
                            <div className="no-templates">No templates saved yet</div>
                        ) : (
                            <div className="templates-list">
                                {savedTemplates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`template-item ${selectedTemplateId === template.id ? 'active' : ''}`}
                                    >
                                        <div className="template-info">
                                            <h4>{template.name}</h4>
                                            <span className="template-date">
                                                {new Date(template.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="template-actions">
                                            <button
                                                className="btn-small btn-load"
                                                onClick={() => loadTemplate(template.id)}
                                            >
                                                Load
                                            </button>
                                            <button
                                                className="btn-small btn-delete"
                                                onClick={() => deleteTemplate(template.id)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="template-designer">
                    <div className="designer-header">
                        <h3>Template Designer</h3>
                        <div className="designer-info">
                            <span>Drag and drop elements to design your invoice template</span>
                        </div>
                    </div>
                    <div id="designer-container" className="designer-container"></div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceTemplate;