import React from 'react';
import DashboardLayout from './DashboardLayout';

const Placeholder = ({ title, icon }) => (
    <DashboardLayout>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '60vh',
            color: '#7f8c8d'
        }}>
            <div style={{ fontSize: '5rem', marginBottom: '20px' }}>{icon}</div>
            <h1>{title}</h1>
            <p>This module is currently under development.</p>
            <button
                onClick={() => window.history.back()}
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Go Back
            </button>
        </div>
    </DashboardLayout>
);

export const VacancyManagement = () => <Placeholder title="Vacancy Management" icon="💼" />;
export const ApplicantManagement = () => <Placeholder title="Applicant Management" icon="📑" />;
export const PromotionManagement = () => <Placeholder title="Promotion Management" icon="⬆️" />;
