import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from './DashboardLayout';
import Pagination from './Pagination';
import './Management.css';

const ApplicantManagement = () => {
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/applicants');
            setApplicants(res.data.data || []);
        } catch (error) {
            console.error('Error fetching applicants:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleScreen = async (id, status) => {
        try {
            const response = await axios.patch(`/api/applicants/${id}/screen`, { status });
            alert(`Applicant ${status} successfully!`);
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to update applicant';
            alert(errorMsg);
        }
    };

    const handleHire = async (id) => {
        try {
            await axios.patch(`/api/applicants/${id}/hire`);
            alert('Applicant hired and employee record created!');
            fetchData();
        } catch (error) {
            alert('Failed to hire applicant');
        }
    };

    const handleViewDetails = (applicant) => {
        setSelectedApplicant(applicant);
        setShowModal(true);
    };

    if (loading) return <div className="loading">Loading Applicants...</div>;

    // Pagination logic
    const totalPages = Math.ceil(applicants.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedApplicants = applicants.slice(startIndex, endIndex);

    return (
        <DashboardLayout user={user} logout={logout}>
            <div className="management-container">
                <div className="section-header">
                    <h1>Applicant Management</h1>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Position</th>
                                <th>Status</th>
                                <th>Applied Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedApplicants.map(a => (
                                <tr key={a._id}>
                                    <td>{a.applicationNumber}</td>
                                    <td>{a.firstName} {a.middleName || a.lastName}</td>
                                    <td>{a.vacancy?.position || a.vacancy?.title || 'N/A'}</td>
                                    <td><span className={`status-badge status-${a.status}`}>{a.status}</span></td>
                                    <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                                    <td className="action-buttons">
                                        {user.role === 'department_head' && a.status === 'submitted' && (
                                            <>
                                                <button className="btn-approve" onClick={() => handleScreen(a._id, 'recommended')}>Recommend</button>
                                                <button className="btn-reject" onClick={() => handleScreen(a._id, 'rejected')}>Reject</button>
                                            </>
                                        )}
                                        {user.role === 'hr_officer' && a.status === 'recommended' && (
                                            <>
                                                <button className="btn-approve" onClick={() => handleScreen(a._id, 'shortlisted')}>Approve</button>
                                                <button className="btn-reject" onClick={() => handleScreen(a._id, 'rejected')}>Reject</button>
                                            </>
                                        )}
                                        {user.role === 'hr_officer' && a.status === 'shortlisted' && (
                                            <button className="btn-publish" onClick={() => handleHire(a._id)}>Hire & Place</button>
                                        )}
                                        <button className="btn-view" onClick={() => handleViewDetails(a)}>View Details</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {applicants.length > 5 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        itemsPerPage={itemsPerPage}
                        totalItems={applicants.length}
                        onItemsPerPageChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                    />
                )}

                {showModal && selectedApplicant && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>Applicant Details</h2>
                                <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <div className="modal-body">
                                <section className="detail-section">
                                    <h3>Personal Information</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item"><strong>Name:</strong> {selectedApplicant.firstName} {selectedApplicant.middleName || selectedApplicant.lastName}</div>
                                        <div className="detail-item"><strong>Gender:</strong> {selectedApplicant.gender}</div>
                                        <div className="detail-item"><strong>Date of Birth:</strong> {new Date(selectedApplicant.dateOfBirth).toLocaleDateString()}</div>
                                        <div className="detail-item"><strong>Application #:</strong> {selectedApplicant.applicationNumber}</div>
                                    </div>
                                </section>

                                <section className="detail-section">
                                    <h3>Contact Information</h3>
                                    <div className="detail-grid">
                                        <div className="detail-item"><strong>Email:</strong> {selectedApplicant.email}</div>
                                        <div className="detail-item"><strong>Phone:</strong> {selectedApplicant.phoneNumber}</div>
                                        <div className="detail-item"><strong>City:</strong> {selectedApplicant.address?.city || 'N/A'}</div>
                                    </div>
                                </section>

                                <section className="detail-section">
                                    <h3>Education</h3>
                                    <div className="education-list">
                                        {selectedApplicant.education && selectedApplicant.education.length > 0 ? (
                                            selectedApplicant.education.map((edu, idx) => (
                                                <div key={idx} className="edu-card">
                                                    <div><strong>{edu.level.toUpperCase()}</strong> in {edu.fieldOfStudy}</div>
                                                    <div>{edu.institution}, {edu.graduationYear}</div>
                                                </div>
                                            ))
                                        ) : <p>No education records found.</p>}
                                    </div>
                                </section>

                                <section className="detail-section">
                                    <h3>Documents</h3>
                                    <div className="document-list">
                                        {selectedApplicant.documents?.resume?.filePath ? (
                                            <div className="doc-item">
                                                <strong>Resume:</strong>
                                                <button
                                                    className="btn-view"
                                                    style={{ marginLeft: '10px', padding: '5px 15px' }}
                                                    onClick={() => {
                                                        const url = `http://localhost:5000/${selectedApplicant.documents.resume.filePath}`;
                                                        window.open(url, '_blank');
                                                    }}
                                                >
                                                    View / Download PDF
                                                </button>
                                            </div>
                                        ) : (
                                            <p>No resume uploaded.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-cancel" onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ApplicantManagement;
