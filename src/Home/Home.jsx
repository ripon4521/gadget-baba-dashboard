import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaPlus, FaTrash, FaPhoneAlt, FaSpinner, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const WEBSITE_DATA_API_BASE_URL = 'https://backend.gadgetbaba.online'; // আপনার Node.js সার্ভারের URL
const ORDERS_API_BASE_URL = 'https://backend.gadgetbaba.online'; // অর্ডারের জন্য নতুন URL

const Home = () => {
    const [websiteData, setWebsiteData] = useState(null);
    const [orders, setOrders] = useState([]); // State for orders
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('data'); // Default active section
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar visibility

    // Login states
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // File upload specific loading state
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    // Order action specific loading state (for individual complete/delete buttons)
    const [orderActionLoading, setOrderActionLoading] = useState({});


    // Static credentials
    const STATIC_USERNAME = 'osman';
    const STATIC_PASSWORD = '4521';

    useEffect(() => {
        // Only fetch data if authenticated
        if (isAuthenticated) {
            fetchWebsiteData();
            fetchOrders(); // Fetch orders when authenticated
        } else {
            setLoading(false); // If not authenticated, stop loading and show login
        }
    }, [isAuthenticated]); // Only re-run when isAuthenticated changes

    const fetchWebsiteData = async () => {
        try {
            const response = await axios.get(`${WEBSITE_DATA_API_BASE_URL}/website-data`);
            setWebsiteData(response.data);
        } catch (error) {
            console.error('Error fetching website data:', error);
            toast.error('ওয়েবসাইট ডেটা লোড করতে ব্যর্থ হয়েছে।');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`${ORDERS_API_BASE_URL}/orders`);
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('অর্ডার লোড করতে ব্যর্থ হয়েছে।');
        }
    };

    const updateWebsiteData = async () => {
        setIsSaving(true);
        try {
            if (!websiteData || !websiteData._id) {
                toast.error('ওয়েবসাইট ডেটা আইডি অনুপস্থিত। আপডেট করা যাবে না।');
                setIsSaving(false);
                return;
            }

            const { _id, ...dataToUpdate } = websiteData; // _id field কে বাদ দিন

            await axios.patch(`${WEBSITE_DATA_API_BASE_URL}/website-data/${websiteData._id}`, dataToUpdate);
            toast.success('ওয়েবসাইট ডেটা সফলভাবে আপডেট হয়েছে!');
        } catch (error) {
            console.error('Error updating website data:', error);
            toast.error(`আপডেট করতে ব্যর্থ হয়েছে: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setWebsiteData(prevData => ({
            ...prevData,
            [section]: {
                ...prevData[section],
                [field]: value
            }
        }));
    };

    const handleFeatureChange = (index, field, value) => {
        setWebsiteData(prevData => {
            const newFeatures = [...prevData.features];
            newFeatures[index] = {
                ...newFeatures[index],
                [field]: value
            };
            return { ...prevData, features: newFeatures };
        });
    };

    const handleAddFeature = () => {
        setWebsiteData(prevData => ({
            ...prevData,
            features: [
                ...prevData.features,
                { heading: '', ctaButtonText: 'এখনই অর্ডার করুন', listItems: [''], image: 'https://placehold.co/400x300' }
            ]
        }));
    };

    const handleRemoveFeature = (index) => {
        setWebsiteData(prevData => {
            const newFeatures = prevData.features.filter((_, i) => i !== index);
            return { ...prevData, features: newFeatures };
        });
    };

    const handleListItemChange = (featureIndex, itemIndex, value) => {
        setWebsiteData(prevData => {
            const newFeatures = [...prevData.features];
            const newListItems = [...newFeatures[featureIndex].listItems];
            newListItems[itemIndex] = value;
            newFeatures[featureIndex] = {
                ...newFeatures[featureIndex],
                listItems: newListItems
            };
            return { ...prevData, features: newFeatures };
        });
    };

    const handleAddListItem = (featureIndex) => {
        setWebsiteData(prevData => {
            const newFeatures = [...prevData.features];
            newFeatures[featureIndex] = {
                ...newFeatures[featureIndex],
                listItems: [...newFeatures[featureIndex].listItems, '']
            };
            return { ...prevData, features: newFeatures };
        });
    };

    const handleRemoveListItem = (featureIndex, itemIndex) => {
        setWebsiteData(prevData => {
            const newFeatures = [...prevData.features];
            const newListItems = newFeatures[featureIndex].listItems.filter((_, i) => i !== itemIndex);
            newFeatures[featureIndex] = {
                ...newFeatures[featureIndex],
                listItems: newListItems
            };
            return { ...prevData, features: newFeatures };
        });
    };

    const handleFileChange = async (event, section, field, index = null) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingFile(true); // Start file upload loading

        const formData = new FormData();
        formData.append('image', file); // 'image' should match the name in multer upload.single()

        try {
            const uploadRes = await axios.post(`${WEBSITE_DATA_API_BASE_URL}/upload-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const newImageUrl = uploadRes.data.url;
            toast.success('ছবি সফলভাবে আপলোড হয়েছে!');

            if (section === 'header' && field === 'logo') {
                handleInputChange(section, field, newImageUrl);
            } else if (section === 'features' && field === 'image' && index !== null) {
                handleFeatureChange(index, field, newImageUrl);
            }
        } catch (error) {
            console.error('ছবি আপলোড করতে ত্রুটি:', error);
            toast.error(`ছবি আপলোড করতে ব্যর্থ হয়েছে: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploadingFile(false); // End file upload loading
        }
    };

    const handleVideoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingFile(true); // Start file upload loading

        const formData = new FormData();
        formData.append('image', file); // 'image' should match the name in multer upload.single()

        try {
            const uploadRes = await axios.post(`${WEBSITE_DATA_API_BASE_URL}/upload-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const newVideoUrl = uploadRes.data.url;

            setWebsiteData(prevData => ({
                ...prevData,
                videos: [...prevData.videos, newVideoUrl]
            }));
            toast.success('ভিডিও সফলভাবে আপলোড হয়েছে!');
        } catch (error) {
            console.error('ভিডিও আপলোড করতে ত্রুটি:', error);
            toast.error(`ভিডিও আপলোড করতে ব্যর্থ হয়েছে: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploadingFile(false); // End file upload loading
        }
    };

    const handleRemoveVideo = (index) => {
        setWebsiteData(prevData => {
            const newVideos = prevData.videos.filter((_, i) => i !== index);
            return { ...prevData, videos: newVideos };
        });
    };

    const handleAddPreviewImage = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploadingFile(true); // Start file upload loading

        const formData = new FormData();
        formData.append('image', file);

        try {
            const uploadRes = await axios.post(`${WEBSITE_DATA_API_BASE_URL}/upload-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            const newImageUrl = uploadRes.data.url;

            setWebsiteData(prevData => ({
                ...prevData,
                previewImages: [...prevData.previewImages, newImageUrl]
            }));
            toast.success('প্রিভিউ ছবি সফলভাবে আপলোড হয়েছে!');
        } catch (error) {
            console.error('প্রিভিউ ছবি আপলোড করতে ত্রুটি:', error);
            toast.error(`প্রিভিউ ছবি আপলোড করতে ব্যর্থ হয়েছে: ${error.response?.data?.message || error.message}`);
        } finally {
            setIsUploadingFile(false); // End file upload loading
        }
    };

    const handleRemovePreviewImage = (index) => {
        setWebsiteData(prevData => {
            const newPreviewImages = prevData.previewImages.filter((_, i) => i !== index);
            return { ...prevData, previewImages: newPreviewImages };
        });
    };

    const navigateToSection = (sectionName) => {
        setActiveSection(sectionName);
        setIsSidebarOpen(false); // Close sidebar on mobile after selection
    };

    const handleLogin = (e) => {
        e.preventDefault();
        setLoginError(''); // Clear previous errors
        if (username === STATIC_USERNAME && password === STATIC_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            setLoginError('ভুল ইউজারনেম অথবা পিন।');
        }
    };

    const handleCompleteOrder = async (orderId) => {
        setOrderActionLoading(prev => ({ ...prev, [orderId]: true }));
        try {
            await axios.patch(`${ORDERS_API_BASE_URL}/orders/${orderId}`, { status: 'completed' });
            toast.success('অর্ডার সফলভাবে সম্পূর্ণ হয়েছে!');
            fetchOrders(); // Re-fetch orders to update the list
        } catch (error) {
            console.error('Error completing order:', error);
            toast.error(`অর্ডার সম্পূর্ণ করতে ব্যর্থ হয়েছে: ${error.response?.data?.message || error.message}`);
        } finally {
            setOrderActionLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('আপনি কি এই অর্ডারটি মুছে ফেলতে নিশ্চিত?')) {
            return;
        }
        setOrderActionLoading(prev => ({ ...prev, [orderId]: true }));
        try {
            await axios.delete(`${ORDERS_API_BASE_URL}/orders/${orderId}`);
            toast.success('অর্ডার সফলভাবে মুছে ফেলা হয়েছে!');
            fetchOrders(); // Re-fetch orders to update the list
        } catch (error) {
            console.error('Error deleting order:', error);
            toast.error(`অর্ডার মুছে ফেলতে ব্যর্থ হয়েছে: ${error.response?.data?.message || error.message}`);
        } finally {
            setOrderActionLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };


    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 font-sans">
                <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
                <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm transform transition-transform duration-300 hover:scale-105">
                    <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-8">লগইন</h2>
                    <form onSubmit={handleLogin}>
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                                ইউজারনেম:
                            </label>
                            <input
                                type="text"
                                id="username"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-8">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                                পিন:
                            </label>
                            <input
                                type="password"
                                id="password"
                                className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        {loginError && <p className="text-red-600 text-sm font-medium mb-6 text-center">{loginError}</p>}
                        <div className="flex items-center justify-center">
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                            >
                                লগইন করুন
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <FaSpinner className="animate-spin text-4xl text-blue-500" />
                <p className="ml-4 text-xl text-gray-700">লোড হচ্ছে...</p>
            </div>
        );
    }

    if (!websiteData) {
        return <div className="flex justify-center items-center min-h-screen text-xl text-red-500">ওয়েবসাইট ডেটা লোড করতে ব্যর্থ হয়েছে।</div>;
    }

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />

            {/* Mobile Hamburger Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>

            {/* Sidebar Navigation */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-gray-800 text-white p-6 flex flex-col shadow-lg z-40
                transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0
                transition-transform duration-300 ease-in-out lg:rounded-r-lg`}
            >
                <div className="text-3xl font-extrabold mb-10 text-center text-red-400 drop-shadow-md">
                    অ্যাডমিন প্যানেল
                </div>
                <nav className="flex-1">
                    <ul>
                        <li className="mb-3">
                            <button
                                onClick={() => navigateToSection('order')}
                                className={`w-full text-left py-3 px-5 rounded-lg transition-colors duration-200 ${activeSection === 'order' ? 'bg-red-600 font-bold shadow-md' : 'hover:bg-gray-700'}`}
                            >
                                অর্ডার ম্যানেজমেন্ট
                            </button>
                        </li>
                        <li className="mb-3">
                            <button
                                onClick={() => navigateToSection('data')}
                                className={`w-full text-left py-3 px-5 rounded-lg transition-colors duration-200 ${activeSection === 'data' ? 'bg-red-600 font-bold shadow-md' : 'hover:bg-gray-700'}`}
                            >
                                ওয়েবসাইট ডেটা এডিটর
                            </button>
                        </li>
                        <li className="mb-3">
                            <button
                                onClick={() => navigateToSection('homeSite')}
                                className={`w-full text-left py-3 px-5 rounded-lg transition-colors duration-200 ${activeSection === 'homeSite' ? 'bg-red-600 font-bold shadow-md' : 'hover:bg-gray-700'}`}
                            >
                                হোম ও সাইট তথ্য
                            </button>
                        </li>
                    </ul>
                </nav>
                <div className="mt-auto text-center text-xs text-gray-400 pt-4 border-t border-gray-700">
                    Gadget BaBa &copy; 2025
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-8 lg:ml-0 ml-16"> {/* Adjust ml for hamburger button */}
                <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
                    {activeSection === 'data' && 'ওয়েবসাইট বিষয়বস্তু সম্পাদক'}
                    {activeSection === 'order' && 'অর্ডার ম্যানেজমেন্ট'}
                    {activeSection === 'homeSite' && 'হোম ও সাইট তথ্য'}
                </h1>

                {activeSection === 'data' && (
                    <form onSubmit={(e) => { e.preventDefault(); updateWebsiteData(); }} className="space-y-8 pb-20">
                        {/* Header Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">হেডার সেকশন</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">লোগো URL:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.header.logo}
                                    onChange={(e) => handleInputChange('header', 'logo', e.target.value)}
                                />
                                <div className="flex items-center mt-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'header', 'logo')}
                                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        disabled={isUploadingFile}
                                    />
                                    {isUploadingFile && <FaSpinner className="animate-spin text-blue-500 ml-2" />}
                                    {isUploadingFile && <span className="text-blue-500 text-sm ml-1">আপলোড হচ্ছে...</span>}
                                </div>
                                {websiteData.header.logo && <img src={websiteData.header.logo} alt="Logo Preview" className="mt-4 h-24 w-auto object-contain rounded-md border border-gray-200 p-1 shadow-sm" />}
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">মূল হেডিং:</label>
                                <textarea
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.header.mainHeading}
                                    onChange={(e) => handleInputChange('header', 'mainHeading', e.target.value)}
                                    rows="3"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">CTA বাটন টেক্সট:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.header.ctaButtonText}
                                    onChange={(e) => handleInputChange('header', 'ctaButtonText', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Features Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">ফিচার সেকশন</h2>
                            {websiteData.features.map((feature, featureIndex) => (
                                <div key={featureIndex} className="border border-gray-200 p-6 rounded-lg shadow-md mb-6 bg-gray-50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-medium text-gray-800">ফিচার {featureIndex + 1}</h3>
                                        <button
                                            onClick={() => handleRemoveFeature(featureIndex)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center transition duration-200"
                                        >
                                            <FaTrash className="mr-2" /> সরান
                                        </button>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">হেডিং:</label>
                                        <input
                                            type="text"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                            value={feature.heading}
                                            onChange={(e) => handleFeatureChange(featureIndex, 'heading', e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">CTA বাটন টেক্সট:</label>
                                        <input
                                            type="text"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                            value={feature.ctaButtonText}
                                            onChange={(e) => handleFeatureChange(featureIndex, 'ctaButtonText', e.target.value)}
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">লিস্ট আইটেম:</label>
                                        {feature.listItems.map((item, itemIndex) => (
                                            <div key={itemIndex} className="flex items-center mb-2">
                                                <input
                                                    type="text"
                                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mr-2"
                                                    value={item}
                                                    onChange={(e) => handleListItemChange(featureIndex, itemIndex, e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleRemoveListItem(featureIndex, itemIndex)}
                                                    className="bg-red-400 hover:bg-red-600 text-white p-2 rounded-full text-sm transition duration-200"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => handleAddListItem(featureIndex)}
                                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center text-sm mt-2 transition duration-200"
                                        >
                                            <FaPlus className="mr-2" /> আইটেম যোগ করুন
                                        </button>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-gray-700 text-sm font-bold mb-2">ইমেজ URL:</label>
                                        <input
                                            type="text"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                            value={feature.image}
                                            onChange={(e) => handleFeatureChange(featureIndex, 'image', e.target.value)}
                                        />
                                        <div className="flex items-center mt-2">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'features', 'image', featureIndex)}
                                                className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                disabled={isUploadingFile}
                                            />
                                            {isUploadingFile && <FaSpinner className="animate-spin text-blue-500 ml-2" />}
                                            {isUploadingFile && <span className="text-blue-500 text-sm ml-1">আপলোড হচ্ছে...</span>}
                                        </div>
                                        {feature.image && <img src={feature.image} alt={`Feature ${featureIndex + 1} Preview`} className="mt-4 h-32 w-auto object-contain rounded-md border border-gray-200 p-1 shadow-sm" />}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={handleAddFeature}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center transition duration-200"
                            >
                                <FaPlus className="mr-2" /> ফিচার যোগ করুন
                            </button>
                        </div>

                        {/* Price Notification Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">মূল্য বিজ্ঞপ্তি সেকশন</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">বিজ্ঞপ্তি টেক্সট:</label>
                                <textarea
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.priceNotification.text}
                                    onChange={(e) => handleInputChange('priceNotification', 'text', e.target.value)}
                                    rows="2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">ডেলিভারি তথ্য:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.priceNotification.deliveryInfo}
                                    onChange={(e) => handleInputChange('priceNotification', 'deliveryInfo', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Videos Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">ভিডিও সেকশন</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">নতুন ভিডিও আপলোড করুন:</label>
                                <div className="flex items-center mt-2">
                                    <input
                                        type="file"
                                        accept="video/*"
                                        onChange={handleVideoUpload}
                                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        disabled={isUploadingFile}
                                    />
                                    {isUploadingFile && <FaSpinner className="animate-spin text-blue-500 ml-2" />}
                                    {isUploadingFile && <span className="text-blue-500 text-sm ml-1">আপলোড হচ্ছে...</span>}
                                </div>
                            </div>
                            {websiteData.videos.map((videoUrl, index) => (
                                <div key={index} className="border border-gray-200 p-4 rounded-lg shadow-sm mb-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between">
                                    <div className="flex-1 mr-2 w-full sm:w-auto">
                                        <input
                                            type="text"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-2"
                                            value={videoUrl}
                                            onChange={(e) => setWebsiteData(prevData => {
                                                const newVideos = [...prevData.videos];
                                                newVideos[index] = e.target.value;
                                                return { ...prevData, videos: newVideos };
                                            })}
                                        />
                                        <video src={videoUrl} controls className="mt-2 w-full max-h-48 object-contain rounded-md border border-gray-300 p-1 shadow-sm" />
                                    </div>
                                    <button
                                        onClick={() => handleRemoveVideo(index)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 mt-2 sm:mt-0"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>


                        {/* Preview Images Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">প্রিভিউ ইমেজ সেকশন</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">নতুন প্রিভিউ ইমেজ আপলোড করুন:</label>
                                <div className="flex items-center mt-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAddPreviewImage}
                                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                        disabled={isUploadingFile}
                                    />
                                    {isUploadingFile && <FaSpinner className="animate-spin text-blue-500 ml-2" />}
                                    {isUploadingFile && <span className="text-blue-500 text-sm ml-1">আপলোড হচ্ছে...</span>}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {websiteData.previewImages.map((imageUrl, index) => (
                                    <div key={index} className="border border-gray-200 p-4 rounded-lg shadow-sm bg-gray-50 flex flex-col items-center">
                                        <img src={imageUrl} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover mb-3 rounded-md border border-gray-300 p-1 shadow-sm" />
                                        <input
                                            type="text"
                                            className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-1 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 text-sm mb-3"
                                            value={imageUrl}
                                            onChange={(e) => setWebsiteData(prevData => {
                                                const newImages = [...prevData.previewImages];
                                                newImages[index] = e.target.value;
                                                return { ...prevData, previewImages: newImages };
                                            })}
                                        />
                                        <button
                                            onClick={() => handleRemovePreviewImage(index)}
                                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded-lg focus:outline-none focus:shadow-outline text-sm transition duration-200"
                                        >
                                            <FaTrash /> সরান
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Contact Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">যোগাযোগ সেকশন</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">হেডিং:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.contact.heading}
                                    onChange={(e) => handleInputChange('contact', 'heading', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">বর্ণনা:</label>
                                <textarea
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.contact.description}
                                    onChange={(e) => handleInputChange('contact', 'description', e.target.value)}
                                    rows="2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">হেল্পলাইন নাম্বার:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.contact.helplineNumber}
                                    onChange={(e) => handleInputChange('contact', 'helplineNumber', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">কল বাটন টেক্সট:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.contact.callButtonText}
                                    onChange={(e) => handleInputChange('contact', 'callButtonText', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Order Form Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">অর্ডার ফর্ম সেকশন</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">ফর্মের শিরোনাম:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.orderForm.title}
                                    onChange={(e) => handleInputChange('orderForm', 'title', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">অফার টেক্সট:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.orderForm.offerTxt}
                                    onChange={(e) => handleInputChange('orderForm', 'offerTxt', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">পণ্যের নাম:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.orderForm.productName}
                                    onChange={(e) => handleInputChange('orderForm', 'productName', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">মূল্য টেক্সট:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.orderForm.price}
                                    onChange={(e) => handleInputChange('orderForm', 'price', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">অর্ডার বাটন টেক্সট:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.orderForm.placeOrderButtonText}
                                    onChange={(e) => handleInputChange('orderForm', 'placeOrderButtonText', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Footer Section */}
                        <div className="bg-white p-8 rounded-xl shadow-xl mb-6">
                            <h2 className="text-2xl font-semibold mb-6 text-gray-700 border-b pb-2 border-gray-200">ফুটার সেকশন</h2>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">কপিরাইট টেক্সট:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.footer.copyright}
                                    onChange={(e) => handleInputChange('footer', 'copyright', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">বিল্ড বাই টেক্সট:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.footer.builtByText}
                                    onChange={(e) => handleInputChange('footer', 'builtByText', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">এজেন্সি নাম:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.footer.agencyName}
                                    onChange={(e) => handleInputChange('footer', 'agencyName', e.target.value)}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">এজেন্সি লিঙ্ক:</label>
                                <input
                                    type="text"
                                    className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    value={websiteData.footer.agencyLink}
                                    onChange={(e) => handleInputChange('footer', 'agencyLink', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="text-center mt-6 mb-12">
                            <button
                                type="submit"
                                className={`bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-700 hover:to-blue-800 text-white font-bold py-3 px-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center mx-auto ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" /> সংরক্ষণ হচ্ছে...
                                    </>
                                ) : (
                                    'পরিবর্তন সংরক্ষণ করুন'
                                )}
                            </button>
                        </div>
                    </form>
                )}

                {activeSection === 'order' && (
                    <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 min-h-[calc(100vh-64px)] flex flex-col items-center">
                        <h2 className="text-3xl font-bold text-gray-700 mb-6">অর্ডার ম্যানেজমেন্ট</h2>

                        {orders.length === 0 ? (
                            <p className="text-gray-600 text-lg mt-4">কোনো অর্ডার পাওয়া যায়নি।</p>
                        ) : (
                            <div className="w-full overflow-x-auto mt-6">
                                <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-md">
                                    <thead>
                                        <tr className="bg-gray-100 border-b border-gray-200 text-left">
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">অর্ডার আইডি</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">গ্রাহকের নাম</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">ঠিকানা</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">ফোন</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">পণ্য</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">মূল্য</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">স্ট্যাটাস</th>
                                            <th className="py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">অ্যাকশন</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map(order => (
                                            <tr key={order._id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-sm text-gray-800">{order._id}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{order.name}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{order.address}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{order.phone}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{order.productName}</td>
                                                <td className="py-3 px-4 text-sm text-gray-800">{order.productPrice}</td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {order.status === 'pending' ? 'পেন্ডিং' : 'সম্পূর্ণ'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <div className="flex space-x-2">
                                                        {order.status === 'pending' && (
                                                            <button
                                                                onClick={() => handleCompleteOrder(order._id)}
                                                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-md transition duration-150 ease-in-out text-xs font-medium flex items-center justify-center"
                                                                title="সম্পূর্ণ করুন"
                                                                disabled={orderActionLoading[order._id]}
                                                            >
                                                                {orderActionLoading[order._id] ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                                                {orderActionLoading[order._id] ? '' : ''}
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDeleteOrder(order._id)}
                                                            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-md transition duration-150 ease-in-out text-xs font-medium flex items-center justify-center"
                                                            title="মুছে ফেলুন"
                                                            disabled={orderActionLoading[order._id]}
                                                        >
                                                            {orderActionLoading[order._id] ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                                            {orderActionLoading[order._id] ? '' : ''}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeSection === 'homeSite' && (
                    <div className="bg-white p-8 rounded-xl shadow-xl border border-gray-200 min-h-[calc(100vh-64px)] flex items-center justify-center">
                        <h2 className="text-3xl font-bold text-gray-700">হোম ও সাইট তথ্য (প্লেসহোল্ডার)</h2>
                        <p className="text-gray-600">এখানে হোম ও সাইট সম্পর্কিত তথ্য থাকবে।</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;
