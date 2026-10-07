import { jsPDF } from 'jspdf';

export const generateTicketPDF = (booking, attendeeName = '') => {
    if (!booking) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5' // Compact modern pass size (148 x 210 mm)
    });

    const invite = booking.inviteId || booking.eventId || {};
    const title = invite.title || 'Event Access Pass';
    const category = (invite.category || 'EVENT').toUpperCase();
    const eventDate = invite.date ? new Date(invite.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' }) : 'TBA';
    const venue = invite.location || 'Venue TBA';
    const passHolder = attendeeName || booking.userId?.name || 'Attendee';
    const holderEmail = booking.userId?.email || '';
    const ticketId = booking._id || 'TICKET-PASS';
    const amount = booking.amount === 0 ? 'FREE' : `Rs. ${booking.amount}`;
    const paymentMethod = (booking.paymentMethod || 'COMPLETED').toUpperCase();
    const paymentRef = booking.paymentReference || 'VERIFIED';

    // Dark sleek theme background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 148, 210, 'F');

    // Header gradient banner bar
    doc.setFillColor(99, 102, 241); // indigo-500
    doc.rect(0, 0, 148, 28, 'F');

    // Brand title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('INVITOR', 12, 14);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(224, 231, 255);
    doc.text('OFFICIAL DIGITAL ACCESS PASS', 12, 20);

    // Verified badge
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(102, 8, 34, 12, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('ENTRY CONFIRMED', 105, 15.5);

    // Event Category pill
    doc.setFillColor(30, 41, 59); // slate-800
    doc.roundedRect(12, 36, 40, 7, 2, 2, 'F');
    doc.setTextColor(129, 140, 248); // indigo-400
    doc.setFontSize(7);
    doc.text(category, 16, 40.5);

    // Event Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    const splitTitle = doc.splitTextToSize(title, 124);
    doc.text(splitTitle, 12, 50);

    let currentY = 52 + (splitTitle.length * 6);

    // Decorative divider line
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.5);
    doc.line(12, currentY, 136, currentY);
    currentY += 8;

    // Event Details Grid
    const drawField = (label, value, x, y) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text(label.toUpperCase(), x, y);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(241, 245, 249); // slate-100
        const splitVal = doc.splitTextToSize(value, 56);
        doc.text(splitVal, x, y + 4.5);
    };

    drawField('Date & Time', eventDate, 12, currentY);
    drawField('Venue / Location', venue, 74, currentY);
    currentY += 16;

    drawField('Pass Holder', passHolder, 12, currentY);
    drawField('Email Address', holderEmail || 'Registered User', 74, currentY);
    currentY += 16;

    drawField('Amount Paid', amount, 12, currentY);
    drawField('Payment Channel', `${paymentMethod} (${paymentRef.substring(0, 14)})`, 74, currentY);
    currentY += 20;

    // Security Gate Pass Container
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(12, currentY, 124, 52, 4, 4, 'F');
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.3);
    doc.roundedRect(12, currentY, 124, 52, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(129, 140, 248);
    doc.text('SECURITY GATE PASS TOKEN', 18, currentY + 8);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`PASS ID: ${ticketId}`, 18, currentY + 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Scan this QR code at the venue entrance gate.', 18, currentY + 24);
    doc.text('Do not share this code to prevent ticket duplication.', 18, currentY + 29);
    doc.text(`Status: ${booking.checkedIn ? 'ALREADY REDEEMED' : 'READY FOR SCAN'}`, 18, currentY + 36);

    // QR Code Placeholder text / Image integration
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(ticketId)}`;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = qrUrl;

    const saveDoc = () => {
        // Footer note
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text('This is an authenticated computer-generated entry pass issued by INVITOR.', 74, 202, { align: 'center' });

        doc.save(`INVITOR_Pass_${ticketId.substring(ticketId.length - 8)}.pdf`);
    };

    img.onload = () => {
        try {
            doc.addImage(img, 'PNG', 98, currentY + 6, 34, 34);
        } catch (e) {
            console.warn('QR image embed notice:', e);
        }
        saveDoc();
    };

    img.onerror = () => {
        saveDoc();
    };
};
