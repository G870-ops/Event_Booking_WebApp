import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import api from '../utils/axios';
import { FaCheckCircle, FaTimesCircle, FaCamera, FaRedo } from 'react-icons/fa';

const GateScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannerInstance, setScannerInstance] = useState(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);
        setScannerInstance(scanner);

        return () => {
            scanner.clear().catch(error => console.error("Failed to clear scanner", error));
        };
    }, []);

    const onScanSuccess = async (decodedText) => {
        setLoading(true);
        try {
            const { data } = await api.put('/bookings/verify-gatepass', { bookingId: decodedText });
            setScanResult({ success: true, message: data.message, booking: data.booking });
        } catch (error) {
            setScanResult({
                success: false,
                message: error.response?.data?.error || 'Verification Failed',
                booking: error.response?.data?.booking
            });
        } finally {
            setLoading(false);
        }
    };

    const onScanFailure = (error) => {
        // Scanner scanning continuous frame callbacks
    };

    const resetScanner = () => {
        setScanResult(null);
    };

    return (
        <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg text-center border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-2">
                <FaCamera className="text-indigo-600" /> Gate Pass Scanner
            </h2>

            {!scanResult ? (
                <div>
                    <div id="qr-reader" className="overflow-hidden rounded-xl border-2 border-indigo-100"></div>
                    {loading && <p className="mt-3 text-indigo-600 font-semibold animate-pulse">Verifying ticket...</p>}
                </div>
            ) : (
                <div className={`p-6 rounded-xl border ${scanResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    {scanResult.success ? (
                        <FaCheckCircle className="text-5xl text-green-500 mx-auto mb-3" />
                    ) : (
                        <FaTimesCircle className="text-5xl text-red-500 mx-auto mb-3" />
                    )}

                    <h3 className={`text-lg font-bold ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
                        {scanResult.message}
                    </h3>

                    {scanResult.booking && (
                        <div className="mt-4 text-left text-sm text-gray-700 bg-white p-4 rounded-lg shadow-inner space-y-1">
                            <p><strong>Guest:</strong> {scanResult.booking.userId?.name}</p>
                            <p><strong>Event:</strong> {scanResult.booking.inviteId?.title || scanResult.booking.eventId?.title}</p>
                            <p><strong>Ticket ID:</strong> {scanResult.booking._id}</p>
                        </div>
                    )}

                    <button
                        onClick={resetScanner}
                        className="mt-5 w-full bg-indigo-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
                    >
                        <FaRedo /> Scan Next Pass
                    </button>
                </div>
            )}
        </div>
    );
};

export default GateScanner;