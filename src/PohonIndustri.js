import React from 'react';
import { Link } from 'react-router-dom';

const PohonIndustri = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Pohon Industri</h1>
            <p>This is the page for Pohon Industri.</p>
            <Link to="/dashboard" className="text-blue-500 hover:underline">Back to Dashboard</Link>
        </div>
    );
};

export default PohonIndustri;
