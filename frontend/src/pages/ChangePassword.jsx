import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import NavbarHome from '../components/NavbarHome';
import { getPageBackgroundStyle } from '../utils/theme';

const ACCENT = 'rgba(232, 184, 75, 1)';
const ACCENT_SHADOW = 'rgba(232, 184, 75, 0.4)';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPassword, setShowPassword] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [errors, setErrors] = useState({});
    const [focusedField, setFocusedField] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;
    const isCompact = isMobile || isTablet;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.currentPassword) newErrors.currentPassword = 'Current password is required';
        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (formData.currentPassword && formData.newPassword &&
            formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (validateForm()) {
            try {
                const token = localStorage.getItem('token');
                if (!token) { alert('You are not logged in!'); return; }
                const res = await API.put('/auth/change-password', {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                });
                setSuccessMessage(res.data.message || 'Password changed successfully!');
                setShowSuccessModal(true);
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || 'An error occurred. Please try again.');
            }
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, when: 'beforeChildren', staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: { opacity: 1, x: 0, transition: { duration: 0.3 } }
    };

    const inputStyle = (fieldName) => ({
        backgroundColor: focusedField === fieldName ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${errors[fieldName] ? '#ff4444' : focusedField === fieldName ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '10px',
        color: '#ffffff',
        padding: '12px 44px 12px 16px',
        fontSize: '14px',
        width: '100%',
        outline: 'none',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        boxShadow: focusedField === fieldName ? `0 0 0 3px rgba(232,184,75,0.15)` : 'none',
        fontFamily: 'Poppins, sans-serif',
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            <NavbarHome />
            <Sidebar sidebarOpen={sidebarOpen} />

            <div style={{
                marginLeft: isCompact ? '0' : '250px',
                width: isCompact ? '100%' : 'calc(100% - 250px)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
            }}>
                <div style={{
                    ...styles.pageContainer,
                    ...getPageBackgroundStyle(isMobile, 0.58)
                }}>
            {/* Injected focus styles */}
            <style>{`
                input::placeholder { color: rgba(255,255,255,0.35) !important; }
            `}</style>

            <motion.div
                style={styles.formContainer}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '36px' }}>Recipe.IO</div>
                    <h2 style={styles.title}>Change Password</h2>
                    <p style={styles.subtitle}>Keep your account secure by updating your password</p>
                </motion.div>

                <form onSubmit={handleSubmit}>
                    {/* Current Password */}
                    <motion.div className="mb-4" variants={itemVariants}>
                        <label htmlFor="currentPassword" style={styles.label}>Current Password</label>
                        <div style={styles.inputGroup}>
                            <input
                                type={showPassword.current ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('currentPassword')}
                                onBlur={() => setFocusedField(null)}
                                style={inputStyle('currentPassword')}
                                placeholder="Enter current password"
                            />
                            <button type="button" style={styles.eyeButton} onClick={() => togglePasswordVisibility('current')}>
                                {showPassword.current ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.currentPassword && <small style={styles.error}>{errors.currentPassword}</small>}
                    </motion.div>

                    {/* New Password */}
                    <motion.div className="mb-4" variants={itemVariants}>
                        <label htmlFor="newPassword" style={styles.label}>New Password</label>
                        <div style={styles.inputGroup}>
                            <input
                                type={showPassword.new ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('newPassword')}
                                onBlur={() => setFocusedField(null)}
                                style={inputStyle('newPassword')}
                                placeholder="Enter new password"
                            />
                            <button type="button" style={styles.eyeButton} onClick={() => togglePasswordVisibility('new')}>
                                {showPassword.new ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.newPassword && <small style={styles.error}>{errors.newPassword}</small>}
                    </motion.div>

                    {/* Confirm Password */}
                    <motion.div className="mb-4" variants={itemVariants}>
                        <label htmlFor="confirmPassword" style={styles.label}>Confirm New Password</label>
                        <div style={styles.inputGroup}>
                            <input
                                type={showPassword.confirm ? 'text' : 'password'}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onFocus={() => setFocusedField('confirmPassword')}
                                onBlur={() => setFocusedField(null)}
                                style={inputStyle('confirmPassword')}
                                placeholder="Confirm new password"
                            />
                            <button type="button" style={styles.eyeButton} onClick={() => togglePasswordVisibility('confirm')}>
                                {showPassword.confirm ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {errors.confirmPassword && <small style={styles.error}>{errors.confirmPassword}</small>}
                    </motion.div>

                    {/* Submit Button */}
                    <motion.div variants={itemVariants}>
                        <motion.button
                            type="submit"
                            style={styles.submitButton}
                            whileHover={{
                                scale: 1.02,
                                boxShadow: '0 15px 35px rgba(232, 184, 75, 0.6)',
                            }}
                            whileTap={{ scale: 0.98 }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = '0 15px 35px rgba(232,184,75,0.6)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(232,184,75,0.4)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Change Password
                        </motion.button>
                    </motion.div>
                </form>

                <motion.div style={styles.footer} variants={itemVariants}>
                    <small style={styles.footerText}>
                        Make sure your password is at least 8 characters long
                    </small>
                </motion.div>
            </motion.div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        style={styles.modalOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            style={styles.modalContent}
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div style={styles.modalIcon}>OK</div>
                            <h3 style={styles.modalTitle}>Success!</h3>
                            <p style={styles.modalMessage}>{successMessage}</p>
                            <motion.button
                                style={styles.modalButton}
                                onClick={() => navigate('/profile')}
                                whileHover={{ scale: 1.05, boxShadow: '0 10px 25px rgba(232,184,75,0.5)' }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Continue to Profile
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: 'Poppins, sans-serif',
    },
    formContainer: {
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
    },
    title: {
        color: '#ffffff',
        fontSize: '26px',
        fontWeight: '700',
        marginBottom: '8px',
        textAlign: 'center',
        letterSpacing: '-0.5px',
    },
    subtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: '14px',
        marginBottom: '32px',
        textAlign: 'center',
    },
    label: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '8px',
        display: 'block',
        letterSpacing: '0.3px',
    },
    inputGroup: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    eyeButton: {
        position: 'absolute',
        right: '12px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '4px',
        fontSize: '18px',
        opacity: 0.6,
        transition: 'opacity 0.2s',
    },
    error: {
        color: '#ff5555',
        fontSize: '12px',
        marginTop: '6px',
        display: 'block',
    },
    submitButton: {
        background: 'rgba(232, 184, 75, 1)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '100px',
        color: '#fff',
        padding: '14px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '8px',
        width: '100%',
        boxShadow: '0 10px 30px rgba(232, 184, 75, 0.4)',
        fontFamily: 'Poppins, sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    },
    footer: {
        marginTop: '24px',
        textAlign: 'center',
    },
    footerText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: '12px',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modalContent: {
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.15)',
        padding: '40px',
        borderRadius: '24px',
        textAlign: 'center',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
    },
    modalIcon: {
        width: '72px',
        height: '72px',
        borderRadius: '50%',
        backgroundColor: 'rgba(232, 184, 75, 0.15)',
        border: '1px solid rgba(232,184,75,0.3)',
        color: 'rgba(232,184,75,1)',
        fontSize: '36px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px auto',
    },
    modalTitle: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '12px',
    },
    modalMessage: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: '16px',
        marginBottom: '32px',
    },
    modalButton: {
        background: 'rgba(232, 184, 75, 1)',
        color: '#fff',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '100px',
        padding: '14px 32px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        width: '100%',
        boxShadow: '0 10px 30px rgba(232,184,75,0.4)',
        transition: 'all 0.3s ease',
        fontFamily: 'Poppins, sans-serif',
    },
};

export default ChangePassword;
